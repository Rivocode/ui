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

describe("o catalogo de papeis", () => {
  test("sai do CSS do tema, e nao de uma lista escrita a mao", () => {
    expect(ALL).toContain("--rc-font-sans");
    expect(ALL).toContain("--rc-bg");
    expect(new Set(ALL).size).toBe(ALL.length);
  });

  test("os tres papeis de acabamento nao entram na conta do obrigatorio", () => {
    for (const role of Object.keys(OPTIONAL)) {
      expect(ALL).toContain(role);
      expect(REQUIRED).not.toContain(role);
    }
  });

  test("token de forma nao e papel de tema: ele tem valor de :root por baixo", () => {
    for (const token of SHAPE_TOKENS) expect(REQUIRED).not.toContain(token);
  });

  test("todo papel obrigatorio diz o que acontece na tela sem ele", () => {
    for (const role of REQUIRED) {
      const effect = effectOf(role)?.effect ?? "";
      expect(effect.length).toBeGreaterThan(40);
      expect(effect).not.toContain(role);
    }
  });
});

describe("o que o comando acusa", () => {
  test("tema completo passa sem uma linha de acusacao", () => {
    const [theme] = one(complete('[data-rc-theme="acme"]'));

    expect(theme?.selector).toBe('[data-rc-theme="acme"]');
    expect(theme?.missing).toEqual([]);
    expect(theme?.declared).toBe(REQUIRED.length);
  });

  test("tema sem `--rc-font-sans` acusa, e a acusacao fala da tela", () => {
    const [theme] = one(complete('[data-rc-theme="neon"]', ["--rc-font-sans"]));
    const [hole] = theme!.missing;

    expect(theme?.missing).toHaveLength(1);
    expect(hole?.role).toBe("--rc-font-sans");
    expect(hole?.silent).toBe(true);
    expect(hole?.effect).toContain("fonte do navegador");
  });

  test("papel que entrou numa versao nova chega com a versao junto", () => {
    const [theme] = one(complete('[data-rc-theme="neon"]', Object.keys(ARRIVED)));

    for (const hole of theme!.missing) {
      expect(hole.version).toBe(ARRIVED[hole.role]!.version);
      expect(hole.note?.length ?? 0).toBeGreaterThan(20);
    }
  });

  test("a falta de cor tambem e cobrada, e separada da quebra calada", () => {
    const [theme] = one(complete('[data-rc-theme="acme"]', ["--rc-accent", "--rc-accent-hover"]));

    expect(theme!.missing.find((hole) => hole.role === "--rc-accent")?.silent).toBe(false);
    expect(theme!.missing.find((hole) => hole.role === "--rc-accent-hover")?.silent).toBe(true);
  });

  test("papel escrito com um dedo errado vira sugestao, e nao ruido", () => {
    const css = complete('[data-rc-theme="acme"]', ["--rc-font-sans"]).replace(
      "}\n",
      '  --rc-font-san: "Inter";\n}\n',
    );
    const [theme] = one(css);

    expect(theme!.missing.find((hole) => hole.role === "--rc-font-sans")?.meant).toBe(
      "--rc-font-san",
    );
  });

  test("a paleta do cliente nao vira papel desconhecido", () => {
    const css = complete('[data-rc-theme="acme"]').replace(
      "}\n",
      "  --rc-p-azul-500: oklch(62% 0.19 250);\n}\n",
    );

    expect(one(css)[0]?.unknown).toEqual([]);
  });
});

describe("como ele le o CSS", () => {
  test("o mesmo seletor em dois arquivos conta como um tema so", () => {
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

  test("dois temas no mesmo arquivo sao dois relatorios", () => {
    const reports = one(
      complete('[data-rc-theme="neon"]', ["--rc-font-sans"]) + complete('[data-rc-theme="mint"]'),
    );

    expect(reports.map((theme) => theme.missing.length)).toEqual([1, 0]);
  });

  test("bloco que so redefine forma nao e tema", () => {
    expect(one(":root { --rc-radius-md: 0px; --rc-duration-base: 140ms; }")).toEqual([]);
  });

  test("papel dentro de `@media` conta para o seletor de dentro", () => {
    const css = `@media (prefers-color-scheme: dark) {\n${complete(":root")}}\n`;

    expect(one(css)[0]?.selector).toBe(":root");
    expect(one(css)[0]?.missing).toEqual([]);
  });

  test("comentario nao esconde nem inventa papel", () => {
    const css = complete('[data-rc-theme="acme"]', ["--rc-bg"]).replace(
      "}\n",
      "  /* --rc-bg: red; */\n}\n",
    );

    expect(one(css)[0]?.missing.map((hole) => hole.role)).toEqual(["--rc-bg"]);
  });
});

describe("o comando de verdade, pelo terminal", () => {
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
   * O tema da casa inteiro, paleta e camada 3 juntas.
   *
   * O `complete()` acima escreve `red` em cada papel, e serve para a pergunta
   * de completude - mas o comando passou a MEDIR contraste depois dela, e
   * `red` nao e cor que a conta saiba ler. Tema de mentira nao prova mais que
   * o comando sai com zero: so um tema de verdade prova.
   */
  const real = async (extra = "") =>
    (await read("src/tokens/palette.css")) +
    "\n" +
    (await read("src/tokens/themes/rivocode-light.css")) +
    extra;

  test("tema completo e legivel sai com codigo zero", async () => {
    const { code, output } = await run("completo.css", await real());

    expect(output).toContain("Tema completo");
    expect(output).toContain("Todo par acima do");
    expect(code).toBe(0);
  });

  test("tema sem a familia de fonte sai com codigo um, e diz o que acontece", async () => {
    const { code, output } = await run(
      "sem-fonte.css",
      complete('[data-rc-theme="neon"]', ["--rc-font-sans"]),
    );

    expect(code).toBe(1);
    expect(output).toContain("--rc-font-sans");
    expect(output).toContain("fonte do navegador");
    expect(output).toContain("QUEBRA CALADA");
  });

  test("papel faltando vem antes do contraste, e o contraste nem e medido", async () => {
    const { code, output } = await run(
      "sem-anel.css",
      (await real()).replace(/--rc-ring:[^;]+;/, ""),
    );

    expect(code).toBe(1);
    expect(output).toContain("--rc-ring");
    // Medir o que nao existe nao diz nada: a secao de contraste nao sai.
    expect(output).not.toContain("Contraste, agora que");
  });

  test("tema completo com um par abaixo do minimo sai com codigo um", async () => {
    const { code, output } = await run(
      "cinza-claro.css",
      (await real()).replace(
        "--rc-fg-muted: var(--rc-p-gray-700);",
        "--rc-fg-muted: var(--rc-p-gray-300);",
      ),
    );

    expect(code).toBe(1);
    expect(output).toContain("Tema completo");
    expect(output).toContain("FALHA --rc-fg-muted sobre --rc-bg");
    expect(output).toContain("abaixo do mínimo");
  });

  test("papel que a conta nao sabe ler nao passa calado", async () => {
    const { code, output } = await run("oklch.css", complete('[data-rc-theme="oklch"]'));

    expect(code).toBe(1);
    expect(output).toContain("não resolveu para uma cor opaca que a conta lê");
    expect(output).toContain("o que não se mede não se promete");
  });

  test("arquivo sem tema nenhum falha em vez de passar calado", async () => {
    const { code, output } = await run("vazio.css", ".botao { color: red; }");

    expect(code).toBe(1);
    expect(output).toContain("Nenhum bloco de tema");
  });

  /**
   * O mapa do React Native pelo MESMO comando.
   *
   * A extensao e o que separa as duas formas de tema: `.css` e a camada 3 do
   * web, e `.ts`, `.mjs` ou `.js` e o mapa com `light` e `dark` que o
   * `RivoProvider` nativo recebe. Dois CLIs para as duas formas divergiriam na
   * primeira correcao que so um deles recebesse.
   */
  test("o mapa do nativo entra pelo mesmo comando, pela extensao", async () => {
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
    expect(output).toContain("Todo par acima do");
    expect(code).toBe(0);
  });

  test("mapa com um par abaixo do minimo sai com codigo um", async () => {
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
    expect(output).toContain("FALHA fg-muted sobre bg");
  });

  test("extensao que o comando nao le falha dizendo quais ele le", async () => {
    const { code, output } = await run("tema.json", "{}");

    expect(code).toBe(1);
    expect(output).toContain("Não sei ler");
    expect(output).toContain(".css");
  });
});
