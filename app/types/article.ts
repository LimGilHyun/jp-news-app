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
  reading: string;          // 한국어 발음 표기 (예: 토우쿄우)
  reading_kana?: string;    // 원본 가타카나 (예: トウキョウ)
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

export interface GrammarMatch {
  sentenceIdx: number;
  startTokenIdx: number;
  endTokenIdx: number;
}

export interface GrammarPoint {
  pattern: string;
  meaning_ko: string;
  example_jp: string;
  example_ko: string;
  jlpt: Difficulty;
  match_indices?: GrammarMatch[];
}

export interface KeyVocab {
  word: string;
  reading: string;
  reading_ko: string;
  meaning_ko: string;
  jlpt: Difficulty;
}

export interface QuizQuestion {
  question_ko: string;
  options: string[];
  answer_idx: number;
  explanation_ko: string;
  grammar_idx: number;
}

export type CategoryName =
  | '주요'
  | '사회'
  | '연애'
  | '과학'
  | '정치'
  | '경제'
  | '국제'
  | '스포츠'
  | '기상';

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
  grammarPoints: GrammarPoint[];
  keyVocab: KeyVocab[];
  quiz: QuizQuestion[];
  category?: CategoryName;
  rankInCategory?: number;
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
