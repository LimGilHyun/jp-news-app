import type { JpGrammarItem } from './jpGrammarTypes';

// 일본어 접속사 약 50개 — 순접·역접·병렬·전환·인과·첨가·예시
export const JP_CONJUNCTIONS: JpGrammarItem[] = [
  // === 순접 (順接) ===
  { jp: 'そして', kana: 'そして', ko_pron: '소시테', meaning: '그리고', usage: '내용 추가·시간 흐름.', example_jp: '雨が降った。そして寒くなった。', example_kana: 'あめがふった。そしてさむくなった。', example_ko: '비가 왔다. 그리고 추워졌다.' },
  { jp: 'それから', kana: 'それから', ko_pron: '소레카라', meaning: '그러고 나서', usage: '시간 순서.', example_jp: '食べた。それから出かけた。', example_kana: 'たべた。それからでかけた。', example_ko: '먹었다. 그러고 나서 나갔다.' },
  { jp: 'すると', kana: 'すると', ko_pron: '스루토', meaning: '그러자', usage: '곧이어 일어난 결과.', example_jp: 'ボタンを押した。すると鳴った。', example_kana: 'ボタンをおした。するとなった。', example_ko: '버튼을 눌렀다. 그러자 울렸다.' },
  { jp: 'それで', kana: 'それで', ko_pron: '소레데', meaning: '그래서', usage: '인과 관계 (그래서).', example_jp: '雨だった。それで休んだ。', example_kana: 'あめだった。それでやすんだ。', example_ko: '비가 왔다. 그래서 쉬었다.' },
  { jp: 'だから', kana: 'だから', ko_pron: '다카라', meaning: '그러니까 / 그래서', usage: '강한 인과.', example_jp: '危ない。だから止めた。', example_kana: 'あぶない。だからとめた。', example_ko: '위험해. 그래서 말렸다.' },
  { jp: 'したがって', kana: 'したがって', ko_pron: '시타갓테', meaning: '따라서', usage: '문어·논리적 결과.', example_jp: '雨だ。したがって試合は中止。', example_kana: 'あめだ。したがってしあいはちゅうし。', example_ko: '비가 온다. 따라서 시합은 중지.' },
  { jp: 'ですから', kana: 'ですから', ko_pron: '데스카라', meaning: '그러니까 (정중)', usage: 'だから의 정중형.', example_jp: '危険です。ですから注意を。', example_kana: 'きけんです。ですからちゅういを。', example_ko: '위험합니다. 그러니 주의하세요.' },
  { jp: 'よって', kana: 'よって', ko_pron: '욧테', meaning: '따라서 / 그로 인해', usage: '문어. 인과 결론.', example_jp: '事実が判明した。よって決定する。', example_kana: 'じじつがはんめいした。よってけっていする。', example_ko: '사실이 밝혀졌다. 따라서 결정한다.' },

  // === 역접 (逆接) ===
  { jp: 'しかし', kana: 'しかし', ko_pron: '시카시', meaning: '그러나', usage: '대표적 역접 (격식).', example_jp: '行きたい。しかし時間がない。', example_kana: 'いきたい。しかしじかんがない。', example_ko: '가고 싶다. 그러나 시간이 없다.' },
  { jp: 'でも', kana: 'でも', ko_pron: '데모', meaning: '하지만', usage: '구어적 역접.', example_jp: '寒い。でも行く。', example_kana: 'さむい。でもいく。', example_ko: '춥다. 하지만 간다.' },
  { jp: 'だが', kana: 'だが', ko_pron: '다가', meaning: '그러나', usage: '문어. 강한 역접.', example_jp: '努力した。だが失敗した。', example_kana: 'どりょくした。だがしっぱいした。', example_ko: '노력했다. 그러나 실패했다.' },
  { jp: 'けれども', kana: 'けれども', ko_pron: '케레도모', meaning: '하지만', usage: '정중한 역접. けど로 축약.', example_jp: '辛い。けれども頑張る。', example_kana: 'つらい。けれどもがんばる。', example_ko: '힘들다. 하지만 힘낸다.' },
  { jp: 'ところが', kana: 'ところが', ko_pron: '토코로가', meaning: '그런데 / 그러나', usage: '예상 밖의 결과.', example_jp: '勝つと思った。ところが負けた。', example_kana: 'かつとおもった。ところがまけた。', example_ko: '이길 줄 알았다. 그런데 졌다.' },
  { jp: 'それなのに', kana: 'それなのに', ko_pron: '소레나노니', meaning: '그런데도 / 그럼에도', usage: '강한 역접·불만.', example_jp: '頑張った。それなのに評価されない。', example_kana: 'がんばった。それなのにひょうかされない。', example_ko: '열심히 했다. 그런데도 평가받지 못한다.' },
  { jp: 'それでも', kana: 'それでも', ko_pron: '소레데모', meaning: '그래도', usage: '앞 사실에도 불구하고.', example_jp: '失敗した。それでも続ける。', example_kana: 'しっぱいした。それでもつづける。', example_ko: '실패했다. 그래도 계속한다.' },
  { jp: 'にもかかわらず', kana: 'にもかかわらず', ko_pron: '니모카카와라즈', meaning: '~에도 불구하고', usage: '문어적 강한 역접.', example_jp: '雨にもかかわらず開催した。', example_kana: 'あめにもかかわらずかいさいした。', example_ko: '비에도 불구하고 개최했다.' },

  // === 병렬·첨가 ===
  { jp: 'また', kana: 'また', ko_pron: '마타', meaning: '또 / 또한', usage: '병렬적 추가.', example_jp: '美味しい。また安い。', example_kana: 'おいしい。またやすい。', example_ko: '맛있다. 또한 싸다.' },
  { jp: 'および', kana: 'および', ko_pron: '오요비', meaning: '및', usage: '문어. 명사 병렬.', example_jp: '東京および大阪。', example_kana: 'とうきょうおよびおおさか。', example_ko: '도쿄 및 오사카.' },
  { jp: 'ならびに', kana: 'ならびに', ko_pron: '나라비니', meaning: '아울러 / 및', usage: '문어. 명사 병렬.', example_jp: '社員ならびに家族。', example_kana: 'しゃいんならびにかぞく。', example_ko: '사원 및 가족.' },
  { jp: 'さらに', kana: 'さらに', ko_pron: '사라니', meaning: '게다가 / 더욱이', usage: '강도·범위의 추가.', example_jp: '安い。さらに早い。', example_kana: 'やすい。さらにはやい。', example_ko: '싸다. 게다가 빠르다.' },
  { jp: 'しかも', kana: 'しかも', ko_pron: '시카모', meaning: '게다가', usage: '추가적 강조.', example_jp: '美しい。しかも賢い。', example_kana: 'うつくしい。しかもかしこい。', example_ko: '아름답다. 게다가 똑똑하다.' },
  { jp: 'そのうえ', kana: 'そのうえ', ko_pron: '소노우에', meaning: '게다가 / 그 위에', usage: '추가 사실.', example_jp: '雨。そのうえ寒い。', example_kana: 'あめ。そのうえさむい。', example_ko: '비. 게다가 춥다.' },
  { jp: 'それに', kana: 'それに', ko_pron: '소레니', meaning: '게다가', usage: '구어적 추가.', example_jp: '安い。それに美味しい。', example_kana: 'やすい。それにおいしい。', example_ko: '싸다. 게다가 맛있다.' },

  // === 선택·전환 ===
  { jp: 'または', kana: 'または', ko_pron: '마타와', meaning: '또는', usage: '선택지 제시.', example_jp: '電話または メール。', example_kana: 'でんわまたはメール。', example_ko: '전화 또는 메일.' },
  { jp: 'あるいは', kana: 'あるいは', ko_pron: '아루이와', meaning: '혹은', usage: '문어적 선택.', example_jp: '彼あるいは私が行く。', example_kana: 'かれあるいはわたしがいく。', example_ko: '그 혹은 내가 간다.' },
  { jp: 'それとも', kana: 'それとも', ko_pron: '소레토모', meaning: '그렇지 않으면 / 아니면', usage: '의문 선택.', example_jp: 'コーヒー、それとも紅茶？', example_kana: 'コーヒー、それともこうちゃ？', example_ko: '커피, 아니면 홍차?' },
  { jp: 'ところで', kana: 'ところで', ko_pron: '토코로데', meaning: '그런데 / 화제 전환', usage: '주제 변경.', example_jp: 'ところで、最近どう？', example_kana: 'ところで、さいきんどう？', example_ko: '그런데 요즘 어때?' },
  { jp: 'さて', kana: 'さて', ko_pron: '사테', meaning: '그럼 / 자', usage: '화제 전환·시작.', example_jp: 'さて、始めましょう。', example_kana: 'さて、はじめましょう。', example_ko: '자, 시작합시다.' },
  { jp: 'では', kana: 'では', ko_pron: '데와', meaning: '그러면', usage: '결론·전환.', example_jp: 'では、行きましょう。', example_kana: 'では、いきましょう。', example_ko: '그러면 가시죠.' },
  { jp: 'それでは', kana: 'それでは', ko_pron: '소레데와', meaning: '그러면', usage: '정중한 전환.', example_jp: 'それでは失礼します。', example_kana: 'それではしつれいします。', example_ko: '그러면 실례하겠습니다.' },

  // === 부연·요약 ===
  { jp: 'つまり', kana: 'つまり', ko_pron: '츠마리', meaning: '즉 / 결국', usage: '바꿔 말하면.', example_jp: 'つまり無理ということ。', example_kana: 'つまりむりということ。', example_ko: '즉 무리란 얘기.' },
  { jp: 'すなわち', kana: 'すなわち', ko_pron: '스나와치', meaning: '즉', usage: '문어적 「つまり」.', example_jp: '彼、すなわち社長。', example_kana: 'かれ、すなわちしゃちょう。', example_ko: '그, 즉 사장.' },
  { jp: 'ようするに', kana: 'ようするに', ko_pron: '요우스루니', meaning: '요컨대', usage: '요약 결론.', example_jp: 'ようするに賛成だ。', example_kana: 'ようするにさんせいだ。', example_ko: '요컨대 찬성이다.' },
  { jp: 'なぜなら', kana: 'なぜなら', ko_pron: '나제나라', meaning: '왜냐하면', usage: '이유 제시.', example_jp: '休む。なぜなら病気だから。', example_kana: 'やすむ。なぜならびょうきだから。', example_ko: '쉰다. 왜냐하면 아프기 때문.' },
  { jp: 'というのは', kana: 'というのは', ko_pron: '토이우노와', meaning: '왜냐하면 / 라는 것은', usage: '이유나 정의 제시.', example_jp: 'というのは、こういうことだ。', example_kana: 'というのは、こういうことだ。', example_ko: '왜냐하면 이런 거야.' },

  // === 예시·열거 ===
  { jp: 'たとえば', kana: 'たとえば', ko_pron: '타토에바', meaning: '예를 들면', usage: '구체적 예시.', example_jp: 'たとえば、果物。', example_kana: 'たとえば、くだもの。', example_ko: '예를 들면 과일.' },
  { jp: 'まず', kana: 'まず', ko_pron: '마즈', meaning: '우선 / 먼저', usage: '순서 제시.', example_jp: 'まず手を洗おう。', example_kana: 'まずてをあらおう。', example_ko: '우선 손부터 씻자.' },
  { jp: 'つぎに', kana: 'つぎに', ko_pron: '츠기니', meaning: '다음으로', usage: '순서 제시.', example_jp: 'つぎに、ご飯を炊く。', example_kana: 'つぎに、ごはんをたく。', example_ko: '다음으로 밥을 짓는다.' },
  { jp: '最後に', kana: 'さいごに', ko_pron: '사이고니', meaning: '마지막으로', usage: '결론 제시.', example_jp: '最後に挨拶する。', example_kana: 'さいごにあいさつする。', example_ko: '마지막으로 인사한다.' },

  // === 기타 ===
  { jp: 'さらには', kana: 'さらには', ko_pron: '사라니와', meaning: '나아가', usage: '범위·강도 확대.', example_jp: '韓国、さらには海外でも。', example_kana: 'かんこく、さらにはかいがいでも。', example_ko: '한국, 나아가 해외에서도.' },
  { jp: 'ちなみに', kana: 'ちなみに', ko_pron: '치나미니', meaning: '참고로', usage: '부가 정보.', example_jp: 'ちなみに、私も参加する。', example_kana: 'ちなみに、わたしもさんかする。', example_ko: '참고로 나도 참가해.' },
  { jp: 'ただし', kana: 'ただし', ko_pron: '타다시', meaning: '단', usage: '조건·예외.', example_jp: '入場無料。ただし子供のみ。', example_kana: 'にゅうじょうむりょう。ただしこどものみ。', example_ko: '입장 무료. 단 어린이만.' },
  { jp: 'もっとも', kana: 'もっとも', ko_pron: '못토모', meaning: '다만 / 단', usage: '문어. 단서·완화.', example_jp: '行く。もっとも遅刻するかも。', example_kana: 'いく。もっともちこくするかも。', example_ko: '간다. 다만 지각할지도.' },
  { jp: 'なお', kana: 'なお', ko_pron: '나오', meaning: '또한 / 덧붙여', usage: '문서 첨가.', example_jp: 'なお、詳細は別紙。', example_kana: 'なお、しょうさいはべっし。', example_ko: '또한 상세는 별지.' },
  { jp: 'もしくは', kana: 'もしくは', ko_pron: '모시쿠와', meaning: '혹은 / 또는', usage: '문어 「または」.', example_jp: '電話もしくはメール。', example_kana: 'でんわもしくはメール。', example_ko: '전화 혹은 메일.' },
];
