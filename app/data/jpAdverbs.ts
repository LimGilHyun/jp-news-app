import type { JpGrammarItem } from './jpGrammarTypes';

// 일본어 부사 약 60개 — 정도·빈도·시간·상태·감정·강조
export const JP_ADVERBS: JpGrammarItem[] = [
  // === 정도 (程度) ===
  { jp: 'とても', kana: 'とても', ko_pron: '토테모', meaning: '매우 / 아주', usage: '정도가 매우 큼을 나타냄.', example_jp: 'とても面白い。', example_kana: 'とてもおもしろい。', example_ko: '매우 재미있다.' },
  { jp: 'すごく', kana: 'すごく', ko_pron: '스고쿠', meaning: '엄청 / 굉장히', usage: '구어적 강조.', example_jp: 'すごく嬉しい。', example_kana: 'すごくうれしい。', example_ko: '엄청 기쁘다.' },
  { jp: 'かなり', kana: 'かなり', ko_pron: '카나리', meaning: '꽤 / 상당히', usage: '예상 이상의 정도.', example_jp: 'かなり遠い。', example_kana: 'かなりとおい。', example_ko: '꽤 멀다.' },
  { jp: 'ちょっと', kana: 'ちょっと', ko_pron: '춋토', meaning: '조금 / 잠깐', usage: '구어. 적은 정도 또는 잠시.', example_jp: 'ちょっと待って。', example_kana: 'ちょっとまって。', example_ko: '잠깐 기다려.' },
  { jp: '少し', kana: 'すこし', ko_pron: '스코시', meaning: '조금', usage: '문어/정중. 「ちょっと」보다 격식.', example_jp: '少し休もう。', example_kana: 'すこしやすもう。', example_ko: '조금 쉬자.' },
  { jp: 'もっと', kana: 'もっと', ko_pron: '못토', meaning: '더', usage: '비교적 더 많이.', example_jp: 'もっと食べたい。', example_kana: 'もっとたべたい。', example_ko: '더 먹고 싶다.' },
  { jp: 'あまり', kana: 'あまり', ko_pron: '아마리', meaning: '그다지', usage: '뒤에 부정형. 「많지 않다」.', example_jp: 'あまり好きじゃない。', example_kana: 'あまりすきじゃない。', example_ko: '그다지 좋아하지 않는다.' },
  { jp: '全然', kana: 'ぜんぜん', ko_pron: '젠젠', meaning: '전혀', usage: '뒤에 부정형. 「조금도 ~ 없다」.', example_jp: '全然わからない。', example_kana: 'ぜんぜんわからない。', example_ko: '전혀 모르겠다.' },
  { jp: 'ほとんど', kana: 'ほとんど', ko_pron: '호톤도', meaning: '거의', usage: '대부분 또는 거의 ~.', example_jp: 'ほとんど終わった。', example_kana: 'ほとんどおわった。', example_ko: '거의 끝났다.' },
  { jp: 'ぜんぶ', kana: 'ぜんぶ', ko_pron: '젠부', meaning: '전부', usage: '모두를 의미.', example_jp: 'ぜんぶ食べた。', example_kana: 'ぜんぶたべた。', example_ko: '전부 먹었다.' },

  // === 빈도 (頻度) ===
  { jp: 'いつも', kana: 'いつも', ko_pron: '이츠모', meaning: '항상', usage: '한결같이.', example_jp: 'いつも遅刻する。', example_kana: 'いつもちこくする。', example_ko: '항상 지각한다.' },
  { jp: 'よく', kana: 'よく', ko_pron: '요쿠', meaning: '자주', usage: '높은 빈도.', example_jp: 'よく行く店。', example_kana: 'よくいくみせ。', example_ko: '자주 가는 가게.' },
  { jp: 'たまに', kana: 'たまに', ko_pron: '타마니', meaning: '가끔', usage: '낮은 빈도.', example_jp: 'たまに会う。', example_kana: 'たまにあう。', example_ko: '가끔 만난다.' },
  { jp: 'ときどき', kana: 'ときどき', ko_pron: '토키도키', meaning: '때때로', usage: '간헐적인 빈도.', example_jp: 'ときどき雨が降る。', example_kana: 'ときどきあめがふる。', example_ko: '때때로 비가 온다.' },
  { jp: 'めったに', kana: 'めったに', ko_pron: '멧타니', meaning: '좀처럼', usage: '뒤에 부정형. 「거의 안 ~」.', example_jp: 'めったに見ない。', example_kana: 'めったにみない。', example_ko: '좀처럼 안 본다.' },
  { jp: 'まれに', kana: 'まれに', ko_pron: '마레니', meaning: '드물게', usage: '매우 낮은 빈도.', example_jp: 'まれに起こる現象。', example_kana: 'まれにおこるげんしょう。', example_ko: '드물게 일어나는 현상.' },
  { jp: 'ぜったいに', kana: 'ぜったいに', ko_pron: '젯타이니', meaning: '절대로', usage: '강한 단정.', example_jp: 'ぜったいに勝つ！', example_kana: 'ぜったいにかつ！', example_ko: '반드시 이긴다!' },
  { jp: 'かならず', kana: 'かならず', ko_pron: '카나라즈', meaning: '반드시', usage: '확실한 의지·예측.', example_jp: 'かならず行く。', example_kana: 'かならずいく。', example_ko: '반드시 간다.' },
  { jp: 'たぶん', kana: 'たぶん', ko_pron: '타분', meaning: '아마', usage: '추측.', example_jp: 'たぶん来ない。', example_kana: 'たぶんこない。', example_ko: '아마 안 올 거다.' },
  { jp: 'もちろん', kana: 'もちろん', ko_pron: '모치론', meaning: '물론', usage: '당연한 동의.', example_jp: 'もちろん行きます。', example_kana: 'もちろんいきます。', example_ko: '물론 갑니다.' },

  // === 시간 (時間) ===
  { jp: 'もう', kana: 'もう', ko_pron: '모우', meaning: '이미 / 벌써', usage: '완료된 상태.', example_jp: 'もう食べた。', example_kana: 'もうたべた。', example_ko: '이미 먹었다.' },
  { jp: 'まだ', kana: 'まだ', ko_pron: '마다', meaning: '아직', usage: '진행 또는 미완.', example_jp: 'まだ寝てる。', example_kana: 'まだねてる。', example_ko: '아직 자고 있다.' },
  { jp: 'すぐ', kana: 'すぐ', ko_pron: '스구', meaning: '곧 / 즉시', usage: '바로 다음 행동.', example_jp: 'すぐ行く。', example_kana: 'すぐいく。', example_ko: '곧 갈게.' },
  { jp: 'はやく', kana: 'はやく', ko_pron: '하야쿠', meaning: '빨리', usage: '신속히. 「早く」.', example_jp: 'はやく起きて。', example_kana: 'はやくおきて。', example_ko: '빨리 일어나.' },
  { jp: 'ゆっくり', kana: 'ゆっくり', ko_pron: '윳쿠리', meaning: '천천히', usage: '느긋하게.', example_jp: 'ゆっくり話して。', example_kana: 'ゆっくりはなして。', example_ko: '천천히 말해줘.' },
  { jp: 'さっき', kana: 'さっき', ko_pron: '삿키', meaning: '아까', usage: '조금 전.', example_jp: 'さっき会った。', example_kana: 'さっきあった。', example_ko: '아까 만났다.' },
  { jp: 'これから', kana: 'これから', ko_pron: '코레카라', meaning: '이제부터', usage: '앞으로의 시간.', example_jp: 'これから出発。', example_kana: 'これからしゅっぱつ。', example_ko: '이제부터 출발.' },
  { jp: 'ずっと', kana: 'ずっと', ko_pron: '즛토', meaning: '계속 / 훨씬', usage: '긴 시간 또는 비교 강조.', example_jp: 'ずっと待ってた。', example_kana: 'ずっとまってた。', example_ko: '계속 기다렸어.' },
  { jp: 'やっと', kana: 'やっと', ko_pron: '얏토', meaning: '드디어 / 가까스로', usage: '오랜 끝에 달성.', example_jp: 'やっと着いた。', example_kana: 'やっとついた。', example_ko: '드디어 도착했다.' },
  { jp: 'ついに', kana: 'ついに', ko_pron: '츠이니', meaning: '마침내', usage: '최종적으로.', example_jp: 'ついに完成した。', example_kana: 'ついにかんせいした。', example_ko: '마침내 완성됐다.' },

  // === 상태·양태 ===
  { jp: 'たくさん', kana: 'たくさん', ko_pron: '타쿠상', meaning: '많이', usage: '양·수의 풍부.', example_jp: 'たくさん食べた。', example_kana: 'たくさんたべた。', example_ko: '많이 먹었다.' },
  { jp: 'ちょうど', kana: 'ちょうど', ko_pron: '쵸우도', meaning: '딱 / 때마침', usage: '정확히·우연히.', example_jp: 'ちょうど三時。', example_kana: 'ちょうどさんじ。', example_ko: '딱 3시.' },
  { jp: 'だいたい', kana: 'だいたい', ko_pron: '다이타이', meaning: '대체로', usage: '대략·근사.', example_jp: 'だいたいわかる。', example_kana: 'だいたいわかる。', example_ko: '대충 안다.' },
  { jp: 'やはり', kana: 'やはり', ko_pron: '야하리', meaning: '역시', usage: '예상대로. やっぱり의 정중형.', example_jp: 'やはり彼が正しい。', example_kana: 'やはりかれがただしい。', example_ko: '역시 그가 맞다.' },
  { jp: 'やっぱり', kana: 'やっぱり', ko_pron: '얏파리', meaning: '역시', usage: '구어적 「やはり」.', example_jp: 'やっぱりこれにする。', example_kana: 'やっぱりこれにする。', example_ko: '역시 이걸로 할래.' },
  { jp: 'ぜひ', kana: 'ぜひ', ko_pron: '제히', meaning: '꼭 / 부디', usage: '강한 권유·희망.', example_jp: 'ぜひ来てください。', example_kana: 'ぜひきてください。', example_ko: '꼭 와주세요.' },
  { jp: 'なるべく', kana: 'なるべく', ko_pron: '나루베쿠', meaning: '되도록', usage: '가능한 한.', example_jp: 'なるべく早く。', example_kana: 'なるべくはやく。', example_ko: '되도록 빨리.' },
  { jp: 'できるだけ', kana: 'できるだけ', ko_pron: '데키루다케', meaning: '가능한 한', usage: '최대한.', example_jp: 'できるだけ手伝う。', example_kana: 'できるだけてつだう。', example_ko: '가능한 한 돕는다.' },
  { jp: 'ちゃんと', kana: 'ちゃんと', ko_pron: '챤토', meaning: '제대로 / 잘', usage: '정확하고 성실하게.', example_jp: 'ちゃんと食べて。', example_kana: 'ちゃんとたべて。', example_ko: '제대로 먹어.' },
  { jp: 'しっかり', kana: 'しっかり', ko_pron: '싯카리', meaning: '단단히 / 야무지게', usage: '확실하고 굳건히.', example_jp: 'しっかり勉強する。', example_kana: 'しっかりべんきょうする。', example_ko: '제대로 공부한다.' },

  // === 강조·확실성 ===
  { jp: '本当に', kana: 'ほんとうに', ko_pron: '혼토우니', meaning: '정말로', usage: '진심으로의 강조.', example_jp: '本当にありがとう。', example_kana: 'ほんとうにありがとう。', example_ko: '정말 고마워.' },
  { jp: 'まったく', kana: 'まったく', ko_pron: '맛타쿠', meaning: '완전히 / 전혀', usage: '강한 단정 또는 부정 강조.', example_jp: 'まったく違う。', example_kana: 'まったくちがう。', example_ko: '완전히 다르다.' },
  { jp: 'けっして', kana: 'けっして', ko_pron: '켓시테', meaning: '결코', usage: '뒤에 부정형. 강한 부정.', example_jp: 'けっして許さない。', example_kana: 'けっしてゆるさない。', example_ko: '결코 용서하지 않는다.' },
  { jp: 'たしかに', kana: 'たしかに', ko_pron: '타시카니', meaning: '확실히', usage: '동의·인정.', example_jp: 'たしかにそうだ。', example_kana: 'たしかにそうだ。', example_ko: '확실히 그렇다.' },
  { jp: 'やはり', kana: 'やはり', ko_pron: '야하리', meaning: '역시 (예상대로)', usage: '심리적 확인.', example_jp: 'やはり彼だった。', example_kana: 'やはりかれだった。', example_ko: '역시 그였다.' },
  { jp: 'まさか', kana: 'まさか', ko_pron: '마사카', meaning: '설마', usage: '예상 밖의 놀람.', example_jp: 'まさか負けるとは。', example_kana: 'まさかまけるとは。', example_ko: '설마 질 줄이야.' },

  // === 결과·상태 변화 ===
  { jp: 'もうすぐ', kana: 'もうすぐ', ko_pron: '모우스구', meaning: '곧', usage: '시간상 임박.', example_jp: 'もうすぐ春。', example_kana: 'もうすぐはる。', example_ko: '곧 봄이다.' },
  { jp: 'ますます', kana: 'ますます', ko_pron: '마스마스', meaning: '점점 더', usage: '정도가 점진적으로 증가.', example_jp: 'ますます寒くなる。', example_kana: 'ますますさむくなる。', example_ko: '점점 더 추워진다.' },
  { jp: 'だんだん', kana: 'だんだん', ko_pron: '단단', meaning: '점점', usage: '서서히 변화.', example_jp: 'だんだん上手になる。', example_kana: 'だんだんじょうずになる。', example_ko: '점점 잘하게 된다.' },
  { jp: 'すっかり', kana: 'すっかり', ko_pron: '슷카리', meaning: '완전히 / 모조리', usage: '전부 ~한 상태.', example_jp: 'すっかり忘れた。', example_kana: 'すっかりわすれた。', example_ko: '깡그리 잊었다.' },
  { jp: 'いきなり', kana: 'いきなり', ko_pron: '이키나리', meaning: '갑자기', usage: '예고 없이.', example_jp: 'いきなり泣き出した。', example_kana: 'いきなりなきだした。', example_ko: '갑자기 울기 시작했다.' },
  { jp: '突然', kana: 'とつぜん', ko_pron: '토츠젠', meaning: '돌연 / 갑자기', usage: '문어적 「갑자기」.', example_jp: '突然訪ねてきた。', example_kana: 'とつぜんたずねてきた。', example_ko: '돌연 찾아왔다.' },
  { jp: 'ふと', kana: 'ふと', ko_pron: '후토', meaning: '문득', usage: '의도하지 않게.', example_jp: 'ふと思い出した。', example_kana: 'ふとおもいだした。', example_ko: '문득 떠올랐다.' },

  // === 의태어 부사 ===
  { jp: 'はっきり', kana: 'はっきり', ko_pron: '핫키리', meaning: '뚜렷이 / 분명히', usage: '명확하게.', example_jp: 'はっきり言って。', example_kana: 'はっきりいって。', example_ko: '분명히 말해.' },
  { jp: 'ぼんやり', kana: 'ぼんやり', ko_pron: '본야리', meaning: '멍하니 / 흐릿하게', usage: '집중하지 못함.', example_jp: 'ぼんやりしていた。', example_kana: 'ぼんやりしていた。', example_ko: '멍하니 있었다.' },
  { jp: 'すっと', kana: 'すっと', ko_pron: '슷토', meaning: '쓱 / 부드럽게', usage: '동작이 매끄럽게.', example_jp: 'すっと立ち上がる。', example_kana: 'すっとたちあがる。', example_ko: '쓱 일어선다.' },
  { jp: 'たっぷり', kana: 'たっぷり', ko_pron: '탓푸리', meaning: '듬뿍 / 충분히', usage: '양이 풍부.', example_jp: 'たっぷり眠った。', example_kana: 'たっぷりねむった。', example_ko: '푹 잤다.' },
  { jp: 'ぐっすり', kana: 'ぐっすり', ko_pron: '굿스리', meaning: '푹 (자다)', usage: '깊이 잠.', example_jp: 'ぐっすり眠る。', example_kana: 'ぐっすりねむる。', example_ko: '푹 잔다.' },
  { jp: 'のんびり', kana: 'のんびり', ko_pron: '논비리', meaning: '느긋하게', usage: '여유로운 상태.', example_jp: 'のんびり過ごす。', example_kana: 'のんびりすごす。', example_ko: '느긋하게 보낸다.' },
];
