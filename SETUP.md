# 원클릭 셋업 가이드

본 문서는 사용자께서 직접 진행해주셔야 할 외부 서비스 연동을 한 번에 끝내기 위한 통합 가이드입니다. 모든 자동화 가능한 작업은 이미 완료되었으며, 아래 5개 항목만 차례로 진행하시면 앱이 실 데이터로 동작합니다.

---

## ✅ 1. Supabase 스키마 적용 (1분, 필수)

### 1-A. SQL Editor 열기
👉 https://supabase.com/dashboard/project/cftgenhccujkhekllxhn/sql/new

### 1-B. 다음 3개 SQL을 순서대로 붙여넣고 각각 **Run** 버튼 클릭

순서가 중요합니다 (테이블 → RPC → 더미 데이터 순).

1. **테이블 + RLS**: [supabase/migrations/0001_init_schema.sql](supabase/migrations/0001_init_schema.sql) 전체 내용 복사 → 붙여넣기 → Run
2. **RPC 함수**: [supabase/functions/get_unread_articles.sql](supabase/functions/get_unread_articles.sql) 전체 내용 복사 → 붙여넣기 → Run
3. **더미 데이터**: [supabase/migrations/0002_seed_demo_articles.sql](supabase/migrations/0002_seed_demo_articles.sql) 전체 내용 복사 → 붙여넣기 → Run

### 1-C. 검증
**Table Editor** 메뉴에서 `articles`, `user_activities`, `highlights` 3개 테이블이 보이고 `articles`에 3건이 있으면 성공입니다.

---

## ✅ 2. 안드로이드 앱 실행 (자동 진행 중)

Expo 개발 서버가 이미 백그라운드에서 빌드 중입니다. 약 1~3분 후 에뮬레이터에 Expo Go가 자동 설치되고 앱이 실행됩니다.

빌드 진행 중 화면이 안 뜬다면 PowerShell 별도 창에서:
```powershell
cd C:\Users\user\jp-news-app
npm run android
```

---

## ✅ 3. Groq API 키 발급 (2분, n8n용)

### 3-A. 가입 + 키 발급
👉 https://console.groq.com/keys → **Create API Key**

### 3-B. 키를 `.env`에 입력
[.env](.env) 파일을 열고 `GROQ_API_KEY=` 줄에 발급받은 `gsk_xxxxxxx...` 값 입력 후 저장.

⚠️ **주의**: 이 값은 채팅창이나 GitHub에 절대 공유하지 마십시오. `.env`는 `.gitignore`로 보호되어 있어 안전합니다.

---

## ✅ 4. Supabase Service Role Key 입력 (1분, n8n용)

### 4-A. 키 확보
👉 https://supabase.com/dashboard/project/cftgenhccujkhekllxhn/settings/api-keys

페이지 하단의 **secret** 또는 **service_role** 표시된 키를 복사합니다.

### 4-B. `.env`에 입력
[.env](.env) 파일을 열고 `SUPABASE_SERVICE_ROLE_KEY=` 줄에 붙여넣기 후 저장.

⚠️ **이 키는 RLS를 우회**합니다. 채팅창, GitHub, 클라이언트 앱 어디에도 절대 노출 금지. `.env`만 사용.

---

## ✅ 5. Kuromoji 서비스 Railway 배포 (5분, Phase 2)

### 5-A. Railway 가입
👉 https://railway.app → **Login with GitHub**

### 5-B. 프로젝트 생성
1. **New Project** → **Deploy from GitHub repo** 클릭
2. **`LimGilHyun/jp-news-app`** 선택 (필요 시 GitHub 권한 승인)
3. Railway가 자동 빌드를 시작합니다

### 5-C. ⚠️ Root Directory 변경 (중요)
1. 프로젝트 화면에서 **Settings → Source → Root Directory** 클릭
2. `n8n/kuromoji-service` 입력 후 저장
3. Railway가 자동 재빌드

### 5-D. 공개 URL 발급
1. **Settings → Networking → Generate Domain** 클릭
2. 발급된 URL (예: `kuromoji-service-production-abc.up.railway.app`) 복사

### 5-E. 검증
PowerShell에서:
```powershell
curl https://YOUR-RAILWAY-DOMAIN/health
# 응답: {"status":"ok","ready":true}
```

`{"ready":true}` 가 나오면 성공입니다.

---

## ✅ 6. n8n 인스턴스 + 워크플로 (10분, Phase 2)

### 6-A. n8n Cloud 가입 (가장 쉬움)
👉 https://app.n8n.cloud/register (14일 무료, 이후 $20/월)

### 6-B. 자격 증명 등록
1. **Credentials → New Credential**
2. **Supabase API** 선택
   - Host: `https://cftgenhccujkhekllxhn.supabase.co`
   - Service Role Secret: ④에서 받은 키
3. **New Credential → HTTP Header Auth** 선택 (Groq용)
   - Name: `Authorization`
   - Value: `Bearer gsk_...` (③에서 받은 키, Bearer 접두사 포함)

### 6-C. 환경 변수 등록
**Settings → Variables** (또는 Variables 탭):
- 변수명 `KUROMOJI_URL`, 값 `https://YOUR-RAILWAY-DOMAIN` (⑤에서 받은 URL, 끝에 `/` 없음)

### 6-D. 워크플로 임포트
1. **Workflows → Import from File** 클릭
2. [n8n/workflows/daily_news_pipeline.json](n8n/workflows/daily_news_pipeline.json) 파일 업로드
3. 임포트된 워크플로의 각 노드 클릭 → 자격 증명 매핑:
   - **LLM Translate (Groq)** → 6-B에서 만든 HTTP Header Auth
   - **Supabase Insert** → 6-B에서 만든 Supabase API

### 6-E. 시험 실행 + 활성화
1. **Cron** 노드 우클릭 → **Execute Workflow**
2. 모든 노드가 초록색 체크가 되면 성공
3. Supabase Table Editor에서 `articles` 테이블에 새 row 확인
4. 우상단 **Active** 토글 ON → 매일 KST 06:00 자동 실행 시작

---

## 🎯 진행 상황 체크리스트

- [ ] **1**. Supabase SQL 3개 실행 (테이블 3개 + RPC + 더미 데이터)
- [ ] **2**. 안드로이드 에뮬레이터에서 앱 화면 확인
- [ ] **3**. Groq API 키 발급 및 `.env` 입력
- [ ] **4**. Supabase Service Role Key `.env` 입력
- [ ] **5**. Kuromoji 서비스 Railway 배포 + URL 확보
- [ ] **6**. n8n 워크플로 임포트 + 시험 실행 + Active

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 앱이 빈 화면 | Supabase 테이블 미생성 | ① 단계 SQL 실행 |
| 앱이 빌드 실패 | node_modules 손상 | `rm -rf node_modules && npm install` |
| Railway 빌드 실패 | Root Directory 미설정 | 5-C 단계 재확인 |
| n8n 노드 timeout | KUROMOJI_URL 오타 | 6-C에서 끝의 `/` 제거 확인 |
| Groq 401 에러 | Bearer 누락 | `Authorization: Bearer gsk_...` 형식 |
| Supabase Insert 실패 | service_role 미입력 | 4-B 또는 6-B 자격 증명 재확인 |
