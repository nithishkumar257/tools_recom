export function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  return query.toString() ? `?${query.toString()}` : '';
}

export async function requestWithOfflineCache({ requester, cacheKey = '', ttlMs = 5 * 60 * 1000, readCache, writeCache }) {
  try {
    const response = await requester();
    if (cacheKey) {
      writeCache?.(cacheKey, response, ttlMs);
    }
    return { ...response, __fromCache: false };
  } catch (error) {
    if (cacheKey) {
      const cached = readCache?.(cacheKey);
      if (cached) {
        return { ...cached, __fromCache: true };
      }
    }
    throw error;
  }
}