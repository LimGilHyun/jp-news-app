import { supabase } from './supabase';
import {
  Article,
  GrammarPoint,
  KeyVocab,
  QuizQuestion,
  Sentence,
  Token,
} from '../types/article';
import { getDeviceUserId } from '../utils/deviceUser';

interface ArticleRow {
  id: string;
  source: string;
  source_url: string;
  title_jp: string;
  title_ko: string | null;
  body_jp: string;
  body_ko: string | null;
  tokens?: Token[] | null;
  sentences?: Sentence[] | null;
  thumbnail_url: string | null;
  difficulty: Article['difficulty'] | null;
  grammar_points?: GrammarPoint[] | null;
  key_vocab?: KeyVocab[] | null;
  quiz?: QuizQuestion[] | null;
  category?: string | null;
  rank_in_category?: number | null;
  published_at: string;
  is_favorited?: boolean;
  is_read?: boolean;
}

function ensureSentences(row: ArticleRow): Sentence[] {
  const s = row.sentences;
  if (Array.isArray(s) && s.length > 0) return s;
  // 백워드 호환: sentences가 비어있으면 본문 전체를 단일 문장으로 감쌈
  return [
    {
      idx: 0,
      text_jp: row.body_jp,
      text_ko: row.body_ko ?? '',
      tokens: row.tokens ?? [],
    },
  ];
}

const rowToArticle = (row: ArticleRow): Article => ({
  id: row.id,
  source: row.source,
  sourceUrl: row.source_url,
  titleJp: row.title_jp,
  titleKo: row.title_ko ?? '',
  bodyJp: row.body_jp,
  bodyKo: row.body_ko ?? '',
  sentences: ensureSentences(row),
  thumbnailUrl: row.thumbnail_url ?? undefined,
  difficulty: row.difficulty ?? undefined,
  grammarPoints: Array.isArray(row.grammar_points) ? row.grammar_points : [],
  keyVocab: Array.isArray(row.key_vocab) ? row.key_vocab : [],
  quiz: Array.isArray(row.quiz) ? row.quiz : [],
  category: (row.category as Article['category']) ?? undefined,
  rankInCategory: row.rank_in_category ?? undefined,
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
  const userId = await getDeviceUserId();
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
  const userId = await getDeviceUserId();
  const { error } = await supabase
    .from('user_activities')
    .upsert(
      { user_id: userId, article_id: articleId, is_favorited: next },
      { onConflict: 'user_id,article_id' }
    );
  if (error) throw error;
}
