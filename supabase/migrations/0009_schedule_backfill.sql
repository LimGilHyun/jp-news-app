-- ============================================
-- 0009: 학습 콘텐츠 백필 자동 실행
--
-- 메인 수집(매일 KST 06:00~06:40)이 끝난 후, LLM 호출이 실패해서
-- grammar_points / key_vocab / quiz가 비어 있는 기사를 발견하면
-- 별도 cron이 daily-news-fetch?mode=backfill 을 호출해 채워넣는다.
--
-- 시간: 매일 KST 02:00 (= UTC 17:00)
--   - 메인 수집(KST 06:00)에서 멀리 떨어져 LLM 동시성 충돌 방지
--   - Groq 무료 한도가 0시(UTC) 기준 갱신되므로 새벽에 안정적
-- 한 번에 처리할 건수: 2건 (LLM 호출 직렬 실행 ~70~80초, timeout 120s 안에)
-- ============================================

-- 기존 스케줄 제거 후 재등록 (idempotent)
SELECT cron.unschedule('daily-news-backfill')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-news-backfill');

SELECT cron.schedule(
  'daily-news-backfill',
  '0 17 * * *',  -- UTC 17:00 = KST 02:00 매일
  $$
  SELECT net.http_post(
    url := 'https://cftgenhccujkhekllxhn.supabase.co/functions/v1/daily-news-fetch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_service_role_key'
      )
    ),
    body := jsonb_build_object(
      'mode', 'backfill',
      'limit', 2,
      'triggered_by', 'pg_cron'
    ),
    timeout_milliseconds := 120000
  ) AS request_id;
  $$
);

-- 등록 확인
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname IN ('daily-news-backfill')
ORDER BY jobname;

-- 모니터링용 (필요시 SQL Editor에서 직접 실행)
-- SELECT jobid, runid, status, return_message, start_time, end_time
-- FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-news-backfill')
-- ORDER BY start_time DESC
-- LIMIT 10;
