import type { JpGrammarItem } from './jpGrammarTypes';

// 일본어 접두사 약 50개 — 경어·부정·강조·시간·위치·방향·정도
export const JP_PREFIXES: JpGrammarItem[] = [
  // === 경어 (敬語) ===
  { jp: 'お〜', kana: 'お', ko_pron: '오', meaning: '~ (정중·존경)', usage: '일본 고유어 명사 앞에 붙는 미화어/존경어.', example_jp: 'お茶を飲む。', example_kana: 'おちゃをのむ。', example_ko: '차를 마신다.' },
  { jp: 'ご〜', kana: 'ご', ko_pron: '고', meaning: '~ (정중·존경)', usage: '한자어 명사 앞에 붙는 정중·존경어.', example_jp: 'ご家族はお元気ですか。', example_kana: 'ごかぞくはおげんきですか。', example_ko: '가족분들은 잘 지내십니까?' },
  { jp: '御〜', kana: 'お/ご', ko_pron: '오/고', meaning: '~ (정중)', usage: 'お/ご의 한자 표기. 격식 있는 문서.', example_jp: '御挨拶申し上げます。', example_kana: 'ごあいさつもうしあげます。', example_ko: '인사드립니다.' },

  // === 부정 ===
  { jp: '不〜', kana: 'ふ', ko_pron: '후', meaning: '불~ / ~하지 않음', usage: '부정·결여를 나타냄.', example_jp: '不便な場所。', example_kana: 'ふべんなばしょ。', example_ko: '불편한 장소.' },
  { jp: '非〜', kana: 'ひ', ko_pron: '히', meaning: '비~ / ~이 아님', usage: '소속·상태의 부정.', example_jp: '非常識な発言。', example_kana: 'ひじょうしきなはつげん。', example_ko: '몰상식한 발언.' },
  { jp: '未〜', kana: 'み', ko_pron: '미', meaning: '미~ / 아직 ~않음', usage: '아직 ~ 안 된 상태.', example_jp: '未完成の作品。', example_kana: 'みかんせいのさくひん。', example_ko: '미완성 작품.' },
  { jp: '無〜', kana: 'む', ko_pron: '무', meaning: '무~ / ~없음', usage: '존재·소유의 부재.', example_jp: '無責任な行動。', example_kana: 'むせきにんなこうどう。', example_ko: '무책임한 행동.' },
  { jp: '反〜', kana: 'はん', ko_pron: '한', meaning: '반~ / ~에 반대', usage: '반대·역행.', example_jp: '反社会的な行為。', example_kana: 'はんしゃかいてきなこうい。', example_ko: '반사회적 행위.' },

  // === 강조 / 정도 ===
  { jp: '大〜', kana: 'だい/おお', ko_pron: '다이/오오', meaning: '대~ / 큰', usage: '규모·정도의 큼. 한자어는 だい, 고유어는 おお.', example_jp: '大成功を収める。', example_kana: 'だいせいこうをおさめる。', example_ko: '대성공을 거두다.' },
  { jp: '小〜', kana: 'しょう/こ', ko_pron: '쇼우/코', meaning: '소~ / 작은', usage: '규모·정도의 작음.', example_jp: '小規模な店。', example_kana: 'しょうきぼなみせ。', example_ko: '소규모 가게.' },
  { jp: '真〜', kana: 'ま', ko_pron: '마', meaning: '한~ / 정~', usage: '진짜·정확한·정중앙.', example_jp: '真っ赤なバラ。', example_kana: 'まっかなバラ。', example_ko: '새빨간 장미.' },
  { jp: '超〜', kana: 'ちょう', ko_pron: '쵸우', meaning: '초~ / 매우', usage: '극단적 강조 (구어).', example_jp: '超満員の電車。', example_kana: 'ちょうまんいんのでんしゃ。', example_ko: '초만원 전철.' },
  { jp: '激〜', kana: 'げき', ko_pron: '게키', meaning: '격~ / 매우 격렬', usage: '강한 정도.', example_jp: '激安の商品。', example_kana: 'げきやすのしょうひん。', example_ko: '아주 싼 상품.' },
  { jp: '最〜', kana: 'さい', ko_pron: '사이', meaning: '최~ / 가장', usage: '최상급·극한.', example_jp: '最新の情報。', example_kana: 'さいしんのじょうほう。', example_ko: '최신 정보.' },
  { jp: '高〜', kana: 'こう', ko_pron: '코우', meaning: '고~ / 높은', usage: '높은 수준·등급.', example_jp: '高品質の素材。', example_kana: 'こうひんしつのそざい。', example_ko: '고품질 소재.' },
  { jp: '低〜', kana: 'てい', ko_pron: '테이', meaning: '저~ / 낮은', usage: '낮은 수준.', example_jp: '低価格で売る。', example_kana: 'ていかかくでうる。', example_ko: '저가로 판다.' },
  { jp: '極〜', kana: 'ごく/きょく', ko_pron: '고쿠/쿄쿠', meaning: '극~ / 매우', usage: '극단적 정도.', example_jp: '極上のワイン。', example_kana: 'ごくじょうのワイン。', example_ko: '최상급 와인.' },
  { jp: '猛〜', kana: 'もう', ko_pron: '모우', meaning: '맹~ / 맹렬한', usage: '맹렬·격렬한 정도.', example_jp: '猛烈な勢い。', example_kana: 'もうれつないきおい。', example_ko: '맹렬한 기세.' },

  // === 시간 / 순서 ===
  { jp: '再〜', kana: 'さい', ko_pron: '사이', meaning: '재~ / 다시', usage: '반복·재차.', example_jp: '再起動する。', example_kana: 'さいきどうする。', example_ko: '재시작한다.' },
  { jp: '新〜', kana: 'しん', ko_pron: '신', meaning: '신~ / 새~', usage: '새로움.', example_jp: '新製品の発表。', example_kana: 'しんせいひんのはっぴょう。', example_ko: '신제품 발표.' },
  { jp: '旧〜', kana: 'きゅう', ko_pron: '큐우', meaning: '구~ / 옛~', usage: '예전의 것.', example_jp: '旧モデルを使う。', example_kana: 'きゅうモデルをつかう。', example_ko: '구 모델을 쓴다.' },
  { jp: '前〜', kana: 'ぜん/まえ', ko_pron: '젠/마에', meaning: '전~ / 앞~', usage: '시간·순서상 이전.', example_jp: '前社長の方針。', example_kana: 'ぜんしゃちょうのほうしん。', example_ko: '전 사장의 방침.' },
  { jp: '後〜', kana: 'ご/あと', ko_pron: '고/아토', meaning: '후~ / 뒤~', usage: '시간·순서상 이후.', example_jp: '後日連絡します。', example_kana: 'ごじつれんらくします。', example_ko: '훗날 연락드립니다.' },
  { jp: '元〜', kana: 'もと', ko_pron: '모토', meaning: '전~ / 원~', usage: '전직·이전 신분.', example_jp: '元同僚に会う。', example_kana: 'もとどうりょうにあう。', example_ko: '전 동료를 만난다.' },
  { jp: '故〜', kana: 'こ', ko_pron: '코', meaning: '고~ / 돌아가신', usage: '故人 (고인) 표기.', example_jp: '故山田氏を悼む。', example_kana: 'こやまだしをいたむ。', example_ko: '고 야마다 씨를 애도한다.' },
  { jp: '当〜', kana: 'とう', ko_pron: '토우', meaning: '당~ / 이번~', usage: '당해 시점·당사자.', example_jp: '当社の方針。', example_kana: 'とうしゃのほうしん。', example_ko: '저희 회사의 방침.' },
  { jp: '来〜', kana: 'らい', ko_pron: '라이', meaning: '내~ / 다음~', usage: '다음 차례의 (월·년·주).', example_jp: '来月帰国する。', example_kana: 'らいげつきこくする。', example_ko: '다음 달 귀국한다.' },
  { jp: '翌〜', kana: 'よく', ko_pron: '요쿠', meaning: '익~ / 다음~', usage: '문어적 「다음」.', example_jp: '翌日出発した。', example_kana: 'よくじつしゅっぱつした。', example_ko: '다음 날 출발했다.' },
  { jp: '初〜', kana: 'しょ/はつ', ko_pron: '쇼/하츠', meaning: '초~ / 첫~', usage: '처음의·초기의.', example_jp: '初対面の挨拶。', example_kana: 'しょたいめんのあいさつ。', example_ko: '첫 대면의 인사.' },
  { jp: '終〜', kana: 'しゅう', ko_pron: '슈우', meaning: '종~ / 마지막~', usage: '끝·종료.', example_jp: '終電を逃す。', example_kana: 'しゅうでんをのがす。', example_ko: '막차를 놓치다.' },

  // === 위치 / 방향 ===
  { jp: '上〜', kana: 'じょう/うえ', ko_pron: '죠우/우에', meaning: '상~ / 위~', usage: '위쪽·상위.', example_jp: '上半期の売上。', example_kana: 'じょうはんきのうりあげ。', example_ko: '상반기 매출.' },
  { jp: '下〜', kana: 'か/した', ko_pron: '카/시타', meaning: '하~ / 아래~', usage: '아래쪽·하위.', example_jp: '下半期の予定。', example_kana: 'かはんきのよてい。', example_ko: '하반기 예정.' },
  { jp: '中〜', kana: 'ちゅう/なか', ko_pron: '츄우/나카', meaning: '중~ / 가운데~', usage: '중앙·진행중.', example_jp: '中規模の都市。', example_kana: 'ちゅうきぼのとし。', example_ko: '중규모 도시.' },
  { jp: '内〜', kana: 'ない', ko_pron: '나이', meaning: '내~ / 안~', usage: '내부·내적.', example_jp: '内部告発が出る。', example_kana: 'ないぶこくはつがでる。', example_ko: '내부 고발이 나오다.' },
  { jp: '外〜', kana: 'がい', ko_pron: '가이', meaning: '외~ / 밖~', usage: '외부·외국.', example_jp: '外資系の会社。', example_kana: 'がいしけいのかいしゃ。', example_ko: '외자계 회사.' },
  { jp: '海外〜', kana: 'かいがい', ko_pron: '카이가이', meaning: '해외~', usage: '국외 관련.', example_jp: '海外旅行に行く。', example_kana: 'かいがいりょこうにいく。', example_ko: '해외여행을 간다.' },

  // === 자/타 / 기타 한자 접두사 ===
  { jp: '自〜', kana: 'じ', ko_pron: '지', meaning: '자~ / 스스로', usage: '자신·자동.', example_jp: '自分で決める。', example_kana: 'じぶんできめる。', example_ko: '스스로 정한다.' },
  { jp: '他〜', kana: 'た', ko_pron: '타', meaning: '타~ / 다른', usage: '타인·타사.', example_jp: '他社の製品。', example_kana: 'たしゃのせいひん。', example_ko: '타사 제품.' },
  { jp: '同〜', kana: 'どう', ko_pron: '도우', meaning: '동~ / 같은', usage: '동일·동기.', example_jp: '同世代の友人。', example_kana: 'どうせだいのゆうじん。', example_ko: '동세대 친구.' },
  { jp: '副〜', kana: 'ふく', ko_pron: '후쿠', meaning: '부~ / 보조', usage: '보조 직위·부산물.', example_jp: '副社長に昇進。', example_kana: 'ふくしゃちょうにしょうしん。', example_ko: '부사장으로 승진.' },
  { jp: '主〜', kana: 'しゅ', ko_pron: '슈', meaning: '주~ / 메인', usage: '주된·핵심.', example_jp: '主要な課題。', example_kana: 'しゅようなかだい。', example_ko: '주요한 과제.' },
  { jp: '全〜', kana: 'ぜん', ko_pron: '젠', meaning: '전~ / 모든', usage: '전체·전부.', example_jp: '全社員が参加。', example_kana: 'ぜんしゃいんがさんか。', example_ko: '전 사원이 참가.' },
  { jp: '各〜', kana: 'かく', ko_pron: '카쿠', meaning: '각~ / 각각의', usage: '하나하나의.', example_jp: '各国の代表。', example_kana: 'かっこくのだいひょう。', example_ko: '각국의 대표.' },
  { jp: '諸〜', kana: 'しょ', ko_pron: '쇼', meaning: '제~ / 여러', usage: '문어적 복수.', example_jp: '諸事情により中止。', example_kana: 'しょじじょうによりちゅうし。', example_ko: '여러 사정으로 중지.' },
  { jp: '両〜', kana: 'りょう', ko_pron: '료우', meaning: '양~ / 두~', usage: '두 쪽·양쪽.', example_jp: '両親に会う。', example_kana: 'りょうしんにあう。', example_ko: '부모님을 만난다.' },
  { jp: '第〜', kana: 'だい', ko_pron: '다이', meaning: '제~ / ~번째', usage: '서수·순서.', example_jp: '第一印象が大事。', example_kana: 'だいいちいんしょうがだいじ。', example_ko: '첫인상이 중요.' },
  { jp: '約〜', kana: 'やく', ko_pron: '야쿠', meaning: '약~', usage: '대략·근사값.', example_jp: '約三十分かかる。', example_kana: 'やくさんじっぷんかかる。', example_ko: '약 30분 걸린다.' },
  { jp: '准〜', kana: 'じゅん', ko_pron: '쥰', meaning: '준~', usage: '버금가는 자격.', example_jp: '准教授に就任。', example_kana: 'じゅんきょうじゅにしゅうにん。', example_ko: '준교수에 취임.' },
  { jp: '半〜', kana: 'はん', ko_pron: '한', meaning: '반~ / 절반', usage: '절반·중간.', example_jp: '半透明の素材。', example_kana: 'はんとうめいのそざい。', example_ko: '반투명 소재.' },
  { jp: '逆〜', kana: 'ぎゃく', ko_pron: '갸쿠', meaning: '역~ / 반대', usage: '반대 방향·역전.', example_jp: '逆方向に進む。', example_kana: 'ぎゃくほうこうにすすむ。', example_ko: '반대 방향으로 나아간다.' },
  { jp: '準〜', kana: 'じゅん', ko_pron: '쥰', meaning: '준~ / 버금', usage: '준결승·준회원 등.', example_jp: '準決勝に進出。', example_kana: 'じゅんけっしょうにしんしゅつ。', example_ko: '준결승에 진출.' },
  { jp: '総〜', kana: 'そう', ko_pron: '소우', meaning: '총~ / 모두 합한', usage: '총합·총괄.', example_jp: '総人口が減る。', example_kana: 'そうじんこうがへる。', example_ko: '총인구가 줄다.' },
  { jp: '生〜', kana: 'なま', ko_pron: '나마', meaning: '생~ / 날~', usage: '가공되지 않은.', example_jp: '生ビールを飲む。', example_kana: 'なまビールをのむ。', example_ko: '생맥주를 마신다.' },
];
