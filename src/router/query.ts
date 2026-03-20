export function getStringParam(params: URLSearchParams, key: string) {
  const v = params.get(key);
  return v && v.trim() ? v : null;
}

export function getEnumParam<T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[]
): T | null {
  const v = getStringParam(params, key);
  if (!v) return null;
  return (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

export function setOrDeleteParam(url: URL, key: string, value: string | null | undefined) {
  if (!value) url.searchParams.delete(key);
  else url.searchParams.set(key, value);
}

