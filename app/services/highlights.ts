import { supabase } from './supabase';
import { Highlight, Quality } from '../types/article';
import { getDeviceUserId } from '../utils/deviceUser';
import { applySrs } from '../utils/srs';

interface HighlightRow {
  id: string;
  article_id: string;
  sentence_idx: number;
  start_token_idx: number;
  end_token_idx: number;
  selected_text: string;
  reading: string | null;
  meaning: string | null;
  color: string;
  note: string | null;
  created_at: string;
  ease_factor: number;
  interval_days: number;
  repetition: number;
  next_review_at: string;
  last_quality: number | null;
}

const rowToHighlight = (r: HighlightRow): Highlight => ({
  id: r.id,
  articleId: r.article_id,
  sentenceIdx: r.sentence_idx,
  startTokenIdx: r.start_token_idx,
  endTokenIdx: r.end_token_idx,
  selectedText: r.selected_text,
  reading: r.reading ?? undefined,
  meaning: r.meaning ?? undefined,
  color: r.color,
  note: r.note ?? undefined,
  createdAt: r.created_at,
  easeFactor: Number(r.ease_factor),
  intervalDays: r.interval_days,
  repetition: r.repetition,
  nextReviewAt: r.next_review_at,
  lastQuality: r.last_quality ?? undefined,
});

export async function fetchHighlights(): Promise<Highlight[]> {
  const userId = await getDeviceUserId();
  const { data, error } = await supabase
    .from('highlights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as HighlightRow[]).map(rowToHighlight);
}

export interface CreateHighlightInput {
  articleId: string;
  sentenceIdx: number;
  startTokenIdx: number;
  endTokenIdx: number;
  selectedText: string;
  reading?: string;
  meaning?: string;
  color?: string;
  note?: string;
}

export async function createHighlight(input: CreateHighlightInput): Promise<Highlight> {
  const userId = await getDeviceUserId();
  const { data, error } = await supabase
    .from('highlights')
    .insert({
      user_id: userId,
      article_id: input.articleId,
      sentence_idx: input.sentenceIdx,
      start_token_idx: input.startTokenIdx,
      end_token_idx: input.endTokenIdx,
      selected_text: input.selectedText,
      reading: input.reading ?? null,
      meaning: input.meaning ?? null,
      color: input.color ?? 'yellow',
      note: input.note ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToHighlight(data as HighlightRow);
}

export async function deleteHighlight(id: string): Promise<void> {
  const { error } = await supabase.from('highlights').delete().eq('id', id);
  if (error) throw error;
}

export async function reviewHighlight(highlight: Highlight, quality: Quality): Promise<Highlight> {
  const next = applySrs(highlight, quality);
  const { data, error } = await supabase
    .from('highlights')
    .update({
      ease_factor: next.easeFactor,
      interval_days: next.intervalDays,
      repetition: next.repetition,
      next_review_at: next.nextReviewAt,
      last_quality: next.lastQuality,
    })
    .eq('id', highlight.id)
    .select()
    .single();
  if (error) throw error;
  return rowToHighlight(data as HighlightRow);
}
