export type HighlightChunk = { text: string; match: boolean };

type Folded = { text: string; starts: number[]; ends: number[] };

const MARKS = /[̀-ͯ]/g;

function fold(text: string): Folded {
  let folded = "";
  const starts: number[] = [];
  const ends: number[] = [];
  let at = 0;
  for (const char of text) {
    const base = char.normalize("NFD").replace(MARKS, "").toLocaleLowerCase("pt-BR");
    const end = at + char.length;
    if (base.length === 0 && ends.length > 0) {
      ends[ends.length - 1] = end;
    }
    for (let unit = 0; unit < base.length; unit++) {
      starts.push(at);
      ends.push(end);
    }
    folded += base;
    at = end;
  }
  return { text: folded, starts, ends };
}

export function foldSearch(text: string): string {
  return fold(text).text;
}

export function matchesSearch(text: string, query: string): boolean {
  const needle = foldSearch(query.trim());
  return needle.length === 0 || foldSearch(text).includes(needle);
}

function termsOf(query: string | readonly string[]): string[] {
  const list = typeof query === "string" ? [query] : query;
  const terms = new Set<string>();
  for (const term of list) {
    const folded = foldSearch(term.trim());
    if (folded.length > 0) terms.add(folded);
  }
  return [...terms];
}

export function splitHighlight(
  text: string,
  query: string | readonly string[],
): HighlightChunk[] {
  const terms = termsOf(query);
  if (text.length === 0) return [];
  if (terms.length === 0) return [{ text, match: false }];

  const folded = fold(text);
  const ranges: Array<[number, number]> = [];
  for (const term of terms) {
    let from = folded.text.indexOf(term);
    while (from !== -1) {
      ranges.push([from, from + term.length]);
      from = folded.text.indexOf(term, from + 1);
    }
  }
  if (ranges.length === 0) return [{ text, match: false }];

  ranges.sort((one, other) => one[0] - other[0] || other[1] - one[1]);
  const merged: Array<[number, number]> = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([range[0], range[1]]);
  }

  const chunks: HighlightChunk[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    const from = Math.max(folded.starts[start] as number, cursor);
    const to = folded.ends[end - 1] as number;
    if (from > cursor) chunks.push({ text: text.slice(cursor, from), match: false });
    chunks.push({ text: text.slice(from, to), match: true });
    cursor = to;
  }
  if (cursor < text.length) chunks.push({ text: text.slice(cursor), match: false });
  return chunks;
}
