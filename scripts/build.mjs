import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
const url = process.env.SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';
if (!url || !anonKey) throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY before building. Never use a service_role or secret key.');
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)) throw new Error('SUPABASE_URL must be the HTTPS URL of your Supabase project.');
if (!anonKey.startsWith('sb_publishable_')) {
  let role;
  try { const parts = anonKey.split('.'); if (parts.length !== 3) throw new Error(); role = JSON.parse(Buffer.from(parts[1], 'base64url').toString()).role; } catch { throw new Error('Expected a Supabase publishable or legacy anon key.'); }
  if (role !== 'anon') throw new Error('Only a legacy anon key may be exposed in browser code.');
}
await mkdir('dist', {recursive:true});
await mkdir('dist/assets', {recursive:true});
for (const file of ['index.html','style.css','app.js']) await copyFile(file, `dist/${file}`);
for (const file of ['kimchiro-logo.webp','map-heading.webp','kimchi-icon.webp','hero-kimchi.webp']) await copyFile(`assets/${file}`, `dist/assets/${file}`);
await writeFile('dist/config.js', `window.KIMCHIRO_CONFIG = ${JSON.stringify({url,anonKey})};\n`);


// The game has its own shareable page and preview metadata.
const gameHtml = (await readFile('index.html', 'utf8'))
  .replaceAll('김치로-김치로 통하는 우리동네 김치 지도.', '김치 이상형 월드컵 | 김치로 실험실')
  .replaceAll('김치로 통하는 우리동네 김치 지도.', '32가지 김치 중 나의 최애 김치를 골라보세요!')
  .replaceAll('https://kimchiro.vercel.app/', 'https://kimchiro.vercel.app/worldcup.html');
await writeFile('dist/worldcup.html', gameHtml);
