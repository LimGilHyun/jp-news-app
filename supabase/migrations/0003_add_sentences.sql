-- ============================================
-- 0003: 문장 단위 사전 분리/번역 컬럼 추가
-- 목적: 앱이 매번 토큰화/번역하지 않도록 DB에 모든 데이터를 미리 저장
--       하루 1회만 fetch + 클라이언트 24시간 캐싱으로 호출 최소화
-- ============================================

-- 1) sentences 컬럼 추가 (구조: [{idx, text_jp, text_ko, tokens: [...]}])
ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS sentences JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2) 기존 seed 데이터를 sentences 구조로 백필
--    body 전체를 단일 문장으로 감싸서 기존 tokens를 그 안에 담음
UPDATE articles
SET sentences = jsonb_build_array(
    jsonb_build_object(
        'idx', 0,
        'text_jp', body_jp,
        'text_ko', COALESCE(body_ko, ''),
        'tokens', COALESCE(tokens, '[]'::jsonb)
    )
)
WHERE jsonb_array_length(sentences) = 0
  AND jsonb_array_length(COALESCE(tokens, '[]'::jsonb)) > 0;

-- 3) RPC 갱신: sentences 컬럼도 함께 반환
DROP FUNCTION IF EXISTS public.get_unread_articles();

CREATE OR REPLACE FUNCTION public.get_unread_articles()
RETURNS TABLE (
    id              UUID,
    source          TEXT,
    source_url      TEXT,
    title_jp        TEXT,
    title_ko        TEXT,
    body_jp         TEXT,
    body_ko         TEXT,
    tokens          JSONB,
    sentences       JSONB,
    thumbnail_url   TEXT,
    difficulty      TEXT,
    published_at    TIMESTAMPTZ,
    is_favorited    BOOLEAN,
    is_read         BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT
        a.id,
        a.source,
        a.source_url,
        a.title_jp,
        a.title_ko,
        a.body_jp,
        a.body_ko,
        a.tokens,
        a.sentences,
        a.thumbnail_url,
        a.difficulty,
        a.published_at,
        COALESCE(ua.is_favorited, FALSE) AS is_favorited,
        COALESCE(ua.is_read, FALSE) AS is_read
    FROM articles a
    LEFT JOIN user_activities ua
        ON ua.article_id = a.id
        AND ua.user_id = auth.uid()
    WHERE a.published_at >= NOW() - INTERVAL '7 days'
    ORDER BY a.published_at DESC
    LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_articles() TO authenticated, anon;

-- ============================================
-- 참고: 위 RPC는 더 이상 'unread만' 필터링하지 않습니다.
-- 이유: 클라이언트가 24시간 캐싱하므로, 그동안 사용자가 읽음 처리한 것을
--       앱이 로컬에서 표시하기 위해 전체 7일치를 가져옵니다.
--       호출은 하루 1회로 충분하며, 읽음/안읽음은 is_read 필드로 구분합니다.
-- ============================================

-- 4) SRS(간격 반복 학습) 단어장을 위한 highlights 테이블 확장
--    Anki SM-2 알고리즘에 필요한 메타 컬럼 추가
ALTER TABLE highlights
    ADD COLUMN IF NOT EXISTS ease_factor    NUMERIC(4,2) NOT NULL DEFAULT 2.5,
    ADD COLUMN IF NOT EXISTS interval_days  INTEGER      NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS repetition     INTEGER      NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS last_quality   INTEGER;

CREATE INDEX IF NOT EXISTS idx_highlights_review_due
    ON highlights (user_id, next_review_at)
    WHERE next_review_at IS NOT NULL;

-- 5) anon 사용자도 highlights에 INSERT/UPDATE/DELETE 가능하도록
--    (개발 단계 — 실 서비스에서는 인증 후 user_id 매핑 필요)
DROP POLICY IF EXISTS "highlights_owner_all" ON highlights;
CREATE POLICY "highlights_anyone_dev"
    ON highlights
    FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

-- 6) user_activities도 anon 허용 (읽음/즐겨찾기를 익명 모드에서도 동기화)
DROP POLICY IF EXISTS "user_activities_owner_all" ON user_activities;
CREATE POLICY "user_activities_anyone_dev"
    ON user_activities
    FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

-- 7) MVP 단계: device-local UUID(앱이 AsyncStorage에 저장)를 user_id로 사용 가능하도록
--    auth.users FK 제약을 제거합니다. 실 인증 도입 시 다시 복원.
ALTER TABLE user_activities DROP CONSTRAINT IF EXISTS user_activities_user_id_fkey;
ALTER TABLE highlights      DROP CONSTRAINT IF EXISTS highlights_user_id_fkey;

-- ============================================
-- ⚠️ 주의: 5/6번 정책은 익명 사용자도 모든 row를 변경할 수 있어
--          개발/MVP 전용입니다. 실 서비스 출시 전에는 Supabase Auth로
--          익명 인증(supabase.auth.signInAnonymously())을 도입하고
--          정책을 'auth.uid() = user_id'로 되돌려야 합니다.
-- ============================================
