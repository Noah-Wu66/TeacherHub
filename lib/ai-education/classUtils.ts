export function normalizeClassName(input: unknown): string {
  if (typeof input === 'number' && Number.isFinite(input)) {
    const n = Math.trunc(input);
    return n > 0 ? `${n}班` : '';
  }
  if (typeof input !== 'string') return '';
  const s = input.trim();
  if (!s) return '';

  // 兼容旧数据：1 / 1班 / 01班
  const m = s.match(/^(\d{1,3})\s*(?:班)?$/);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > 0) return `${n}班`;
  }
  return s;
}

export function normalizeClassList(input: unknown): string[] {
  if (Array.isArray(input)) {
    return uniq(input.map(normalizeClassName).filter(Boolean));
  }
  if (typeof input === 'string') {
    // 兼容旧数据：'1班,2班' / '1班、2班' / '1班 2班'
    const parts = input
      .split(/[，,、\s]+/g)
      .map((p) => p.trim())
      .filter(Boolean);
    return uniq(parts.map(normalizeClassName).filter(Boolean));
  }
  if (typeof input === 'number' && Number.isFinite(input)) {
    const one = normalizeClassName(input);
    return one ? [one] : [];
  }
  return [];
}

export function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}


