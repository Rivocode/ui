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

const bench = mkdtempSync(join(tmpdir(), "rivocode-generator-"));

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
  `export const theme = ${JSON.stringify({
    light: { ...SEEDS.light, ...extra.light },
    dark: { ...SEEDS.dark, ...extra.dark },
  })};\n`;

describe("the palette the consumer writes", () => {
  test("eight roles per scheme are enough, and the rest is derived", () => {
    expect(generator.SEEDS).toHaveLength(8);
    expect(generator.SEEDS.length + generator.DERIVED.length).toBe(generator.ROLES.length);
    for (const role of generator.DERIVED) expect(generator.EXPLAIN[role]).toBeTruthy();
  });

  test("a hand-written role beats the derived one, and counts as written", () => {
    const derived = generator.derive(SEEDS.light, "light");
    const asked = generator.derive({ ...SEEDS.light, "accent-text": "#0b3fa8" }, "light");

    expect(derived.written).toHaveLength(8);
    expect(asked.written).toContain("accent-text");
    expect(asked.colors["accent-text"]).toBe("#0b3fa8");
    expect(derived.colors["accent-text"]).toBe(SEEDS.light.accent);
  });

  test("alpha comes out in the syntax the native compiler pins down", () => {
    const { colors } = generator.derive(SEEDS.light, "light");

    expect(colors["accent-subtle"]).toBe("rgba(29,78,216,0.22)");
    expect(generator.withAlpha("#d4f34a", 0.14)).toBe("rgba(212,243,74,0.14)");
  });

  test("the alpha ladder and the mix ladder follow the measured scheme, and not the slot name", () => {
    const lightInDarkSlot = generator.derive(SEEDS.light, "dark");
    const darkInLightSlot = generator.derive(SEEDS.dark, "light");

    expect(generator.isDarkScheme(SEEDS.light.bg)).toBe(false);
    expect(lightInDarkSlot.colors.overlay).toContain("0.42");
    expect(darkInLightSlot.colors.overlay).toContain("0.62");
  });

  test("three-digit hex becomes six, and the rest does not pass as a color", () => {
    expect(generator.normalizeHex("#ABC")).toBe("#aabbcc");
    expect(generator.normalizeHex("#2563eb")).toBe("#2563eb");
    expect(generator.normalizeHex("rebeccapurple")).toBeNull();
    expect(generator.mix("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  test("the seed arrives in any color space, and comes out in hex", () => {
    expect(generator.normalizeHex("oklch(0.44 0.18 264)")).toBe("#1b46b4");
    expect(generator.normalizeHex("hsl(210 60% 45%)")).toBe("#2e73b8");
    expect(generator.normalizeHex("color(display-p3 0.4 0.6 0.8)")).toBe("#559bd1");
    expect(generator.normalizeHex("color-mix(in oklab, red, blue)")).toBeNull();
    expect(generator.normalizeHex("#2563ebcc")).toBeNull();
  });
});

describe("the two-theme ceiling", () => {
  test("two schemes become the two slots of light-dark()", () => {
    const { slots } = generator.schemesOf(SEEDS);

    expect(slots?.light?.accent).toBe(SEEDS.light.accent);
    expect(slots?.dark?.accent).toBe(SEEDS.dark.accent);
  });

  test("a single scheme fills both slots, because a one-scheme theme is a choice", () => {
    const { slots } = generator.schemesOf({ light: SEEDS.light });

    expect(slots?.light).toEqual(slots?.dark ?? {});
  });

  test("loose `light` and `dark` are the two schemes, and not the first one twice", async () => {
    const loose =
      `export const light = ${JSON.stringify(SEEDS.light)};\n` +
      `export const dark = ${JSON.stringify(SEEDS.dark)};\n`;
    const { code, output, css } = await run("loose", loose);

    expect(code).toBe(0);
    expect(css).toContain(`--color-accent: light-dark(${SEEDS.light.accent}, ${SEEDS.dark.accent});`);
    expect(css).toContain(`--color-bg: light-dark(${SEEDS.light.bg}, ${SEEDS.dark.bg});`);
    expect(output).toContain("light and dark");
    expect(output).not.toContain("has a dark background");
  });

  test("a `.json` palette loads, because the command itself offers it", async () => {
    const { code, output, css } = await run(
      "acme.json",
      JSON.stringify({ light: SEEDS.light, dark: SEEDS.dark }),
    );

    expect(code).toBe(0);
    expect(output).not.toContain("import attribute");
    expect(css).toContain(`--color-accent: light-dark(${SEEDS.light.accent}, ${SEEDS.dark.accent});`);
  });

  test("a single scheme is announced, and not silently discarded", async () => {
    const { code, output, css } = await run(
      "single",
      `export const light = ${JSON.stringify(SEEDS.light)};\n`,
    );

    expect(code).toBe(0);
    expect(output).toContain("a single scheme");
    expect(output).toContain("in light and in dark mode");
    expect(css).not.toContain("light-dark(");
  });

  test("three loose schemes do not fit either, and do not silently become two", async () => {
    const threeLoose =
      `export const light = ${JSON.stringify(SEEDS.light)};\n` +
      `export const dark = ${JSON.stringify(SEEDS.dark)};\n` +
      `export const contrast = ${JSON.stringify(SEEDS.dark)};\n`;
    const { code, output, wrote } = await run("three-loose", threeLoose);

    expect(code).toBe(1);
    expect(wrote).toBe(false);
    expect(output).toContain("TWO slots");
  });

  test("three schemes do not fit, and the command says why", async () => {
    const three = `export const theme = ${JSON.stringify({
      light: SEEDS.light,
      dark: SEEDS.dark,
      contrast: SEEDS.dark,
    })};\n`;
    const { code, output, wrote } = await run("three", three);

    expect(code).toBe(1);
    expect(wrote).toBe(false);
    expect(output).toContain("light-dark()");
    expect(output).toContain("TWO slots");
    expect(output).toContain("third BUNDLE");
  });
});

describe("what it refuses to write", () => {
  test("a good palette generates the @theme with every role", async () => {
    const { code, output, css } = await run("good", source());

    expect(code).toBe(0);
    expect(output).toContain("light: passes");
    expect(output).toContain("dark: passes");
    expect(css).toContain("@theme {");
    for (const role of generator.ROLES) expect(css).toContain(`  --color-${role}: `);
  });

  test("a pair below the minimum writes nothing, and names the pair and the number", async () => {
    const { code, output, wrote } = await run("bad", source({ light: { "accent-fg": "#8ab4f8" } }));

    expect(code).toBe(1);
    expect(wrote).toBe(false);
    expect(output).toContain("Contrast guard:");
    expect(output).toMatch(/accent-fg on accent {2}\d\.\d\d:1 \(min 4\.5\)/);
    expect(output).toContain("Nothing was written");
  });

  test("a derived role that fails comes with the value that would pass", async () => {
    const { code, output } = await run("lime", source({ light: { accent: "#d4f34a" } }));

    expect(code).toBe(1);
    expect(output).toContain("light.accent-text was DERIVED");
    expect(output).toMatch(/`accent-text: "#[\da-f]{6}"` would pass/);
    expect(output).toContain("does not invent a new hue");
  });

  test("a missing seed is flagged by name, with what it would drag along", async () => {
    const short = { ...SEEDS.light } as Record<string, string>;
    delete short.info;
    const { code, output, wrote } = await run(
      "missing",
      `export const theme = ${JSON.stringify({ light: short, dark: SEEDS.dark })};\n`,
    );

    expect(code).toBe(1);
    expect(wrote).toBe(false);
    expect(output).toContain("light.info  - is a seed");
    expect(output).toContain("light.info-subtle");
    expect(output).toContain("would come from: alpha of `info`");
  });

  test("without `bg` or `fg` it refuses before measuring, and does not blow up mid-calculation", async () => {
    const blind = { ...SEEDS.light } as Record<string, string>;
    delete blind.bg;
    const { code, output, wrote } = await run(
      "anchor",
      `export const theme = ${JSON.stringify({ light: blind, dark: SEEDS.dark })};\n`,
    );

    expect(code).toBe(1);
    expect(wrote).toBe(false);
    expect(output).toContain("anchor role(s) with no value");
    expect(output).toContain("light.bg");
    expect(output).not.toContain("TypeError");
  });

  test("a role the math cannot read is refused with the reason, and not with a crash", async () => {
    const { code, output, wrote } = await run(
      "mix",
      source({ light: { accent: "color-mix(in oklab, #1d4ed8, white 20%)" } }),
    );

    expect(code).toBe(1);
    expect(wrote).toBe(false);
    expect(output).toContain("cannot read");
    expect(output).toContain("color-mix()");
    expect(output).toContain("Tailwind 4");
    expect(output).toContain("converts everything to sRGB before measuring");
  });

  test("a seed written in oklch is measured, and the CSS comes out as literal sRGB", async () => {
    const { code, output, css } = await run(
      "oklch",
      source({
        light: { accent: "oklch(0.44 0.18 264)", info: "oklch(0.44 0.18 264)" },
        dark: { accent: "oklch(0.72 0.14 264)", info: "oklch(0.72 0.14 264)" },
      }),
    );

    expect(code).toBe(0);
    expect(output).toContain("Contrast guard:");
    expect(css).toContain("--color-accent: light-dark(#1b46b4, #77a2fc);");
    expect(css).not.toContain("oklch(");
  });

  test("a color outside the sRGB gamut is measured at the clipped value, and the command warns", async () => {
    const { code, output } = await run(
      "gamut",
      source({
        light: { danger: "oklch(0.52 0.22 20)" },
      }),
    );

    expect(code).toBe(0);
    expect(output).toContain("describe a tone sRGB cannot");
    expect(output).toContain("light.danger: oklch(0.52 0.22 20) -> #c9002e");
  });

  test("a role that does not exist in the installed version becomes a name suggestion", async () => {
    const { code, output } = await run("wrong", source({ light: { "acent-text": "#0b3fa8" } }));

    expect(code).toBe(1);
    expect(output).toContain("light.acent-text");
    expect(output).toContain("did you mean `accent-text`");
  });

  test("a new role in a new version is flagged instead of the theme silently breaking", () => {
    const known = new Set([...generator.SEEDS, ...generator.DERIVED]);

    for (const role of generator.ROLES) expect(known.has(role)).toBe(true);
    for (const role of known) expect(generator.ROLES).toContain(role);
  });
});

describe("the map emitter", () => {
  test("it is written and turned off, and the flag says why", () => {
    expect(generator.MAP_EMITTER.on).toBe(false);
    expect(generator.MAP_EMITTER.why).toContain("runtime");
    expect(generator.MAP_EMITTER.why).toContain("gen:native --theme");
  });

  test("`--map`, and its old name `--mapa`, refuse before any work, saying where to turn it back on", async () => {
    for (const flag of ["--map", "--mapa"]) {
      const { code, output, wrote } = await run("map", source(), flag);

      expect(code).toBe(1);
      expect(wrote).toBe(false);
      expect(output).toContain("--map is switched off");
      expect(output).toContain("MAP_EMITTER.on");
    }
  });

  test("`--roles` and its old name `--papeis` list the seeds and the derived roles", async () => {
    for (const flag of ["--roles", "--papeis"]) {
      const shell = Bun.spawn([Bun.which("node") ?? "bun", GENERATOR, flag], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const output = await new Response(shell.stdout).text();

      expect(await shell.exited).toBe(0);
      expect(output).toContain(`The ${generator.ROLES.length} roles of @rivocode/ui-native`);
      expect(output).toContain(`The command derives ${generator.DERIVED.length}`);
    }
  });

  test("the format honored is the one from `gen:native --tema`, and not one made up here", () => {
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
