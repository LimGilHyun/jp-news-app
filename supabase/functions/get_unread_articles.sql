-- ============================================
-- '읽지 않은 뉴스 목록' RPC 함수
-- 호출: supabase.rpc('get_unread_articles')
--
-- 동작:
--   articles와 user_activities를 LEFT JOIN하여
--   현재 인증된 사용자가 아직 읽지 않은(is_read=false 또는 row 없음)
--   최근 7일 내 기사 최대 20개를 발행일 역순으로 반환
-- ============================================

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
        a.thumbnail_url,
        a.difficulty,
        a.published_at,
        COALESCE(ua.is_favorited, FALSE) AS is_favorited,
        COALESCE(ua.is_read, FALSE) AS is_read
    FROM articles a
    LEFT JOIN user_activities ua
        ON ua.article_id = a.id
        AND ua.user_id = auth.uid()
    WHERE
        COALESCE(ua.is_read, FALSE) = FALSE
        AND a.published_at >= NOW() - INTERVAL '7 days'
    ORDER BY a.published_at DESC
    LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_articles() TO authenticated;

-- ============================================
-- 참고: 기본 SELECT 형태 (RPC 미사용 시)
-- ============================================
-- SELECT
--     a.id, a.title_jp, a.title_ko, a.published_at,
--     a.thumbnail_url, a.source,
--     COALESCE(ua.is_favorited, false) AS is_favorited
-- FROM articles a
-- LEFT JOIN user_activities ua
--     ON ua.article_id = a.id AND ua.user_id = auth.uid()
-- WHERE COALESCE(ua.is_read, false) = false
--   AND a.published_at >= NOW() - INTERVAL '7 days'
-- ORDER BY a.published_at DESC
-- LIMIT 20;
