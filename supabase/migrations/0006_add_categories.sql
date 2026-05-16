-- ============================================
-- 0006: 카테고리/순위 컬럼 추가
--   articles.category         : '사회'|'연예'|'과학'|'정치'|'경제'|'국제'|'스포츠'|'주요'|'기상'
--   articles.rank_in_category : NHK RSS 노출 순서 = 그 카테고리의 인기/이슈도 (1~10)
-- ============================================

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS category          text,
  ADD COLUMN IF NOT EXISTS rank_in_category  int;

-- 카테고리 + 순위 조회를 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS articles_category_rank_idx
  ON articles (category, rank_in_category, published_at DESC);

-- 기존 데이터는 모두 '주요' 카테고리로 임의 설정 (추후 cron이 새 데이터 채움)
UPDATE articles SET category = '주요' WHERE category IS NULL;
