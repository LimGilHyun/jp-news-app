const express = require('express');
const kuromoji = require('kuromoji');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DICT_PATH = path.join(
  path.dirname(require.resolve('kuromoji/package.json')),
  'dict'
);

const KANA_TO_KOREAN = {
  ア: '아', イ: '이', ウ: '우', エ: '에', オ: '오',
  カ: '카', キ: '키', ク: '쿠', ケ: '케', コ: '코',
  サ: '사', シ: '시', ス: '스', セ: '세', ソ: '소',
  タ: '타', チ: '치', ツ: '츠', テ: '테', ト: '토',
  ナ: '나', ニ: '니', ヌ: '누', ネ: '네', ノ: '노',
  ハ: '하', ヒ: '히', フ: '후', ヘ: '헤', ホ: '호',
  マ: '마', ミ: '미', ム: '무', メ: '메', モ: '모',
  ヤ: '야', ユ: '유', ヨ: '요',
  ラ: '라', リ: '리', ル: '루', レ: '레', ロ: '로',
  ワ: '와', ヲ: '오', ン: 'ㄴ',
  ガ: '가', ギ: '기', グ: '구', ゲ: '게', ゴ: '고',
  ザ: '자', ジ: '지', ズ: '즈', ゼ: '제', ゾ: '조',
  ダ: '다', ヂ: '지', ヅ: '즈', デ: '데', ド: '도',
  バ: '바', ビ: '비', ブ: '부', ベ: '베', ボ: '보',
  パ: '파', ピ: '피', プ: '푸', ペ: '페', ポ: '포',
  キャ: '캬', キュ: '큐', キョ: '쿄',
  シャ: '샤', シュ: '슈', ショ: '쇼',
  チャ: '챠', チュ: '츄', チョ: '쵸',
  ニャ: '냐', ニュ: '뉴', ニョ: '뇨',
  ヒャ: '햐', ヒュ: '휴', ヒョ: '효',
  ミャ: '먀', ミュ: '뮤', ミョ: '묘',
  リャ: '랴', リュ: '류', リョ: '료',
  ギャ: '갸', ギュ: '규', ギョ: '교',
  ジャ: '쟈', ジュ: '쥬', ジョ: '죠',
  ビャ: '뱌', ビュ: '뷰', ビョ: '뵤',
  ピャ: '퍄', ピュ: '퓨', ピョ: '표',
  ー: '',
  ッ: '',
};

function attachFinalConsonant(prevSyllable, finalIdx) {
  const code = prevSyllable.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return prevSyllable + 'ㄴ';
  const offset = code - 0xac00;
  if (offset % 28 !== 0) return prevSyllable + 'ㄴ';
  return String.fromCharCode(code + finalIdx);
}

function kanaToKorean(kana) {
  if (!kana) return '';
  let result = '';
  let i = 0;
  while (i < kana.length) {
    const two = kana.substring(i, i + 2);
    if (two.length === 2 && KANA_TO_KOREAN[two] !== undefined) {
      result += KANA_TO_KOREAN[two];
      i += 2;
      continue;
    }
    const one = kana[i];
    if (one === 'ン' && result.length > 0) {
      result =
        result.slice(0, -1) + attachFinalConsonant(result.slice(-1), 4);
      i += 1;
      continue;
    }
    if (one === 'ッ' && result.length > 0) {
      result =
        result.slice(0, -1) + attachFinalConsonant(result.slice(-1), 8);
      i += 1;
      continue;
    }
    result += KANA_TO_KOREAN[one] !== undefined ? KANA_TO_KOREAN[one] : one;
    i += 1;
  }
  return result;
}

const POS_MAP = {
  名詞: 'noun',
  動詞: 'verb',
  形容詞: 'adjective',
  副詞: 'adverb',
  助詞: 'particle',
  助動詞: 'particle',
  記号: 'symbol',
};

function mapPos(jpPos) {
  return POS_MAP[jpPos] || 'other';
}

let tokenizerInstance = null;
let tokenizerError = null;

function initTokenizer() {
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: DICT_PATH }).build((err, tokenizer) => {
      if (err) {
        tokenizerError = err;
        reject(err);
        return;
      }
      tokenizerInstance = tokenizer;
      resolve(tokenizer);
    });
  });
}

const app = express();
app.use(express.json({ limit: '512kb' }));

app.get('/health', (_req, res) => {
  if (tokenizerInstance) return res.json({ status: 'ok', ready: true });
  if (tokenizerError) return res.status(500).json({ status: 'error', message: String(tokenizerError) });
  return res.status(503).json({ status: 'loading', ready: false });
});

function splitSentences(text) {
  // 일본어 문장 구분: 。！？
  const out = [];
  let buf = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    buf += c;
    if (c === '。' || c === '！' || c === '？') {
      const trimmed = buf.trim();
      if (trimmed.length > 0) out.push(trimmed);
      buf = '';
    }
  }
  const tail = buf.trim();
  if (tail.length > 0) out.push(tail);
  return out;
}

function tokenizeText(text) {
  const raw = tokenizerInstance.tokenize(text);
  let cursor = 0;
  return raw.map((t) => {
    const surface = t.surface_form;
    const startIdx = cursor;
    const endIdx = cursor + surface.length;
    cursor = endIdx;
    const readingKana = t.reading || surface;
    return {
      surface,
      reading_kana: readingKana,
      reading: kanaToKorean(readingKana),
      pos: mapPos(t.pos),
      pos_jp: t.pos,
      startIdx,
      endIdx,
    };
  });
}

app.post('/tokenize-sentences', (req, res) => {
  if (!tokenizerInstance) {
    return res.status(503).json({ error: 'tokenizer not ready' });
  }
  const text = (req.body && req.body.text) || '';
  if (typeof text !== 'string' || text.length === 0) {
    return res.status(400).json({ error: 'body.text is required (string)' });
  }
  if (text.length > 10000) {
    return res.status(413).json({ error: 'text too long (max 10000 chars)' });
  }
  try {
    const parts = splitSentences(text);
    const sentences = parts.map((text_jp, idx) => ({
      idx,
      text_jp,
      tokens: tokenizeText(text_jp),
    }));
    res.json({ sentences });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/tokenize', (req, res) => {
  if (!tokenizerInstance) {
    return res.status(503).json({ error: 'tokenizer not ready' });
  }
  const text = (req.body && req.body.text) || '';
  if (typeof text !== 'string' || text.length === 0) {
    return res.status(400).json({ error: 'body.text is required (string)' });
  }
  if (text.length > 5000) {
    return res.status(413).json({ error: 'text too long (max 5000 chars)' });
  }

  try {
    const raw = tokenizerInstance.tokenize(text);
    let cursor = 0;
    const tokens = raw.map((t) => {
      const surface = t.surface_form;
      const startIdx = cursor;
      const endIdx = cursor + surface.length;
      cursor = endIdx;
      const readingKana = t.reading || surface;
      return {
        surface,
        reading_kana: readingKana,
        reading: kanaToKorean(readingKana),
        pos: mapPos(t.pos),
        pos_jp: t.pos,
        startIdx,
        endIdx,
      };
    });
    res.json({ tokens });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

initTokenizer()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`kuromoji-service listening on :${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to init kuromoji tokenizer:', err);
    process.exit(1);
  });
