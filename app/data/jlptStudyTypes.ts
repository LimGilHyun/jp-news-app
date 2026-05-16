import type { Difficulty } from '../types/article';

export interface JlptStudyWord {
  jp: string;       // 일본어 표기 (한자/가나 혼합)
  kana: string;     // 히라가나/가타카나 발음
  ko_pron: string;  // 한국어 발음 표기
  meaning: string;  // 한국어 의미
  level: Difficulty;
  pos?: string;     // 명사/동사/형용사 등
  // 카드 학습 뒷면에 표시될 예문 (선택)
  example_jp?: string;
  example_kana?: string;
  example_ko?: string;
  // 단어 사용에 대한 메모 (특이사항·뉘앙스)
  note?: string;
}
