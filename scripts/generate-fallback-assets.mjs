import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidates = JSON.parse(fs.readFileSync(path.join(root, 'src/data/wedding-band/candidates.v2.json'), 'utf8'));
const assets = JSON.parse(fs.readFileSync(path.join(root, 'src/data/wedding-band/diagnostic-assets.v2.json'), 'utf8'));
const tone = { silver:'#c8c9ca', champagne:'#bfaa7c', yellow:'#bf8c24', rose:'#bc7e72', twoTone:'#b69a72' };
function svg(item) {
  const a = item.attributes;
  const stroke = tone[a.metalTone] ?? tone.silver;
  const width = { slim:12, medium:18, wide:26 }[a.bandWidth] ?? 18;
  const stone = a.diamondLayout === 'none' ? '' : '<circle cx="320" cy="368" r="7" fill="#fbffff" stroke="#aeb8bc" stroke-width="2"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640"><defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".35" stop-color="${stroke}"/><stop offset=".65" stop-color="#fff8ef"/><stop offset="1" stop-color="#8b827c"/></linearGradient></defs><rect width="640" height="640" fill="#f7f3ef"/><ellipse cx="320" cy="340" rx="177" ry="130" fill="none" stroke="url(#m)" stroke-width="${width}"/>${stone}</svg>`;
}
for (const item of [...candidates, ...assets]) {
  const target = path.join(root, 'public', item.assets.fallback.replace(/^\//, ''));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (!fs.existsSync(target)) fs.writeFileSync(target, svg(item));
}
console.log(`fallback assets ready: ${candidates.length + assets.length}`);
