import { Glob } from "bun";

export const SHOTS = "demo/dist";

export const SIGNATURES = "demo/assinaturas.json";

export const SECTION_PREFIX = "secao-";

export const CELL = 8;

export const CELL_CEILING = 4096;

export const FRAME = { red: 255, green: 0, blue: 255 };

export type Section = {
  page: string;
  name: string;
  theme: string;
  density?: string;
};

export const THEMES = ["rivocode-dark", "rivocode-light"];

function bothThemes(page: string, name: string): Section[] {
  return THEMES.map((theme) => ({ page, name, theme }));
}

export const SECTIONS: Section[] = [
  ...bothThemes("controles", "Progresso"),
  ...bothThemes("controles", "Chave"),
  ...bothThemes("completos", "Faixa"),
  ...bothThemes("completos", "Capacidade"),
  ...bothThemes("completos", "Numero com passo"),
  ...bothThemes("dados", "Marcadores"),
];

export function slug(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function shotName({ page, name, theme, density }: Section) {
  const parts = [page, slug(name), slug(theme)];
  if (density) parts.push(slug(density));
  return SECTION_PREFIX + parts.join("-");
}

export function address({ page, name, theme, density }: Section) {
  return `/secao.html#/${page}.html|${name}|${theme}|${density ?? ""}`;
}

export function isSection(name: string) {
  return name.startsWith(SECTION_PREFIX);
}

export async function markers() {
  const found = new Map<string, Set<string>>();

  for await (const file of new Glob("demo/*.tsx").scan(".")) {
    const page = file.replace(/^demo\/|\.tsx$/g, "");
    const code = await Bun.file(file).text();
    const titles = new Set<string>();

    if (code.includes("data-rc-shot={title}")) {
      for (const [, title] of code.matchAll(/<Block title="([^"]+)"/g)) titles.add(title!);
    }
    for (const [, title] of code.matchAll(/data-rc-shot="([^"]+)"/g)) titles.add(title!);

    if (titles.size > 0) found.set(page, titles);
  }

  return found;
}

export const BUILD_KEYWORD = "rc-build";

const digests = new Map<string, string>();

/**
 * O resumo do conteudo de um arquivo do build, ou `undefined` se ele sumiu.
 *
 * O cache existe porque cada pagina da vitrine repete a mesma CSS compilada, e
 * cada pacote passa dos 3 MB: sem ele os 32 retratos leriam 100 MB de disco.
 */
export async function digestOf(path: string) {
  const known = digests.get(path);
  if (known) return known;

  const file = Bun.file(path);
  if (!(await file.exists())) return undefined;

  const digest = Bun.hash.wyhash(new Uint8Array(await file.arrayBuffer())).toString(16);
  digests.set(path, digest);
  return digest;
}

/**
 * A marca de build de um retrato: caminho e resumo de cada arquivo que o
 * navegador carregou para produzi-lo, em ordem, separados por espaco.
 *
 * O formato e autodescritivo de proposito. Quem confere nao precisa saber a
 * rota de nenhum retrato: le os caminhos que o proprio PNG cita e refaz cada
 * resumo.
 */
export async function buildStamp(files: string[]) {
  const parts: string[] = [];

  for (const path of [...files].sort()) {
    const digest = await digestOf(path);
    if (!digest) throw new Error(`o retrato depende de ${path}, e o arquivo nao existe`);
    parts.push(`${path}=${digest}`);
  }

  return parts.join(" ");
}

/**
 * O que na marca de build nao corresponde mais ao disco, em uma frase por
 * arquivo. Lista vazia quer dizer que o retrato e deste build.
 */
export async function driftOf(stamp: string) {
  const drift: string[] = [];

  for (const part of stamp.split(" ")) {
    const [path, before] = part.split("=");
    if (!path || !before) {
      drift.push(`a marca de build esta ilegivel em "${part}"`);
      continue;
    }

    const now = await digestOf(path);
    if (!now) drift.push(`${path} nao existe mais`);
    else if (now !== before) drift.push(`${path} mudou depois do retrato`);
  }

  return drift;
}
