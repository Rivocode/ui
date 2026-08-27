import { expect, test } from "bun:test";

import {
  MAP_ROLES,
  MEASURED_ROLES,
  WITHOUT_PAIR,
  checkThemeCss,
  checkThemeMap,
  compose,
  contrastRatio,
  outsideSrgb,
  readColor,
  readTokens,
  refusalOf,
  resolveTokens,
  toHex,
} from "../src/lib/contrast";
import { themeBlocks } from "../src/lib/theme-check";
import { tokens } from "../native/tokens";

const read = (path: string) => Bun.file(path).text();

const house = async (theme: string) =>
  readTokens(
    (await read("src/tokens/palette.css")) + "\n" + (await read(`src/tokens/themes/${theme}.css`)),
  );

test("as tres sintaxes de alfa compoem no mesmo pixel", () => {
  const background = "#14171a";
  const composed = [
    compose("rgb(212 243 74 / 0.14)", background),
    compose("rgba(212,243,74,0.14)", background),
    compose("#d4f34a24", background),
  ];

  expect(new Set(composed).size).toBe(1);
  expect(contrastRatio(composed[0]!, background)).not.toBeNaN();
});

test("cor que a conta nao sabe compor sai intacta, e a razao nao mente", () => {
  const value = compose("color-mix(in oklab, red, blue)", "#14171a");

  expect(value.startsWith("#")).toBe(false);
  expect(contrastRatio(value, "#14171a")).toBeNaN();
});

const CHROME_PIXEL: Array<[string, string]> = [
  ["oklch(63.7% 0.237 25.331)", "#fb2c36"],
  ["oklch(54.6% 0.245 262.881)", "#155dfc"],
  ["oklch(0.44 0.18 264)", "#1b46b4"],
  ["oklch(0.72 0.14 264)", "#77a2fc"],
  ["oklch(70% 0.15 145)", "#5bb661"],
  ["oklch(0.5 0.1 0.25turn)", "#796006"],
  ["oklab(0.5 -0.1 0.05)", "#207544"],
  ["oklab(50% -25% 12.5%)", "#207544"],
  ["lab(52.2 40.1 59.9)", "#c65d07"],
  ["lch(52.2 72.2 56.2)", "#c65d06"],
  ["hsl(210 60% 45%)", "#2e73b8"],
  ["hsl(0.5turn 100% 50%)", "#00ffff"],
  ["hwb(210 20% 30%)", "#3373b3"],
  ["hwb(45 60% 60%)", "#808080"],
  ["rgb(50% 20% 10%)", "#80331a"],
  ["color(srgb 0.3 0.6 0.9)", "#4d99e6"],
  ["color(srgb-linear 0.1 0.4 0.8)", "#59aae7"],
  ["color(display-p3 0.4 0.6 0.8)", "#559bd1"],
  ["color(a98-rgb 0.4 0.6 0.8)", "#439acf"],
  ["color(prophoto-rgb 0.4 0.6 0.8)", "#00b2dc"],
  ["color(rec2020 0.4 0.6 0.8)", "#2da7d7"],
  ["color(xyz-d65 0.2 0.3 0.4)", "#00a7a4"],
  ["color(xyz-d50 0.2 0.3 0.4)", "#00a8bd"],
  ["oklch(0.52 0.22 20)", "#c9002e"],
  ["oklch(0.7 0.4 145)", "#00d200"],
  ["lch(50 130 40)", "#ff0000"],
];

test("os espacos novos chegam no mesmo pixel que o Chrome pinta num canvas", () => {
  for (const [written, pixel] of CHROME_PIXEL) expect(toHex(written)).toBe(pixel);
  expect(CHROME_PIXEL.length).toBeGreaterThan(25);
});

test("a paleta do Tailwind 4 inteira se le, e nenhuma cor sai sem medida", async () => {
  const theme = await read("node_modules/tailwindcss/theme.css");
  const named = new Map<string, string>();
  for (const [, role, value] of theme.matchAll(/--color-([a-z]+-\d+):\s*(oklch\([^)]*\))/g)) {
    named.set(role!, value!);
  }

  expect(named.size).toBeGreaterThan(250);

  const blind = [...named].filter(([, value]) => !toHex(value));
  expect(blind).toEqual([]);

  const wide = [...named].filter(([, value]) => outsideSrgb(value));
  expect(wide.length).toBeGreaterThan(50);
  expect(wide.length).toBeLessThan(named.size / 2);
});

test("branco e preto chegam ao mesmo lugar por todos os espacos que a conta le", () => {
  const white = [
    "#fff",
    "#ffffff",
    "rgb(255 255 255)",
    "hsl(0 0% 100%)",
    "hwb(0 100% 0%)",
    "lab(100 0 0)",
    "lch(100 0 0)",
    "oklab(1 0 0)",
    "oklch(1 0 0)",
    "oklch(100% 0 none)",
    "color(srgb 1 1 1)",
    "color(srgb-linear 1 1 1)",
    "color(display-p3 1 1 1)",
    "color(rec2020 1 1 1)",
  ];
  const black = [
    "#000",
    "#000000",
    "rgb(0 0 0)",
    "hsl(0 0% 0%)",
    "hwb(0 0% 100%)",
    "lab(0 0 0)",
    "oklch(0 0 0)",
    "color(srgb 0 0 0)",
    "color(xyz-d65 0 0 0)",
  ];

  expect(new Set(white.map((value) => toHex(value)))).toEqual(new Set(["#ffffff"]));
  expect(new Set(black.map((value) => toHex(value)))).toEqual(new Set(["#000000"]));
});

test("o alfa dos espacos novos compoe no mesmo pixel do rgba e do hexadecimal", () => {
  const background = "#14171a";
  const solid = toHex("oklch(0.7 0.15 145)")!;
  const [red, green, blue] = [1, 3, 5].map((at) => parseInt(solid.slice(at, at + 2), 16));

  const composed = [
    compose("oklch(0.7 0.15 145 / 0.4)", background),
    compose("oklch(0.7 0.15 145 / 40%)", background),
    compose(`rgb(${red} ${green} ${blue} / 0.4)`, background),
    compose(`rgba(${red},${green},${blue},0.4)`, background),
  ];

  expect(new Set(composed).size).toBe(1);
  expect(composed[0]!.startsWith("#")).toBe(true);
  expect(contrastRatio(composed[0]!, background)).not.toBeNaN();

  const eight = compose("#ffffff66", background);
  expect(compose("rgb(255 255 255 / 0.4)", background)).toBe(eight);
});

test("cor fora do gamut do sRGB e medida no valor que a tela corta, e a nota diz quais", async () => {
  const tokens = { ...(await house("rivocode-light")), "--rc-danger": "oklch(0.52 0.22 20)" };
  const findings = checkThemeCss("gamut", tokens);
  const note = findings.find((finding) => finding.line.includes("fora do sRGB"));

  expect(note?.ok).toBe(true);
  expect(note?.line).toContain("danger (oklch(0.52 0.22 20) → #c9002e)");
  expect(findings.filter((finding) => !finding.ok)).toEqual([]);
  expect(outsideSrgb("oklch(0.52 0.22 20)")).toBe(true);
  expect(outsideSrgb("oklch(0.44 0.18 264)")).toBe(false);
});

test("color-mix e nome de cor da CSS continuam sem medida, e cada um diz por que", () => {
  expect(refusalOf("color-mix(in oklab, red 40%, blue)")).toBe("mix");
  expect(refusalOf("rebeccapurple")).toBe("syntax");
  expect(refusalOf("var(--rc-accent)")).toBe("syntax");
  expect(refusalOf("oklch(0.7 0.15)")).toBe("syntax");
  expect(refusalOf("oklch(0.7 0.15 145)")).toBeUndefined();
  expect(readColor("color-mix(in oklab, red, blue)")).toBeUndefined();

  const findings = checkThemeMap("mistura", {
    light: { ...tokens.themes["rivocode-light"], accent: "color-mix(in oklab, red, blue)" },
    dark: tokens.themes["rivocode-dark"],
  });
  const bad = findings.filter((finding) => !finding.ok);

  expect(bad.length).toBeGreaterThan(0);
  expect(bad.some((finding) => finding.line.includes("sem medida"))).toBe(true);
});

test("o angulo aceita deg, rad, grad e turn, e o percentual entra no lugar do numero", () => {
  const same = [
    "hsl(90deg 50% 40%)",
    "hsl(90 50% 40%)",
    "hsl(100grad 50% 40%)",
    "hsl(0.25turn 50% 40%)",
    `hsl(${Math.PI / 2}rad 50% 40%)`,
  ];
  expect(new Set(same.map((value) => toHex(value))).size).toBe(1);

  expect(toHex("oklch(0.6 0.1 180deg)")).toBe(toHex("oklch(60% 25% 0.5turn)"));
  expect(toHex("hsl(90 50 40)")).toBe(toHex("hsl(90 50% 40%)"));
});

test("o mesmo tema em outra sintaxe mede a mesma linha, papel por papel", () => {
  const rewrite = (colors: Record<string, string>) => {
    const other: Record<string, string> = {};
    for (const [role, value] of Object.entries(colors)) {
      const hex = toHex(value);
      const color = readColor(value);
      other[role] = hex
        ? `rgb(${[color!.red, color!.green, color!.blue].join(" ")})`
        : `rgb(${[color!.red, color!.green, color!.blue].join(" ")} / ${color!.alpha})`;
    }
    return other;
  };

  const house = {
    light: tokens.themes["rivocode-light"],
    dark: tokens.themes["rivocode-dark"],
  };
  const other = { light: rewrite(house.light), dark: rewrite(house.dark) };

  expect(other.light.bg).not.toStartWith("#");
  expect(checkThemeMap("outra", other)).toEqual(checkThemeMap("outra", house));
});

test("os dois temas da casa passam em todos os pares de CSS", async () => {
  for (const theme of ["rivocode-dark", "rivocode-light"]) {
    const findings = checkThemeCss(theme, await house(theme));
    expect(findings.length).toBeGreaterThan(70);
    expect(findings.filter((finding) => !finding.ok).map((finding) => finding.line)).toEqual([]);
  }
});

test("um papel com contraste ruim reprova, e a linha diz qual par", async () => {
  const broken = { ...(await house("rivocode-light")), "--rc-fg-muted": "#b9bfc6" };
  const bad = checkThemeCss("ruim", broken).filter((finding) => !finding.ok);

  expect(bad.length).toBeGreaterThan(0);
  expect(bad.every((finding) => finding.line.includes("--rc-fg-muted"))).toBe(true);
});

test("os dois mapas da casa passam em todos os pares do nativo", () => {
  const findings = checkThemeMap("rivocode", {
    light: tokens.themes["rivocode-light"],
    dark: tokens.themes["rivocode-dark"],
  });

  expect(findings.filter((finding) => !finding.ok).map((finding) => finding.line)).toEqual([]);
});

test("papel faltando no mapa reprova sem ninguem passar a lista de papeis", () => {
  const { bg: _bg, ...light } = tokens.themes["rivocode-light"] as Record<string, string>;
  const findings = checkThemeMap("sem fundo", {
    light,
    dark: tokens.themes["rivocode-dark"],
  });

  expect(findings.some((finding) => !finding.ok && finding.line.includes("bg"))).toBe(true);
});

test("pino do Slider que se dissolve no trilho reprova, e a linha diz qual par caiu", () => {
  const light = tokens.themes["rivocode-light"] as Record<string, string>;
  const track = compose(light["skeleton"]!, toHex(light["bg"]!)!);
  const dissolved = { ...light, fg: track, "border-strong": track };

  const bad = checkThemeMap("pino dissolvido", {
    light: dissolved,
    dark: tokens.themes["rivocode-dark"],
  })
    .filter((finding) => !finding.ok)
    .map((finding) => finding.line);

  expect(bad.some((line) => line.includes("fg sobre skeleton em bg"))).toBe(true);
  expect(bad.some((line) => line.includes("border-strong sobre skeleton em bg"))).toBe(true);
  expect(bad.some((line) => line.includes("border-strong sobre skeleton em surface"))).toBe(true);
});

test("o trilho do Slider e medido composto, e nao no token cru", async () => {
  const light = await house("rivocode-light");
  const track = compose(light["--rc-skeleton"]!, light["--rc-bg"]!);

  expect(toHex(light["--rc-skeleton"]!)).toBeUndefined();
  expect(track).not.toBe(light["--rc-skeleton"]);

  const line = checkThemeCss("rivocode-light", light)
    .map((finding) => finding.line)
    .find((text) => text.includes("--rc-accent-text sobre --rc-skeleton em --rc-bg"));

  expect(line).toContain(contrastRatio(light["--rc-accent-text"]!, track).toFixed(2));
  expect(line).toContain("1.4.11");
});

test("acento que empata com o trilho reprova a faixa do web, e a linha diz qual par caiu", async () => {
  const light = await house("rivocode-light");
  const track = compose(light["--rc-skeleton"]!, light["--rc-bg"]!);
  const bad = checkThemeCss("faixa dissolvida", { ...light, "--rc-accent-text": track })
    .filter((finding) => !finding.ok)
    .map((finding) => finding.line);

  expect(bad.some((line) => line.includes("--rc-accent-text sobre --rc-skeleton em --rc-bg"))).toBe(
    true,
  );
  expect(
    bad.some((line) => line.includes("--rc-accent-text sobre --rc-skeleton em --rc-surface")),
  ).toBe(true);
});

test("a lista de papeis do mapa e derivada das tabelas, e bate com o gerador", () => {
  const roles = Object.keys(tokens.themes["rivocode-dark"]);

  expect([...MAP_ROLES].sort()).toEqual([...roles].sort());
  expect(MEASURED_ROLES.length + Object.keys(WITHOUT_PAIR).length).toBe(roles.length);
});

test("o bloco de tema entrega os valores, e nao so os nomes dos papeis", async () => {
  const css = await read("src/tokens/themes/rivocode-light.css");
  const [block] = themeBlocks([{ file: "rivocode-light.css", css }]);

  expect(block!.selector).toBe('[data-rc-theme="rivocode-light"]');
  expect(block!.tokens["--rc-bg"]).toBe("var(--rc-p-paper)");

  const palette = readTokens(await read("src/tokens/palette.css"));
  expect(resolveTokens(block!.tokens, palette)["--rc-bg"]).toStartWith("#");
});

test("o espelho do nativo mede igual ao modulo do web", async () => {
  const mirror = "native/scripts/contrast.mjs";
  const text = await read(mirror);

  expect(text).toStartWith("/* Gerado de src/lib/contrast.ts por bun run gen:native:contrast.");

  const there = (await import(`../${mirror}`)) as {
    checkThemeMap: typeof checkThemeMap;
    compose: typeof compose;
  };

  expect(there.compose("rgba(212,243,74,0.14)", "#14171a")).toBe(
    compose("rgba(212,243,74,0.14)", "#14171a"),
  );

  const map = {
    light: tokens.themes["rivocode-light"],
    dark: tokens.themes["rivocode-dark"],
  };
  expect(there.checkThemeMap("prova", map)).toEqual(checkThemeMap("prova", map));
});

test("o pacote nativo publica o espelho por um subcaminho proprio", async () => {
  const pkg = (await Bun.file("native/package.json").json()) as {
    files: string[];
    exports: Record<string, string>;
  };

  expect(pkg.files).toContain("scripts");
  expect(pkg.exports["./contrast"]).toBe("./scripts/contrast.mjs");
});
