const SAMPLES = [
  '東京で桜が満開になりました。',
  '新しい電車が来月から運行します。',
  '日本の経済が回復しています。',
];

const BASE = process.env.SERVICE_URL || 'http://localhost:3000';

async function main() {
  const health = await fetch(`${BASE}/health`).then((r) => r.json());
  console.log('health:', health);

  for (const text of SAMPLES) {
    const r = await fetch(`${BASE}/tokenize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const json = await r.json();
    console.log(`\n[${text}]`);
    console.log(JSON.stringify(json.tokens, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
