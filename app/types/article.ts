export type Pos =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'particle'
  | 'symbol'
  | 'other';

export type Difficulty = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface Token {
  surface: string;
  reading: string;
  meaning: string;
  pos: Pos;
  startIdx: number;
  endIdx: number;
}

export interface Sentence {
  idx: number;
  text_jp: string;
  text_ko: string;
  tokens: Token[];
}

export interface Article {
  id: string;
  source: string;
  sourceUrl: string;
  titleJp: string;
  titleKo: string;
  bodyJp: string;
  bodyKo: string;
  sentences: Sentence[];
  thumbnailUrl?: string;
  difficulty?: Difficulty;
  publishedAt: string;
  isRead?: boolean;
  isFavorited?: boolean;
}

export interface Highlight {
  id: string;
  articleId: string;
  sentenceIdx: number;
  startTokenIdx: number;
  endTokenIdx: number;
  selectedText: string;
  reading?: string;
  meaning?: string;
  color: string;
  note?: string;
  createdAt: string;
  // SRS (SM-2)
  easeFactor: number;
  intervalDays: number;
  repetition: number;
  nextReviewAt: string;
  lastQuality?: number;
}

// SM-2 품질 평점 (0~5). UI에서 4단계만 노출
export const QUALITY = {
  AGAIN: 0,
  HARD: 2,
  GOOD: 4,
  EASY: 5,
} as const;
export type Quality = (typeof QUALITY)[keyof typeof QUALITY];
