-- ============================================
-- 0008: 누락된 카테고리(과학/기상) cron 추가 + 일관성 정리
--   매일 KST 06:00~06:40 사이 5분 간격 9개 카테고리
-- ============================================

DO $$
DECLARE
  schedules text[][] := ARRAY[
    ARRAY['news-main',     '0  21 * * *', 'main'],
    ARRAY['news-society',  '5  21 * * *', 'society'],
    ARRAY['news-culture',  '10 21 * * *', 'culture'],
    ARRAY['news-politics', '15 21 * * *', 'politics'],
    ARRAY['news-economy',  '20 21 * * *', 'economy'],
    ARRAY['news-world',    '25 21 * * *', 'world'],
    ARRAY['news-sports',   '30 21 * * *', 'sports'],
    ARRAY['news-science',  '35 21 * * *', 'science'],
    ARRAY['news-weather',  '40 21 * * *', 'weather']
  ];
  s text[];
BEGIN
  FOREACH s SLICE 1 IN ARRAY schedules
  LOOP
    PERFORM cron.unschedule(s[1]) WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = s[1]);
    PERFORM cron.schedule(
      s[1],
      s[2],
      format(
        $cmd$
        SELECT net.http_post(
          'https://cftgenhccujkhekllxhn.supabase.co/functions/v1/daily-news-fetch',
          jsonb_build_object('category', %L, 'triggered_by', 'pg_cron'),
          '{}'::jsonb,
          jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (
              SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_service_role_key'
            )
          ),
          60000
        );
        $cmd$,
        s[3]
      )
    );
  END LOOP;
END $$;

-- 등록 확인
SELECT jobname, schedule, active FROM cron.job WHERE jobname LIKE 'news-%' ORDER BY jobname;
