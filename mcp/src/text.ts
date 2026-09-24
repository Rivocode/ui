const STOPWORDS = new Set([
  "a",
  "algo",
  "algum",
  "alguma",
  "antes",
  "ao",
  "aos",
  "aqui",
  "as",
  "ate",
  "cada",
  "coisa",
  "com",
  "como",
  "da",
  "das",
  "de",
  "depois",
  "do",
  "dos",
  "e",
  "ela",
  "ele",
  "em",
  "entre",
  "essa",
  "esse",
  "esta",
  "estar",
  "exibir",
  "este",
  "eu",
  "fazer",
  "for",
  "isso",
  "isto",
  "ja",
  "la",
  "mais",
  "mas",
  "me",
  "mostra",
  "mostrar",
  "muito",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "onde",
  "os",
  "ou",
  "outra",
  "outro",
  "para",
  "pela",
  "pelo",
  "por",
  "pouco",
  "preciso",
  "quais",
  "qual",
  "quando",
  "que",
  "quero",
  "se",
  "sem",
  "ser",
  "seu",
  "so",
  "sobre",
  "sua",
  "tela",
  "tem",
  "ter",
  "toda",
  "todo",
  "todos",
  "um",
  "uma",
  "umas",
  "uns",
  "usar",
  "vai",
  "vou",
]);

export function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function stem(word: string): string {
  return word.length > 6 ? word.slice(0, 6) : word.replace(/s$/, "");
}

export function words(text: string): string[] {
  return fold(text).match(/[a-z0-9]+/g) ?? [];
}

export function terms(text: string): string[] {
  return words(text).filter((word) => word.length > 1 && !STOPWORDS.has(word));
}

export function stems(text: string): Set<string> {
  return new Set(terms(text).map(stem));
}

export function overlap(query: Set<string>, text: Set<string>): string[] {
  return [...query].filter((item) => text.has(item));
}

export function compact(name: string): string {
  return fold(name).replace(/[^a-z0-9]/g, "");
}

export function clip(text: string, size: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > size ? `${flat.slice(0, size - 1).trimEnd()}…` : flat;
}
