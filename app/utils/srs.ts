import { Highlight, Quality } from '../types/article';

/**
 * SuperMemo SM-2 알고리즘 (간격 반복 학습)
 * 입력: 현재 카드 상태 + 사용자 평점(0~5)
 * 출력: 다음 복습 일정 + 갱신된 ease/interval/repetition
 *
 * 참고: https://super-memory.com/english/ol/sm2.htm
 */
export function applySrs(
  card: Pick<Highlight, 'easeFactor' | 'intervalDays' | 'repetition'>,
  quality: Quality
): Pick<Highlight, 'easeFactor' | 'intervalDays' | 'repetition' | 'nextReviewAt' | 'lastQuality'> {
  let { easeFactor, intervalDays, repetition } = card;

  if (quality < 3) {
    // AGAIN: 처음부터 다시
    repetition = 0;
    intervalDays = 1;
  } else {
    repetition += 1;
    if (repetition === 1) intervalDays = 1;
    else if (repetition === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);

    easeFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
  }

  const next = new Date();
  next.setDate(next.getDate() + intervalDays);

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    intervalDays,
    repetition,
    nextReviewAt: next.toISOString(),
    lastQuality: quality,
  };
}

export function isDue(card: Pick<Highlight, 'nextReviewAt'>, now = new Date()): boolean {
  return new Date(card.nextReviewAt).getTime() <= now.getTime();
}
