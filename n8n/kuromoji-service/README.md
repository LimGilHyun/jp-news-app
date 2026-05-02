# Kuromoji Service

일본어 형태소 분석 + 한국어 발음 변환 마이크로서비스. n8n 워크플로의 `Tokenize` 노드가 호출합니다.

## API

### `GET /health`
서비스 준비 상태 확인.
```json
{ "status": "ok", "ready": true }
```

### `POST /tokenize`
**요청**: `{ "text": "東京で桜が満開になりました" }`
**응답**:
```json
{
  "tokens": [
    {
      "surface": "東京",
      "reading_kana": "トウキョウ",
      "reading": "토우쿄우",
      "pos": "noun",
      "pos_jp": "名詞",
      "startIdx": 0,
      "endIdx": 2
    },
    ...
  ]
}
```

## 로컬 실행

```bash
npm install
npm start
# 다른 터미널에서:
npm test
```

## 배포 (Railway)

자세한 절차는 [../PHASE2_GUIDE.md](../PHASE2_GUIDE.md)의 STEP 1을 참고하십시오.

핵심:
- Railway 프로젝트의 **Root Directory**를 `n8n/kuromoji-service` 로 설정
- **Builder**: Dockerfile 또는 Nixpacks 자동 감지
- 메모리 약 200MB 필요 (Kuromoji 사전 로딩)

## 발음 변환 알고리즘

1. Kuromoji가 가타카나(katakana) reading을 산출
2. 매핑 테이블로 가타카나 → 한국어 음절 변환 (예: `サクラ` → `사쿠라`)
3. 받침 처리:
   - `ン`(n) → 직전 음절의 종성으로 합침 (예: `マンカイ` → `만카이`)
   - `ッ`(촉음) → 직전 음절에 ㄹ 받침으로 합침 (예: `ニッポン` → `닐폰`)

> 발음은 학습 보조용 가이드이며, 음운적으로 100% 정확하지는 않습니다. 정확한 표준 한국어 표기와 다른 부분이 있으면 LLM 번역 단계에서 보정하거나 피드백 신고 기능으로 수집하여 매핑 테이블을 개선해주십시오.
