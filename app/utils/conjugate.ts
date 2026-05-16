// 일본어 동사 활용 자동 생성 (휴리스틱)
// 정확한 그룹 분류 없이도 ます/ない/た/て 4가지 형태를 추정.
// 1그룹(五段) / 2그룹(一段) / 불규칙(する·来る·行く)을 어미로 판정.

export interface ConjugationForms {
  masu: string; // 정중형 (~ます)
  nai: string;  // 부정형 (~ない)
  ta: string;   // 과거형 (~た)
  te: string;   // 연결형 (~て)
}

// い단/え단 판별 (2그룹 동사 어간 마지막 글자)
const E_DAN = /[いえきけしせちてにねひへみめりれぎげじぜぢでびべぴぺ]/;

const ICHIDAN_EXCEPTIONS = new Set([
  // 형태가 い·え 단으로 끝나도 1그룹인 동사들
  '帰る', '入る', '走る', '切る', '知る', '要る', '減る', '蹴る', '滑る', '握る',
  'かえる', 'はいる', 'はしる', 'きる', 'しる', 'いる', 'へる', 'ける',
]);

const MASU_MAP: Record<string, string> = {
  う: 'い', く: 'き', ぐ: 'ぎ', す: 'し', つ: 'ち',
  ぬ: 'に', ぶ: 'び', む: 'み', る: 'り',
};
const NAI_MAP: Record<string, string> = {
  う: 'わ', く: 'か', ぐ: 'が', す: 'さ', つ: 'た',
  ぬ: 'な', ぶ: 'ば', む: 'ま', る: 'ら',
};
const TA_MAP: Record<string, string> = {
  う: 'った', つ: 'った', る: 'った',
  く: 'いた', ぐ: 'いだ',
  す: 'した',
  ぬ: 'んだ', ぶ: 'んだ', む: 'んだ',
};
const TE_MAP: Record<string, string> = {
  う: 'って', つ: 'って', る: 'って',
  く: 'いて', ぐ: 'いで',
  す: 'して',
  ぬ: 'んで', ぶ: 'んで', む: 'んで',
};

// pos가 동사일 가능성을 판단
export function isVerb(pos: string | undefined, kana: string): boolean {
  if (!pos) return false;
  if (pos.includes('동사')) return true;
  // pos가 명시적이지 않을 때 어미 추정
  return /[うくぐすつぬぶむる]$/.test(kana);
}

// 동사 활용형 자동 생성. 휴리스틱이라 100%는 아니나 학습 참고용.
export function conjugateVerb(jp: string, kana: string): ConjugationForms | null {
  if (!kana) return null;

  // 불규칙
  if (kana === 'する' || jp === 'する') {
    return { masu: 'します', nai: 'しない', ta: 'した', te: 'して' };
  }
  if (kana === 'くる' || jp === '来る' || jp === 'くる') {
    return { masu: '来ます', nai: '来ない', ta: '来た', te: '来て' };
  }
  if (kana === 'いく' || jp === '行く' || jp === 'いく') {
    return { masu: '行きます', nai: '行かない', ta: '行った', te: '行って' };
  }
  if (kana === 'ある') {
    return { masu: 'あります', nai: 'ない', ta: 'あった', te: 'あって' };
  }

  const lastChar = kana.slice(-1);
  const stemKana = kana.slice(0, -1);
  const stemJp = jp.slice(0, -1);
  const trailingJp = jp.slice(-1) === lastChar ? jp.slice(0, -1) : jp;

  // 2그룹 (い段·え段 + る) 판정
  if (lastChar === 'る') {
    const prevChar = kana.slice(-2, -1);
    const looksIchidan = E_DAN.test(prevChar) && !ICHIDAN_EXCEPTIONS.has(jp) && !ICHIDAN_EXCEPTIONS.has(kana);
    if (looksIchidan) {
      return {
        masu: stemJp + 'ます',
        nai: stemJp + 'ない',
        ta: stemJp + 'た',
        te: stemJp + 'て',
      };
    }
  }

  // 1그룹 (五段)
  const m = MASU_MAP[lastChar];
  const n = NAI_MAP[lastChar];
  const ta = TA_MAP[lastChar];
  const te = TE_MAP[lastChar];
  if (!m || !n || !ta || !te) return null;

  // jp가 한자 표기일 경우 한자 부분 + (변화 글자)
  // 예: 書く (jp='書く', kana='かく') → ます: 書きます
  // jp의 마지막 한 글자가 kana 마지막 글자와 같다고 가정 (대부분 그러함)
  if (jp.endsWith(lastChar)) {
    const baseJp = jp.slice(0, -1);
    return {
      masu: baseJp + m + 'ます',
      nai: baseJp + n + 'ない',
      ta: baseJp + ta,
      te: baseJp + te,
    };
  }

  // jp == kana인 경우 (가나 동사)
  return {
    masu: stemKana + m + 'ます',
    nai: stemKana + n + 'ない',
    ta: stemKana + ta,
    te: stemKana + te,
  };
}

// 형용사 활용 (い형용사만 — な형용사는 패턴이 단순해 별도 처리 안 함)
export interface AdjectiveForms {
  negative: string;  // ~くない
  past: string;      // ~かった
  te: string;        // ~くて
}

export function isIAdjective(pos: string | undefined, kana: string): boolean {
  if (!pos) return false;
  if (!pos.includes('형용사')) return false;
  return kana.endsWith('い');
}

export function conjugateIAdjective(jp: string, kana: string): AdjectiveForms | null {
  if (!kana.endsWith('い')) return null;
  // 'いい' (좋다) 불규칙 — 어간이 'よ'로 변함
  if (kana === 'いい' || jp === 'いい' || jp === '良い' || jp === 'よい') {
    return { negative: 'よくない', past: 'よかった', te: 'よくて' };
  }
  const baseJp = jp.endsWith('い') ? jp.slice(0, -1) : jp;
  return {
    negative: baseJp + 'くない',
    past: baseJp + 'かった',
    te: baseJp + 'くて',
  };
}
