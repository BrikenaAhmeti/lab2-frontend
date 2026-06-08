const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const SAFE_ASSET_PROTOCOLS = new Set(['http:', 'https:']);

function normalized(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function isInternalPath(value: string) {
  return value.startsWith('/') && !value.startsWith('//');
}

export function safeHref(value: string | null | undefined) {
  const url = normalized(value);

  if (!url) return null;
  if (url.startsWith('#') || isInternalPath(url)) return url;

  try {
    const parsed = new URL(url);
    return SAFE_LINK_PROTOCOLS.has(parsed.protocol) ? url : null;
  } catch {
    return null;
  }
}

export function safeImageSrc(value: string | null | undefined) {
  const url = normalized(value);

  if (!url) return null;
  if (isInternalPath(url)) return url;

  try {
    const parsed = new URL(url);
    return SAFE_ASSET_PROTOCOLS.has(parsed.protocol) ? url : null;
  } catch {
    return null;
  }
}
