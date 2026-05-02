# Phase 2: n8n 자동 수집 파이프라인 구축 가이드

본 가이드는 매일 KST 06:00에 일본 뉴스를 자동으로 수집·번역하여 Supabase에 적재하는 파이프라인을 구축하는 단계별 절차입니다.

## 전체 아키텍처

```
┌─────────────┐  06:00   ┌─────────┐  RSS  ┌──────────────────┐
│ n8n Cron    │─────────▶│ n8n     │──────▶│ Kuromoji Service │
│ (Cloud or   │          │ Workflow│       │ (Railway)        │
│  Self-host) │          │         │       └──────────────────┘
└─────────────┘          │         │       ┌──────────────────┐
                         │         │──────▶│ Groq LLM API     │
                         │         │       └──────────────────┘
                         │         │       ┌──────────────────┐
                         │         │──────▶│ Supabase (DB)    │
                         └─────────┘       └──────────────────┘
```

---

## STEP 1. Kuromoji 마이크로서비스 배포 (Railway 권장, 약 10분)

### 1-1. 사전 조건
- GitHub 계정 (Railway 가입에 필요)
- 본 저장소(`jp-news-app`)를 GitHub에 푸시했거나 새로 푸시 예정

### 1-2. GitHub에 푸시 (이미 했다면 생략)

```bash
cd C:\Users\user\jp-news-app
git init
git add .
git commit -m "initial commit"
# GitHub에서 새 repo 생성 후
git remote add origin https://github.com/YOUR_USERNAME/jp-news-app.git
git push -u origin main
```

### 1-3. Railway 프로젝트 생성

1. https://railway.app 가입 (GitHub 로그인)
2. **New Project** → **Deploy from GitHub repo** 선택 → 본 저장소 선택
3. Railway가 자동으로 빌드를 시도합니다. **여기가 중요**: 루트가 아닌 `n8n/kuromoji-service/` 만 배포해야 하므로:
   - 프로젝트 생성 후 **Settings → Root Directory** 에 `n8n/kuromoji-service` 입력
   - **Settings → Build → Builder** 를 `Dockerfile` 로 설정 (또는 Nixpacks 자동 감지도 가능)
4. **Networking → Generate Domain** 클릭하여 공개 URL 생성 (예: `https://kuromoji-service-production.up.railway.app`)

### 1-4. 배포 검증

```bash
curl https://YOUR-DOMAIN.up.railway.app/health
# 예상: {"status":"ok","ready":true}

curl -X POST https://YOUR-DOMAIN.up.railway.app/tokenize \
  -H "Content-Type: application/json" \
  -d '{"text":"日本の経済が回復しています"}'
# 예상: {"tokens":[{"surface":"日本","reading":"닐폰",...},...]}
```

### 비용
- Railway 무료 사용량: $5 크레딧/월 (학습용 트래픽이면 충분)
- 메모리 약 200MB (Kuromoji 사전 로딩)

### Fly.io 대안
Railway 대신 Fly.io 사용 시:
```bash
cd n8n/kuromoji-service
fly launch    # 자동 감지
fly deploy
```

---

## STEP 2. Groq API 키 발급 (무료, 약 2분)

1. https://console.groq.com 가입
2. **API Keys** 메뉴 → **Create API Key**
3. 키 발급 (예: `gsk_xxxxxxxxxxxxxxxxxxxxxxx`)
4. 키 복사 → 안전한 곳에 보관 (n8n에 등록할 때 사용)

### 추천 모델
- `llama-3.3-70b-versatile` (균형, 본 워크플로 기본값)
- `llama-3.1-8b-instant` (빠름·저렴)
- 일 20기사 × 평균 2000토큰 ≈ 무료 한도(분당 6000토큰) 내

### 대안: Anthropic Claude Haiku
워크플로의 `LLM Translate` 노드를 `https://api.anthropic.com/v1/messages` 로 변경 후 모델 `claude-haiku-4-5-20251001`을 사용하셔도 됩니다. 한국어/일본어 번역 품질은 더 우수하지만 유료입니다.

---

## STEP 3. n8n 인스턴스 마련 (택1)

### 옵션 A: n8n Cloud (가장 쉬움)
1. https://n8n.io 가입 → **Get started for free**
2. 14일 무료 체험 후 $20/월 (Starter 플랜) 또는 셀프호스트로 전환
3. 즉시 사용 가능, 별도 인프라 관리 불필요

### 옵션 B: Railway에 셀프호스트 (저렴, 약 5분)
1. Railway에서 **New Project** → **Deploy a template** → **n8n** 검색 후 선택
2. 환경 변수 `N8N_BASIC_AUTH_USER`, `N8N_BASIC_AUTH_PASSWORD` 설정
3. **Networking → Generate Domain** 으로 공개 URL 생성
4. 비용 약 $5/월

### 옵션 C: 로컬 Docker (개발용)
```bash
docker run -d --name n8n -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```
브라우저에서 http://localhost:5678 접속

---

## STEP 4. n8n에 자격 증명 등록

n8n UI 접속 후:

### 4-1. Supabase 자격 증명
1. **Credentials** 메뉴 → **Add Credential** → **Supabase API** 선택
2. 입력:
   - **Host**: `https://cftgenhccujkhekllxhn.supabase.co` (앱과 동일)
   - **Service Role Secret**: ⚠️ **Service Role Key** (publishable key 아님)
3. **Save**

> Service Role Key는 Supabase 대시보드 → API Keys 에서 `service_role` 또는 `secret` 표시된 키입니다. RLS를 우회하기 때문에 절대 클라이언트나 GitHub에 노출하지 마십시오.

### 4-2. Groq API 자격 증명
1. **Add Credential** → **Header Auth** 선택
2. 입력:
   - **Name**: `Authorization`
   - **Value**: `Bearer gsk_xxxxxxxxxxxxxxxxxxxxxxx` (Step 2 키)
3. **Save**

### 4-3. 환경 변수 등록 (Kuromoji URL)
1. **Settings** → **Variables** (n8n Cloud) 또는 인스턴스 환경 변수
2. `KUROMOJI_URL` = `https://YOUR-DOMAIN.up.railway.app` (Step 1 URL)

---

## STEP 5. 워크플로 임포트 및 활성화

### 5-1. 워크플로 임포트
1. n8n 메인 화면 → **Workflows** → **Import from File**
2. `n8n/workflows/daily_news_pipeline.json` 선택

### 5-2. 노드별 자격 증명 연결
임포트 직후 각 노드는 자격 증명이 비어 있습니다. 다음 노드를 클릭하여 연결합니다.
- **LLM Translate (Groq)** 노드 → 자격 증명 → 4-2 등록한 Header Auth 선택
- **Supabase Insert** 노드 → 자격 증명 → 4-1 등록한 Supabase 선택

### 5-3. 시험 실행 (수동)
1. **Cron** 노드 우클릭 → **Execute Workflow** 클릭
2. 각 노드의 출력을 클릭하여 단계별로 데이터가 흐르는지 확인
3. 마지막 **Supabase Insert** 노드 성공 시, Supabase Table Editor에서 `articles` 테이블에 새 row가 들어왔는지 확인

### 5-4. 정기 실행 활성화
1. 워크플로 우상단 **Active** 토글 ON
2. 매일 KST 06:00(UTC 21:00)에 자동 실행됨

---

## STEP 6. 운영 모니터링

### 6-1. n8n 실행 이력
- **Executions** 탭에서 매일 실행 결과 확인
- 실패 시 빨간색 표시, 클릭하여 상세 에러 확인

### 6-2. Supabase 데이터 검증
SQL Editor에서:
```sql
SELECT COUNT(*) as today_count
FROM articles
WHERE created_at >= NOW() - INTERVAL '24 hours';
-- 매일 1~20건 사이가 정상
```

### 6-3. 알림 추가 (권장)
- n8n에 **Error Trigger** 워크플로 추가
- Slack/Discord/이메일로 실패 알림 발송

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| Tokenize 노드 timeout | Kuromoji 콜드 스타트 | Railway 인스턴스를 1개 이상 실행 상태 유지, healthcheck 설정 |
| Supabase Insert 실패 | RLS / Service Role 키 잘못됨 | 자격 증명에 service_role 키(아닌 anon)인지 재확인 |
| LLM 응답 형식 에러 | Groq JSON 모드 미지원 모델 | `response_format` 호환 모델로 교체 (llama-3.3-70b 등) |
| 매일 실행 안 됨 | n8n 시간대 미설정 | n8n 환경 변수 `GENERIC_TIMEZONE=Asia/Seoul` 설정 |
| RSS 중복 수집 | source_url UNIQUE 위배 | INSERT를 UPSERT로 변경 또는 dedupe 노드 통과 확인 |

---

## 다음 단계 (Phase 3+)

- 형광펜 드래그 선택 UI 고도화
- TTS 음성 재생 (Expo Speech)
- JLPT 난이도 자동 분류 (LLM 추가 호출)
- SRS 단어장
- 푸시 알림 (매일 오전 알림: "오늘의 뉴스 N건 도착")
