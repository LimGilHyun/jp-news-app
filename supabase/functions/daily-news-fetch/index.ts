// ============================================
// Supabase Edge Function: daily-news-fetch
//
// 매일 KST 06:00 (UTC 21:00) pg_cron이 호출하여 일본 뉴스 자동 수집
//   1) NHK RSS 수집 (최대 20건)
//   2) Kuromoji 마이크로서비스로 문장+토큰 분리
//   3) Groq LLM으로 한국어 번역 + JLPT 난이도 자동 분류
//   4) Supabase articles 테이블에 UPSERT (source_url 충돌 시 무시)
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
const RSS_URL =
  Deno.env.get('NEWS_RSS_URL') ?? 'https://www3.nhk.or.jp/rss/news/cat0.xml';
const MAX_ITEMS = 20;

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
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

interface LlmResponse {
  title_ko: string;
  body_ko: string;
  difficulty: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  sentences: LlmSentence[];
}

function parseRss(xml: string): RssItem[] {
  // 매우 단순한 RSS 파서 (item 태그만)
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
    });
  }
  return items;
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

  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are a Japanese language teacher translating Japanese news for Korean learners. Return STRICT JSON: {"title_ko": string, "body_ko": string, "difficulty": "N5"|"N4"|"N3"|"N2"|"N1", "sentences": [{"idx": number, "text_ko": string, "token_meanings": string[]}]}. token_meanings MUST match the input surface_tokens length and order. Difficulty is judged by overall vocabulary level.',
        },
        { role: 'user', content: JSON.stringify(userPayload) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });
  if (!r.ok) throw new Error(`Groq ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const content = j.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(content);
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
    return {
      idx: s.idx,
      text_jp: s.text_jp,
      text_ko: ls.text_ko,
      tokens: s.tokens.map((t, i) => ({ ...t, meaning: ls.token_meanings[i] ?? '' })),
    };
  });
  const flatTokens = sentences.flatMap((s) => s.tokens);
  return { sentences, flatTokens };
}

Deno.serve(async (req: Request) => {
  // 인증: 호출자가 Supabase Service Role 또는 알려진 cron secret을 가져야 함
  // (pg_cron + net.http_post는 서비스 키 헤더로 호출하도록 마이그레이션에 정의)
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.includes(SERVICE_KEY)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const startedAt = Date.now();
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    // 1) RSS fetch
    const rssResp = await fetch(RSS_URL);
    if (!rssResp.ok) throw new Error(`RSS ${rssResp.status}`);
    const xml = await rssResp.text();
    const allItems = parseRss(xml).slice(0, MAX_ITEMS);

    // 2) source_url 기준으로 이미 있는 것 필터링 (중복 방지)
    const { data: existing } = await supabase
      .from('articles')
      .select('source_url')
      .in('source_url', allItems.map((i) => i.link));
    const existingSet = new Set((existing ?? []).map((r) => r.source_url));
    const newItems = allItems.filter((i) => !existingSet.has(i.link));

    const results: Array<{ link: string; status: 'ok' | 'error'; reason?: string }> = [];
    let inserted = 0;

    for (const item of newItems) {
      try {
        const bodyJp = item.description || item.title;
        const kSentences = await tokenizeSentences(bodyJp);
        const llm = await translateAndClassify(item.title, bodyJp, kSentences);
        const merged = mergeSentences(kSentences, llm);

        const { error } = await supabase.from('articles').insert({
          source: 'NHK',
          source_url: item.link,
          title_jp: item.title,
          title_ko: llm.title_ko,
          body_jp: bodyJp,
          body_ko: llm.body_ko,
          tokens: merged.flatTokens,
          sentences: merged.sentences,
          difficulty: ['N5', 'N4', 'N3', 'N2', 'N1'].includes(llm.difficulty)
            ? llm.difficulty
            : null,
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
    return new Response(JSON.stringify({ ok: false, error: reason }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
