import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidates = JSON.parse(fs.readFileSync(path.join(root, 'src/data/wedding-band/candidates.v2.json'), 'utf8'));
const diagnosticAssets = JSON.parse(fs.readFileSync(path.join(root, 'src/data/wedding-band/diagnostic-assets.v2.json'), 'utf8'));
const questions = JSON.parse(fs.readFileSync(path.join(root, 'src/data/wedding-band/diagnostic-questions.v2.json'), 'utf8'));

function fail(message) { throw new Error(message); }
function absolute(publicPath) { return path.join(root, 'public', publicPath.replace(/^\//, '')); }

function webpDimensions(buffer) {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') fail('Invalid WebP signature');
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (type === 'VP8X' && data + 10 <= buffer.length) {
      const width = 1 + buffer[data + 4] + (buffer[data + 5] << 8) + (buffer[data + 6] << 16);
      const height = 1 + buffer[data + 7] + (buffer[data + 8] << 8) + (buffer[data + 9] << 16);
      return [width, height];
    }
    if (type === 'VP8L' && data + 5 <= buffer.length) {
      const b1 = buffer[data + 1], b2 = buffer[data + 2], b3 = buffer[data + 3], b4 = buffer[data + 4];
      return [1 + (((b2 & 0x3f) << 8) | b1), 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6))];
    }
    if (type === 'VP8 ' && data + 10 <= buffer.length) {
      for (let i = data; i < Math.min(data + 20, buffer.length - 6); i += 1) {
        if (buffer[i] === 0x9d && buffer[i + 1] === 0x01 && buffer[i + 2] === 0x2a) {
          return [buffer.readUInt16LE(i + 3) & 0x3fff, buffer.readUInt16LE(i + 5) & 0x3fff];
        }
      }
    }
    offset = data + size + (size % 2);
  }
  fail('Unsupported WebP container');
}

const expected = [];
for (const candidate of candidates) {
  expected.push([candidate.assets.pack384, 384], [candidate.assets.pack768, 768], [candidate.assets.worn384, 384], [candidate.assets.worn768, 768]);
  if (!fs.existsSync(absolute(candidate.assets.fallback))) fail(`Missing fallback ${candidate.assets.fallback}`);
}
for (const asset of diagnosticAssets) {
  expected.push([asset.assets.image384, 384], [asset.assets.image768, 768]);
  if (!fs.existsSync(absolute(asset.assets.fallback))) fail(`Missing fallback ${asset.assets.fallback}`);
}

if (candidates.length !== 64) fail(`Expected 64 candidates, got ${candidates.length}`);
if (diagnosticAssets.length !== 25) fail(`Expected 25 diagnostic assets, got ${diagnosticAssets.length}`);
if (questions.length !== 18) fail(`Expected 18 diagnostic questions, got ${questions.length}`);
if (expected.length !== 306) fail(`Expected 306 WebP variants, got ${expected.length}`);

const hashes = new Map();
for (const [assetPath, expectedSize] of expected) {
  const file = absolute(assetPath);
  if (!fs.existsSync(file)) fail(`Missing WebP ${assetPath}`);
  const buffer = fs.readFileSync(file);
  if (buffer.length < 1_000) fail(`Suspiciously small WebP ${assetPath}`);
  if (buffer.length > 240_000) fail(`Oversized WebP ${assetPath}: ${buffer.length}`);
  const [width, height] = webpDimensions(buffer);
  if (width !== expectedSize || height !== expectedSize) fail(`Wrong dimensions ${assetPath}: ${width}x${height}`);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  if (hashes.has(hash)) fail(`Exact duplicate files: ${assetPath} and ${hashes.get(hash)}`);
  hashes.set(hash, assetPath);
}

const diagnosticById = new Map(diagnosticAssets.map((asset) => [asset.id, asset]));
for (const question of questions) {
  const a = diagnosticById.get(question.assetA);
  const b = diagnosticById.get(question.assetB);
  if (!a || !b) fail(`Question ${question.id} references missing asset`);
  const differences = Object.keys(a.attributes).filter((key) => a.attributes[key] !== b.attributes[key]);
  if (differences.length !== 1 || differences[0] !== question.attribute) {
    fail(`Question ${question.id} is not controlled: ${differences.join(', ')}`);
  }
  if (a.attributes[question.attribute] !== question.aValue || b.attributes[question.attribute] !== question.bValue) {
    fail(`Question ${question.id} values do not match assets`);
  }
}

const familyCounts = candidates.reduce((acc, item) => { acc[item.family] = (acc[item.family] ?? 0) + 1; return acc; }, {});
const expectedFamilies = { classic:8, point:8, line:8, pave:8, structure:8, texture:8, twoTone:6, curve:6, petiteCenter:4 };
for (const [family, count] of Object.entries(expectedFamilies)) if (familyCounts[family] !== count) fail(`Wrong ${family} count: ${familyCounts[family]}`);

console.log(`assets ok: ${expected.length} WebP variants, ${candidates.length + diagnosticAssets.length} fallbacks, ${questions.length} controlled pairs`);
