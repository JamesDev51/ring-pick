import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidatePath = path.join(root, 'src/data/wedding-band/candidates.v2.json');
const diagnosticPath = path.join(root, 'src/data/wedding-band/diagnostic-assets.v2.json');
const handBase64Path = path.join(root, 'assets/worn-hand-base.webp.b64');
const candidates = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
const diagnostics = JSON.parse(fs.readFileSync(diagnosticPath, 'utf8'));
const handBuffer = Buffer.from(fs.readFileSync(handBase64Path, 'utf8').trim(), 'base64');
const outputRoot = path.join(root, 'public/images/wedding-bands/v2');
const candidateDir = path.join(outputRoot, 'candidates');
const diagnosticDir = path.join(outputRoot, 'diagnostic');
const fallbackDir = path.join(outputRoot, 'fallback');
const marker = path.join(outputRoot, '.generated-sha');
const generatorVersion = '2.1.0';
const digest = crypto.createHash('sha256')
  .update(generatorVersion)
  .update(fs.readFileSync(candidatePath))
  .update(fs.readFileSync(diagnosticPath))
  .update(handBuffer)
  .digest('hex');

const expectedFiles = [
  ...candidates.flatMap((item) => [item.assets.pack384, item.assets.pack768, item.assets.worn384, item.assets.worn768, item.assets.fallback]),
  ...diagnostics.flatMap((item) => [item.assets.image384, item.assets.image768, item.assets.fallback]),
].map((value) => path.join(root, 'public', value.replace(/^\//, '')));

if (fs.existsSync(marker) && fs.readFileSync(marker, 'utf8').trim() === digest && expectedFiles.every(fs.existsSync)) {
  console.log('wedding-band v2 assets already generated');
  process.exit(0);
}

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(candidateDir, { recursive: true });
fs.mkdirSync(diagnosticDir, { recursive: true });
fs.mkdirSync(fallbackDir, { recursive: true });

const tones = {
  silver: ['#f9fbfc', '#c7cbd0', '#ffffff', '#8e9399'],
  champagne: ['#fff8e9', '#c7aa73', '#f6e4b9', '#8f7349'],
  yellow: ['#fff0a8', '#d49b22', '#fff1a2', '#9b6911'],
  rose: ['#ffe0d6', '#c88470', '#f6c0ae', '#945849'],
  twoTone: ['#f9fbfc', '#c7cbd0', '#ffffff', '#8e9399'],
};
const secondaryDefault = { silver: 'yellow', champagne: 'silver', yellow: 'silver', rose: 'champagne', twoTone: 'yellow' };
const widthMap = { slim: 20, medium: 34, wide: 50 };

function escapeXml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function gradient(id, tone) {
  const colors = tones[tone] ?? tones.silver;
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors[0]}"/><stop offset=".24" stop-color="${colors[1]}"/><stop offset=".49" stop-color="${colors[2]}"/><stop offset=".72" stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[3]}"/></linearGradient>`;
}

function point(theta, cx, cy, rx, ry, inset = 0) {
  return [cx + (rx - inset) * Math.cos(theta), cy + (ry - inset * 0.54) * Math.sin(theta)];
}

function gem(x, y, radius, id, metalGradient, bezel = true) {
  const facets = Array.from({ length: 8 }, (_, index) => {
    const a1 = index * Math.PI / 4;
    const a2 = (index + 1) * Math.PI / 4;
    const p1 = `${(x + Math.cos(a1) * radius * .9).toFixed(1)},${(y + Math.sin(a1) * radius * .9).toFixed(1)}`;
    const p2 = `${(x + Math.cos(a2) * radius * .9).toFixed(1)},${(y + Math.sin(a2) * radius * .9).toFixed(1)}`;
    return `<path d="M ${x.toFixed(1)} ${y.toFixed(1)} L ${p1} L ${p2} Z" fill="${index % 2 ? '#dce8ed' : '#ffffff'}" fill-opacity="${index % 3 ? '.82' : '.95'}"/>`;
  }).join('');
  const bezelRing = bezel ? `<circle cx="${x}" cy="${y}" r="${radius + 2.6}" fill="none" stroke="url(#${metalGradient})" stroke-width="3.4"/>` : '';
  return `<g filter="url(#gemShadow${id})">${bezelRing}<circle cx="${x}" cy="${y}" r="${radius}" fill="url(#stone${id})" stroke="#aab7bd" stroke-width="1.2"/>${facets}<circle cx="${x - radius * .28}" cy="${y - radius * .34}" r="${Math.max(1.2, radius * .13)}" fill="#fff" fill-opacity=".92"/></g>`;
}

function surfaceDefs(id, finish) {
  if (finish === 'satin' || finish === 'sandblast') {
    return `<filter id="surface${id}" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="${finish === 'satin' ? '.55' : '.9'}" numOctaves="2" seed="17" result="n"/><feComposite in="n" in2="SourceGraphic" operator="in" result="t"/><feBlend in="SourceGraphic" in2="t" mode="soft-light"/></filter>`;
  }
  if (finish === 'hammered') {
    return `<filter id="surface${id}" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="turbulence" baseFrequency=".025" numOctaves="3" seed="23" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  }
  return `<filter id="surface${id}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="0"/></filter>`;
}

function ringShape(attrs, id, size, worn = false) {
  const scale = size / 768;
  const cx = (worn ? 278 : 384) * scale;
  const cy = (worn ? 548 : 326) * scale;
  const rx = (worn ? 112 : 282) * scale;
  const ry = (worn ? 37 : 174) * scale;
  const width = widthMap[attrs.bandWidth] * scale;
  const main = `metal${id}`;
  const secondaryTone = attrs.metalTone === 'twoTone' ? 'yellow' : secondaryDefault[attrs.metalTone];
  const secondary = `secondary${id}`;
  const tone = attrs.metalTone === 'twoTone' ? 'silver' : attrs.metalTone;
  const defs = `${gradient(main, tone)}${gradient(secondary, secondaryTone)}${surfaceDefs(id, attrs.surfaceFinish)}<radialGradient id="stone${id}" cx="32%" cy="25%" r="78%"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#f8fdff"/><stop offset=".73" stop-color="#dce8ed"/><stop offset="1" stop-color="#b8c5cb"/></radialGradient><filter id="shadow${id}" x="-30%" y="-30%" width="160%" height="180%"><feGaussianBlur stdDeviation="${worn ? 4 : 10}"/></filter><filter id="gemShadow${id}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#574b44" flood-opacity=".2"/></filter>`;

  const shadow = worn
    ? `<ellipse cx="${cx}" cy="${cy + ry * .45}" rx="${rx * .96}" ry="${ry * .5}" fill="#402e26" fill-opacity=".18" filter="url(#shadow${id})"/>`
    : `<ellipse cx="${cx}" cy="${cy + ry + 68 * scale}" rx="${rx * .64}" ry="${25 * scale}" fill="#584c45" fill-opacity=".17" filter="url(#shadow${id})"/>`;

  let baseShape = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="url(#${main})" stroke-width="${width}" filter="url(#surface${id})"/>`;
  if (attrs.motif === 'wave' || attrs.motif === 'vLine' || attrs.motif === 'twist' || attrs.motif === 'asymmetric') {
    if (worn) {
      const left = cx - rx, right = cx + rx;
      const wave = attrs.motif === 'vLine' ? 15 : attrs.motif === 'asymmetric' ? 10 : 8;
      const pathA = `M ${left} ${cy} C ${cx - rx * .45} ${cy + wave * scale}, ${cx - rx * .16} ${cy - wave * scale}, ${cx} ${cy - (attrs.motif === 'vLine' ? 10 : 4) * scale} C ${cx + rx * .22} ${cy - wave * scale}, ${cx + rx * .55} ${cy + wave * scale}, ${right} ${cy}`;
      baseShape = `<path d="${pathA}" fill="none" stroke="url(#${main})" stroke-width="${width}" stroke-linecap="round" filter="url(#surface${id})"/>`;
      if (attrs.motif === 'twist') {
        const pathB = `M ${left} ${cy + 8 * scale} C ${cx - rx * .38} ${cy - 9 * scale}, ${cx + rx * .38} ${cy + 9 * scale}, ${right} ${cy - 8 * scale}`;
        baseShape += `<path d="${pathB}" fill="none" stroke="url(#${secondary})" stroke-width="${Math.max(5, width * .42)}" stroke-linecap="round"/>`;
      }
    } else {
      const bottom = cy + ry;
      const left = cx - rx, right = cx + rx;
      const topPath = `M ${left} ${cy} C ${cx - rx * .5} ${cy - ry * 1.05}, ${cx + rx * .5} ${cy - ry * 1.05}, ${right} ${cy}`;
      const bend = attrs.motif === 'vLine' ? 34 : attrs.motif === 'asymmetric' ? 22 : 16;
      const bottomPath = `M ${left} ${cy} C ${cx - rx * .45} ${bottom + bend * scale}, ${cx + rx * .42} ${bottom - bend * scale}, ${right} ${cy}`;
      baseShape = `<path d="${topPath}" fill="none" stroke="url(#${main})" stroke-width="${width}" stroke-linecap="round"/><path d="${bottomPath}" fill="none" stroke="url(#${main})" stroke-width="${width}" stroke-linecap="round"/>`;
      if (attrs.motif === 'twist') baseShape += `<path d="M ${left} ${cy} C ${cx - rx * .35} ${bottom - 28 * scale}, ${cx + rx * .35} ${bottom + 28 * scale}, ${right} ${cy}" fill="none" stroke="url(#${secondary})" stroke-width="${Math.max(5, width * .42)}" stroke-linecap="round"/>`;
    }
  }

  let accents = '';
  if (attrs.colorLayout === 'centerStripe') accents += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="url(#${secondary})" stroke-width="${Math.max(3, width * .28)}"/>`;
  if (attrs.colorLayout === 'edgeContrast') {
    accents += `<ellipse cx="${cx}" cy="${cy}" rx="${rx - width * .32}" ry="${ry - width * .18}" fill="none" stroke="url(#${secondary})" stroke-width="${Math.max(3, width * .2)}"/>`;
    accents += `<ellipse cx="${cx}" cy="${cy}" rx="${rx + width * .32}" ry="${ry + width * .18}" fill="none" stroke="url(#${secondary})" stroke-width="${Math.max(3, width * .2)}"/>`;
  }
  if (attrs.colorLayout === 'split') accents += `<path d="M ${cx} ${cy - ry} A ${rx} ${ry} 0 0 1 ${cx} ${cy + ry}" fill="none" stroke="url(#${secondary})" stroke-width="${width}"/>`;
  if (attrs.colorLayout === 'interwoven' && attrs.motif !== 'twist') accents += `<path d="M ${cx - rx} ${cy} C ${cx - rx * .35} ${cy - 18 * scale}, ${cx + rx * .35} ${cy + 18 * scale}, ${cx + rx} ${cy}" fill="none" stroke="url(#${secondary})" stroke-width="${Math.max(4, width * .34)}" stroke-linecap="round"/>`;

  if (attrs.motif === 'centerGroove') accents += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#5f554f" stroke-opacity=".42" stroke-width="${Math.max(1.5, width * .09)}"/>`;
  if (attrs.motif === 'edgeLine') accents += `<ellipse cx="${cx}" cy="${cy}" rx="${rx - width * .28}" ry="${ry - width * .16}" fill="none" stroke="#fff" stroke-opacity=".62" stroke-width="${Math.max(1.5, width * .08)}"/>`;
  if (attrs.motif === 'diagonal') {
    const [x, y] = point(Math.PI / 2, cx, cy, rx, ry, width * .45);
    accents += `<path d="M ${x - 34 * scale} ${y + 15 * scale} L ${x + 34 * scale} ${y - 15 * scale}" stroke="#655850" stroke-opacity=".46" stroke-width="${Math.max(2, 3 * scale)}"/><path d="M ${x - 31 * scale} ${y + 11 * scale} L ${x + 37 * scale} ${y - 19 * scale}" stroke="#fff" stroke-opacity=".58" stroke-width="${Math.max(1, 1.4 * scale)}"/>`;
  }
  if (attrs.motif === 'segmented') {
    for (let index = 0; index < 11; index += 1) {
      const theta = .4 + index * .235;
      const [x1, y1] = point(theta, cx, cy, rx, ry, width * .12);
      const [x2, y2] = point(theta, cx, cy, rx, ry, width * .85);
      accents += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${index % 2 ? '#6f625a' : '#fff'}" stroke-opacity=".36" stroke-width="${Math.max(1, 2 * scale)}"/>`;
    }
  }
  if (attrs.surfaceFinish === 'milgrain') {
    for (let index = 0; index < 32; index += 1) {
      const theta = .2 + index * (2.74 / 31);
      for (const inset of [width * .02, width * .78]) {
        const [x, y] = point(theta, cx, cy, rx, ry, inset);
        accents += `<circle cx="${x}" cy="${y}" r="${Math.max(1.2, 2.3 * scale)}" fill="url(#${main})" stroke="#fff" stroke-opacity=".42" stroke-width=".7"/>`;
      }
    }
  }
  if (attrs.surfaceFinish === 'hairline' || attrs.surfaceFinish === 'engraved') {
    for (let index = 0; index < 30; index += 1) {
      const theta = .3 + index * .082;
      const [x1, y1] = point(theta, cx, cy, rx, ry, width * .12);
      const [x2, y2] = point(theta + (attrs.surfaceFinish === 'engraved' ? .018 : 0), cx, cy, rx, ry, width * .82);
      accents += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${attrs.surfaceFinish === 'engraved' ? '#6c5c54' : '#fff'}" stroke-opacity="${attrs.surfaceFinish === 'engraved' ? '.32' : '.22'}" stroke-width="${Math.max(.8, 1.1 * scale)}"/>`;
    }
  }

  let stones = '';
  const addAt = (theta, radius, inset = width * .46, bezel = true) => {
    const [x, y] = point(theta, cx, cy, rx, ry, inset);
    stones += gem(x, y, radius * scale, id, main, bezel);
  };
  const layout = attrs.diamondLayout;
  if (layout === 'singleFlush') addAt(attrs.motif === 'asymmetric' ? 1.95 : Math.PI / 2, 6.8);
  if (layout === 'triple') [1.37, 1.57, 1.77].forEach((theta) => addAt(theta, 5.4));
  if (layout === 'shortLine' || layout === 'diagonalLine' || layout === 'channel') {
    const count = layout === 'channel' ? 6 : 5;
    if (layout === 'channel') {
      const [x, y] = point(Math.PI / 2, cx, cy, rx, ry, width * .45);
      accents += `<rect x="${x - 48 * scale}" y="${y - 11 * scale}" width="${96 * scale}" height="${22 * scale}" rx="${7 * scale}" fill="#62564f" fill-opacity=".26" stroke="#fff" stroke-opacity=".38"/>`;
    }
    for (let index = 0; index < count; index += 1) {
      if (layout === 'diagonalLine' || attrs.motif === 'diagonal') {
        const [x, y] = point(Math.PI / 2, cx, cy, rx, ry, width * .46);
        const delta = index - (count - 1) / 2;
        stones += gem(x + delta * 14 * scale, y - delta * 5.7 * scale, 5.1 * scale, id, main, true);
      } else if (attrs.motif === 'vLine') {
        const [x, y] = point(Math.PI / 2, cx, cy, rx, ry, width * .46);
        const delta = index - (count - 1) / 2;
        stones += gem(x + delta * 14 * scale, y - Math.abs(delta) * 4.6 * scale, 5.1 * scale, id, main, true);
      } else addAt(1.36 + index * (.42 / Math.max(1, count - 1)), 5.1);
    }
  }
  if (layout === 'quarterPave' || layout === 'halfPave' || layout === 'fullEternity') {
    const [start, end, count] = layout === 'quarterPave' ? [.92, 2.22, 18] : layout === 'halfPave' ? [.34, 2.8, 30] : [0, Math.PI * 2, 52];
    for (let index = 0; index < count; index += 1) addAt(start + (end - start) * index / (layout === 'fullEternity' ? count : count - 1), 4.2);
  }
  if (layout === 'petiteCenter') {
    const [x, y] = point(Math.PI / 2, cx, cy, rx, ry, width * .45);
    stones += gem(x, y - width * .76, attrs.bandWidth === 'slim' ? 21 * scale : 24 * scale, id, main, true);
  }

  return { defs, shadow, baseShape, accents, stones, cx, cy, rx, ry, width };
}

function packSvg(item, size = 768) {
  const id = item.id.replaceAll('-', '');
  const shape = ringShape(item.attributes, id, size, false);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${escapeXml(item.title ?? item.id)}"><defs>${shape.defs}<radialGradient id="bg${id}" cx="48%" cy="40%" r="74%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#f1ece8"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#bg${id})"/>${shape.shadow}${shape.baseShape}${shape.accents}${shape.stones}</svg>`);
}

function wornOverlaySvg(item, size = 768) {
  const id = `${item.id.replaceAll('-', '')}w`;
  const shape = ringShape(item.attributes, id, size, true);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><defs>${shape.defs}</defs>${shape.shadow}${shape.baseShape}${shape.accents}${shape.stones}</svg>`);
}

async function renderWebp(svg, size, destination, quality = 78) {
  await sharp(svg, { density: 144 }).resize(size, size).webp({ quality, effort: 5, smartSubsample: true }).toFile(destination);
}

async function renderWorn(item, size, destination) {
  const base = await sharp(handBuffer).resize(size, size).ensureAlpha().toBuffer();
  const overlay = wornOverlaySvg(item, size);
  const composed = await sharp(base).composite([{ input: overlay, blend: 'over' }]).webp({ quality: 72, effort: 5, smartSubsample: true }).toBuffer();
  await fs.promises.writeFile(destination, composed);
}

for (const item of candidates) {
  const pack768 = packSvg(item, 768);
  await renderWebp(pack768, 768, path.join(candidateDir, `${item.id}-pack-768.webp`));
  await renderWebp(pack768, 384, path.join(candidateDir, `${item.id}-pack-384.webp`), 76);
  await renderWorn(item, 768, path.join(candidateDir, `${item.id}-worn-768.webp`));
  await renderWorn(item, 384, path.join(candidateDir, `${item.id}-worn-384.webp`));
  fs.writeFileSync(path.join(fallbackDir, `${item.id}.svg`), packSvg(item, 640));
}

for (const item of diagnostics) {
  const pack768 = packSvg({ ...item, title: item.id }, 768);
  await renderWebp(pack768, 768, path.join(diagnosticDir, `${item.id}-768.webp`));
  await renderWebp(pack768, 384, path.join(diagnosticDir, `${item.id}-384.webp`), 76);
  fs.writeFileSync(path.join(fallbackDir, `${item.id}.svg`), packSvg({ ...item, title: item.id }, 640));
}

fs.writeFileSync(marker, `${digest}\n`);
console.log(`generated ${candidates.length * 4 + diagnostics.length * 2} WebP variants and ${candidates.length + diagnostics.length} SVG fallbacks`);
