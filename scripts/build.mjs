import { mkdir, copyFile, writeFile } from 'node:fs/promises';
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
for (const file of ['index.html','style.css','app.js']) await copyFile(file, `dist/${file}`);
await writeFile('dist/config.js', `window.KIMCHIRO_CONFIG = ${JSON.stringify({url,anonKey})};\n`);

