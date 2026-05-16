import type { JpSentence } from './jpSentenceTypes';

// 자주 쓰는 문장 약 80개 — 맞장구·확인·요청·거절·약속·감탄·동의·불확실성
export const JP_FREQUENT_SENTENCES: JpSentence[] = [
  // === 맞장구 (相づち) ===
  { category: '맞장구', jp: 'そうですね。', kana: 'そうですね。', ko_pron: '소우데스네', ko: '그렇네요.' },
  { category: '맞장구', jp: 'そうそう。', kana: 'そうそう。', ko_pron: '소우소우', ko: '맞아 맞아.' },
  { category: '맞장구', jp: 'なるほどね。', kana: 'なるほどね。', ko_pron: '나루호도네', ko: '그렇구나.' },
  { category: '맞장구', jp: 'たしかに。', kana: 'たしかに。', ko_pron: '타시카니', ko: '확실히.' },
  { category: '맞장구', jp: 'まあね。', kana: 'まあね。', ko_pron: '마-네', ko: '뭐 그렇지.' },
  { category: '맞장구', jp: 'うんうん。', kana: 'うんうん。', ko_pron: '운운', ko: '응응.' },
  { category: '맞장구', jp: 'やっぱり。', kana: 'やっぱり。', ko_pron: '얏파리', ko: '역시.' },
  { category: '맞장구', jp: 'わかる。', kana: 'わかる。', ko_pron: '와카루', ko: '이해돼.' },
  { category: '맞장구', jp: 'それな。', kana: 'それな。', ko_pron: '소레나', ko: '그러게/맞말.' },

  // === 확인 ===
  { category: '확인', jp: '本当ですか？', kana: 'ほんとうですか？', ko_pron: '혼토우데스카', ko: '진짜요?' },
  { category: '확인', jp: 'マジで？', kana: 'マジで？', ko_pron: '마지데', ko: '진심?' },
  { category: '확인', jp: 'えっ、何？', kana: 'えっ、なに？', ko_pron: '엣 나니', ko: '어, 뭐?' },
  { category: '확인', jp: 'もう一度言って。', kana: 'もういちどいって。', ko_pron: '모우 이치도 잇테', ko: '한 번 더 말해줘.' },
  { category: '확인', jp: 'どういう意味？', kana: 'どういういみ？', ko_pron: '도우유우 이미', ko: '무슨 뜻이야?' },
  { category: '확인', jp: 'これでいい？', kana: 'これでいい？', ko_pron: '코레데 이이', ko: '이걸로 괜찮아?' },
  { category: '확인', jp: '間違ってない？', kana: 'まちがってない？', ko_pron: '마치갓테나이', ko: '틀리지 않았어?' },
  { category: '확인', jp: '聞こえた？', kana: 'きこえた？', ko_pron: '키코에타', ko: '들렸어?' },

  // === 요청 ===
  { category: '요청', jp: 'ちょっといい？', kana: 'ちょっといい？', ko_pron: '춋토 이이', ko: '잠깐 괜찮아?' },
  { category: '요청', jp: '手伝って。', kana: 'てつだって。', ko_pron: '테츠닷테', ko: '도와줘.' },
  { category: '요청', jp: '貸して。', kana: 'かして。', ko_pron: '카시테', ko: '빌려줘.' },
  { category: '요청', jp: '見せて。', kana: 'みせて。', ko_pron: '미세테', ko: '보여줘.' },
  { category: '요청', jp: '送って。', kana: 'おくって。', ko_pron: '오쿳테', ko: '보내줘.' },
  { category: '요청', jp: 'ちょっと待って。', kana: 'ちょっとまって。', ko_pron: '춋토 맛테', ko: '잠깐 기다려.' },
  { category: '요청', jp: '電話して。', kana: 'でんわして。', ko_pron: '덴와시테', ko: '전화해.' },
  { category: '요청', jp: 'メッセージちょうだい。', kana: 'メッセージちょうだい。', ko_pron: '멧세-지 쵸우다이', ko: '메시지 줘.' },

  // === 거절·사양 ===
  { category: '거절', jp: 'ちょっと無理。', kana: 'ちょっとむり。', ko_pron: '춋토 무리', ko: '좀 무리야.' },
  { category: '거절', jp: '今日は遠慮します。', kana: 'きょうはえんりょします。', ko_pron: '쿄우와 엔료시마스', ko: '오늘은 사양할게요.' },
  { category: '거절', jp: 'やめておく。', kana: 'やめておく。', ko_pron: '야메테 오쿠', ko: '안 할래.' },
  { category: '거절', jp: 'また今度。', kana: 'またこんど。', ko_pron: '마타 콘도', ko: '다음에.' },
  { category: '거절', jp: 'ごめん、無理かも。', kana: 'ごめん、むりかも。', ko_pron: '고멘 무리카모', ko: '미안, 어려울지도.' },
  { category: '거절', jp: '気持ちだけで嬉しい。', kana: 'きもちだけでうれしい。', ko_pron: '키모치다케데 우레시이', ko: '마음만으로 기뻐.' },
  { category: '거절', jp: '大丈夫、自分でやる。', kana: 'だいじょうぶ、じぶんでやる。', ko_pron: '다이죠우부 지분데 야루', ko: '괜찮아 내가 할게.' },

  // === 약속·계획 ===
  { category: '약속', jp: 'いつにする？', kana: 'いつにする？', ko_pron: '이츠니 스루', ko: '언제로 할까?' },
  { category: '약속', jp: '空いてる？', kana: 'あいてる？', ko_pron: '아이테루', ko: '비어 있어?' },
  { category: '약속', jp: '予定が入ってる。', kana: 'よていがはいってる。', ko_pron: '요테이가 하잇테루', ko: '일정이 있어.' },
  { category: '약속', jp: '行けたら行く。', kana: 'いけたらいく。', ko_pron: '이케타라 이쿠', ko: '갈 수 있으면 갈게.' },
  { category: '약속', jp: 'また連絡する。', kana: 'またれんらくする。', ko_pron: '마타 렌라쿠스루', ko: '다시 연락할게.' },
  { category: '약속', jp: '楽しみにしてる。', kana: 'たのしみにしてる。', ko_pron: '타노시미니 시테루', ko: '기대하고 있어.' },
  { category: '약속', jp: '時間ぴったりに来てね。', kana: 'じかんぴったりにきてね。', ko_pron: '지칸 핏타리니 키테네', ko: '시간 딱 맞춰서 와.' },
  { category: '약속', jp: '少し遅れる。', kana: 'すこしおくれる。', ko_pron: '스코시 오쿠레루', ko: '조금 늦을게.' },

  // === 감탄·반응 ===
  { category: '감탄', jp: 'すごい！', kana: 'すごい！', ko_pron: '스고이', ko: '대단해!' },
  { category: '감탄', jp: 'やばい！', kana: 'やばい！', ko_pron: '야바이', ko: '대박/큰일!' },
  { category: '감탄', jp: 'うそでしょ？', kana: 'うそでしょ？', ko_pron: '우소데쇼', ko: '거짓말이지?' },
  { category: '감탄', jp: 'ありえない。', kana: 'ありえない。', ko_pron: '아리에나이', ko: '말도 안 돼.' },
  { category: '감탄', jp: 'びっくりした。', kana: 'びっくりした。', ko_pron: '빗쿠리시타', ko: '깜짝 놀랐어.' },
  { category: '감탄', jp: 'まじか。', kana: 'まじか。', ko_pron: '마지카', ko: '진심?' },
  { category: '감탄', jp: '最高！', kana: 'さいこう！', ko_pron: '사이코우', ko: '최고!' },
  { category: '감탄', jp: 'うらやましい！', kana: 'うらやましい！', ko_pron: '우라야마시이', ko: '부럽다!' },
  { category: '감탄', jp: 'かっこいい！', kana: 'かっこいい！', ko_pron: '캇코이이', ko: '멋있다!' },
  { category: '감탄', jp: 'かわいい！', kana: 'かわいい！', ko_pron: '카와이이', ko: '귀엽다!' },

  // === 동의·반대 ===
  { category: '동의', jp: 'いいよ。', kana: 'いいよ。', ko_pron: '이이요', ko: '좋아.' },
  { category: '동의', jp: 'もちろん！', kana: 'もちろん！', ko_pron: '모치론', ko: '물론!' },
  { category: '동의', jp: '賛成。', kana: 'さんせい。', ko_pron: '산세이', ko: '찬성.' },
  { category: '동의', jp: '異議なし。', kana: 'いぎなし。', ko_pron: '이기나시', ko: '이의 없음.' },
  { category: '동의', jp: 'それで決まり。', kana: 'それできまり。', ko_pron: '소레데 키마리', ko: '그걸로 결정.' },
  { category: '반대', jp: 'それは違うよ。', kana: 'それはちがうよ。', ko_pron: '소레와 치가우요', ko: '그건 아니지.' },
  { category: '반대', jp: '反対！', kana: 'はんたい！', ko_pron: '한타이', ko: '반대!' },
  { category: '반대', jp: 'いやだ。', kana: 'いやだ。', ko_pron: '이야다', ko: '싫어.' },
  { category: '반대', jp: 'やめて。', kana: 'やめて。', ko_pron: '야메테', ko: '그만해.' },

  // === 불확실성·고민 ===
  { category: '고민', jp: 'どうしよう。', kana: 'どうしよう。', ko_pron: '도우시요우', ko: '어떡하지.' },
  { category: '고민', jp: '迷ってる。', kana: 'まよってる。', ko_pron: '마욧테루', ko: '망설이고 있어.' },
  { category: '고민', jp: 'まだ決めてない。', kana: 'まだきめてない。', ko_pron: '마다 키메테나이', ko: '아직 안 정했어.' },
  { category: '고민', jp: 'ちょっと考えさせて。', kana: 'ちょっとかんがえさせて。', ko_pron: '춋토 칸가에사세테', ko: '잠시 생각하게 해줘.' },
  { category: '고민', jp: 'なんとも言えない。', kana: 'なんともいえない。', ko_pron: '난토모 이에나이', ko: '뭐라 말 못 하겠어.' },
  { category: '고민', jp: '微妙。', kana: 'びみょう。', ko_pron: '비묘우', ko: '애매해.' },
  { category: '고민', jp: 'たぶんね。', kana: 'たぶんね。', ko_pron: '타분네', ko: '아마도.' },

  // === 기분·상태 ===
  { category: '기분', jp: 'お腹いっぱい。', kana: 'おなかいっぱい。', ko_pron: '오나카 잇파이', ko: '배불러.' },
  { category: '기분', jp: '眠い。', kana: 'ねむい。', ko_pron: '네무이', ko: '졸려.' },
  { category: '기분', jp: '疲れた。', kana: 'つかれた。', ko_pron: '츠카레타', ko: '피곤해.' },
  { category: '기분', jp: 'のどが渇いた。', kana: 'のどがかわいた。', ko_pron: '노도가 카와이타', ko: '목 말라.' },
  { category: '기분', jp: '暇だな。', kana: 'ひまだな。', ko_pron: '히마다나', ko: '심심하다.' },
  { category: '기분', jp: '忙しすぎる。', kana: 'いそがしすぎる。', ko_pron: '이소가시스기루', ko: '너무 바빠.' },
  { category: '기분', jp: 'ストレス溜まる。', kana: 'ストレスたまる。', ko_pron: '스토레스 타마루', ko: '스트레스 쌓여.' },
  { category: '기분', jp: 'リラックスしたい。', kana: 'リラックスしたい。', ko_pron: '리랏쿠스시타이', ko: '쉬고 싶어.' },

  // === 기타 자주 쓰는 표현 ===
  { category: '기타', jp: 'なんか変だね。', kana: 'なんかへんだね。', ko_pron: '난카 헨다네', ko: '뭔가 이상하네.' },
  { category: '기타', jp: 'まさか。', kana: 'まさか。', ko_pron: '마사카', ko: '설마.' },
  { category: '기타', jp: 'とりあえず。', kana: 'とりあえず。', ko_pron: '토리아에즈', ko: '일단.' },
  { category: '기타', jp: 'ついでに。', kana: 'ついでに。', ko_pron: '츠이데니', ko: '겸사겸사.' },
  { category: '기타', jp: 'だいたいわかった。', kana: 'だいたいわかった。', ko_pron: '다이타이 와캇타', ko: '대충 알겠어.' },
  { category: '기타', jp: 'なんでもいいよ。', kana: 'なんでもいいよ。', ko_pron: '난데모 이이요', ko: '아무거나 좋아.' },
  { category: '기타', jp: 'それぞれだね。', kana: 'それぞれだね。', ko_pron: '소레조레다네', ko: '제각각이네.' },
  { category: '기타', jp: 'お任せします。', kana: 'おまかせします。', ko_pron: '오마카세시마스', ko: '맡길게요.' },
];
