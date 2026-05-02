import { supabase } from './supabase';
import { Article, Token } from '../types/article';

interface ArticleRow {
  id: string;
  source: string;
  source_url: string;
  title_jp: string;
  title_ko: string | null;
  body_jp: string;
  body_ko: string | null;
  tokens: Token[];
  thumbnail_url: string | null;
  difficulty: Article['difficulty'] | null;
  published_at: string;
  is_favorited?: boolean;
  is_read?: boolean;
}

const rowToArticle = (row: ArticleRow): Article => ({
  id: row.id,
  source: row.source,
  sourceUrl: row.source_url,
  titleJp: row.title_jp,
  titleKo: row.title_ko ?? '',
  bodyJp: row.body_jp,
  bodyKo: row.body_ko ?? '',
  tokens: row.tokens ?? [],
  thumbnailUrl: row.thumbnail_url ?? undefined,
  difficulty: row.difficulty ?? undefined,
  publishedAt: row.published_at,
  isFavorited: row.is_favorited ?? false,
  isRead: row.is_read ?? false,
});

export async function fetchUnreadArticles(): Promise<Article[]> {
  const { data, error } = await supabase.rpc('get_unread_articles');
  if (error) throw error;
  return (data as ArticleRow[]).map(rowToArticle);
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data ? rowToArticle(data as ArticleRow) : null;
}

export async function markAsRead(articleId: string): Promise<void> {
  const { data: userResp } = await supabase.auth.getUser();
  const userId = userResp.user?.id;
  if (!userId) return;
  const { error } = await supabase
    .from('user_activities')
    .upsert(
      { user_id: userId, article_id: articleId, is_read: true },
      { onConflict: 'user_id,article_id' }
    );
  if (error) throw error;
}

export async function toggleFavorite(
  articleId: string,
  next: boolean
): Promise<void> {
  const { data: userResp } = await supabase.auth.getUser();
  const userId = userResp.user?.id;
  if (!userId) return;
  const { error } = await supabase
    .from('user_activities')
    .upsert(
      { user_id: userId, article_id: articleId, is_favorited: next },
      { onConflict: 'user_id,article_id' }
    );
  if (error) throw error;
}
