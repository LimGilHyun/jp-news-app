-- ============================================
-- 데모용 더미 기사 3건 (앱이 빈 화면이 아니도록)
-- 실제 n8n 파이프라인 가동 시 실데이터가 추가됩니다.
-- ============================================

INSERT INTO articles (source, source_url, title_jp, title_ko, body_jp, body_ko, tokens, difficulty, published_at)
VALUES
(
    'NHK',
    'https://example.com/seed-1',
    '東京で桜が満開になりました',
    '도쿄에서 벚꽃이 만개했습니다',
    '東京の各地で桜が満開になりました。多くの人が花見を楽しんでいます。',
    '도쿄 각지에서 벚꽃이 만개했습니다. 많은 사람들이 꽃놀이를 즐기고 있습니다.',
    '[
        {"surface":"東京","reading":"토우쿄우","meaning":"도쿄(지명)","pos":"noun","startIdx":0,"endIdx":2},
        {"surface":"の","reading":"노","meaning":"의","pos":"particle","startIdx":2,"endIdx":3},
        {"surface":"各地","reading":"카쿠치","meaning":"각지","pos":"noun","startIdx":3,"endIdx":5},
        {"surface":"で","reading":"데","meaning":"에서","pos":"particle","startIdx":5,"endIdx":6},
        {"surface":"桜","reading":"사쿠라","meaning":"벚꽃","pos":"noun","startIdx":6,"endIdx":7},
        {"surface":"が","reading":"가","meaning":"이/가","pos":"particle","startIdx":7,"endIdx":8},
        {"surface":"満開","reading":"만카이","meaning":"만개","pos":"noun","startIdx":8,"endIdx":10},
        {"surface":"に","reading":"니","meaning":"에","pos":"particle","startIdx":10,"endIdx":11},
        {"surface":"なりました","reading":"나리마시타","meaning":"되었습니다","pos":"verb","startIdx":11,"endIdx":16}
    ]'::jsonb,
    'N4',
    NOW() - INTERVAL '1 hour'
),
(
    '読売新聞',
    'https://example.com/seed-2',
    '新しい電車が来月から運行します',
    '새로운 전철이 다음 달부터 운행합니다',
    '新しい電車が来月から運行を始めます。速さと快適さが向上します。',
    '새로운 전철이 다음 달부터 운행을 시작합니다. 속도와 쾌적함이 향상됩니다.',
    '[
        {"surface":"新しい","reading":"아타라시이","meaning":"새로운","pos":"adjective","startIdx":0,"endIdx":3},
        {"surface":"電車","reading":"덴샤","meaning":"전철","pos":"noun","startIdx":3,"endIdx":5},
        {"surface":"が","reading":"가","meaning":"이/가","pos":"particle","startIdx":5,"endIdx":6},
        {"surface":"来月","reading":"라이게츠","meaning":"다음 달","pos":"noun","startIdx":6,"endIdx":8},
        {"surface":"から","reading":"카라","meaning":"부터","pos":"particle","startIdx":8,"endIdx":10},
        {"surface":"運行","reading":"운코우","meaning":"운행","pos":"noun","startIdx":10,"endIdx":12}
    ]'::jsonb,
    'N3',
    NOW() - INTERVAL '2 hours'
),
(
    '朝日新聞',
    'https://example.com/seed-3',
    '日本の経済が回復しています',
    '일본 경제가 회복되고 있습니다',
    '今年、日本の経済はゆっくりと回復しています。',
    '올해, 일본 경제는 천천히 회복되고 있습니다.',
    '[
        {"surface":"今年","reading":"코토시","meaning":"올해","pos":"noun","startIdx":0,"endIdx":2},
        {"surface":"日本","reading":"닐폰","meaning":"일본","pos":"noun","startIdx":3,"endIdx":5},
        {"surface":"の","reading":"노","meaning":"의","pos":"particle","startIdx":5,"endIdx":6},
        {"surface":"経済","reading":"케이자이","meaning":"경제","pos":"noun","startIdx":6,"endIdx":8},
        {"surface":"は","reading":"와","meaning":"은/는","pos":"particle","startIdx":8,"endIdx":9},
        {"surface":"ゆっくり","reading":"윳쿠리","meaning":"천천히","pos":"adverb","startIdx":9,"endIdx":13},
        {"surface":"回復しています","reading":"카이후쿠시테이마스","meaning":"회복되고 있습니다","pos":"verb","startIdx":14,"endIdx":21}
    ]'::jsonb,
    'N3',
    NOW() - INTERVAL '3 hours'
)
ON CONFLICT (source_url) DO NOTHING;
