export type Pos =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'particle'
  | 'symbol'
  | 'other';

export interface Token {
  surface: string;
  reading: string;
  meaning: string;
  pos: Pos;
  startIdx: number;
  endIdx: number;
}

export interface Article {
  id: string;
  source: string;
  sourceUrl: string;
  titleJp: string;
  titleKo: string;
  bodyJp: string;
  bodyKo: string;
  tokens: Token[];
  thumbnailUrl?: string;
  difficulty?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  publishedAt: string;
  isRead?: boolean;
  isFavorited?: boolean;
}

export interface Highlight {
  id: string;
  articleId: string;
  startTokenIdx: number;
  endTokenIdx: number;
  selectedText: string;
  color: string;
  note?: string;
  createdAt: string;
}
