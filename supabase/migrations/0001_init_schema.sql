-- ============================================
-- 일본 뉴스 학습 앱: 초기 스키마
-- 실행: Supabase Studio SQL Editor
-- ============================================

-- 1) articles: 뉴스 원문 및 전처리 결과
CREATE TABLE IF NOT EXISTS articles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source          TEXT NOT NULL,
    source_url      TEXT UNIQUE NOT NULL,
    title_jp        TEXT NOT NULL,
    title_ko        TEXT,
    body_jp         TEXT NOT NULL,
    body_ko         TEXT,
    tokens          JSONB NOT NULL DEFAULT '[]'::jsonb,
    thumbnail_url   TEXT,
    difficulty      TEXT CHECK (difficulty IN ('N5','N4','N3','N2','N1')),
    published_at    TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_published_at
    ON articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_difficulty
    ON articles (difficulty);

-- 2) user_activities: 사용자별 읽음/즐겨찾기 상태
CREATE TABLE IF NOT EXISTS user_activities (
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id          UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    is_favorited        BOOLEAN NOT NULL DEFAULT FALSE,
    last_read_position  INTEGER NOT NULL DEFAULT 0,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_user_activities_favorited
    ON user_activities (user_id, is_favorited)
    WHERE is_favorited = TRUE;

-- 3) highlights: 사용자 형광펜 데이터
CREATE TABLE IF NOT EXISTS highlights (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id        UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    start_token_idx   INTEGER NOT NULL,
    end_token_idx     INTEGER NOT NULL,
    selected_text     TEXT NOT NULL,
    color             TEXT NOT NULL DEFAULT 'yellow',
    note              TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT highlights_idx_range CHECK (end_token_idx >= start_token_idx)
);

CREATE INDEX IF NOT EXISTS idx_highlights_user_article
    ON highlights (user_id, article_id);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- articles 는 인증된 사용자에게 모두 읽기 허용
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "articles_read_all_authenticated"
    ON articles
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- user_activities 는 본인 데이터만
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_activities_owner_all"
    ON user_activities
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- highlights 는 본인 데이터만
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "highlights_owner_all"
    ON highlights
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- updated_at 자동 갱신 트리거
-- ============================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_activities_updated_at ON user_activities;
CREATE TRIGGER user_activities_updated_at
    BEFORE UPDATE ON user_activities
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
