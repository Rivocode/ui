import { Glob } from "bun";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateSync, inflateSync } from "node:zlib";

export const SHOTS = "demo/dist";

/**
 * O Chrome que fotografa e audita. O padrao e o do macOS, onde as assinaturas
 * comitadas nasceram; a CI ubuntu aponta `RC_CHROME` para o binario dela.
 */
export const CHROME =
  process.env.RC_CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/**
 * Bandeiras a mais para o Chrome, separadas por espaco. Existe pela CI: o
 * ubuntu 24.04 restringe o namespace de usuario sem privilegio, e o Chrome de
 * la so abre com `--no-sandbox`. Na maquina fica vazio.
 */
export const CHROME_FLAGS = (process.env.RC_CHROME_FLAGS ?? "").split(/\s+/).filter(Boolean);

/** Morre com a instrucao, em vez de o `spawn` falhar com ENOENT sem contexto. */
export async function requireChrome() {
  if (await Bun.file(CHROME).exists()) return;
  console.error(
    `O Chrome nao esta em ${CHROME}.\n` +
      "Aponte a variavel RC_CHROME para o binario - no linux, `which google-chrome`.",
  );
  process.exit(1);
}

type Pending = { resolve: (value: any) => void; reject: (error: Error) => void };

export async function launchChrome(extraFlags: string[] = []) {
  const profile = mkdtempSync(join(tmpdir(), "rc-chrome-"));
  const proc = Bun.spawn(
    [
      CHROME,
      ...CHROME_FLAGS,
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--hide-scrollbars",
      "--force-prefers-reduced-motion",
      ...extraFlags,
      "about:blank",
    ],
    { stderr: "pipe", stdout: "ignore" },
  );

  const reader = proc.stderr.getReader();
  const decoder = new TextDecoder();
  let seen = "";
  let browserUrl = "";
  const deadline = Date.now() + 15000;
  while (!browserUrl && Date.now() < deadline) {
    const { value, done } = await reader.read();
    if (done) break;
    seen += decoder.decode(value);
    browserUrl = /DevTools listening on (ws:\/\/\S+)/.exec(seen)?.[1] ?? "";
  }
  reader.releaseLock();
  if (!browserUrl) throw new Error(`o Chrome nao abriu a porta de depuracao:\n${seen}`);

  const port = new URL(browserUrl).port;
  const list = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as {
    type: string;
    webSocketDebuggerUrl: string;
  }[];
  const tab = list.find((entry) => entry.type === "page");
  if (!tab) throw new Error("o Chrome abriu sem aba");

  const socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });

  let next = 0;
  const pending = new Map<number, Pending>();
  socket.onmessage = (event) => {
    const message = JSON.parse(String(event.data));
    const waiting = message.id ? pending.get(message.id) : undefined;
    if (!waiting) return;
    pending.delete(message.id);
    if (message.error) waiting.reject(new Error(JSON.stringify(message.error)));
    else waiting.resolve(message.result);
  };

  const send = (method: string, params: Record<string, unknown> = {}) =>
    new Promise<any>((resolve, reject) => {
      const id = ++next;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async <T>(expression: string): Promise<T> => {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ?? result.exceptionDetails.text,
      );
    }
    return result.result.value as T;
  };

  const KEYS = { Enter: { code: 13, text: "\r" }, Tab: { code: 9, text: undefined } } as const;
  const press = async (key: keyof typeof KEYS) => {
    const { code, text } = KEYS[key];
    await send("Input.dispatchKeyEvent", {
      type: text ? "keyDown" : "rawKeyDown",
      key,
      code: key,
      windowsVirtualKeyCode: code,
      text,
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key,
      code: key,
      windowsVirtualKeyCode: code,
    });
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });

  const close = () => {
    socket.close();
    proc.kill();
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {}
  };

  return { send, evaluate, press, close };
}

export type PngImage = {
  width: number;
  height: number;
  channels: number;
  pixels: Uint8Array;
  build?: string;
};

export function decodePng(bytes: Uint8Array): PngImage {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let at = 8;

  let width = 0;
  let height = 0;
  let channels = 4;
  let build: string | undefined;
  const data: Uint8Array[] = [];

  while (at < bytes.length) {
    const length = view.getUint32(at);
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
    const body = bytes.subarray(at + 8, at + 8 + length);

    if (type === "IHDR") {
      width = view.getUint32(at + 8);
      height = view.getUint32(at + 12);
      const depth = body[8];
      const color = body[9];
      const interlace = body[12];

      if (depth !== 8 || interlace !== 0 || (color !== 6 && color !== 2)) {
        throw new Error(`PNG fora do que este decodificador le: ${depth}/${color}/${interlace}`);
      }
      channels = color === 6 ? 4 : 3;
    }

    if (type === "tEXt") {
      const split = body.indexOf(0);
      const keyword = split < 0 ? "" : new TextDecoder().decode(body.subarray(0, split));
      if (keyword === BUILD_KEYWORD) build = new TextDecoder().decode(body.subarray(split + 1));
    }

    if (type === "IDAT") data.push(body);
    if (type === "IEND") break;

    at += 12 + length;
  }

  const deflated = new Uint8Array(data.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of data) {
    deflated.set(part, offset);
    offset += part.length;
  }

  const raw = inflateSync(deflated);
  const stride = width * channels;
  const pixels = new Uint8Array(width * height * channels);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]!;
    const from = y * (stride + 1) + 1;
    const to = y * stride;

    for (let x = 0; x < stride; x++) {
      const value = raw[from + x]!;
      const left = x >= channels ? pixels[to + x - channels]! : 0;
      const up = y > 0 ? pixels[to - stride + x]! : 0;
      const upLeft = y > 0 && x >= channels ? pixels[to - stride + x - channels]! : 0;

      let restored = value;
      if (filter === 1) restored = value + left;
      else if (filter === 2) restored = value + up;
      else if (filter === 3) restored = value + ((left + up) >> 1);
      else if (filter === 4) {
        const p = left + up - upLeft;
        const dLeft = Math.abs(p - left);
        const dUp = Math.abs(p - up);
        const dUpLeft = Math.abs(p - upLeft);
        restored = value + (dLeft <= dUp && dLeft <= dUpLeft ? left : dUp <= dUpLeft ? up : upLeft);
      }

      pixels[to + x] = restored & 0xff;
    }
  }

  return { width, height, channels, pixels, build };
}

export function pngChunk(type: string, body: Uint8Array) {
  const chunk = new Uint8Array(12 + body.length);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, body.length);
  for (let index = 0; index < 4; index++) chunk[4 + index] = type.charCodeAt(index);
  chunk.set(body, 8);
  view.setUint32(8 + body.length, Bun.hash.crc32(chunk.subarray(4, 8 + body.length)) >>> 0);

  return chunk;
}

export function encodePng({ width, height, channels, pixels }: PngImage): Uint8Array {
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header[8] = 8;
  header[9] = channels === 4 ? 6 : 2;

  const stride = width * channels;
  const raw = new Uint8Array(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw.set(pixels.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }

  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", new Uint8Array(0)),
  ];
  const png = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    png.set(part, offset);
    offset += part.length;
  }
  return png;
}

export function stackPngs(slices: PngImage[]): PngImage {
  const first = slices[0]!;
  const height = slices.reduce((sum, slice) => sum + slice.height, 0);
  const pixels = new Uint8Array(first.width * height * first.channels);
  let offset = 0;
  for (const slice of slices) {
    if (slice.width !== first.width || slice.channels !== first.channels) {
      throw new Error("fatias de retrato com largura ou canais diferentes");
    }
    pixels.set(slice.pixels, offset);
    offset += slice.pixels.length;
  }
  return { width: first.width, height, channels: first.channels, pixels };
}

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

/**
 * Diferenca de cinza que um quadrado pode ter sem contar como mudanca. O
 * motivo de ser 4, e nao 6, esta no cabecalho do `check-retratos.ts`.
 */
export const NOISE = 4;

export type SignatureDiff = { frame?: string; cells: number; total: number; worst: number };

/**
 * Quantos quadrados de duas assinaturas do mesmo retrato mudaram. Retrato de
 * secao guarda as dimensoes da moldura nas duas primeiras posicoes, e moldura
 * de tamanho diferente nao se compara quadrado a quadrado: volta em `frame`.
 */
export function compareSignatures(name: string, before: number[], after: number[]): SignatureDiff {
  if (isSection(name) && (before[0] !== after[0] || before[1] !== after[1])) {
    return {
      frame: `a moldura foi de ${before[0]}x${before[1]} para ${after[0]}x${after[1]} celulas`,
      cells: 0,
      total: 0,
      worst: 0,
    };
  }

  const from = isSection(name) ? 2 : 0;
  let cells = 0;
  let worst = 0;
  for (let index = from; index < after.length; index++) {
    const diff = Math.abs(after[index]! - (before[index] ?? 0));
    if (diff > NOISE) cells++;
    worst = Math.max(worst, diff);
  }

  return { cells, total: after.length - from, worst };
}

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
