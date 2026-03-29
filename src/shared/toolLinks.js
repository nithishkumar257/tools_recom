function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeExternalUrl(value) {
  const raw = asString(value);
  if (!raw) return '';

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(raw)) {
    return `https://${raw}`;
  }

  return '';
}

export function getToolExternalUrl(tool = {}) {
  return normalizeExternalUrl(
    tool.url || tool.website_url || tool.website || tool.site_url || tool.link,
  );
}