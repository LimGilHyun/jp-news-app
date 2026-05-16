-- ============================================
-- 0004: Edge Function 'daily-news-fetch' 자동 실행 (매일 KST 06:00)
--
-- 사전 조건: Edge Function이 Supabase에 deploy되어 있어야 함
--   $ supabase functions deploy daily-news-fetch
--
-- 본 마이그레이션은:
--   1) pg_cron / pg_net 확장 활성화
--   2) Vault에 cron이 사용할 service_role 키 저장
--   3) 매일 21:00 UTC (KST 06:00)에 Edge Function HTTP POST 호출 스케줄 등록
-- ============================================

-- 1) 확장 활성화 (Supabase Dashboard → Database → Extensions 에서도 가능)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net  WITH SCHEMA extensions;

-- 2) Vault에 service_role 키 저장
--    ⚠️ 사용자께서 직접 SQL Editor에서 아래 placeholder를 실제 키로 교체 후 실행해주십시오.
--    service_role 키는 Dashboard → Settings → API Keys 의 'secret/service_role' 값입니다.
--    절대 채팅창이나 GitHub에 공유하지 마십시오.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'cron_service_role_key') THEN
    PERFORM vault.create_secret(
      '<SERVICE_ROLE_KEY>'::text,
      'cron_service_role_key',
      'Used by pg_cron to invoke daily-news-fetch Edge Function'
    );
  END IF;
END $$;

-- 3) 기존 스케줄 제거 후 재등록 (idempotent)
SELECT cron.unschedule('daily-news-fetch')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-news-fetch');

SELECT cron.schedule(
  'daily-news-fetch',
  '0 21 * * *',  -- UTC 21:00 = KST 06:00 매일
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/daily-news-fetch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_service_role_key'
      )
    ),
    body := jsonb_build_object('triggered_by', 'pg_cron'),
    timeout_milliseconds := 60000
  ) AS request_id;
  $$
);

-- ============================================
-- ⚠️ 추가 설정 필요:
--   Supabase Dashboard → Database → Settings → Custom Postgres Config 에서
--   app.settings.supabase_url = https://cftgenhccujkhekllxhn.supabase.co
--   를 등록해야 위 SQL의 current_setting()이 동작합니다.
--
--   또는 위 SQL의 url 부분을 직접 하드코딩하셔도 됩니다:
--     url := 'https://cftgenhccujkhekllxhn.supabase.co/functions/v1/daily-news-fetch'
-- ============================================

-- 4) 시험용: 즉시 1회 실행하여 동작 확인
--    (아래 주석을 풀고 실행하면 cron 등록 직후 한 번 호출됩니다)
-- SELECT net.http_post(
--   url := 'https://cftgenhccujkhekllxhn.supabase.co/functions/v1/daily-news-fetch',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'Authorization', 'Bearer ' || (
--       SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_service_role_key'
--     )
--   ),
--   body := jsonb_build_object('triggered_by', 'manual_test')
-- );

-- 5) 모니터링: 최근 cron 실행 이력 확인
-- SELECT jobid, runid, status, return_message, start_time, end_time
-- FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-news-fetch')
-- ORDER BY start_time DESC
-- LIMIT 10;
