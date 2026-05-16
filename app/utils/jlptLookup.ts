import type { Difficulty, Token } from '../types/article';
import { JLPT_DICT, JLPT_KANA_DICT } from '../data/jlptDict';

/**
 * 토큰의 JLPT 레벨 추정.
 * 우선순위: surface 매칭 → kana 매칭 → null (미분류)
 */
export function lookupJlpt(token: Token): Difficulty | null {
  if (!token.surface) return null;
  // 기호/조사는 분류 제외
  if (token.pos === 'symbol' || token.pos === 'particle') return null;

  // 1. surface form 직접 매칭 (한자/혼합)
  const direct = JLPT_DICT[token.surface];
  if (direct) return direct;

  // 2. kana 매칭 (히라가나/가타카나로 적힌 단어)
  if (token.reading_kana) {
    const kanaMatch = JLPT_KANA_DICT[token.reading_kana];
    if (kanaMatch) return kanaMatch;
  }

  return null;
}

/**
 * JLPT 레벨에 따른 색상 (밑줄용).
 * 진할수록 어려움. 라이트/다크 모드 둘 다 가독성 좋게.
 */
export function jlptUnderlineColor(level: Difficulty | null, isDark: boolean): string | null {
  if (!level) return null;
  if (isDark) {
    switch (level) {
      case 'N5': return '#86efac'; // 연두 (쉬움)
      case 'N4': return '#93c5fd'; // 하늘
      case 'N3': return '#fde047'; // 노랑
      case 'N2': return '#fdba74'; // 주황
      case 'N1': return '#fca5a5'; // 빨강 (어려움)
    }
  }
  switch (level) {
    case 'N5': return '#16a34a';
    case 'N4': return '#2563eb';
    case 'N3': return '#ca8a04';
    case 'N2': return '#ea580c';
    case 'N1': return '#dc2626';
  }
  return null;
}
