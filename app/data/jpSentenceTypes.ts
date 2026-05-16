export type SentenceKind = 'travel' | 'situation' | 'frequent' | 'slang' | 'internet';

export interface JpSentence {
  jp: string;        // 일본어 문장
  kana: string;      // 가나 표기 (한자 → 후리가나)
  ko_pron: string;   // 한국어 음역
  ko: string;        // 한국어 번역
  category: string;  // 세부 카테고리 (예: 공항, 호텔, 식당, 비즈니스)
}

export interface JpSentenceMeta {
  name: string;
  description: string;
  gradient: readonly [string, string];
}

export const SENTENCE_META: Record<SentenceKind, JpSentenceMeta> = {
  travel: {
    name: '여행 문장',
    description: '공항·호텔·식당·교통 등 여행 필수 표현',
    gradient: ['#10b981', '#06b6d4'] as const,
  },
  situation: {
    name: '상황별 문장',
    description: '인사·자기소개·비즈니스·일상 회화',
    gradient: ['#ec4899', '#8b5cf6'] as const,
  },
  frequent: {
    name: '자주 쓰는 문장',
    description: '맞장구·확인·요청·감탄 등 일상 빈도 표현',
    gradient: ['#f59e0b', '#f43f5e'] as const,
  },
  slang: {
    name: '회화 줄임말',
    description: 'てる·ちゃう·なきゃ 등 구어 축약·청소년 슬랭',
    gradient: ['#8b5cf6', '#3b82f6'] as const,
  },
  internet: {
    name: '인터넷 용어',
    description: 'SNS·밈·트위터·게임·재택 등 신조어',
    gradient: ['#06b6d4', '#22c55e'] as const,
  },
};
