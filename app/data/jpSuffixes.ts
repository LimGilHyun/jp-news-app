import type { JpGrammarItem } from './jpGrammarTypes';

// 일본어 접미사 약 60개 — 호칭·복수·성격·사람·기간·범위·도구·관계
export const JP_SUFFIXES: JpGrammarItem[] = [
  // === 호칭 ===
  { jp: '〜さん', kana: 'さん', ko_pron: '상', meaning: '~씨 / ~님', usage: '가장 일반적인 정중 호칭. 남녀·연령 무관.', example_jp: '田中さんは医者です。', example_kana: 'たなかさんはいしゃです。', example_ko: '다나카 씨는 의사입니다.' },
  { jp: '〜様', kana: 'さま', ko_pron: '사마', meaning: '~님 (최상급 정중)', usage: '손님·고위 인물·서면 호칭.', example_jp: '山田様、こちらへどうぞ。', example_kana: 'やまださま、こちらへどうぞ。', example_ko: '야마다 님, 이쪽으로 오세요.' },
  { jp: '〜ちゃん', kana: 'ちゃん', ko_pron: '쨩', meaning: '~짱 (애칭)', usage: '가족·친한 사이·아이 호칭.', example_jp: 'みかちゃんと遊ぶ。', example_kana: 'みかちゃんとあそぶ。', example_ko: '미카짱과 논다.' },
  { jp: '〜くん', kana: 'くん', ko_pron: '쿤', meaning: '~군', usage: '주로 젊은 남성·후배·동급생.', example_jp: '田中くん、頑張れ。', example_kana: 'たなかくん、がんばれ。', example_ko: '다나카 군, 힘내.' },
  { jp: '〜先生', kana: 'せんせい', ko_pron: '센세이', meaning: '~선생님', usage: '교사·의사·작가·정치인 등.', example_jp: '鈴木先生に質問する。', example_kana: 'すずきせんせいにしつもんする。', example_ko: '스즈키 선생님께 질문한다.' },
  { jp: '〜氏', kana: 'し', ko_pron: '시', meaning: '~씨 (격식)', usage: '뉴스·문서에서 사용하는 격식 호칭.', example_jp: '山田氏が発表した。', example_kana: 'やまだしがはっぴょうした。', example_ko: '야마다 씨가 발표했다.' },
  { jp: '〜殿', kana: 'どの', ko_pron: '도노', meaning: '~귀하', usage: '문서·공식 호칭. 동등·하위에 사용.', example_jp: '部長殿、ご確認ください。', example_kana: 'ぶちょうどの、ごかくにんください。', example_ko: '부장님, 확인 부탁드립니다.' },
  { jp: '〜君', kana: 'きみ', ko_pron: '키미', meaning: '~군 / 그대', usage: '시·문어에서 호칭.', example_jp: '友よ、君のために。', example_kana: 'ともよ、きみのために。', example_ko: '벗이여, 그대를 위해.' },

  // === 복수 / 인칭 ===
  { jp: '〜たち', kana: 'たち', ko_pron: '타치', meaning: '~들', usage: '사람·동물의 복수.', example_jp: '私たちは学生だ。', example_kana: 'わたしたちはがくせいだ。', example_ko: '우리는 학생이다.' },
  { jp: '〜ら', kana: 'ら', ko_pron: '라', meaning: '~들', usage: '문어적 복수. 일부 격식 표현.', example_jp: '彼らが来た。', example_kana: 'かれらがきた。', example_ko: '그들이 왔다.' },
  { jp: '〜方', kana: 'がた', ko_pron: '가타', meaning: '~분들 (정중)', usage: '존경의 복수.', example_jp: '皆様方、ようこそ。', example_kana: 'みなさまがた、ようこそ。', example_ko: '여러분, 어서 오세요.' },
  { jp: '〜ども', kana: 'ども', ko_pron: '도모', meaning: '~들 (낮춤·자기 측)', usage: '겸손한 자기 측 복수 또는 경시.', example_jp: '私どもの会社。', example_kana: 'わたくしどものかいしゃ。', example_ko: '저희 회사.' },

  // === 직업 / 사람 ===
  { jp: '〜者', kana: 'しゃ/もの', ko_pron: '샤/모노', meaning: '~자 / ~사람', usage: '직업·역할 표시.', example_jp: '研究者になる。', example_kana: 'けんきゅうしゃになる。', example_ko: '연구자가 된다.' },
  { jp: '〜員', kana: 'いん', ko_pron: '인', meaning: '~원 / 직원', usage: '소속 구성원.', example_jp: '会社員として働く。', example_kana: 'かいしゃいんとしてはたらく。', example_ko: '회사원으로 일한다.' },
  { jp: '〜師', kana: 'し', ko_pron: '시', meaning: '~사 (전문직)', usage: '전문가·기능자.', example_jp: '料理師になる。', example_kana: 'りょうりしになる。', example_ko: '요리사가 된다.' },
  { jp: '〜士', kana: 'し', ko_pron: '시', meaning: '~사 (자격증)', usage: '국가 자격을 가진 사람.', example_jp: '弁護士に相談する。', example_kana: 'べんごしにそうだんする。', example_ko: '변호사에게 상담한다.' },
  { jp: '〜家', kana: 'か', ko_pron: '카', meaning: '~가 (전문가·예술가)', usage: '특정 분야의 전문가.', example_jp: '画家として活動する。', example_kana: 'がかとしてかつどうする。', example_ko: '화가로 활동한다.' },
  { jp: '〜手', kana: 'しゅ', ko_pron: '슈', meaning: '~수 (선수·기수)', usage: '운동·기능 종사자.', example_jp: '選手として出場する。', example_kana: 'せんしゅとしてしゅつじょうする。', example_ko: '선수로 출전한다.' },
  { jp: '〜屋', kana: 'や', ko_pron: '야', meaning: '~가게 / ~사람 (성향)', usage: '가게·직업·성격 묘사.', example_jp: 'パン屋に寄る。', example_kana: 'パンやによる。', example_ko: '빵집에 들른다.' },
  { jp: '〜長', kana: 'ちょう', ko_pron: '쵸우', meaning: '~장 (장)', usage: '책임자·우두머리.', example_jp: '社長と会う。', example_kana: 'しゃちょうとあう。', example_ko: '사장님과 만난다.' },
  { jp: '〜君', kana: 'くん', ko_pron: '쿤', meaning: '~군 (직장·학교 후배)', usage: '직장·학교에서 동료·후배.', example_jp: '佐藤君に頼む。', example_kana: 'さとうくんにたのむ。', example_ko: '사토 군에게 부탁한다.' },

  // === 형태·성격 ===
  { jp: '〜的', kana: 'てき', ko_pron: '테키', meaning: '~적', usage: '명사 → 형용동사화. 매우 자주 쓰임.', example_jp: '感情的な反応。', example_kana: 'かんじょうてきなはんのう。', example_ko: '감정적 반응.' },
  { jp: '〜性', kana: 'せい', ko_pron: '세이', meaning: '~성', usage: '성질·속성.', example_jp: '可能性が高い。', example_kana: 'かのうせいがたかい。', example_ko: '가능성이 높다.' },
  { jp: '〜化', kana: 'か', ko_pron: '카', meaning: '~화', usage: '~로 변화함.', example_jp: '高齢化が進む。', example_kana: 'こうれいかがすすむ。', example_ko: '고령화가 진행된다.' },
  { jp: '〜風', kana: 'ふう', ko_pron: '후우', meaning: '~풍 / ~스타일', usage: '~의 양식·분위기.', example_jp: '和風レストラン。', example_kana: 'わふうレストラン。', example_ko: '일본풍 레스토랑.' },
  { jp: '〜式', kana: 'しき', ko_pron: '시키', meaning: '~식', usage: '방식·양식.', example_jp: '和式の部屋。', example_kana: 'わしきのへや。', example_ko: '일본식 방.' },
  { jp: '〜流', kana: 'りゅう', ko_pron: '류우', meaning: '~류 / ~식', usage: '독자적 방식·유파.', example_jp: '自分流に解釈する。', example_kana: 'じぶんりゅうにかいしゃくする。', example_ko: '자기 식으로 해석한다.' },
  { jp: '〜系', kana: 'けい', ko_pron: '케이', meaning: '~계', usage: '계통·분류.', example_jp: '理系の学生。', example_kana: 'りけいのがくせい。', example_ko: '이과 계열 학생.' },
  { jp: '〜派', kana: 'は', ko_pron: '하', meaning: '~파', usage: '학파·당파.', example_jp: '保守派の意見。', example_kana: 'ほしゅはのいけん。', example_ko: '보수파 의견.' },
  { jp: '〜らしい', kana: 'らしい', ko_pron: '라시이', meaning: '~답다 / ~인 듯', usage: '전형적 성격·추측.', example_jp: '彼は男らしい。', example_kana: 'かれはおとこらしい。', example_ko: '그는 남자답다.' },
  { jp: '〜っぽい', kana: 'っぽい', ko_pron: '폽이', meaning: '~한 듯한', usage: '~의 느낌이 강한 (구어).', example_jp: '子供っぽい行動。', example_kana: 'こどもっぽいこうどう。', example_ko: '어린애 같은 행동.' },
  { jp: '〜気味', kana: 'ぎみ', ko_pron: '기미', meaning: '~기미 / ~인 듯', usage: '약간의 경향.', example_jp: '風邪気味です。', example_kana: 'かぜぎみです。', example_ko: '감기 기운이 있다.' },
  { jp: '〜がち', kana: 'がち', ko_pron: '가치', meaning: '자주 ~함', usage: '~하기 쉬운 경향.', example_jp: '忘れがちな人。', example_kana: 'わすれがちなひと。', example_ko: '잘 잊는 사람.' },

  // === 시간 / 기간 ===
  { jp: '〜中', kana: 'ちゅう/じゅう', ko_pron: '츄우/쥬우', meaning: '~중', usage: '진행중 또는 ~동안.', example_jp: '会議中です。', example_kana: 'かいぎちゅうです。', example_ko: '회의 중입니다.' },
  { jp: '〜頃', kana: 'ごろ', ko_pron: '고로', meaning: '~경 / ~쯤', usage: '대략적인 시점.', example_jp: '三時頃に着く。', example_kana: 'さんじごろにつく。', example_ko: '3시쯤에 도착한다.' },
  { jp: '〜前', kana: 'まえ', ko_pron: '마에', meaning: '~전', usage: '시간·장소상 이전.', example_jp: '食事前に飲む。', example_kana: 'しょくじまえにのむ。', example_ko: '식사 전에 마신다.' },
  { jp: '〜後', kana: 'ご/あと', ko_pron: '고/아토', meaning: '~후', usage: '시간상 이후.', example_jp: '一時間後に戻る。', example_kana: 'いちじかんごにもどる。', example_ko: '한 시간 후에 돌아온다.' },
  { jp: '〜目', kana: 'め', ko_pron: '메', meaning: '~번째', usage: '서수.', example_jp: '三日目の朝。', example_kana: 'みっかめのあさ。', example_ko: '3일째 아침.' },
  { jp: '〜代', kana: 'だい', ko_pron: '다이', meaning: '~대 (요금·세대)', usage: '요금·연대 표시.', example_jp: '電気代を払う。', example_kana: 'でんきだいをはらう。', example_ko: '전기료를 낸다.' },
  { jp: '〜年生', kana: 'ねんせい', ko_pron: '넨세이', meaning: '~학년', usage: '학년 표시.', example_jp: '高校二年生だ。', example_kana: 'こうこうにねんせいだ。', example_ko: '고등학교 2학년이다.' },

  // === 장소 / 범위 ===
  { jp: '〜所', kana: 'しょ/じょ', ko_pron: '쇼/죠', meaning: '~소 (장소)', usage: '~하는 장소.', example_jp: '事務所で働く。', example_kana: 'じむしょではたらく。', example_ko: '사무소에서 일한다.' },
  { jp: '〜場', kana: 'じょう/ば', ko_pron: '죠우/바', meaning: '~장', usage: '특정 활동 장소.', example_jp: '駐車場が満車。', example_kana: 'ちゅうしゃじょうがまんしゃ。', example_ko: '주차장이 만차.' },
  { jp: '〜館', kana: 'かん', ko_pron: '칸', meaning: '~관 (건물)', usage: '대형 건물·시설.', example_jp: '美術館を訪れる。', example_kana: 'びじゅつかんをおとずれる。', example_ko: '미술관을 방문한다.' },
  { jp: '〜街', kana: 'がい', ko_pron: '가이', meaning: '~가 (거리)', usage: '특정 성격의 거리.', example_jp: '繁華街で食事する。', example_kana: 'はんかがいでしょくじする。', example_ko: '번화가에서 식사한다.' },
  { jp: '〜内', kana: 'ない', ko_pron: '나이', meaning: '~내', usage: '~의 안쪽.', example_jp: '社内で打ち合わせ。', example_kana: 'しゃないでうちあわせ。', example_ko: '사내에서 미팅.' },
  { jp: '〜側', kana: 'がわ', ko_pron: '가와', meaning: '~쪽 / ~측', usage: '방향·입장.', example_jp: '右側に立つ。', example_kana: 'みぎがわにたつ。', example_ko: '오른쪽에 선다.' },
  { jp: '〜行き', kana: 'ゆき/いき', ko_pron: '유키/이키', meaning: '~행', usage: '교통수단의 목적지.', example_jp: '東京行きの電車。', example_kana: 'とうきょうゆきのでんしゃ。', example_ko: '도쿄행 전철.' },

  // === 단위 / 수 ===
  { jp: '〜個', kana: 'こ', ko_pron: '코', meaning: '~개', usage: '작고 둥근 물건의 단위.', example_jp: 'りんごを三個買う。', example_kana: 'りんごをさんこかう。', example_ko: '사과를 세 개 산다.' },
  { jp: '〜本', kana: 'ほん/ぼん/ぽん', ko_pron: '혼/본/폰', meaning: '~병 / ~자루', usage: '길고 가는 물건의 단위.', example_jp: '鉛筆三本ください。', example_kana: 'えんぴつさんぼんください。', example_ko: '연필 세 자루 주세요.' },
  { jp: '〜枚', kana: 'まい', ko_pron: '마이', meaning: '~장', usage: '얇고 평평한 물건.', example_jp: '紙を五枚使う。', example_kana: 'かみをごまいつかう。', example_ko: '종이를 다섯 장 쓴다.' },
  { jp: '〜匹', kana: 'ひき/びき/ぴき', ko_pron: '히키/비키/피키', meaning: '~마리', usage: '작은 동물·곤충·물고기.', example_jp: '猫が二匹いる。', example_kana: 'ねこがにひきいる。', example_ko: '고양이가 두 마리 있다.' },
  { jp: '〜頭', kana: 'とう', ko_pron: '토우', meaning: '~마리 (큰 동물)', usage: '소·말 등 큰 동물.', example_jp: '牛を三頭飼う。', example_kana: 'うしをさんとうかう。', example_ko: '소를 세 마리 키운다.' },
  { jp: '〜冊', kana: 'さつ', ko_pron: '사츠', meaning: '~권', usage: '책·잡지·노트.', example_jp: '本を二冊読む。', example_kana: 'ほんをにさつよむ。', example_ko: '책을 두 권 읽는다.' },
  { jp: '〜台', kana: 'だい', ko_pron: '다이', meaning: '~대', usage: '기계·차량.', example_jp: '車三台を所有。', example_kana: 'くるまさんだいをしょゆう。', example_ko: '차 세 대를 소유.' },
  { jp: '〜杯', kana: 'はい/ばい/ぱい', ko_pron: '하이/바이/파이', meaning: '~잔', usage: '컵·잔·그릇 단위.', example_jp: 'コーヒー一杯ください。', example_kana: 'コーヒーいっぱいください。', example_ko: '커피 한 잔 주세요.' },
  { jp: '〜階', kana: 'かい/がい', ko_pron: '카이/가이', meaning: '~층', usage: '건물의 층수.', example_jp: '三階に上がる。', example_kana: 'さんがいにあがる。', example_ko: '3층으로 올라간다.' },
  { jp: '〜回', kana: 'かい', ko_pron: '카이', meaning: '~회 / 번', usage: '횟수.', example_jp: '一日三回服用。', example_kana: 'いちにちさんかいふくよう。', example_ko: '하루 세 번 복용.' },
  { jp: '〜歳', kana: 'さい', ko_pron: '사이', meaning: '~세', usage: '나이.', example_jp: '二十歳になる。', example_kana: 'はたちになる。', example_ko: '스무 살이 된다.' },
  { jp: '〜人', kana: 'にん/り', ko_pron: '닌/리', meaning: '~명', usage: '사람 수.', example_jp: '五人で行く。', example_kana: 'ごにんでいく。', example_ko: '다섯 명이서 간다.' },
  { jp: '〜度', kana: 'ど', ko_pron: '도', meaning: '~도 / 번', usage: '횟수·각도·온도.', example_jp: '三十度の暑さ。', example_kana: 'さんじゅうどのあつさ。', example_ko: '30도의 더위.' },
];
