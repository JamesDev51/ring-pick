export function normalizeSeed(seed: number) {
  const normalized = Math.abs(Math.trunc(seed)) % 2_147_483_647;
  return normalized || 1;
}

export function randomSeed() {
  try {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return normalizeSeed(values[0]);
  } catch {
    return normalizeSeed(Date.now());
  }
}

export function mulberry32(seed: number) {
  let state = normalizeSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const output = [...items];
  const random = mulberry32(seed);
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }
  return output;
}
