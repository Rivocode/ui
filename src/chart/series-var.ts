const SAFE = /^[\p{L}\p{N}_-]+$/u;

function digest(text: string): string {
  let hash = 5381;
  for (const char of text) hash = ((hash * 33) ^ char.codePointAt(0)!) >>> 0;
  return hash.toString(36);
}

export function seriesId(key: string): string {
  if (SAFE.test(key)) return key;
  return `${key.replace(/[^\p{L}\p{N}_-]/gu, "_")}-${digest(key)}`;
}

export function seriesVar(key: string): string {
  return `--color-${seriesId(key)}`;
}
