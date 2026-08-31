export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const result = [...items]; const random = mulberry32(seed);
  for (let i=result.length-1;i>0;i--){ const j=Math.floor(random()*(i+1)); [result[i],result[j]]=[result[j]!,result[i]!]; }
  return result;
}
export function createSeed() {
  if (globalThis.crypto?.getRandomValues) { const a = new Uint32Array(1); globalThis.crypto.getRandomValues(a); return a[0] || 1; }
  return (Date.now() ^ Math.floor(Math.random()*0xffffffff)) >>> 0;
}
