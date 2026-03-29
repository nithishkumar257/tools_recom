const CACHE_PREFIX = 'aibrutal:offline:';

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function makeKey(key) {
  return `${CACHE_PREFIX}${key}`;
}

export function writeOfflineCache(key, value, ttlMs = 10 * 60 * 1000) {
  if (!hasStorage()) return;
  const now = Date.now();
  const safeTtl = Math.max(10_000, Number(ttlMs) || 10 * 60 * 1000);
  const payload = {
    value,
    createdAt: now,
    expiresAt: now + safeTtl,
  };

  try {
    window.localStorage.setItem(makeKey(key), JSON.stringify(payload));
  } catch {
    return;
  }
}

export function readOfflineCache(key) {
  if (!hasStorage()) return null;
  const raw = window.localStorage.getItem(makeKey(key));
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== 'object') return null;
    if (Number(payload.expiresAt || 0) < Date.now()) {
      window.localStorage.removeItem(makeKey(key));
      return null;
    }
    return payload.value ?? null;
  } catch {
    return null;
  }
}

export function clearOfflineCache(prefix = '') {
  if (!hasStorage()) return;
  const target = makeKey(prefix);
  const keys = Object.keys(window.localStorage);
  keys
    .filter((key) => key.startsWith(target))
    .forEach((key) => window.localStorage.removeItem(key));
}