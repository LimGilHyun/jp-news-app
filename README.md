# 일본 뉴스 일본어 학습 앱

매일 자동 수집된 일본 주요 뉴스를 토큰화하여 한국어 학습자에게 인터랙티브한 학습 경험을 제공하는 안드로이드 앱입니다.

## 기술 스택

- **Front-end**: React Native + Expo (TypeScript)
- **Database / Auth**: Supabase
- **Data Pipeline**: n8n (RSS 수집 + Kuromoji 형태소 분석 + LLM 번역)
- **상태 관리**: zustand
- **UI**: @gorhom/bottom-sheet, react-native-reanimated

## 디렉토리 구조

```
jp-news-app/                   # 프로젝트 루트 (영문 경로)
├── index.ts                   # Expo 진입점 (registerRootComponent)
├── app.json                   # Expo 설정
├── babel.config.js            # reanimated 플러그인 포함
├── tsconfig.json
├── package.json
├── .env.example / .env
├── app/                       # React Native (Expo) 소스
│   ├── App.tsx                # 루트 React 컴포넌트
│   ├── components/            # 재사용 컴포넌트 (TokenizedArticle 등)
│   ├── screens/               # 화면 단위
│   ├── stores/                # zustand 전역 상태
│   ├── services/              # Supabase / API 호출
│   ├── types/                 # 공용 타입
│   └── data/                  # 더미 데이터 (개발용)
├── supabase/
│   ├── migrations/            # DDL
│   └── functions/             # RPC SQL
└── n8n/
    └── workflows/             # n8n 익스포트 JSON
```

> **참고**: 본 프로젝트는 원래 `일본어학습폴더`로 생성되었으나, Node 22 + Windows 환경의 한글 경로 require 크래시를 회피하기 위해 `jp-news-app` 으로 이동되었습니다.

## 개발 환경 설정

### 1) 의존성 설치

```bash
cd C:\Users\user\jp-news-app
npm install
```

### 2) 환경 변수 설정

`.env.example` 파일을 `.env`로 복사한 뒤 실제 값을 입력합니다.

```bash
cp .env.example .env
```

| 변수 | 용도 | 어디서 사용 |
|------|------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 앱 클라이언트 |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 공개키 | 앱 클라이언트 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 롤 키 | n8n 서버 (비공개) |
| `GROQ_API_KEY` | LLM 번역 호출 | n8n 서버 |

### 3) Supabase 스키마 적용

Supabase Studio의 SQL Editor 또는 CLI로 다음 파일을 순서대로 실행합니다.

1. `supabase/migrations/0001_init_schema.sql`
2. `supabase/functions/get_unread_articles.sql`

### 4) 앱 실행

```bash
npm run android    # 안드로이드 에뮬레이터
npm run start      # Expo Dev Server (QR로 실기기 연결)
```

## MVP 단계의 주의사항

- 현재 단계는 **MVP 골격**이며 더미 데이터(`app/data/mockArticles.ts`)로 동작합니다.
- 실제 Supabase 연결을 사용하려면 `app/stores/articleStore.ts`의 `useMockData` 플래그를 `false`로 설정합니다.
- n8n 워크플로(`n8n/workflows/daily_news_pipeline.json`)는 **골격**이며, n8n 인스턴스에 임포트한 뒤 자격 증명을 연결해야 가동됩니다.

## 핵심 산출물 (계약 사항)

1. **토큰화 컴포넌트**: [app/components/TokenizedArticle.tsx](app/components/TokenizedArticle.tsx)
2. **읽지 않은 뉴스 SQL**: [supabase/functions/get_unread_articles.sql](supabase/functions/get_unread_articles.sql)
3. **n8n 데이터 전처리 설계**: [n8n/workflows/daily_news_pipeline.json](n8n/workflows/daily_news_pipeline.json)

## 알려진 환경 이슈: 한글 경로 + Node 22

본 프로젝트가 **한글 폴더에 위치하면 Node 22.12.0 + Windows 환경에서 `require`로 JS 모듈을 로드할 때 V8 액세스 위반(STATUS_ACCESS_VIOLATION, exit code -1073741819)이 발생합니다.** `npm install` 자체는 정상이지만 `tsc --noEmit`, `metro`, `expo start` 등 require 기반 도구가 모두 크래시합니다. 정션(junction)도 node가 realpath로 한글 경로를 재해석하므로 우회되지 않습니다.

이 때문에 본 프로젝트는 `C:\Users\user\jp-news-app` 영문 경로로 이동되었습니다. 향후 작업 시 다시 한글 경로로 옮기지 말아주십시오.

### 자동 검증 결과 (영문 경로 기준)
- `npm install`: ✅ 정상 (916 → 905 패키지)
- `npm run typecheck` (`tsc --noEmit`): ✅ 에러 0건
- `npx expo-doctor`: ✅ 17/17 검사 통과

## 저작권 안내

뉴스 본문 전문 저장은 저작권 위반의 소지가 있습니다. 실제 출시 전 다음 정책을 반드시 준수해주십시오.

- RSS 요약(summary)만 사용하거나, 정식 라이선스 API(NewsAPI, GNews 등) 활용
- 원문 출처 링크 표시 의무화
- Google Play 콘텐츠 정책 검토
