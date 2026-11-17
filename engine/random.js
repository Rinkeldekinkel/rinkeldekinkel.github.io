export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
export const round = (value, digits = 0) => Number(value.toFixed(digits));

export function hashSeed(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function rng(state) {
  return () => {
    state.random = (state.random + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state.random ^ (state.random >>> 15), state.random | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const integer = (next, min, max) => min + Math.floor(next() * (max - min + 1));
export const choose = (next, items) => items[Math.floor(next() * items.length)];
export const normal = next => (next() + next() + next() + next() + next() + next() - 3) * Math.SQRT2;
export function poisson(next, expected) {
  const limit = Math.exp(-expected);
  let product = next();
  let result = 0;
  while (product > limit) {
    product *= next();
    result++;
  }
  return result;
}
export function shuffle(next, items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = integer(next, 0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function interpolate(year, years, values) {
  if (year < years[0]) return values[0] * (0.92 + (year - years[0] + 4) * .015);
  for (let i = 1; i < years.length; i++) {
    if (year <= years[i]) {
      const t = (year - years[i - 1]) / (years[i] - years[i - 1]);
      return values[i - 1] * (1 - t) + values[i] * t;
    }
  }
  return values.at(-1);
}

export function distance(a,b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 3959 * 2 * Math.asin(Math.sqrt(h));
}
