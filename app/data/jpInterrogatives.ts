import type { JpGrammarItem } from './jpGrammarTypes';

// 일본어 의문사 약 35개 — 사람·사물·시간·장소·이유·방법·수량
export const JP_INTERROGATIVES: JpGrammarItem[] = [
  // === 사람·사물 ===
  { jp: '何', kana: 'なに/なん', ko_pron: '나니/난', meaning: '무엇 / 뭐', usage: '사물 의문. 조사 앞에서 「なん」.', example_jp: '何を食べる？', example_kana: 'なにをたべる？', example_ko: '뭘 먹어?' },
  { jp: '誰', kana: 'だれ', ko_pron: '다레', meaning: '누구', usage: '사람 의문.', example_jp: 'これは誰の？', example_kana: 'これはだれの？', example_ko: '이거 누구 거야?' },
  { jp: 'どなた', kana: 'どなた', ko_pron: '도나타', meaning: '누구 (정중)', usage: '정중한 「だれ」.', example_jp: 'どなた様ですか。', example_kana: 'どなたさまですか。', example_ko: '어느 분이십니까?' },
  { jp: '何者', kana: 'なにもの', ko_pron: '나니모노', meaning: '뭐 하는 사람', usage: '정체를 묻는 표현.', example_jp: '彼は何者だ。', example_kana: 'かれはなにものだ。', example_ko: '그는 누구냐.' },

  // === 시간 ===
  { jp: 'いつ', kana: 'いつ', ko_pron: '이츠', meaning: '언제', usage: '시간 의문.', example_jp: 'いつ来る？', example_kana: 'いつくる？', example_ko: '언제 와?' },
  { jp: '何時', kana: 'なんじ', ko_pron: '난지', meaning: '몇 시', usage: '시각 의문.', example_jp: '何時に始まる？', example_kana: 'なんじにはじまる？', example_ko: '몇 시에 시작해?' },
  { jp: '何曜日', kana: 'なんようび', ko_pron: '난요우비', meaning: '무슨 요일', usage: '요일 의문.', example_jp: '今日は何曜日？', example_kana: 'きょうはなんようび？', example_ko: '오늘 무슨 요일?' },
  { jp: '何日', kana: 'なんにち', ko_pron: '난니치', meaning: '며칠', usage: '날짜·기간 의문.', example_jp: '何日かかる？', example_kana: 'なんにちかかる？', example_ko: '며칠 걸려?' },
  { jp: '何月', kana: 'なんがつ', ko_pron: '난가츠', meaning: '몇 월', usage: '월 의문.', example_jp: '誕生日は何月？', example_kana: 'たんじょうびはなんがつ？', example_ko: '생일은 몇 월?' },
  { jp: '何年', kana: 'なんねん', ko_pron: '난넨', meaning: '몇 년', usage: '년수 의문.', example_jp: '何年勤めた？', example_kana: 'なんねんつとめた？', example_ko: '몇 년 근무했어?' },

  // === 장소 ===
  { jp: 'どこ', kana: 'どこ', ko_pron: '도코', meaning: '어디', usage: '장소 의문.', example_jp: 'どこに行く？', example_kana: 'どこにいく？', example_ko: '어디 가?' },
  { jp: 'どちら', kana: 'どちら', ko_pron: '도치라', meaning: '어디 / 어느 쪽', usage: '정중한 「どこ」 또는 둘 중 선택.', example_jp: 'どちらにお住まい？', example_kana: 'どちらにおすまい？', example_ko: '어디 사세요?' },
  { jp: 'どっち', kana: 'どっち', ko_pron: '돗치', meaning: '어느 쪽 (구어)', usage: '둘 중 선택.', example_jp: 'どっちでもいい。', example_kana: 'どっちでもいい。', example_ko: '어느 쪽이든 좋아.' },

  // === 방법·이유 ===
  { jp: 'どう', kana: 'どう', ko_pron: '도우', meaning: '어떻게', usage: '방법·상태 의문.', example_jp: 'どうやって？', example_kana: 'どうやって？', example_ko: '어떻게?' },
  { jp: 'なぜ', kana: 'なぜ', ko_pron: '나제', meaning: '왜', usage: '이유. 격식 있음.', example_jp: 'なぜ来ないの？', example_kana: 'なぜこないの？', example_ko: '왜 안 와?' },
  { jp: 'どうして', kana: 'どうして', ko_pron: '도우시테', meaning: '왜 / 어째서', usage: '이유. 일반적.', example_jp: 'どうして遅れた？', example_kana: 'どうしておくれた？', example_ko: '왜 늦었어?' },
  { jp: 'なんで', kana: 'なんで', ko_pron: '난데', meaning: '왜 (구어)', usage: '구어적 「どうして」.', example_jp: 'なんで泣いてるの？', example_kana: 'なんでないてるの？', example_ko: '왜 우는 거야?' },
  { jp: 'どのように', kana: 'どのように', ko_pron: '도노요우니', meaning: '어떤 식으로', usage: '방식 의문 (격식).', example_jp: 'どのように使う？', example_kana: 'どのようにつかう？', example_ko: '어떤 식으로 사용해?' },

  // === 수량 ===
  { jp: 'いくつ', kana: 'いくつ', ko_pron: '이쿠츠', meaning: '몇 개 / 몇 살', usage: '개수 또는 나이.', example_jp: 'いくつありますか。', example_kana: 'いくつありますか。', example_ko: '몇 개 있나요?' },
  { jp: 'いくら', kana: 'いくら', ko_pron: '이쿠라', meaning: '얼마', usage: '가격 의문.', example_jp: 'これいくら？', example_kana: 'これいくら？', example_ko: '이거 얼마?' },
  { jp: 'どのくらい', kana: 'どのくらい', ko_pron: '도노쿠라이', meaning: '얼마나 / 어느 정도', usage: '양·정도·시간.', example_jp: 'どのくらい時間がかかる？', example_kana: 'どのくらいじかんがかかる？', example_ko: '얼마나 시간이 걸려?' },
  { jp: 'どれだけ', kana: 'どれだけ', ko_pron: '도레다케', meaning: '얼마나', usage: '강조된 양·정도.', example_jp: 'どれだけ待った？', example_kana: 'どれだけまった？', example_ko: '얼마나 기다렸어?' },
  { jp: '何人', kana: 'なんにん', ko_pron: '난닌', meaning: '몇 명', usage: '사람 수.', example_jp: '何人来た？', example_kana: 'なんにんきた？', example_ko: '몇 명 왔어?' },
  { jp: '何回', kana: 'なんかい', ko_pron: '난카이', meaning: '몇 번', usage: '횟수.', example_jp: '何回行った？', example_kana: 'なんかいいった？', example_ko: '몇 번 갔어?' },
  { jp: '何歳', kana: 'なんさい', ko_pron: '난사이', meaning: '몇 살', usage: '나이.', example_jp: 'お子さんは何歳？', example_kana: 'おこさんはなんさい？', example_ko: '아이는 몇 살이에요?' },

  // === 종류·선택 ===
  { jp: 'どれ', kana: 'どれ', ko_pron: '도레', meaning: '어느 것', usage: '셋 이상에서 선택.', example_jp: 'どれにする？', example_kana: 'どれにする？', example_ko: '어느 걸로 할래?' },
  { jp: 'どの', kana: 'どの', ko_pron: '도노', meaning: '어느 (~)', usage: '명사 앞 의문.', example_jp: 'どの本？', example_kana: 'どのほん？', example_ko: '어느 책?' },
  { jp: 'どんな', kana: 'どんな', ko_pron: '돈나', meaning: '어떤 (~)', usage: '종류·성질 의문.', example_jp: 'どんな映画？', example_kana: 'どんなえいが？', example_ko: '어떤 영화?' },
  { jp: 'どっちの', kana: 'どっちの', ko_pron: '돗치노', meaning: '어느 쪽의', usage: '둘 중 명사 수식.', example_jp: 'どっちの色？', example_kana: 'どっちのいろ？', example_ko: '어느 쪽 색?' },

  // === 한정·강조 ===
  { jp: 'なにか', kana: 'なにか', ko_pron: '나니카', meaning: '뭔가', usage: '불특정 대상.', example_jp: 'なにか食べる？', example_kana: 'なにかたべる？', example_ko: '뭔가 먹을래?' },
  { jp: 'だれか', kana: 'だれか', ko_pron: '다레카', meaning: '누군가', usage: '불특정 사람.', example_jp: 'だれか来た。', example_kana: 'だれかきた。', example_ko: '누군가 왔다.' },
  { jp: 'どこか', kana: 'どこか', ko_pron: '도코카', meaning: '어딘가', usage: '불특정 장소.', example_jp: 'どこかで会った。', example_kana: 'どこかであった。', example_ko: '어딘가에서 만났다.' },
  { jp: 'いつか', kana: 'いつか', ko_pron: '이츠카', meaning: '언젠가', usage: '불특정 시점.', example_jp: 'いつかまた会おう。', example_kana: 'いつかまたあおう。', example_ko: '언젠가 다시 만나자.' },
  { jp: 'なんでも', kana: 'なんでも', ko_pron: '난데모', meaning: '뭐든지', usage: '전체 긍정.', example_jp: 'なんでも食べる。', example_kana: 'なんでもたべる。', example_ko: '뭐든지 먹는다.' },
  { jp: 'どこでも', kana: 'どこでも', ko_pron: '도코데모', meaning: '어디든지', usage: '전체 긍정.', example_jp: 'どこでも行く。', example_kana: 'どこでもいく。', example_ko: '어디든지 간다.' },
];
