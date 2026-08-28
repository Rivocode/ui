import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { BABEL_NAMES, BABEL_V4, RECIPE, globalCss, nativewindEnv, plan } from "../scripts/init.mjs";

function app(extra: Record<string, string> = {}) {
  const root = mkdtempSync(join(tmpdir(), "receita-"));
  writeFileSync(
    join(root, "package.json"),
    `${JSON.stringify({ name: "app", main: "index.ts" }, null, 2)}\n`,
  );
  writeFileSync(
    join(root, "app.json"),
    `${JSON.stringify({ expo: { name: "app", userInterfaceStyle: "light" } }, null, 2)}\n`,
  );
  for (const [name, body] of Object.entries(extra)) writeFileSync(join(root, name), body);
  return root;
}

function apply(root: string, options?: { force?: boolean }) {
  const steps = plan(root, options);
  for (const step of steps) {
    if (step.body !== undefined) writeFileSync(join(root, step.name), step.body);
  }
  return steps;
}

function byName(steps: ReturnType<typeof plan>, name: string) {
  return steps.find((step) => step.name === name)!;
}

describe("a receita de instalacao", () => {
  test("cobre sete arquivos, e nenhum deles duas vezes", () => {
    const names = RECIPE.map((item) => item.name);

    expect(names.length).toBe(7);
    expect(new Set(names).size).toBe(7);
    expect(names).toEqual([
      "babel.config.js",
      "postcss.config.mjs",
      "metro.config.js",
      "global.css",
      "nativewind-env.d.ts",
      "app.json",
      "package.json",
    ]);
  });

  test("num app do Expo recem-criado escreve tudo e nao deixa arquivo vazio", () => {
    const root = app();
    try {
      const steps = apply(root);
      expect(steps.length).toBe(7);

      expect(existsSync(join(root, "babel.config.js"))).toBe(false);

      for (const name of [
        "postcss.config.mjs",
        "metro.config.js",
        "global.css",
        "nativewind-env.d.ts",
      ]) {
        expect(readFileSync(join(root, name), "utf8").length).toBeGreaterThan(20);
      }

      expect(JSON.parse(readFileSync(join(root, "app.json"), "utf8")).expo.userInterfaceStyle).toBe(
        "automatic",
      );
      expect(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).browserslist).toEqual([
        "chrome 130",
        "safari 18",
        "firefox 130",
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("rodar duas vezes nao muda nada na segunda", () => {
    const root = app();
    try {
      apply(root);
      const again = plan(root);

      expect(again.every((step) => step.action === "mantem")).toBe(true);
      expect(again.every((step) => step.body === undefined)).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("arquivo que ja existe com outro conteudo nao e reescrito sem --force", () => {
    const meu = "export default { plugins: { autoprefixer: {} } };\n";
    const root = app({ "postcss.config.mjs": meu });
    try {
      const steps = apply(root);
      const step = byName(steps, "postcss.config.mjs");

      expect(step.action).toBe("conflito");
      expect(step.body).toBeUndefined();
      expect(readFileSync(join(root, "postcss.config.mjs"), "utf8")).toBe(meu);

      const forced = apply(root, { force: true });
      expect(byName(forced, "postcss.config.mjs").action).toBe("sobrescreve");
      expect(readFileSync(join(root, "postcss.config.mjs"), "utf8")).not.toBe(meu);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("chave de JSON trocada sai no relatorio com o valor antigo", () => {
    const root = app();
    try {
      const step = byName(plan(root), "app.json");

      expect(step.action).toBe("sobrescreve");
      expect(step.note).toContain('"light"');
      expect(step.note).toContain('"automatic"');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("o JSON do app conserva o resto e a indentacao", () => {
    const root = app();
    writeFileSync(
      join(root, "app.json"),
      `${JSON.stringify({ expo: { name: "app", slug: "app", ios: { supportsTablet: true } } }, null, 4)}\n`,
    );
    try {
      apply(root);
      const text = readFileSync(join(root, "app.json"), "utf8");
      const json = JSON.parse(text);

      expect(json.expo.slug).toBe("app");
      expect(json.expo.ios.supportsTablet).toBe(true);
      expect(json.expo.userInterfaceStyle).toBe("automatic");
      expect(text).toContain('\n    "expo"');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("app.json ausente e conflito, e nao um app.json inventado", () => {
    const root = mkdtempSync(join(tmpdir(), "receita-vazia-"));
    try {
      const step = byName(plan(root), "app.json");

      expect(step.action).toBe("conflito");
      expect(step.note).toContain("raiz de um app do Expo");
      expect(existsSync(join(root, "app.json"))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("a receita v4 do NativeWind e acusada pelo nome, e o arquivo fica de pe", () => {
    expect(BABEL_V4.length).toBeGreaterThan(1);

    for (const { mark } of BABEL_V4) {
      const body =
        mark.source.includes("jsxImportSource")
          ? 'module.exports = { presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }]] };\n'
          : 'module.exports = { presets: ["babel-preset-expo", "nativewind/babel"] };\n';
      const root = app({ "babel.config.js": body });
      try {
        const step = plan(root).find((one) => one.babel)!;

        expect(step.action).toBe("conflito");
        expect(step.babel.length).toBeGreaterThan(0);
        expect(readFileSync(join(root, "babel.config.js"), "utf8")).toBe(body);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    }
  });

  test("babel.config.js sem marca da v4 fica, e sem arquivo nenhum e o certo", () => {
    const limpo = app({ "babel.config.js": 'module.exports = { presets: ["minha-coisa"] };\n' });
    try {
      const step = plan(limpo).find((one) => one.name.includes("babel"))!;
      expect(step.action).toBe("mantem");
    } finally {
      rmSync(limpo, { recursive: true, force: true });
    }

    const vazio = app();
    try {
      const step = byName(plan(vazio), "babel.config.js");
      expect(step.action).toBe("mantem");
      expect(step.note).toContain("nao existe");
    } finally {
      rmSync(vazio, { recursive: true, force: true });
    }
  });

  test("procura arquivo de Babel em todos os nomes que o Expo procura", () => {
    expect(BABEL_NAMES.length).toBeGreaterThan(10);
    expect(BABEL_NAMES).toContain("babel.config.js");
    expect(BABEL_NAMES).toContain(".babelrc");
    expect(BABEL_NAMES).toContain("babel.config.ts");

    const root = app({ ".babelrc": '{ "presets": [["babel-preset-expo", { "jsxImportSource": "nativewind" }]] }' });
    try {
      expect(plan(root).find((one) => one.babel)).toBeDefined();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("o global.css aponta para o pacote instalado, e nao para o monorepo", () => {
    const css = globalCss();
    const linhas = css.split("\n").filter((line) => line.startsWith("@"));

    expect(linhas.length).toBeGreaterThan(8);
    expect(css).toContain('@import "@rivocode/ui-native/theme.css";');
    expect(css).toContain('@source "./node_modules/@rivocode/ui-native/src";');
    expect(css).not.toContain("../../native");

    for (const word of ["shadow", "invert", "filter", "transform"]) {
      expect(linhas).toContain(`@source not inline("${word}");`);
    }
  });

  test("o nativewind-env.d.ts referencia os tipos do NativeWind e o modulo de CSS", () => {
    const dts = nativewindEnv();

    expect(dts).toContain('/// <reference types="nativewind/types" />');
    expect(dts).toContain('declare module "*.css";');
    expect(dts).not.toContain("nativewind/jsx-runtime");
  });

  test("o nativewind-env.d.ts nasce no app e conflita se ja disser outra coisa", () => {
    const root = app();
    try {
      apply(root);
      expect(readFileSync(join(root, "nativewind-env.d.ts"), "utf8")).toBe(nativewindEnv());
    } finally {
      rmSync(root, { recursive: true, force: true });
    }

    const meu = 'declare module "*.svg";\n';
    const outro = app({ "nativewind-env.d.ts": meu });
    try {
      const step = byName(plan(outro), "nativewind-env.d.ts");

      expect(step.action).toBe("conflito");
      expect(step.body).toBeUndefined();
      expect(readFileSync(join(outro, "nativewind-env.d.ts"), "utf8")).toBe(meu);
    } finally {
      rmSync(outro, { recursive: true, force: true });
    }
  });

  test("nao anda em diretorio que nao e app do Expo, e nao cria pasta", () => {
    const root = mkdtempSync(join(tmpdir(), "receita-solta-"));
    mkdirSync(join(root, "src"));
    try {
      const steps = plan(root);
      const clashes = steps.filter((step) => step.action === "conflito");

      expect(clashes.map((step) => step.name)).toEqual(["app.json", "package.json"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
