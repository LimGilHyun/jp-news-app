# 원클릭 셋업 가이드 (Supabase Edge Function 기반)

본 문서는 사용자께서 직접 진행해주셔야 할 외부 서비스 연동을 한 번에 끝내기 위한 통합 가이드입니다. n8n 대신 **Supabase Edge Function + pg_cron** 으로 자동화하여 외부 인스턴스를 추가하지 않습니다.

## 전체 아키텍처 (옵션 1 채택)

```
┌─────────────────┐ 매일      ┌──────────────────────┐
│ Supabase pg_cron│─06:00 KST─▶│ Edge Function        │
└─────────────────┘            │ daily-news-fetch     │
                               │  · RSS 수집          │
                               │  · Kuromoji 호출     │  ┌──────────────────┐
                               │  · Groq LLM 호출     │─▶│ Kuromoji Service │
                               │  · articles INSERT   │  │ (Railway)        │
                               └──────────────────────┘  └──────────────────┘
                                          │
                                          ▼
                               ┌──────────────────────┐
                               │ articles 테이블       │
                               │ (sentences JSONB +   │
                               │  difficulty 자동분류) │
                               └──────────────────────┘
                                          │
                                          ▼
                               ┌──────────────────────┐
                               │ React Native 앱       │
                               │ (24시간 캐싱)         │
                               └──────────────────────┘
```

---

## ✅ 1. Supabase 스키마 적용 (필수, 1분)

### 1-A. SQL Editor 열기
👉 https://supabase.com/dashboard/project/cftgenhccujkhekllxhn/sql/new

### 1-B. 다음 SQL 파일을 순서대로 실행
1. [supabase/migrations/0001_init_schema.sql](supabase/migrations/0001_init_schema.sql)
2. [supabase/functions/get_unread_articles.sql](supabase/functions/get_unread_articles.sql)
3. [supabase/migrations/0002_seed_demo_articles.sql](supabase/migrations/0002_seed_demo_articles.sql)
4. [supabase/migrations/0003_add_sentences.sql](supabase/migrations/0003_add_sentences.sql)

### 1-C. 검증
**Table Editor**에서 `articles`, `user_activities`, `highlights` 3개 테이블이 보이고 `articles`에 sentences 컬럼이 채워져 있으면 성공입니다.

---

## ✅ 2. 안드로이드 앱 실행 (자동 진행 중)

```powershell
cd C:\Users\user\jp-news-app
npm run android
```

---

## ✅ 3. Groq API 키 발급 (2분, Edge Function용)

1. https://console.groq.com/keys → **Create API Key**
2. 발급받은 `gsk_xxx...` 키를 메모해두십시오 (5번 단계에서 사용)

---

## ✅ 4. Kuromoji 서비스를 Railway에 배포 (5분)

### 4-A. GitHub repo는 이미 준비됨
👉 https://github.com/LimGilHyun/jp-news-app

### 4-B. Railway 프로젝트 생성
1. https://railway.app 가입 (GitHub 로그인)
2. **New Project → Deploy from GitHub repo** → `LimGilHyun/jp-news-app` 선택
3. **Settings → Source → Root Directory** = `n8n/kuromoji-service` 입력
4. **Settings → Networking → Generate Domain** 으로 공개 URL 발급
5. 검증:
   ```bash
   curl https://YOUR-RAILWAY-DOMAIN/health
   # 응답: {"status":"ok","ready":true}
   ```

> 폴더명이 `n8n/`로 시작하지만 n8n과 무관한 단순 Express 서버입니다. n8n은 더 이상 사용하지 않습니다.

---

## ✅ 5. Supabase Edge Function 배포 (5분)

### 5-A. Supabase CLI 설치 (1회만)
```powershell
npm install -g supabase
supabase --version
```

### 5-B. 프로젝트 연결
```powershell
cd C:\Users\user\jp-news-app
supabase login           # 브라우저 OAuth로 로그인
supabase link --project-ref cftgenhccujkhekllxhn
```

### 5-C. Edge Function의 환경 변수(시크릿) 설정
```powershell
supabase secrets set KUROMOJI_URL=https://YOUR-RAILWAY-DOMAIN
supabase secrets set GROQ_API_KEY=gsk_YOUR_GROQ_KEY
```

### 5-D. 배포
```powershell
supabase functions deploy daily-news-fetch
```

### 5-E. 시험 호출 (수동 trigger)
```powershell
$serviceKey = "YOUR_SERVICE_ROLE_KEY"  # Dashboard → Settings → API Keys → service_role
curl.exe -X POST `
  "https://cftgenhccujkhekllxhn.supabase.co/functions/v1/daily-news-fetch" `
  -H "Authorization: Bearer $serviceKey" `
  -H "Content-Type: application/json" `
  -d "{}"
```
응답 예시:
```json
{ "ok": true, "elapsedMs": 12500, "feedItems": 18, "skippedDuplicate": 0, "inserted": 18, "failed": 0 }
```

Supabase Table Editor에서 articles 테이블에 새 row 18개가 들어왔는지 확인.

---

## ✅ 6. 매일 자동 실행 스케줄 등록 (1분)

### 6-A. SQL Editor에서 실행
[supabase/migrations/0004_schedule_daily_fetch.sql](supabase/migrations/0004_schedule_daily_fetch.sql) 의 내용을 복사하시되, 다음 부분을 실제 값으로 교체:
- `PASTE_YOUR_SERVICE_ROLE_KEY_HERE` → 실제 service_role 키 (절대 공유 금지)

복사·붙여넣기 후 **RUN** 클릭. 매일 KST 06:00 (UTC 21:00)에 자동으로 Edge Function이 호출됩니다.

### 6-B. 모니터링 (선택)
같은 SQL Editor에서:
```sql
SELECT jobid, runid, status, return_message, start_time, end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-news-fetch')
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🎯 진행 체크리스트

- [ ] **1**. Supabase SQL 4개 (0001~0003 + RPC) 실행
- [ ] **2**. 안드로이드 앱 실행 + 새 기능 검증
- [ ] **3**. Groq API 키 발급
- [ ] **4**. Kuromoji 서비스 Railway 배포 + URL 확보
- [ ] **5**. Edge Function 배포 + secrets 설정 + 시험 호출 성공
- [ ] **6**. pg_cron 스케줄 등록 (0004 SQL)

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| Edge Function 401 | Authorization 헤더 오타 | `Bearer ` 뒤에 service_role 키 (publishable 아님) |
| Kuromoji timeout | Railway 콜드 스타트 | 첫 호출 후 30초 정도 대기, 또는 healthcheck로 warm-up |
| Groq 429 (rate limit) | 무료 티어 분당 6000 토큰 초과 | 한 번에 처리할 RSS 건수 줄이기 (MAX_ITEMS) |
| pg_cron이 실행 안 됨 | Vault 시크릿 미설정 | 0004 SQL의 `PASTE_YOUR_SERVICE_ROLE_KEY_HERE` 교체 후 재실행 |
| `current_setting` 에러 | app.settings.supabase_url 미설정 | 0004의 url 부분을 직접 하드코딩 |

---

## 비용 요약

| 서비스 | 비용 | 한도 |
|--------|------|------|
| Supabase | 무료 | DB 500MB, Edge Function 500K invocations/월 |
| Railway (Kuromoji) | $5 무료 크레딧/월 | 학습용 트래픽 충분 |
| Groq API | 무료 | 분당 6000 토큰 (일 20건 처리에 충분) |
| **합계** | **$0** | n8n 대비 월 $20~25 절약 |
