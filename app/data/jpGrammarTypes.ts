export type GrammarKind =
  | 'particle'
  | 'prefix'
  | 'suffix'
  | 'adverb'
  | 'conjunction'
  | 'demonstrative'
  | 'interrogative';

export interface JpGrammarItem {
  jp: string;          // 조사/접두사/접미사 표기 (예: は, お~, ~さん)
  kana: string;        // 가나 발음 (예: わ, お, さん)
  ko_pron: string;     // 한국어 음역
  meaning: string;     // 핵심 의미
  usage: string;       // 사용 설명
  example_jp: string;  // 예문 (일본어)
  example_kana: string;// 예문 가나 표기
  example_ko: string;  // 예문 한국어 번역
}

export interface JpGrammarMeta {
  name: string;
  description: string;
  gradient: readonly [string, string];
}

export const GRAMMAR_META: Record<GrammarKind, JpGrammarMeta> = {
  particle: {
    name: '조사',
    description: '助詞 · 명사·동사 뒤에서 의미 관계를 표현',
    gradient: ['#6366f1', '#8b5cf6'] as const,
  },
  prefix: {
    name: '접두사',
    description: '接頭辞 · 단어 앞에 붙어 의미를 더함',
    gradient: ['#0ea5e9', '#06b6d4'] as const,
  },
  suffix: {
    name: '접미사',
    description: '接尾辞 · 단어 뒤에 붙어 호칭·성격을 표현',
    gradient: ['#f59e0b', '#ef4444'] as const,
  },
  adverb: {
    name: '부사',
    description: '副詞 · 동사·형용사를 꾸며 정도·빈도를 표현',
    gradient: ['#22c55e', '#10b981'] as const,
  },
  conjunction: {
    name: '접속사',
    description: '接続詞 · 문장과 문장을 잇는 연결어',
    gradient: ['#a855f7', '#d946ef'] as const,
  },
  demonstrative: {
    name: '지시어',
    description: 'こそあど · 사물·장소·방향을 가리키는 말',
    gradient: ['#0891b2', '#3b82f6'] as const,
  },
  interrogative: {
    name: '의문사',
    description: '疑問詞 · 무엇·언제·어디 등 질문 표현',
    gradient: ['#f43f5e', '#fb923c'] as const,
  },
};
