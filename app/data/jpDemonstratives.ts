import type { JpGrammarItem } from './jpGrammarTypes';

// 일본어 지시어 (こそあど) 약 40개 — 사물·장소·방향·인물·정도·종류
export const JP_DEMONSTRATIVES: JpGrammarItem[] = [
  // === 사물 (これ·それ·あれ·どれ) ===
  { jp: 'これ', kana: 'これ', ko_pron: '코레', meaning: '이것', usage: '말하는 사람 가까이의 사물.', example_jp: 'これは何ですか。', example_kana: 'これはなんですか。', example_ko: '이것은 뭡니까?' },
  { jp: 'それ', kana: 'それ', ko_pron: '소레', meaning: '그것', usage: '듣는 사람 쪽 사물.', example_jp: 'それを取って。', example_kana: 'それをとって。', example_ko: '그거 집어줘.' },
  { jp: 'あれ', kana: 'あれ', ko_pron: '아레', meaning: '저것', usage: '둘 다에서 멀리 있는 사물.', example_jp: 'あれは富士山だ。', example_kana: 'あれはふじさんだ。', example_ko: '저것은 후지산이다.' },
  { jp: 'どれ', kana: 'どれ', ko_pron: '도레', meaning: '어느 것', usage: '셋 이상에서 선택 의문.', example_jp: 'どれが好き？', example_kana: 'どれがすき？', example_ko: '어느 게 좋아?' },

  // === 명사 수식 (この·その·あの·どの) ===
  { jp: 'この', kana: 'この', ko_pron: '코노', meaning: '이 (~)', usage: '명사 앞에서 수식.', example_jp: 'この本は面白い。', example_kana: 'このほんはおもしろい。', example_ko: '이 책은 재미있다.' },
  { jp: 'その', kana: 'その', ko_pron: '소노', meaning: '그 (~)', usage: '명사 앞에서 수식.', example_jp: 'その人を知ってる。', example_kana: 'そのひとをしってる。', example_ko: '그 사람을 안다.' },
  { jp: 'あの', kana: 'あの', ko_pron: '아노', meaning: '저 (~)', usage: '명사 앞에서 수식.', example_jp: 'あの店に行こう。', example_kana: 'あのみせにいこう。', example_ko: '저 가게 가자.' },
  { jp: 'どの', kana: 'どの', ko_pron: '도노', meaning: '어느 (~)', usage: '명사 앞에서 의문.', example_jp: 'どの色がいい？', example_kana: 'どのいろがいい？', example_ko: '어느 색이 좋아?' },

  // === 장소 (ここ·そこ·あそこ·どこ) ===
  { jp: 'ここ', kana: 'ここ', ko_pron: '코코', meaning: '여기', usage: '말하는 사람 가까이.', example_jp: 'ここに座って。', example_kana: 'ここにすわって。', example_ko: '여기 앉아.' },
  { jp: 'そこ', kana: 'そこ', ko_pron: '소코', meaning: '거기', usage: '듣는 사람 쪽.', example_jp: 'そこを右へ。', example_kana: 'そこをみぎへ。', example_ko: '거기서 오른쪽으로.' },
  { jp: 'あそこ', kana: 'あそこ', ko_pron: '아소코', meaning: '저기', usage: '멀리 있는 곳.', example_jp: 'あそこに見える。', example_kana: 'あそこにみえる。', example_ko: '저기에 보인다.' },
  { jp: 'どこ', kana: 'どこ', ko_pron: '도코', meaning: '어디', usage: '장소 의문.', example_jp: 'どこに行く？', example_kana: 'どこにいく？', example_ko: '어디 가?' },

  // === 방향 (こちら·そちら·あちら·どちら) ===
  { jp: 'こちら', kana: 'こちら', ko_pron: '코치라', meaning: '이쪽 / 이분', usage: '정중한 「これ·ここ」. 인물 소개.', example_jp: 'こちらは田中さん。', example_kana: 'こちらはたなかさん。', example_ko: '이분은 다나카 씨.' },
  { jp: 'そちら', kana: 'そちら', ko_pron: '소치라', meaning: '그쪽', usage: '정중한 「それ·そこ」.', example_jp: 'そちらはどうですか。', example_kana: 'そちらはどうですか。', example_ko: '그쪽은 어떻습니까?' },
  { jp: 'あちら', kana: 'あちら', ko_pron: '아치라', meaning: '저쪽', usage: '정중한 「あれ·あそこ」.', example_jp: 'あちらが入口です。', example_kana: 'あちらがいりぐちです。', example_ko: '저쪽이 입구입니다.' },
  { jp: 'どちら', kana: 'どちら', ko_pron: '도치라', meaning: '어느 쪽', usage: '정중한 「どこ·どれ」 (둘 중 하나).', example_jp: 'どちらにしますか。', example_kana: 'どちらにしますか。', example_ko: '어느 쪽으로 하시겠어요?' },

  // === 구어 방향 (こっち·そっち·あっち·どっち) ===
  { jp: 'こっち', kana: 'こっち', ko_pron: '콧치', meaning: '이쪽 (구어)', usage: '구어적 「こちら」.', example_jp: 'こっち来て。', example_kana: 'こっちきて。', example_ko: '이쪽으로 와.' },
  { jp: 'そっち', kana: 'そっち', ko_pron: '솟치', meaning: '그쪽 (구어)', usage: '구어적 「そちら」.', example_jp: 'そっちはどう？', example_kana: 'そっちはどう？', example_ko: '그쪽은 어때?' },
  { jp: 'あっち', kana: 'あっち', ko_pron: '앗치', meaning: '저쪽 (구어)', usage: '구어적 「あちら」.', example_jp: 'あっちに行こう。', example_kana: 'あっちにいこう。', example_ko: '저쪽으로 가자.' },
  { jp: 'どっち', kana: 'どっち', ko_pron: '돗치', meaning: '어느 쪽 (구어)', usage: '구어적 「どちら」.', example_jp: 'どっちが好き？', example_kana: 'どっちがすき？', example_ko: '어느 쪽이 좋아?' },

  // === 양태 (こんな·そんな·あんな·どんな) ===
  { jp: 'こんな', kana: 'こんな', ko_pron: '콘나', meaning: '이런', usage: '이러한 종류·정도.', example_jp: 'こんな日もある。', example_kana: 'こんなひもある。', example_ko: '이런 날도 있다.' },
  { jp: 'そんな', kana: 'そんな', ko_pron: '손나', meaning: '그런', usage: '그런 종류.', example_jp: 'そんなことない。', example_kana: 'そんなことない。', example_ko: '그런 거 아냐.' },
  { jp: 'あんな', kana: 'あんな', ko_pron: '안나', meaning: '저런', usage: '저런 종류.', example_jp: 'あんな人になりたい。', example_kana: 'あんなひとになりたい。', example_ko: '저런 사람이 되고 싶다.' },
  { jp: 'どんな', kana: 'どんな', ko_pron: '돈나', meaning: '어떤', usage: '종류·성질 의문.', example_jp: 'どんな本が好き？', example_kana: 'どんなほんがすき？', example_ko: '어떤 책을 좋아해?' },

  // === 방식 (こう·そう·ああ·どう) ===
  { jp: 'こう', kana: 'こう', ko_pron: '코우', meaning: '이렇게', usage: '이러한 방식.', example_jp: 'こうやって作る。', example_kana: 'こうやってつくる。', example_ko: '이렇게 만든다.' },
  { jp: 'そう', kana: 'そう', ko_pron: '소우', meaning: '그렇게 / 그렇게요', usage: '동의 또는 그러한 방식.', example_jp: 'そうですね。', example_kana: 'そうですね。', example_ko: '그렇네요.' },
  { jp: 'ああ', kana: 'ああ', ko_pron: '아아', meaning: '저렇게', usage: '저러한 방식.', example_jp: 'ああすればいい。', example_kana: 'ああすればいい。', example_ko: '저렇게 하면 된다.' },
  { jp: 'どう', kana: 'どう', ko_pron: '도우', meaning: '어떻게', usage: '방법·상태 의문.', example_jp: 'どうしましたか。', example_kana: 'どうしましたか。', example_ko: '무슨 일이세요?' },

  // === 정도·기타 ===
  { jp: 'これくらい', kana: 'これくらい', ko_pron: '코레쿠라이', meaning: '이 정도', usage: '정도 표현.', example_jp: 'これくらいでいい。', example_kana: 'これくらいでいい。', example_ko: '이 정도면 됐어.' },
  { jp: 'それほど', kana: 'それほど', ko_pron: '소레호도', meaning: '그렇게까지', usage: '정도가 크지 않음.', example_jp: 'それほど難しくない。', example_kana: 'それほどむずかしくない。', example_ko: '그렇게 어렵지 않다.' },
  { jp: 'あれほど', kana: 'あれほど', ko_pron: '아레호도', meaning: '저 정도로', usage: '강조된 정도.', example_jp: 'あれほど言ったのに。', example_kana: 'あれほどいったのに。', example_ko: '저렇게 말했는데도.' },
  { jp: 'どれほど', kana: 'どれほど', ko_pron: '도레호도', meaning: '얼마나', usage: '정도 의문.', example_jp: 'どれほど待った？', example_kana: 'どれほどまった？', example_ko: '얼마나 기다렸어?' },

  // === 시간·기타 ===
  { jp: 'こちらこそ', kana: 'こちらこそ', ko_pron: '코치라코소', meaning: '저야말로', usage: '인사·답례.', example_jp: 'こちらこそありがとう。', example_kana: 'こちらこそありがとう。', example_ko: '저야말로 감사합니다.' },
  { jp: 'あれっ', kana: 'あれっ', ko_pron: '아렛', meaning: '어라?', usage: '의외에 대한 감탄.', example_jp: 'あれっ、鍵がない。', example_kana: 'あれっ、かぎがない。', example_ko: '어라, 열쇠가 없다.' },
  { jp: 'そういう', kana: 'そういう', ko_pron: '소우유우', meaning: '그런', usage: '명사 수식 (그러한).', example_jp: 'そういう話。', example_kana: 'そういうはなし。', example_ko: '그런 이야기.' },
  { jp: 'こういう', kana: 'こういう', ko_pron: '코우유우', meaning: '이런', usage: '명사 수식 (이러한).', example_jp: 'こういう時こそ。', example_kana: 'こういうときこそ。', example_ko: '이럴 때야말로.' },
  { jp: 'ああいう', kana: 'ああいう', ko_pron: '아아유우', meaning: '저런', usage: '명사 수식 (저러한).', example_jp: 'ああいう人。', example_kana: 'ああいうひと。', example_ko: '저런 사람.' },
  { jp: 'どういう', kana: 'どういう', ko_pron: '도우유우', meaning: '어떤 (~인지)', usage: '명사 수식 의문.', example_jp: 'どういう意味？', example_kana: 'どういういみ？', example_ko: '무슨 의미?' },
];
