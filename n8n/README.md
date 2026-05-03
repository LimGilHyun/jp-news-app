# ⚠️ n8n 워크플로 — DEPRECATED

본 폴더의 [workflows/daily_news_pipeline.json](workflows/daily_news_pipeline.json) 은 더 이상 권장하지 않습니다.

**이유**: 프로젝트 자동화는 [Supabase Edge Function + pg_cron](../supabase/functions/daily-news-fetch/) 으로 마이그레이션되었습니다. 외부 인스턴스(n8n Cloud $20/월 또는 셀프호스트) 없이 Supabase 안에서 모두 동작하여 비용 0이 됩니다.

## 그래도 사용 가능한 것
- [kuromoji-service/](kuromoji-service/) — **여전히 사용**합니다. Railway에 배포하여 Edge Function이 호출하는 단순 Express 서버이며 n8n과 무관합니다. 폴더 위치만 그대로 둡니다.

## n8n으로 다시 돌아가고 싶은 경우
[../SETUP.md](../SETUP.md) 의 5/6 단계 (Edge Function + pg_cron) 대신 n8n Cloud 또는 셀프호스트에 [workflows/daily_news_pipeline.json](workflows/daily_news_pipeline.json) 을 임포트하시면 됩니다. 단, 워크플로 JSON은 sentences/JLPT 자동 분류 갱신본이 적용되어 있습니다.
