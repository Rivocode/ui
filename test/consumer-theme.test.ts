import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ARRIVED, OPTIONAL, checkThemes, effectOf, requiredRoles } from "../src/lib/theme-check";
import { SHAPE_TOKENS, THEME_ROLES } from "../src/tokens/theme-roles";

const ALL: readonly string[] = THEME_ROLES;
const REQUIRED = requiredRoles(ALL);

const complete = (selector: string, without: string[] = []) =>
  `${selector} {\n` +
  REQUIRED.filter((role) => !without.includes(role))
    .map((role) => `  ${role}: red;\n`)
    .join("") +
  "}\n";

const one = (css: string) => checkThemes([{ file: "tema.css", css }], ALL);

describe("the role catalog", () => {
  test("comes from the theme CSS, and not from a hand-written list", () => {
    expect(ALL).toContain("--rc-font-sans");
    expect(ALL).toContain("--rc-bg");
    expect(new Set(ALL).size).toBe(ALL.length);
  });

  test("the three finishing roles do not count as required", () => {
    for (const role of Object.keys(OPTIONAL)) {
      expect(ALL).toContain(role);
      expect(REQUIRED).not.toContain(role);
    }
  });

  test("a shape token is not a theme role: it has a :root value underneath", () => {
    for (const token of SHAPE_TOKENS) expect(REQUIRED).not.toContain(token);
  });

  test("every required role says what happens on screen without it", () => {
    for (const role of REQUIRED) {
      const effect = effectOf(role)?.effect ?? "";
      expect(effect.length).toBeGreaterThan(40);
      expect(effect).not.toContain(role);
    }
  });
});

describe("what the command reports", () => {
  test("a complete theme passes without a single complaint line", () => {
    const [theme] = one(complete('[data-rc-theme="acme"]'));

    expect(theme?.selector).toBe('[data-rc-theme="acme"]');
    expect(theme?.missing).toEqual([]);
    expect(theme?.declared).toBe(REQUIRED.length);
  });

  test("a theme without `--rc-font-sans` is reported, and the report talks about the screen", () => {
    const [theme] = one(complete('[data-rc-theme="neon"]', ["--rc-font-sans"]));
    const [hole] = theme!.missing;

    expect(theme?.missing).toHaveLength(1);
    expect(hole?.role).toBe("--rc-font-sans");
    expect(hole?.silent).toBe(true);
    expect(hole?.effect).toContain("browser font");
  });

  test("a role added in a new version comes with that version", () => {
    const [theme] = one(complete('[data-rc-theme="neon"]', Object.keys(ARRIVED)));

    for (const hole of theme!.missing) {
      expect(hole.version).toBe(ARRIVED[hole.role]!.version);
      expect(hole.note?.length ?? 0).toBeGreaterThan(20);
    }
  });

  test("a missing color is also demanded, and kept apart from the silent break", () => {
    const [theme] = one(complete('[data-rc-theme="acme"]', ["--rc-accent", "--rc-accent-hover"]));

    expect(theme!.missing.find((hole) => hole.role === "--rc-accent")?.silent).toBe(false);
    expect(theme!.missing.find((hole) => hole.role === "--rc-accent-hover")?.silent).toBe(true);
  });

  test("a role typed with a wrong finger becomes a suggestion, and not noise", () => {
    const css = complete('[data-rc-theme="acme"]', ["--rc-font-sans"]).replace(
      "}\n",
      '  --rc-font-san: "Inter";\n}\n',
    );
    const [theme] = one(css);

    expect(theme!.missing.find((hole) => hole.role === "--rc-font-sans")?.meant).toBe(
      "--rc-font-san",
    );
  });

  test("the client palette does not become an unknown role", () => {
    const css = complete('[data-rc-theme="acme"]').replace(
      "}\n",
      "  --rc-p-azul-500: oklch(62% 0.19 250);\n}\n",
    );

    expect(one(css)[0]?.unknown).toEqual([]);
  });
});

describe("how it reads the CSS", () => {
  test("the same selector in two files counts as a single theme", () => {
    const reports = checkThemes(
      [
        { file: "cores.css", css: complete('[data-rc-theme="acme"]', ["--rc-font-sans"]) },
        { file: "fontes.css", css: '[data-rc-theme="acme"] { --rc-font-sans: "Inter"; }' },
      ],
      ALL,
    );

    expect(reports).toHaveLength(1);
    expect(reports[0]?.missing).toEqual([]);
    expect(reports[0]?.files).toEqual(["cores.css", "fontes.css"]);
  });

  test("two themes in the same file are two reports", () => {
    const reports = one(
      complete('[data-rc-theme="neon"]', ["--rc-font-sans"]) + complete('[data-rc-theme="mint"]'),
    );

    expect(reports.map((theme) => theme.missing.length)).toEqual([1, 0]);
  });

  test("a block that only redefines shape is not a theme", () => {
    expect(one(":root { --rc-radius-md: 0px; --rc-duration-base: 140ms; }")).toEqual([]);
  });

  test("a role inside `@media` counts for the inner selector", () => {
    const css = `@media (prefers-color-scheme: dark) {\n${complete(":root")}}\n`;

    expect(one(css)[0]?.selector).toBe(":root");
    expect(one(css)[0]?.missing).toEqual([]);
  });

  test("a comment neither hides nor invents a role", () => {
    const css = complete('[data-rc-theme="acme"]', ["--rc-bg"]).replace(
      "}\n",
      "  /* --rc-bg: red; */\n}\n",
    );

    expect(one(css)[0]?.missing.map((hole) => hole.role)).toEqual(["--rc-bg"]);
  });
});

describe("the real command, through the terminal", () => {
  const bench = mkdtempSync(join(tmpdir(), "rivocode-check-theme-"));
  const read = (path: string) => Bun.file(path).text();

  const run = async (file: string, contents: string) => {
    const path = join(bench, file);
    writeFileSync(path, contents);

    const shell = Bun.spawn(["bun", "run", "src/cli.ts", "check-theme", path], {
      stdout: "pipe",
      stderr: "pipe",
    });

    return {
      code: await shell.exited,
      output: (await new Response(shell.stdout).text()) + (await new Response(shell.stderr).text()),
    };
  };

  /**
   * The whole house theme, palette and layer 3 together.
   *
   * The `complete()` above writes `red` in each role, and serves the
   * completeness question - but the command started MEASURING contrast after
   * it, and `red` is not a color the math can read. A fake theme no longer
   * proves the command exits with zero: only a real theme does.
   */
  const real = async (extra = "") =>
    (await read("src/tokens/palette.css")) +
    "\n" +
    (await read("src/tokens/themes/rivocode-light.css")) +
    extra;

  test("a complete and readable theme exits with code zero", async () => {
    const { code, output } = await run("completo.css", await real());

    expect(output).toContain("Complete theme");
    expect(output).toContain("Contrast, now that");
    expect(output).toContain("Every pair above the");
    expect(code).toBe(0);
  });

  test("a theme without the font family exits with code one, and says what happens", async () => {
    const { code, output } = await run(
      "sem-fonte.css",
      complete('[data-rc-theme="neon"]', ["--rc-font-sans"]),
    );

    expect(code).toBe(1);
    expect(output).toContain("--rc-font-sans");
    expect(output).toContain("browser font");
    expect(output).toContain("SILENT BREAKAGE");
  });

  test("a missing role comes before contrast, and contrast is not even measured", async () => {
    const { code, output } = await run(
      "sem-anel.css",
      (await real()).replace(/--rc-ring:[^;]+;/, ""),
    );

    expect(code).toBe(1);
    expect(output).toContain("--rc-ring");
    // Measuring what does not exist says nothing: the contrast section is not printed.
    expect(output).not.toContain("Contrast, now that");
  });

  test("a complete theme with a pair below the minimum exits with code one", async () => {
    const { code, output } = await run(
      "cinza-claro.css",
      (await real()).replace(
        "--rc-fg-muted: var(--rc-p-gray-700);",
        "--rc-fg-muted: var(--rc-p-gray-300);",
      ),
    );

    expect(code).toBe(1);
    expect(output).toContain("Complete theme");
    expect(output).toContain("FAIL  --rc-fg-muted on --rc-bg ");
    expect(output).toContain("below the minimum");
  });

  test("a role the math cannot read does not pass silently", async () => {
    const { code, output } = await run("oklch.css", complete('[data-rc-theme="oklch"]'));

    expect(code).toBe(1);
    expect(output).toContain("did not resolve to an opaque color the math can read");
    expect(output).toContain("what is not measured is not promised");
  });

  test("a file with no theme at all fails instead of passing silently", async () => {
    const { code, output } = await run("vazio.css", ".botao { color: red; }");

    expect(code).toBe(1);
    expect(output).toContain("No theme block");
  });

  /**
   * The React Native map through the SAME command.
   *
   * The extension is what separates the two theme shapes: `.css` is the web
   * layer 3, and `.ts`, `.mjs` or `.js` is the map with `light` and `dark` that
   * the native `RivoProvider` receives. Two CLIs for the two shapes would
   * diverge at the first fix only one of them got.
   */
  test("the native map goes through the same command, by extension", async () => {
    const { tokens } = await import("../native/tokens");
    const map = {
      light: tokens.themes["rivocode-light"],
      dark: tokens.themes["rivocode-dark"],
    };

    const { code, output } = await run(
      "acme.theme.mjs",
      `export const acme = ${JSON.stringify(map)};\n`,
    );

    expect(output).toContain("acme / light");
    expect(output).toContain("acme / dark");
    expect(output).toContain("Every pair above the");
    expect(code).toBe(0);
  });

  test("a map with a pair below the minimum exits with code one", async () => {
    const { tokens } = await import("../native/tokens");
    const map = {
      light: { ...tokens.themes["rivocode-light"], "fg-muted": "#b9bfc6" },
      dark: tokens.themes["rivocode-dark"],
    };

    const { code, output } = await run(
      "ruim.theme.mjs",
      `export const ruim = ${JSON.stringify(map)};\n`,
    );

    expect(code).toBe(1);
    expect(output).toContain("FAIL  fg-muted on bg ");
  });

  test("an extension the command does not read fails saying which ones it reads", async () => {
    const { code, output } = await run("tema.json", "{}");

    expect(code).toBe(1);
    expect(output).toContain("Cannot read");
    expect(output).toContain(".css");
  });
});
