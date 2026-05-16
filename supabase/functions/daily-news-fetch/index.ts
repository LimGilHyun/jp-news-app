// ============================================
// Supabase Edge Function: daily-news-fetch
//
// 매일 KST 06:00 (UTC 21:00) pg_cron이 호출하여 일본 뉴스 자동 수집
//   1) NHK RSS 수집 (최대 20건) + 썸네일 이미지 URL 추출
//   2) Kuromoji 마이크로서비스로 문장+토큰 분리
//   3) Groq LLM으로 한국어 번역 + JLPT 난이도 자동 분류 (한자 잔류 방지 강화)
//   4) Supabase articles 테이블에 INSERT
//
// 환경 변수 (Supabase Dashboard → Edge Functions → Secrets):
//   - SUPABASE_URL              (자동 주입)
//   - SUPABASE_SERVICE_ROLE_KEY (자동 주입)
//   - KUROMOJI_URL              (Railway 등에 배포한 Kuromoji 서비스 URL)
//   - GROQ_API_KEY              (Groq Cloud에서 발급)
//   - NEWS_RSS_URL              (선택, 기본값: NHK)
// ============================================

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const KUROMOJI_URL = Deno.env.get('KUROMOJI_URL')!;
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const MAX_ITEMS = 5; // 카테고리당 최대 수집 수 (이전 3 → 5로 증가, 카테고리 9개 × 5 = 일 45건 목표)
// 메인 번역은 Claude Haiku (자연스러운 한국어 번역, 인명·지명 음역 정확)
// Claude 키가 없거나 호출 실패 시 Groq Llama 3.1 8b instant 로 폴백
const USE_CLAUDE = ANTHROPIC_API_KEY.length > 0;
// Groq 무료 티어(on_demand)에서 70b 모델은 토큰/min 제한이 빡빡해 429 → 35s wait → 함수 timeout 패턴 발생.
// 8b instant는 같은 티어에서 분당 토큰 한도가 5배 이상이라 안정적.
const GROQ_MODEL = 'llama-3.1-8b-instant';

// 조사 surface → 한국어 의미 (LLM 보정용)
// LLM이 token_meanings에서 조사를 빠뜨려 위치가 어긋나는 사고를 방지하기 위한 결정적 사전.
const PARTICLE_KO: Record<string, string> = {
  は: '은/는',
  が: '이/가',
  を: '을/를',
  に: '에',
  へ: '로',
  で: '에서',
  と: '와/과',
  の: '의',
  も: '도',
  や: '~이나',
  か: '~까',
  から: '부터',
  まで: '까지',
  より: '보다',
  ね: '~죠',
  よ: '~요',
  な: '종조사',
  わ: '~네',
  さ: '~말이지',
  ぞ: '~다',
  ぜ: '~다',
  しか: '~밖에',
  だけ: '~만',
  ばかり: '~정도',
  ほど: '~정도',
  くらい: '~정도',
  ぐらい: '~정도',
  など: '~등',
  こそ: '~야말로',
  さえ: '~조차',
  でも: '~라도',
  って: '~라고',
};

// NHK RSS 카테고리 매핑
interface CategoryDef {
  code: string;     // body로 전달되는 식별자
  name: string;     // DB에 저장되는 한국어 카테고리명
  rss: string;
}

const CATEGORIES: CategoryDef[] = [
  { code: 'main',    name: '주요',   rss: 'https://www3.nhk.or.jp/rss/news/cat0.xml' },
  { code: 'society', name: '사회',   rss: 'https://www3.nhk.or.jp/rss/news/cat1.xml' },
  { code: 'culture', name: '연애',   rss: 'https://www3.nhk.or.jp/rss/news/cat2.xml' },
  { code: 'science', name: '과학',   rss: 'https://www3.nhk.or.jp/rss/news/cat3.xml' },
  { code: 'politics',name: '정치',   rss: 'https://www3.nhk.or.jp/rss/news/cat4.xml' },
  { code: 'economy', name: '경제',   rss: 'https://www3.nhk.or.jp/rss/news/cat5.xml' },
  { code: 'world',   name: '국제',   rss: 'https://www3.nhk.or.jp/rss/news/cat6.xml' },
  { code: 'sports',  name: '스포츠', rss: 'https://www3.nhk.or.jp/rss/news/cat7.xml' },
  { code: 'weather', name: '기상',   rss: 'https://www3.nhk.or.jp/rss/news/cat8.xml' },
];

function pickCategory(code: string | undefined): CategoryDef {
  return CATEGORIES.find((c) => c.code === code) ?? CATEGORIES[0];
}

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail: string | null;
}

interface KuromojiToken {
  surface: string;
  reading: string;
  pos: string;
  startIdx: number;
  endIdx: number;
}

interface KuromojiSentence {
  idx: number;
  text_jp: string;
  tokens: KuromojiToken[];
}

interface LlmSentence {
  idx: number;
  text_ko: string;
  token_meanings: string[];
}

interface GrammarPoint {
  pattern: string;        // 일본어 문법 패턴, 예: "～において"
  meaning_ko: string;     // 한국어 의미
  example_jp: string;     // 일본어 예문
  example_ko: string;     // 예문 한국어 번역
  jlpt: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
}

interface KeyVocab {
  word: string;           // 일본어 단어
  reading: string;        // 후리가나 (히라가나)
  reading_ko: string;     // 한국어 발음 표기
  meaning_ko: string;     // 한국어 의미
  jlpt: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
}

interface QuizQuestion {
  question_ko: string;    // 질문 (한국어)
  options: string[];      // 4개 선택지 (일본어 또는 혼합)
  answer_idx: number;     // 정답 인덱스 (0~3)
  explanation_ko: string; // 해설 (한국어)
  grammar_idx: number;    // 어떤 grammar_points 항목과 연결되는지 (-1이면 일반 어휘 문제)
}

interface LlmResponse {
  title_ko: string;
  body_ko: string;
  difficulty: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  sentences: LlmSentence[];
  grammar_points: GrammarPoint[];
  key_vocab: KeyVocab[];
  quiz: QuizQuestion[];
}

function extractThumbnail(block: string): string | null {
  // 1) <media:thumbnail url="..."/>  (NHK 표준)
  const mediaThumb =
    /<media:thumbnail[^>]*url=["']([^"']+)["']/i.exec(block) ||
    /<media:content[^>]*url=["']([^"']+)["'][^>]*type=["']image\//i.exec(block);
  if (mediaThumb) return mediaThumb[1];

  // 2) <enclosure url="..." type="image/..."/>
  const enclosure = /<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image\//i.exec(block);
  if (enclosure) return enclosure[1];

  // 3) description / content:encoded 안의 <img src="...">
  const imgInDesc = /<img[^>]*src=["']([^"']+\.(?:jpe?g|png|webp|gif))["']/i.exec(block);
  if (imgInDesc) return imgInDesc[1];

  return null;
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item[\s\S]*?<\/item>/g;
  const tag = (block: string, name: string) => {
    const cdata = new RegExp(`<${name}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${name}>`).exec(block);
    if (cdata) return cdata[1].trim();
    const plain = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(block);
    return plain ? plain[1].trim() : '';
  };
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(xml))) {
    const block = m[0];
    items.push({
      title: tag(block, 'title'),
      link: tag(block, 'link'),
      pubDate: tag(block, 'pubDate') || new Date().toISOString(),
      description: tag(block, 'description'),
      thumbnail: extractThumbnail(block),
    });
  }
  return items;
}

// NHK 기사 페이지에서 본문 전체 텍스트를 가져옴 (RSS description은 너무 짧음)
async function fetchFullBody(url: string, fallback: string): Promise<string> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return fallback;
    const html = await r.text();

    // NHK 기사 본문 selector 시도 (페이지 구조 변경에 대비해 여러 패턴)
    const patterns = [
      /<section[^>]*class="[^"]*content--body[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
      /<article[^>]*class="[^"]*module--article[^"]*"[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class="[^"]*content--detail[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ];
    let raw = '';
    for (const p of patterns) {
      const m = p.exec(html);
      if (m) {
        raw = m[1];
        break;
      }
    }
    if (!raw) return fallback;

    // HTML → 일반 텍스트
    let text = raw
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (text.length < 50) return fallback; // 추출 실패 시 fallback
    if (text.length > 1800) text = text.substring(0, 1800); // LLM 토큰 한도 보호
    return text;
  } catch {
    return fallback;
  }
}

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return null;
    const html = await r.text();
    const patterns = [
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i,
      /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
    ];
    for (const p of patterns) {
      const m = p.exec(html);
      if (m) return m[1];
    }
    return null;
  } catch {
    return null;
  }
}

async function tokenizeSentences(text: string): Promise<KuromojiSentence[]> {
  const r = await fetch(`${KUROMOJI_URL}/tokenize-sentences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error(`Kuromoji ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.sentences ?? [];
}

const SYSTEM_PROMPT = `You are a Japanese-to-Korean news translator + teacher. Output STRICT JSON only (no prose, no code fence).

# Schema (every field MANDATORY, never empty strings):
{
  "title_ko": "Korean translation of the title",
  "body_ko": "Korean translation of the body (natural Korean, not literal)",
  "difficulty": "N5"|"N4"|"N3"|"N2"|"N1",
  "sentences": [{"idx": int, "text_ko": "Korean translation", "token_meanings": [string,...]}],
  "grammar_points": [{
    "pattern": "<Japanese pattern, e.g. ～において / ～によると / ～ことになっている>",
    "meaning_ko": "Korean explanation",
    "example_jp": "<Japanese example sentence>",
    "example_ko": "Korean translation of example_jp",
    "jlpt": "N1"|"N2"|"N3"|"N4"|"N5",
    "match_indices": [{"sentenceIdx": int, "startTokenIdx": int, "endTokenIdx": int}]
  }],
  "key_vocab": [{
    "word": "<Japanese word as written, e.g. 首相 or プラス or 発表>",
    "reading": "<hiragana reading, e.g. しゅしょう>",
    "reading_ko": "Korean phonetic transcription, e.g. 슈쇼우",
    "meaning_ko": "Korean meaning",
    "jlpt": "N1"|"N2"|"N3"|"N4"|"N5"
  }],
  "quiz": [{
    "question_ko": "Korean question",
    "options": ["<JP option 1>","<JP option 2>","<JP option 3>","<JP option 4>"],
    "answer_idx": 0|1|2|3,
    "explanation_ko": "Korean explanation",
    "grammar_idx": int
  }]
}

# CRITICAL: pattern, word, example_jp, options[*] MUST contain actual Japanese characters (kanji/kana). Do NOT leave them as empty strings or transliteration. Use real Japanese text drawn from or modeled on the article body.

# Rules:
1. NO Japanese kanji/kana in any *_ko field. Korean text 100% Hangul. Regex [\\u3040-\\u30ff\\u4e00-\\u9fff] match count = 0 for: title_ko, body_ko, text_ko, meaning_ko, explanation_ko, reading_ko, example_ko.
2. Japanese proper nouns → Korean phonetic (Japanese-style sounds): 高市→다카이치, 鹿児島→가고시마, 猪苗代湖→이나와시로 호수, 東京→도쿄, 安楽宙斗→안라쿠 추토.
3. token_meanings MUST be a position-aligned array where token_meanings[i] corresponds to surface_tokens[i] EXACTLY. Therefore token_meanings.length === surface_tokens.length is MANDATORY — do NOT skip particles or symbols. For every particle, output its Korean equivalent (の→"의", は→"은/는", を→"을/를", に→"에", へ→"로", で→"에서", と→"와/과", が→"이/가", も→"도", や→"이나", から→"부터", まで→"까지", より→"보다", か→"~까", ね→"~죠", よ→"~요", な→"종조사", しか→"~밖에", だけ→"~만", ばかり→"~정도", ほど→"~정도", くらい→"~정도", など→"~등"). For every punctuation/symbol token (。、！？「」『』（）・…—), output an empty string "". Failing to align positions is a critical bug — count surface_tokens, count token_meanings, they MUST be equal.
4. grammar_points: 3 items minimum, real grammar patterns observed in body. N5-N2 level. For each grammar point, also fill match_indices — list every position where the pattern appears in the body (sentenceIdx + start/end token index, inclusive). If the same pattern appears in multiple sentences, include all of them. Use the surface_tokens indices from input. If unsure, leave the array empty.
5. key_vocab: 5 items minimum. News vocabulary preferred. Skip particles/symbols.

# difficulty 판정 — STRICT 휴리스틱 (N3 편중 금지)
난이도는 본문에 등장한 **가장 어려운 단어/표현**으로 판정.
1. 4자 이상 한자 복합어, 학술·전문·추상 개념 1개 이상 → **N1** 강제
2. 시사 전문 용어(政策·協定·違反·非難·支持率·経営·業績 등) 4개 이상 → **N2** 강제
3. 일반 뉴스 어휘(政治·経済·社会·重要·関連·発表 등) 위주 + 복잡한 문장 → **N3**
4. 기초 한자 + 가벼운 사회 표현 (산업·약속·계획·성공 등) → **N4**
5. 일상 인사·날씨·가족 어휘만 등장 → **N5**

판정 절차:
- 본문 한자어 개수 세기 → 5개 이상이면 N3 미만 불가
- 본문에 4자 한자 복합어 (例: 多角化, 安全保障, 通商政策) 있으면 N1
- 본문에 시사 추상어 (例: 違反, 非難, 連携) 3개 이상이면 N2 이상
- 모든 기사를 N3로 찍는 것은 명백한 오류

JLPT 분포 가이드 (10건 단위):
- N1 약 10%, N2 약 25%, N3 약 35%, N4 약 20%, N5 약 10%
- 실제 NHK 일반 뉴스는 N2가 가장 많아야 정상
6. quiz: 3 items minimum. Distribute answer_idx across 0,1,2,3.
7. Limits: ≤5 grammar, ≤8 vocab, ≤5 quiz.

# Example (illustrates required Japanese content):
{
  "grammar_points":[{"pattern":"～によると","meaning_ko":"~에 따르면 (정보의 출처를 표시)","example_jp":"報告によると、人口は減少している。","example_ko":"보고에 따르면 인구가 감소하고 있다.","jlpt":"N3","match_indices":[{"sentenceIdx":0,"startTokenIdx":2,"endTokenIdx":4}]}],
  "key_vocab":[{"word":"発表","reading":"はっぴょう","reading_ko":"핫뾰우","meaning_ko":"발표","jlpt":"N3"}],
  "quiz":[{"question_ko":"「～によると」의 올바른 사용은?","options":["新聞によると今日は晴れだ","新聞ですと今日は晴れだ","新聞についで今日は晴れだ","新聞へよると今日は晴れだ"],"answer_idx":0,"explanation_ko":"「～によると」 앞에는 명사가 와서 정보의 출처를 나타냅니다.","grammar_idx":0}]
}

Self-verify before output: every pattern/word/example_jp/option contains 1+ JP character; every *_ko field 0 JP characters; valid JSON.`;

// ─── Anthropic Claude (메인 번역) ─────────────────────────────────────
async function callAnthropic(systemPrompt: string, userContent: string, maxTokens = 4096): Promise<any> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: maxTokens,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }, // 5분 prompt cache (같은 cron 실행 안에서 반복 사용)
        },
      ],
      messages: [{ role: 'user', content: userContent }],
    }),
  });
  if (!r.ok) throw new Error(`Anthropic ${r.status}: ${await r.text()}`);
  return r.json();
}

function extractClaudeJson(resp: any): string {
  const blocks = resp?.content ?? [];
  for (const b of blocks) {
    if (b?.type === 'text' && typeof b.text === 'string') {
      // Claude가 ```json ... ``` 코드블록으로 감싸는 경우 풀어내기
      const fence = /```(?:json)?\s*([\s\S]*?)```/.exec(b.text);
      return (fence ? fence[1] : b.text).trim();
    }
  }
  return '{}';
}

async function callGroq(body: unknown, allowRateLimitRetry = true): Promise<any> {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (r.status === 429 && allowRateLimitRetry) {
    const text = await r.text();
    const m = /try again in ([\d.]+)s/.exec(text);
    const waitSec = m ? Math.min(45, parseFloat(m[1]) + 1) : 35;
    console.log(`429 rate limit, waiting ${waitSec}s and retrying once...`);
    await new Promise((res) => setTimeout(res, waitSec * 1000));
    return callGroq(body, false);
  }
  if (!r.ok) throw new Error(`Groq ${r.status}: ${await r.text()}`);
  return r.json();
}

async function translateAndClassify(
  titleJp: string,
  bodyJp: string,
  sentences: KuromojiSentence[]
): Promise<LlmResponse> {
  const userPayload = {
    title_jp: titleJp,
    body_jp: bodyJp,
    sentences: sentences.map((s) => ({
      idx: s.idx,
      text_jp: s.text_jp,
      surface_tokens: s.tokens.map((t) => t.surface),
    })),
  };
  const userContent = JSON.stringify(userPayload);

  // 1) Claude Haiku 시도 (품질 우선)
  if (USE_CLAUDE) {
    try {
      const resp = await callAnthropic(SYSTEM_PROMPT, userContent, 4096);
      const raw = extractClaudeJson(resp);
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Claude failed, falling back to Groq:', e);
    }
  }

  // 2) Groq Llama 3.3 폴백 (무료, 품질 살짝 떨어짐)
  const j = await callGroq({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 4096,
  });
  const content = j.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(content);
}

const JP_REGEX = /[぀-ヿ一-鿿]/;
const KANJI_REGEX = /[一-鿿]+/g;
const HIRAGANA_REGEX = /[぀-ゟ]/g;
const KATAKANA_REGEX = /[゠-ヿ]/g;

function hasJapaneseResidue(s: string | undefined | null): boolean {
  if (!s) return false;
  return JP_REGEX.test(s);
}

// 한자 묶음 → 한국식 음역 매핑 (가나는 이 함수 외부에서 처리)
async function buildKanjiMap(kanjiSet: Set<string>): Promise<Record<string, string>> {
  if (kanjiSet.size === 0) return {};
  const list = [...kanjiSet];
  const sysPrompt =
    'Convert each Japanese kanji word/phrase to its KOREAN PHONETIC TRANSLITERATION (Japanese-style sound, in Hangul only). Output STRICT JSON: {"map": {"<kanji>": "<Hangul phonetic>"}}. CRITICAL: Hangul-only values, ZERO kanji/kana. Examples: 冥王星→메이오우세이, 国立天文台→코쿠리츠 텐몬다이, 高市→다카이치, 鹿児島→가고시마, 東京→도쿄, 発表→핫뾰우, 研究→켄큐우.';
  const userContent = JSON.stringify({ kanji: list });

  try {
    let raw = '{}';
    if (USE_CLAUDE) {
      try {
        const resp = await callAnthropic(sysPrompt, userContent, 1024);
        raw = extractClaudeJson(resp);
      } catch (e) {
        console.warn('Claude kanji map failed, falling back to Groq:', e);
      }
    }
    if (raw === '{}') {
      const j = await callGroq({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 1024,
      });
      raw = j.choices?.[0]?.message?.content ?? '{}';
    }
    const parsed = JSON.parse(raw);
    const map = parsed.map ?? {};
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(map)) {
      if (typeof v === 'string' && !JP_REGEX.test(v)) cleaned[k] = v;
    }
    return cleaned;
  } catch (e) {
    console.warn('buildKanjiMap failed:', e);
    return {};
  }
}

// 텍스트에서 한자/가나 모두 제거하고 한국식 음역 매핑 적용
function applyKanjiMap(text: string, map: Record<string, string>): string {
  if (!text) return text;
  let out = text;
  // 길이 긴 한자 묶음부터 치환 (substring 충돌 방지)
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (out.includes(k)) {
      out = out.split(k).join(map[k]);
    }
  }
  // 매핑되지 않은 한자/가나는 제거 (학습자 혼동 방지)
  out = out.replace(KANJI_REGEX, '');
  out = out.replace(HIRAGANA_REGEX, '');
  out = out.replace(KATAKANA_REGEX, '');
  // 연속 공백 정리
  out = out.replace(/\s+/g, ' ').trim();
  return out;
}

function collectKanji(strings: Array<string | undefined | null>): Set<string> {
  const set = new Set<string>();
  for (const s of strings) {
    if (!s) continue;
    const matches = s.match(KANJI_REGEX);
    if (matches) for (const m of matches) set.add(m);
  }
  return set;
}

// 빈 token meaning을 별도 LLM 호출로 일괄 보충
async function fillMissingMeanings(
  tokensFlat: Array<{ surface: string; meaning: string; pos: string }>
): Promise<void> {
  const candidates = tokensFlat.filter(
    (t) =>
      t.pos !== 'symbol' &&
      t.pos !== 'particle' &&
      (!t.meaning || t.meaning.trim().length === 0)
  );
  if (candidates.length === 0) return;
  const surfaces = [...new Set(candidates.map((t) => t.surface))].filter((s) => s.length > 0);
  if (surfaces.length === 0) return;

  const sysPrompt =
    'For each Japanese word, output its Korean meaning (1-3 Hangul words). STRICT JSON: {"map":{"<jp>":"<ko>"}}. Korean only, ZERO kanji/kana in values.';
  const userContent = JSON.stringify({ words: surfaces });

  try {
    let raw = '{}';
    if (USE_CLAUDE) {
      try {
        const resp = await callAnthropic(sysPrompt, userContent, 1024);
        raw = extractClaudeJson(resp);
      } catch (e) {
        console.warn('Claude fillMissingMeanings failed, fallback Groq:', e);
      }
    }
    if (raw === '{}') {
      const j = await callGroq({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 1024,
      });
      raw = j.choices?.[0]?.message?.content ?? '{}';
    }
    const parsed = JSON.parse(raw);
    const map: Record<string, string> = parsed.map ?? {};
    for (const t of tokensFlat) {
      if ((!t.meaning || t.meaning.trim().length === 0) && map[t.surface]) {
        const v = map[t.surface];
        if (!JP_REGEX.test(v)) t.meaning = v;
      }
    }
  } catch (e) {
    console.warn('fillMissingMeanings failed:', e);
  }
}

async function translateWithRetry(
  titleJp: string,
  bodyJp: string,
  sentences: KuromojiSentence[]
): Promise<LlmResponse> {
  // 1차 번역
  let result = await translateAndClassify(titleJp, bodyJp, sentences);
  // 한자 잔류 검증
  const koFields = (r: LlmResponse): string[] => [
    r.title_ko,
    r.body_ko,
    ...(r.sentences ?? []).map((s) => s.text_ko ?? ''),
    ...(r.grammar_points ?? []).flatMap((g) => [g.meaning_ko ?? '', g.example_ko ?? '']),
    ...(r.key_vocab ?? []).flatMap((v) => [v.reading_ko ?? '', v.meaning_ko ?? '']),
    ...(r.quiz ?? []).flatMap((q) => [q.question_ko ?? '', q.explanation_ko ?? '']),
  ];

  const dirty = (r: LlmResponse) => koFields(r).some((s) => hasJapaneseResidue(s));

  if (dirty(result)) {
    // 2차 LLM 시도
    try {
      const retry = await translateAndClassify(
        titleJp + '\n\n[NOTE] 이전 응답에 한자/가나 잔류. 모든 한국어 필드를 한글만으로 다시 작성.',
        bodyJp,
        sentences
      );
      if (!dirty(retry)) {
        result = retry;
      } else {
        result = retry; // 더 깨끗할 가능성
      }
    } catch (e) {
      console.warn('retry translation failed:', e);
    }
  }

  // 3차 보호막: 후처리로 강제 정리
  if (dirty(result)) {
    const kanjiSet = collectKanji(koFields(result));
    const kmap = await buildKanjiMap(kanjiSet);
    result.title_ko = applyKanjiMap(result.title_ko, kmap);
    result.body_ko = applyKanjiMap(result.body_ko, kmap);
    if (result.sentences) {
      result.sentences = result.sentences.map((s) => ({
        ...s,
        text_ko: applyKanjiMap(s.text_ko, kmap),
        token_meanings: (s.token_meanings ?? []).map((m) => applyKanjiMap(m, kmap)),
      }));
    }
    if (result.grammar_points) {
      result.grammar_points = result.grammar_points.map((g) => ({
        ...g,
        meaning_ko: applyKanjiMap(g.meaning_ko, kmap),
        example_ko: applyKanjiMap(g.example_ko, kmap),
      }));
    }
    if (result.key_vocab) {
      result.key_vocab = result.key_vocab.map((v) => ({
        ...v,
        reading_ko: applyKanjiMap(v.reading_ko, kmap),
        meaning_ko: applyKanjiMap(v.meaning_ko, kmap),
      }));
    }
    if (result.quiz) {
      result.quiz = result.quiz.map((q) => ({
        ...q,
        question_ko: applyKanjiMap(q.question_ko, kmap),
        explanation_ko: applyKanjiMap(q.explanation_ko, kmap),
      }));
    }
  }

  return result;
}

function mergeSentences(
  kuromoji: KuromojiSentence[],
  llm: LlmResponse
): {
  sentences: Array<{
    idx: number;
    text_jp: string;
    text_ko: string;
    tokens: Array<KuromojiToken & { meaning: string }>;
  }>;
  flatTokens: Array<KuromojiToken & { meaning: string }>;
} {
  const llmMap = new Map<number, LlmSentence>();
  (llm.sentences ?? []).forEach((s) => llmMap.set(s.idx, s));

  const sentences = kuromoji.map((s) => {
    const ls = llmMap.get(s.idx) ?? { idx: s.idx, text_ko: '', token_meanings: [] };
    const meaningsRaw = Array.isArray(ls.token_meanings) ? ls.token_meanings : [];
    if (meaningsRaw.length !== s.tokens.length) {
      console.warn(
        `[mergeSentences] sentence ${s.idx} token/meaning length mismatch: tokens=${s.tokens.length} meanings=${meaningsRaw.length}`
      );
    }
    return {
      idx: s.idx,
      text_jp: s.text_jp,
      text_ko: ls.text_ko,
      tokens: s.tokens.map((t, i) => {
        // pos별 surface 기반 안전망 — LLM이 조사를 빠뜨려 인덱스가 밀린 경우
        // 적어도 조사·기호는 항상 정확한 의미가 채워지도록 보정
        if (t.pos === 'symbol') return { ...t, meaning: '' };
        const llmMeaning = meaningsRaw[i] ?? '';
        if (t.pos === 'particle') {
          const fb = PARTICLE_KO[t.surface];
          if (fb) return { ...t, meaning: fb };
        }
        return { ...t, meaning: llmMeaning };
      }),
    };
  });
  const flatTokens = sentences.flatMap((s) => s.tokens);
  return { sentences, flatTokens };
}

// 학습 콘텐츠(grammar_points / key_vocab / quiz)가 비어 있는 기존 기사들을
// 다시 LLM에 돌려 채워넣는 백필 모드.
async function backfillLearningContent(
  supabase: ReturnType<typeof createClient>,
  limit: number
): Promise<{
  scanned: number;
  candidates: number;
  updated: number;
  results: Array<{ id: string; status: 'ok' | 'error'; reason?: string }>;
}> {
  // 최근 50건을 스캔 → 학습 콘텐츠 한 가지라도 비어 있는 항목을 추려 limit개까지 처리
  const { data: rows, error: selectError } = await supabase
    .from('articles')
    .select('id, title_jp, body_jp, sentences, grammar_points, key_vocab, quiz')
    .order('published_at', { ascending: false })
    .limit(50);
  if (selectError) throw selectError;

  const all = rows ?? [];
  const candidates = all.filter((r) => {
    const g = Array.isArray(r.grammar_points) ? r.grammar_points : [];
    const v = Array.isArray(r.key_vocab) ? r.key_vocab : [];
    const q = Array.isArray(r.quiz) ? r.quiz : [];
    return g.length === 0 || v.length === 0 || q.length === 0;
  });
  const targets = candidates.slice(0, limit);

  const results: Array<{ id: string; status: 'ok' | 'error'; reason?: string }> = [];
  let updated = 0;

  for (const row of targets) {
    try {
      const sentences = Array.isArray(row.sentences) ? row.sentences : [];
      if (sentences.length === 0) {
        results.push({ id: row.id, status: 'error', reason: 'no sentences in row' });
        continue;
      }
      // 기존 sentences는 KuromojiSentence와 호환 (extra field meaning은 무시됨)
      const llm = await translateWithRetry(
        row.title_jp,
        row.body_jp,
        sentences as unknown as KuromojiSentence[]
      );
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          grammar_points: Array.isArray(llm.grammar_points) ? llm.grammar_points : [],
          key_vocab: Array.isArray(llm.key_vocab) ? llm.key_vocab : [],
          quiz: Array.isArray(llm.quiz) ? llm.quiz : [],
        })
        .eq('id', row.id);
      if (updateError) throw updateError;
      updated += 1;
      results.push({ id: row.id, status: 'ok' });
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      results.push({ id: row.id, status: 'error', reason });
    }
  }

  return { scanned: all.length, candidates: candidates.length, updated, results };
}

Deno.serve(async (req: Request) => {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.includes(SERVICE_KEY)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // body 옵션:
  //   - category: 카테고리 코드 (기본 main)
  //   - mode: 'backfill' 이면 새 기사 수집 대신 학습 콘텐츠가 빈 기존 기사를 다시 채움
  //   - limit: backfill 시 최대 처리 건수 (기본 5, 최대 20)
  let bodyJson: { category?: string; mode?: 'backfill'; limit?: number } = {};
  try {
    bodyJson = await req.json();
  } catch {
    bodyJson = {};
  }
  const startedAt = Date.now();
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // ─── BACKFILL 모드 ───
  if (bodyJson.mode === 'backfill') {
    try {
      const limit = Math.min(Math.max(bodyJson.limit ?? 5, 1), 20);
      const result = await backfillLearningContent(supabase, limit);
      return new Response(
        JSON.stringify({
          ok: true,
          mode: 'backfill',
          elapsedMs: Date.now() - startedAt,
          ...result,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      return new Response(JSON.stringify({ ok: false, mode: 'backfill', error: reason }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const category = pickCategory(bodyJson.category);

  try {
    const rssResp = await fetch(category.rss);
    if (!rssResp.ok) throw new Error(`RSS ${rssResp.status}`);
    const xml = await rssResp.text();
    const allItems = parseRss(xml).slice(0, MAX_ITEMS);

    const { data: existing } = await supabase
      .from('articles')
      .select('source_url')
      .in('source_url', allItems.map((i) => i.link));
    const existingSet = new Set((existing ?? []).map((r) => r.source_url));
    const newItems: Array<{ item: typeof allItems[0]; rank: number }> = [];
    allItems.forEach((it, i) => {
      if (!existingSet.has(it.link)) newItems.push({ item: it, rank: i + 1 });
    });

    const results: Array<{ link: string; status: 'ok' | 'error'; reason?: string }> = [];
    let inserted = 0;

    for (const { item, rank } of newItems) {
      try {
        // 짧은 RSS 요약 대신 기사 페이지 본문 전체를 가져옴 (실패 시 RSS 요약 폴백)
        const shortBody = item.description || item.title;
        const bodyJp = item.link
          ? await fetchFullBody(item.link, shortBody)
          : shortBody;
        const kSentences = await tokenizeSentences(bodyJp);
        const llm = await translateWithRetry(item.title, bodyJp, kSentences);
        const merged = mergeSentences(kSentences, llm);

        // 빈 token meaning 일괄 보충
        await fillMissingMeanings(merged.flatTokens);

        // RSS에 이미지가 없으면 기사 페이지의 og:image로 폴백
        let thumbnail = item.thumbnail;
        if (!thumbnail && item.link) {
          thumbnail = await fetchOgImage(item.link);
        }

        const { error } = await supabase.from('articles').insert({
          source: 'NHK',
          source_url: item.link,
          title_jp: item.title,
          title_ko: llm.title_ko,
          body_jp: bodyJp,
          body_ko: llm.body_ko,
          tokens: merged.flatTokens,
          sentences: merged.sentences,
          thumbnail_url: thumbnail,
          difficulty: ['N5', 'N4', 'N3', 'N2', 'N1'].includes(llm.difficulty)
            ? llm.difficulty
            : null,
          grammar_points: Array.isArray(llm.grammar_points) ? llm.grammar_points : [],
          key_vocab: Array.isArray(llm.key_vocab) ? llm.key_vocab : [],
          quiz: Array.isArray(llm.quiz) ? llm.quiz : [],
          category: category.name,
          rank_in_category: rank,
          published_at: new Date(item.pubDate).toISOString(),
        });
        if (error) throw error;
        inserted += 1;
        results.push({ link: item.link, status: 'ok' });
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        results.push({ link: item.link, status: 'error', reason });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        elapsedMs: Date.now() - startedAt,
        category: category.name,
        feedItems: allItems.length,
        skippedDuplicate: allItems.length - newItems.length,
        inserted,
        failed: results.filter((r) => r.status === 'error').length,
        details: results,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: reason, category: category.name }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
