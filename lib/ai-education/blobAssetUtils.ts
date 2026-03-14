export const BLOB_URI_PREFIX = 'blob://';

export function buildBlobUri(pathname: string): string {
  const p = normalizeBlobPathname(pathname);
  return `${BLOB_URI_PREFIX}${p}`;
}

export function parseBlobUri(value?: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith(BLOB_URI_PREFIX)) return null;
  const p = value.slice(BLOB_URI_PREFIX.length).trim();
  return p ? normalizeBlobPathname(p) : null;
}

export function normalizeBlobPathname(pathname: string): string {
  const p = String(pathname || '').trim();
  if (!p) throw new Error('Missing blob pathname');
  // 防止 query/hash 注入
  const clean = p.split('?')[0]?.split('#')[0] || '';
  return clean.replace(/^\/+/, '');
}
// 兼容：历史实现里使用过 blob://pathname。现在 Blob 为 public，但仍可用该 URI 作为引用格式。
