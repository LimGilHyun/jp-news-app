-- ============================================
-- 0005: 학습 도구 컬럼 추가
--   - grammar_points: 기사에서 추출한 핵심 문법 (배열)
--   - key_vocab: 핵심 단어 (배열)
--   - quiz: 문법 기반 객관식 퀴즈 (배열)
--
-- Edge Function이 Groq LLM으로 자동 생성하여 INSERT 시 함께 저장합니다.
-- ============================================

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS grammar_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS key_vocab      jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS quiz           jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 기존 RPC가 *를 select하지 않는다면 새 컬럼도 포함되도록 재생성
-- (현재 RPC는 SELECT * 이므로 자동 포함됨)
