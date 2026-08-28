import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GENERATOR = `${import.meta.dir}/../native/scripts/build-theme.mjs`;

const generator = (await import(GENERATOR)) as {
  ROLES: string[];
  SEEDS: string[];
  DERIVED: string[];
  EXPLAIN: Record<string, string>;
  MAP_EMITTER: { on: boolean; why: string };
  normalizeHex: (value: unknown) => string | null;
  mix: (from: string, toward: string, keep: number) => string;
  withAlpha: (color: string, amount: number) => string;
  isDarkScheme: (bg: string) => boolean;
  schemesOf: (palette: Record<string, unknown>) => {
    names: string[];
    slots: Record<string, Record<string, string>> | undefined;
  };
  unreadable: (colors: Record<string, string>) => Array<{ role: string; value: string }>;
  derive: (
    seeds: Record<string, string>,
    slot: string,
  ) => { colors: Record<string, string>; written: string[]; guessed: string[]; missing: string[] };
  emitMap: (
    slots: Record<string, { colors: Record<string, string> }>,
    source: string,
    name: string,
  ) => string;
};

const SEEDS = {
  light: {
    bg: "#ffffff",
    surface: "#ffffff",
    fg: "#111111",
    accent: "#1d4ed8",
    success: "#0f6b52",
    warning: "#7a4a00",
    danger: "#b3261e",
    info: "#1d4ed8",
  },
  dark: {
    bg: "#101314",
    surface: "#191d1f",
    fg: "#f2f3f0",
    accent: "#8ab4f8",
    success: "#3ddc97",
    warning: "#f2b21c",
    danger: "#ff8a8a",
    info: "#8ab4f8",
  },
};

const bench = mkdtempSync(join(tmpdir(), "rivocode-gerador-"));

const run = async (name: string, palette: string, ...flags: string[]) => {
  const file = name.includes(".") ? name : `${name}.mjs`;
  const path = join(bench, file);
  const output = join(bench, `${file.replace(/\.[^.]+$/, "")}.theme.css`);
  writeFileSync(path, palette);

  const shell = Bun.spawn([Bun.which("node") ?? "bun", GENERATOR, path, output, ...flags], {
    stdout: "pipe",
    stderr: "pipe",
  });

  return {
    code: await shell.exited,
    output: (await new Response(shell.stdout).text()) + (await new Response(shell.stderr).text()),
    wrote: existsSync(output),
    css: existsSync(output) ? await Bun.file(output).text() : "",
  };
};

const source = (extra: Record<string, Record<string, string>> = {}) =>
  `export const tema = ${JSON.stringify({
    light: { ...SEEDS.light, ...extra.light },
    dark: { ...SEEDS.dark, ...extra.dark },
  })};\n`;

describe("a paleta que o consumidor escreve", () => {
  test("oito papeis por esquema bastam, e o resto e derivado", () => {
    expect(generator.SEEDS).toHaveLength(8);
    expect(generator.SEEDS.length + generator.DERIVED.length).toBe(generator.ROLES.length);
    for (const role of generator.DERIVED) expect(generator.EXPLAIN[role]).toBeTruthy();
  });

  test("papel escrito a mao ganha do derivado, e conta como escrito", () => {
    const derived = generator.derive(SEEDS.light, "light");
    const asked = generator.derive({ ...SEEDS.light, "accent-text": "#0b3fa8" }, "light");

    expect(derived.written).toHaveLength(8);
    expect(asked.written).toContain("accent-text");
    expect(asked.colors["accent-text"]).toBe("#0b3fa8");
    expect(derived.colors["accent-text"]).toBe(SEEDS.light.accent);
  });

  test("o alfa sai na sintaxe que o compilador nativo crava", () => {
    const { colors } = generator.derive(SEEDS.light, "light");

    expect(colors["accent-subtle"]).toBe("rgba(29,78,216,0.22)");
    expect(generator.withAlpha("#d4f34a", 0.14)).toBe("rgba(212,243,74,0.14)");
  });

  test("a escada de alfa e a de mistura seguem o esquema medido, e nao o nome da vaga", () => {
    const claro = generator.derive(SEEDS.light, "dark");
    const escuro = generator.derive(SEEDS.dark, "light");

    expect(generator.isDarkScheme(SEEDS.light.bg)).toBe(false);
    expect(claro.colors.overlay).toContain("0.42");
    expect(escuro.colors.overlay).toContain("0.62");
  });

  test("hexadecimal de tres digitos vira seis, e o resto nao passa por cor", () => {
    expect(generator.normalizeHex("#ABC")).toBe("#aabbcc");
    expect(generator.normalizeHex("#2563eb")).toBe("#2563eb");
    expect(generator.normalizeHex("rebeccapurple")).toBeNull();
    expect(generator.mix("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  test("a semente chega em qualquer espaco de cor, e sai em hexadecimal", () => {
    expect(generator.normalizeHex("oklch(0.44 0.18 264)")).toBe("#1b46b4");
    expect(generator.normalizeHex("hsl(210 60% 45%)")).toBe("#2e73b8");
    expect(generator.normalizeHex("color(display-p3 0.4 0.6 0.8)")).toBe("#559bd1");
    expect(generator.normalizeHex("color-mix(in oklab, red, blue)")).toBeNull();
    expect(generator.normalizeHex("#2563ebcc")).toBeNull();
  });
});

describe("o teto de dois temas", () => {
  test("dois esquemas viram as duas vagas do light-dark()", () => {
    const { slots } = generator.schemesOf(SEEDS);

    expect(slots?.light?.accent).toBe(SEEDS.light.accent);
    expect(slots?.dark?.accent).toBe(SEEDS.dark.accent);
  });

  test("um esquema so veste as duas vagas, porque tema de um esquema e escolha", () => {
    const { slots } = generator.schemesOf({ light: SEEDS.light });

    expect(slots?.light).toEqual(slots?.dark ?? {});
  });

  test("`light` e `dark` soltos sao os dois esquemas, e nao o primeiro deles duas vezes", async () => {
    const solto =
      `export const light = ${JSON.stringify(SEEDS.light)};\n` +
      `export const dark = ${JSON.stringify(SEEDS.dark)};\n`;
    const { code, output, css } = await run("solto", solto);

    expect(code).toBe(0);
    expect(css).toContain(`--color-accent: light-dark(${SEEDS.light.accent}, ${SEEDS.dark.accent});`);
    expect(css).toContain(`--color-bg: light-dark(${SEEDS.light.bg}, ${SEEDS.dark.bg});`);
    expect(output).toContain("claro e escuro");
    expect(output).not.toContain("fundo escuro");
  });

  test("a paleta em `.json` carrega, porque o proprio comando a oferece", async () => {
    const { code, output, css } = await run(
      "acme.json",
      JSON.stringify({ light: SEEDS.light, dark: SEEDS.dark }),
    );

    expect(code).toBe(0);
    expect(output).not.toContain("import attribute");
    expect(css).toContain(`--color-accent: light-dark(${SEEDS.light.accent}, ${SEEDS.dark.accent});`);
  });

  test("um esquema so sai anunciado, e nao descartado calado", async () => {
    const { code, output, css } = await run(
      "umso",
      `export const light = ${JSON.stringify(SEEDS.light)};\n`,
    );

    expect(code).toBe(0);
    expect(output).toContain("um esquema so");
    expect(output).toContain("modo claro e no escuro");
    expect(css).not.toContain("light-dark(");
  });

  test("tres esquemas soltos tambem nao cabem, e nao viram dois calados", async () => {
    const tres =
      `export const light = ${JSON.stringify(SEEDS.light)};\n` +
      `export const dark = ${JSON.stringify(SEEDS.dark)};\n` +
      `export const contraste = ${JSON.stringify(SEEDS.dark)};\n`;
    const { code, output, wrote } = await run("tres-soltos", tres);

    expect(code).toBe(1);
    expect(wrote).toBe(false);
    expect(output).toContain("DUAS vagas");
  });

  test("tres esquemas nao cabem, e o comando diz por que", async () => {
    const three = `export const tema = ${JSON.stringify({
      light: SEEDS.light,
      dark: SEEDS.dark,
      contraste: SEEDS.dark,
    })};\n`;
    const { code, output, wrote } = await run("tres", three);

    expect(code).toBe(1);
    expect(wrote).toBe(false);
    expect(output).toContain("light-dark()");
    expect(output).toContain("DUAS vagas");
    expect(output).toContain("terceiro BUNDLE");
  });
});

describe("o que ele recusa escrever", () => {
  test("paleta boa gera o @theme com todos os papeis", async () => {
    const { code, output, css } = await run("bom", source());

    expect(code).toBe(0);
    expect(output).toContain("claro: passa");
    expect(output).toContain("escuro: passa");
    expect(css).toContain("@theme {");
    for (const role of generator.ROLES) expect(css).toContain(`  --color-${role}: `);
  });

  test("par abaixo do minimo nao escreve nada, e diz o par e o numero", async () => {
    const { code, output, wrote } = await run("ruim", source({ light: { "accent-fg": "#8ab4f8" } }));

    expect(code).toBe(1);
    expect(wrote).toBe(false);
    expect(output).toContain("Guarda de contraste:");
    expect(output).toMatch(/accent-fg sobre accent {2}\d\.\d\d:1 \(min 4\.5\)/);
    expect(output).toContain("Nada foi escrito");
  });

  test("papel derivado que reprova vem com o valor que passaria", async () => {
    const { code, output } = await run("lima", source({ light: { accent: "#d4f34a" } }));

    expect(code).toBe(1);
    expect(output).toContain("light.accent-text foi DERIVADO");
    expect(output).toMatch(/`accent-text: "#[\da-f]{6}"` passaria/);
    expect(output).toContain("nao inventa matiz nova");
  });

  test("semente faltando e acusada pelo nome, com o que ela arrastaria", async () => {
    const short = { ...SEEDS.light } as Record<string, string>;
    delete short.info;
    const { code, output, wrote } = await run(
      "falta",
      `export const tema = ${JSON.stringify({ light: short, dark: SEEDS.dark })};\n`,
    );

    expect(code).toBe(1);
    expect(wrote).toBe(false);
    expect(output).toContain("light.info  - e semente");
    expect(output).toContain("light.info-subtle");
    expect(output).toContain("sairia de: alfa de `info`");
  });

  test("sem `bg` ou `fg` ele recusa antes de medir, e nao explode no meio da conta", async () => {
    const blind = { ...SEEDS.light } as Record<string, string>;
    delete blind.bg;
    const { code, output, wrote } = await run(
      "ancora",
      `export const tema = ${JSON.stringify({ light: blind, dark: SEEDS.dark })};\n`,
    );

    expect(code).toBe(1);
    expect(wrote).toBe(false);
    expect(output).toContain("ancora sem valor");
    expect(output).toContain("light.bg");
    expect(output).not.toContain("TypeError");
  });

  test("papel que a conta nao sabe ler recusa com o motivo, e nao com defeito", async () => {
    const { code, output, wrote } = await run(
      "mistura",
      source({ light: { accent: "color-mix(in oklab, #1d4ed8, white 20%)" } }),
    );

    expect(code).toBe(1);
    expect(wrote).toBe(false);
    expect(output).toContain("nao sabe ler");
    expect(output).toContain("color-mix()");
    expect(output).toContain("Tailwind 4");
    expect(output).not.toContain("outra frente");
  });

  test("semente escrita em oklch e medida, e o CSS sai em sRGB literal", async () => {
    const { code, output, css } = await run(
      "oklch",
      source({
        light: { accent: "oklch(0.44 0.18 264)", info: "oklch(0.44 0.18 264)" },
        dark: { accent: "oklch(0.72 0.14 264)", info: "oklch(0.72 0.14 264)" },
      }),
    );

    expect(code).toBe(0);
    expect(output).toContain("Guarda de contraste:");
    expect(css).toContain("--color-accent: light-dark(#1b46b4, #77a2fc);");
    expect(css).not.toContain("oklch(");
  });

  test("cor fora do gamut do sRGB e medida no valor cortado, e o comando avisa", async () => {
    const { code, output } = await run(
      "gamut",
      source({
        light: { danger: "oklch(0.52 0.22 20)" },
      }),
    );

    expect(code).toBe(0);
    expect(output).toContain("tom que o sRGB nao");
    expect(output).toContain("light.danger: oklch(0.52 0.22 20) -> #c9002e");
  });

  test("papel que nao existe na versao instalada vira sugestao de nome", async () => {
    const { code, output } = await run("errado", source({ light: { "acent-text": "#0b3fa8" } }));

    expect(code).toBe(1);
    expect(output).toContain("light.acent-text");
    expect(output).toContain("quis dizer `accent-text`");
  });

  test("papel novo numa versao nova acusa em vez de o tema quebrar calado", () => {
    const known = new Set([...generator.SEEDS, ...generator.DERIVED]);

    for (const role of generator.ROLES) expect(known.has(role)).toBe(true);
    for (const role of known) expect(generator.ROLES).toContain(role);
  });
});

describe("o emissor do mapa", () => {
  test("esta escrito e desligado, e a bandeira diz por que", () => {
    expect(generator.MAP_EMITTER.on).toBe(false);
    expect(generator.MAP_EMITTER.why).toContain("runtime");
    expect(generator.MAP_EMITTER.why).toContain("gen:native --tema");
  });

  test("`--mapa` recusa antes de qualquer trabalho, dizendo onde ligar de volta", async () => {
    const { code, output, wrote } = await run("mapa", source(), "--mapa");

    expect(code).toBe(1);
    expect(wrote).toBe(false);
    expect(output).toContain("--mapa esta desligado");
    expect(output).toContain("MAP_EMITTER.on");
  });

  test("o formato respeitado e o do `gen:native --tema`, e nao um inventado aqui", () => {
    const slots = {
      light: generator.derive(SEEDS.light, "light"),
      dark: generator.derive(SEEDS.dark, "dark"),
    };
    const written = generator.emitMap(slots, "acme.ts", "acme");

    expect(written).toContain(
      "type ThemeMap = { light: Record<string, string>; dark: Record<string, string> };",
    );
    expect(written).toContain("export const acmeTheme: ThemeMap = {");
    expect(written).toContain('"light": {');
    expect(written).toContain('"dark": {');
  });
});
