import type { CardStatus, WordProgress } from '../stores/studyStore';

// 세션 시작 시 우선순위 정렬:
//   1) status 미설정(처음 보는 카드) — 가장 먼저
//   2) unknown — 자주 노출
//   3) fuzzy — 중간
//   4) known — 가장 적게
//   같은 상태에서는 lastReviewedAt이 오래된 순서 (오래 안 본 것 먼저)
const STATUS_WEIGHT: Record<CardStatus | 'new', number> = {
  new: 0,
  unknown: 1,
  fuzzy: 2,
  known: 3,
};

function statusKey(p?: WordProgress): keyof typeof STATUS_WEIGHT {
  if (!p?.status) return 'new';
  return p.status;
}

export function sortBySrsPriority<T extends { jp: string }>(
  items: T[],
  progress: Record<string, WordProgress>
): T[] {
  return [...items].sort((a, b) => {
    const pa = progress[a.jp];
    const pb = progress[b.jp];
    const wa = STATUS_WEIGHT[statusKey(pa)];
    const wb = STATUS_WEIGHT[statusKey(pb)];
    if (wa !== wb) return wa - wb;
    // 같은 상태: lastReviewedAt 오래된 것 먼저 (없으면 가장 우선)
    const ta = pa?.lastReviewedAt ? Date.parse(pa.lastReviewedAt) : 0;
    const tb = pb?.lastReviewedAt ? Date.parse(pb.lastReviewedAt) : 0;
    return ta - tb;
  });
}

// 현재 큐에서 다음에 보여줄 카드 인덱스 결정.
// 사용자가 status를 바꾼 직후 호출.
//   - unknown: 큐 끝에 다시 추가 (이번 세션에서 한 번 더)
//   - fuzzy: 끝에서 약 5칸 앞에 다시 삽입 (조금 후에 다시)
//   - known: 큐에서 제거 (이번 세션 안 나옴)
export function applyAction<T>(
  queue: T[],
  currentIdx: number,
  status: CardStatus
): { nextQueue: T[]; nextIdx: number; finished: boolean } {
  const card = queue[currentIdx];
  const before = queue.slice(0, currentIdx);
  const after = queue.slice(currentIdx + 1);

  if (status === 'known') {
    const next = [...before, ...after];
    if (next.length === 0) return { nextQueue: next, nextIdx: 0, finished: true };
    // 현재 인덱스 위치에 그대로 머물기 (다음 카드가 해당 자리에 옴)
    const newIdx = currentIdx >= next.length ? next.length - 1 : currentIdx;
    return { nextQueue: next, nextIdx: newIdx, finished: false };
  }

  if (status === 'fuzzy') {
    // 큐에서 빼고 끝에서 5칸 앞에 다시 삽입 (큐가 짧으면 끝에)
    const remaining = [...before, ...after];
    const insertAt = Math.max(currentIdx, remaining.length - 5);
    const next = [
      ...remaining.slice(0, insertAt),
      card,
      ...remaining.slice(insertAt),
    ];
    const newIdx = currentIdx >= next.length ? next.length - 1 : currentIdx;
    return { nextQueue: next, nextIdx: newIdx, finished: false };
  }

  // unknown: 큐 끝에 다시 추가
  const next = [...before, ...after, card];
  const newIdx = currentIdx >= next.length - 1 ? next.length - 1 : currentIdx;
  return { nextQueue: next, nextIdx: newIdx, finished: false };
}

export function countByStatus<T extends { jp: string }>(
  items: T[],
  progress: Record<string, WordProgress>
): { unknown: number; fuzzy: number; known: number; pending: number } {
  let unknown = 0;
  let fuzzy = 0;
  let known = 0;
  let pending = 0;
  for (const it of items) {
    const s = progress[it.jp]?.status;
    if (s === 'unknown') unknown += 1;
    else if (s === 'fuzzy') fuzzy += 1;
    else if (s === 'known') known += 1;
    else pending += 1;
  }
  return { unknown, fuzzy, known, pending };
}
