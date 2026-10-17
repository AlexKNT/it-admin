const MAX_PAGE = 1_000_000;

// Never throws and always returns a positive integer, so a crafted query
// string cannot reach SQL as a bound value.
export function parsePageParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;

  if (typeof raw !== 'string') {
    return 1;
  }

  const trimmed = raw.trim();

  if (!/^\d+$/.test(trimmed)) {
    return 1;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) {
    return MAX_PAGE;
  }

  if (parsed < 1) {
    return 1;
  }

  return Math.min(parsed, MAX_PAGE);
}
