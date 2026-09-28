import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  BABEL_NAMES,
  BABEL_V4,
  RECIPE,
  REQUIRED_PEERS,
  globalCss,
  missingPeers,
  nativewindEnv,
  plan,
} from "../scripts/init.mjs";

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

describe("the install recipe", () => {
  test("covers seven files, and none of them twice", () => {
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

  test("in a freshly created Expo app it writes everything and leaves no empty file", () => {
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

  test("running twice changes nothing the second time", () => {
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

  test("a file that already exists with other content is not rewritten without --force", () => {
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

  test("a changed JSON key shows up in the report with the old value", () => {
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

  test("the app JSON keeps the rest and the indentation", () => {
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

  test("a missing app.json is a conflict, not an invented app.json", () => {
    const root = mkdtempSync(join(tmpdir(), "receita-vazia-"));
    try {
      const step = byName(plan(root), "app.json");

      expect(step.action).toBe("conflito");
      expect(step.note).toContain("root of an Expo app");
      expect(existsSync(join(root, "app.json"))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("the NativeWind v4 recipe is flagged by name, and the file stays standing", () => {
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

  test("babel.config.js without a v4 mark stays, and no file at all is the right thing", () => {
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
      expect(step.note).toContain("does not exist");
    } finally {
      rmSync(vazio, { recursive: true, force: true });
    }
  });

  test("looks for a Babel file under every name Expo looks for", () => {
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

  test("global.css points to the installed package, not to the monorepo", () => {
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

  test("nativewind-env.d.ts references the NativeWind types and the CSS module", () => {
    const dts = nativewindEnv();

    expect(dts).toContain('/// <reference types="nativewind/types" />');
    expect(dts).toContain('declare module "*.css";');
    expect(dts).not.toContain("nativewind/jsx-runtime");
  });

  test("nativewind-env.d.ts is created in the app and conflicts if it already says something else", () => {
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

  test("does not act in a directory that is not an Expo app, and creates no folder", () => {
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

describe("the required peers", () => {
  test("they come from the manifest, without the optional ones, and the keyboard one is among them", () => {
    const manifest = JSON.parse(readFileSync(join(import.meta.dir, "../package.json"), "utf8"));
    const optional = Object.keys(manifest.peerDependenciesMeta);
    expect(optional.length).toBeGreaterThan(3);
    expect(REQUIRED_PEERS).toContain("react-native-keyboard-controller");
    expect(REQUIRED_PEERS).toContain("react-native-reanimated");
    for (const name of optional) expect(REQUIRED_PEERS).not.toContain(name);
    expect(REQUIRED_PEERS.length + optional.length).toBe(
      Object.keys(manifest.peerDependencies).length,
    );
  });

  test("the app without the keyboard controller hears its name, and the complete app hears nothing", () => {
    const root = app();
    try {
      expect(missingPeers(root)).toEqual(REQUIRED_PEERS);

      const installed = Object.fromEntries(REQUIRED_PEERS.map((name: string) => [name, "*"]));
      const { "react-native-keyboard-controller": _, ...partial } = installed;
      writeFileSync(join(root, "package.json"), JSON.stringify({ dependencies: partial }));
      expect(missingPeers(root)).toEqual(["react-native-keyboard-controller"]);

      writeFileSync(join(root, "package.json"), JSON.stringify({ dependencies: installed }));
      expect(missingPeers(root)).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
