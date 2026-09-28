/**
 * Phase 0 of @rivocode/ui-native: the tokens go from CSS to JSON and TS.
 *
 * The single source is still the CSS - that is where the contrast and
 * documentation guards already bite. This script DERIVES the shape React
 * Native consumes: numbers without "px", resolved colors (var() does not exist
 * there), and only what translates. Box shadow, marketing clamp() and z-index
 * stacking are CSS ideas; they stay out with the reason noted.
 *
 * FONTS DO NOT TRANSLATE, and this is the most expensive case to learn. The
 * `fonts` block existed here and emitted "Manrope Variable", "Poppins" and
 * "JetBrains Mono Variable" - three families that are not installed on iOS or
 * Android. Worse: it resolved with `value.split(",")[0]`, keeping the FIRST of
 * the stack and throwing away the fallback, which is exactly the failure that
 * made `.font-mono` render in the default typeface for versions without anyone
 * seeing. On a phone only the app knows what it loaded, so the family comes in
 * through `fonts` on `RivoProvider` and not through a token. Do not bring this
 * block back.
 *
 * Not emitting was not enough: the app's `@import "tailwindcss/theme.css"`
 * brings `--font-sans`, `--font-serif` and `--font-mono` out of the box, and
 * with them the `font-sans`, `font-serif` and `font-mono` classes compile to
 * the CSS stack `ui-monospace, SFMono-Regular, Menlo, ...`, of which
 * react-native-css keeps the FIRST - a generic that no device has.
 * `font-display` compiles nothing, and vanishes silently. That is why the
 * @theme below resets the three with `initial`: without the token, none of the
 * four generates a rule, and `check:classes` starts flagging them inside
 * `native/src/**` as it flagged the Slider's `shadow-1`.
 *
 * DENSITY DOES NOT TRANSLATE EITHER, and the lesson is the same as the block
 * above in another disguise. `densities` used to come out of here with both
 * scales, `comfortable` and `compact`, and no native piece read either: a
 * touch target does not shrink on a finger screen, so the `density` prop never
 * existed in the native `RivoProvider` API. What sat in `tokens.ts` was the
 * promise of a choice the package does not offer - whoever read
 * `tokens.densities.compact` would build a whole screen on a number nothing
 * applies. The comfortable measurements go into `scales`, together with radius
 * and typography, because on native they are not one density out of two: they
 * are THE measurement.
 *
 * The web stays as it is. There the compact density exists, and a live
 * `[data-rc-density]` in the CSS really applies it.
 *
 * `bun run check:native` runs the generator and fails if the committed result
 * diverges: a token changed in the CSS, native/ moves with it in the same
 * commit.
 */

const read = (path: string) => Bun.file(path).text();

/** `--rc-p-lima-500: #d4f34a;` becomes ["p-lima-500", "#d4f34a"]. */
function declarations(css: string) {
  const found: Array<[string, string]> = [];
  for (const match of css.matchAll(/--rc-([\w-]+):\s*([^;]+);/g)) {
    found.push([match[1], match[2].trim()]);
  }
  return found;
}

/** `rgb(212 243 74 / 0.14)` becomes `rgba(212,243,74,0.14)`, which RN understands. */
function toNativeColor(value: string, palette: Map<string, string>): string | null {
  const reference = /^var\(--rc-(p-[\w-]+)\)$/.exec(value);
  if (reference) return palette.get(reference[1]) ?? null;

  const rgb = /^rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)\)$/.exec(value);
  if (rgb) return `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${rgb[4]})`;

  if (value.startsWith("#")) return value;
  return null;
}

/** `6px` becomes 6; `120ms` becomes 120; the rest stays out. */
const toNumber = (value: string) => {
  const match = /^([\d.]+)(?:px|ms)$/.exec(value);
  return match ? Number(match[1]) : null;
};

const paletteCss = await read("src/tokens/palette.css");
// Scale and shape are read together: for native both are the same thing,
// which is "a measurement that does not come from the color theme".
const scalesCss =
  (await read("src/tokens/scales.css")) + "\n" + (await read("src/tokens/forma.css"));

const palette = new Map<string, string>();
for (const [name, value] of declarations(paletteCss)) {
  if (name.startsWith("p-") && value.startsWith("#")) palette.set(name, value);
}

/**
 * Splits the CSS into top-level blocks, header + body. The compact density
 * redefines the same variables as the comfortable one in the same file, and a
 * blind matchAll let the last one win: control-md came out 32 instead of 40.
 *
 * It still holds after compact left this output, and now with a second use:
 * this cut is how its block is recognized so it can be skipped.
 */
function topLevelBlocks(css: string) {
  const blocks: Array<{ header: string; body: string }> = [];
  let header = "";
  let body = "";
  let depth = 0;

  for (const char of css) {
    if (char === "{") {
      depth++;
      if (depth === 1) {
        body = "";
        continue;
      }
    }
    if (char === "}") {
      depth--;
      if (depth === 0) {
        blocks.push({ header: header.trim(), body });
        header = "";
        continue;
      }
    }
    if (depth === 0) header += char;
    else body += char;
  }

  return blocks;
}

/* The scales that translate: shape, typography, motion and control height.
   Marketing `clamp()`, z-index and @keyframes stay in the CSS, where they
   make sense. */
const scales: Record<string, number> = {};

const easings: Record<string, [number, number, number, number]> = {};

for (const block of topLevelBlocks(scalesCss)) {
  if (block.header.startsWith("@media") || block.header.startsWith("@keyframes")) continue;
  if (block.header.includes('data-rc-density="compact"')) continue;

  for (const [name, value] of declarations(block.body)) {
    if (name.startsWith("z-") || name.startsWith("tracking-")) continue;
    const curve = /^cubic-bezier\(([^)]+)\)$/.exec(value);
    if (curve) {
      const points = curve[1].split(",").map((point) => Number(point.trim()));
      if (points.length === 4 && points.every(Number.isFinite)) {
        easings[name] = points as [number, number, number, number];
      }
      continue;
    }
    const number = toNumber(value) ?? (/^[\d.]+$/.test(value) ? Number(value) : null);
    if (number === null) continue;
    scales[name] = number;
  }
}

async function themeColors(path: string) {
  const css = await read(path);
  const colors: Record<string, string> = {};
  for (const [name, value] of declarations(css)) {
    const color = toNativeColor(value, palette);
    if (color) colors[name] = color;
  }
  return colors;
}

const code: Record<string, string> = {};
const media: Record<string, string> = {};
const signature: Record<string, string> = {};
for (const block of topLevelBlocks(scalesCss)) {
  if (block.header !== ":root") continue;
  for (const [name, value] of declarations(block.body)) {
    const group = name.startsWith("code-")
      ? code
      : name.startsWith("media-")
        ? media
        : name.startsWith("signature-")
          ? signature
          : null;
    if (!group) continue;
    const color = toNativeColor(value, palette);
    if (color) group[name] = color;
  }
}

const tokens = {
  $comment:
    "Generated by scripts/gen-native-tokens.ts from src/tokens/*.css. Do not edit: run bun run gen:native.",
  palette: Object.fromEntries(palette),
  scales,
  easings,
  code,
  media,
  signature,
  themes: {
    "rivocode-dark": await themeColors("src/tokens/themes/rivocode-dark.css"),
    "rivocode-light": await themeColors("src/tokens/themes/rivocode-light.css"),
  },
};

const json = `${JSON.stringify(tokens, null, 2)}\n`;

/**
 * The theme for NativeWind v5, which speaks Tailwind 4 like the web: the
 * @theme generates exactly the same classes - bg-bg, text-fg-muted, rounded-md.
 *
 * Each color comes out as light-dark(light, dark): the react-native-css
 * compiler turns that into a rule conditioned on prefers-color-scheme,
 * evaluated at runtime - and Appearance.setColorScheme() swaps the whole theme
 * with no live var() at all, which is exactly what its inliner does not
 * tolerate. The provider does that set from the `theme` prop. Fonts stay out
 * until the app loads them with expo-font; without the font installed, the
 * name becomes an error.
 */
const dark = tokens.themes["rivocode-dark"];
const light = tokens.themes["rivocode-light"];
const themeLines = [
  ...Object.entries(dark).map(([role, darkColor]) => {
    const lightColor = (light as Record<string, string>)[role];
    const value =
      lightColor && lightColor !== darkColor
        ? `light-dark(${lightColor}, ${darkColor})`
        : darkColor;
    return `  --color-${role}: ${value};`;
  }),
  ...Object.entries(scales)
    .filter(([name]) => name.startsWith("radius-"))
    .map(([name, value]) => `  --${name}: ${value}px;`),
  ...Object.entries(scales)
    .filter(([name]) => name.startsWith("weight-"))
    .map(([name, value]) => `  --font-weight-rc-${name.slice("weight-".length)}: ${value};`),
  ...Object.entries(scales)
    .filter(([name]) => name.startsWith("text-"))
    .flatMap(([name, value]) => {
      // The --text-X--line-height pair is the syntax Tailwind 4 reads to give
      // each size a line height. Headings tighten, body text breathes - the
      // same leading-tight and leading-normal as the web.
      const leading = value >= 20 ? scales["leading-tight"] : scales["leading-normal"];
      return [
        `  --${name}: ${value}px;`,
        `  --${name}--line-height: ${Math.round(value * leading)}px;`,
      ];
    }),
];

const roleClasses = Object.keys(dark).join(",");

const familyRoles = ["sans", "serif", "mono"];
const familyReset = familyRoles.map((role) => `  --font-${role}: initial;`).join("\n");

const themeCss = `/* Generated by scripts/gen-native-tokens.ts. Do not edit: run bun run gen:native. */

/* Only the @theme: the Tailwind build already materializes it on :root by
   itself, and a second declaration of the same variable breaks the native
   compiler's inliner. light-dark() becomes a prefers-color-scheme rule in the
   compiler, and the provider swaps the theme at runtime with
   Appearance.setColorScheme(). */
@theme {
${themeLines.join("\n")}

  /* Font family does not come through a class here, and initial is what makes
     the class STOP existing. The app's tailwindcss/theme.css brings
     --font-sans, --font-serif and --font-mono out of the box, and with them
     font-sans, font-serif and font-mono compile to a CSS stack of which
     react-native-css keeps only the first - a generic no phone has installed,
     and the text renders in the system typeface with nothing flagging it.
     font-display never compiled anything. Without the three tokens, the four
     classes become candidates Tailwind ignores, and check:classes catches
     them. The family comes in through RivoProvider's fonts and goes out
     through Text's font prop. */
${familyReset}
}

/* The inline @source forces one bg- class per role, even a role no piece
   paints as a background. It is from that class that RivoProvider READS the
   color at runtime, with useCssElement: without the emitted rule, the role
   comes back undefined and the chart renders in another theme's color. Of the
   45 roles, 23 had no bg- before this line - among them the eight chart-*,
   which is what ChartDonut needs. */
@source inline("bg-{${roleClasses}}");
`;

const ts = `/* Generated by scripts/gen-native-tokens.ts. Do not edit: run bun run gen:native. */

export const tokens = ${JSON.stringify(tokens, null, 2)} as const;

export type RivoNativeTheme = keyof typeof tokens.themes;
export type RivoNativeColorRole = keyof (typeof tokens.themes)["rivocode-dark"];
`;

// In check mode nothing is written: it compares the committed files with
// what the CSS asks for now, and fails BEFORE hiding the difference.
/* ---------------------------------------------------------------------------
 * The client theme
 *
 * Layer 3 on the web is a CSS file with the 51 roles in one theme selector.
 * Here it becomes the map the native `RivoProvider` wears. The source is the
 * same on both sides on purpose: a second place to maintain a client's color
 * is how the promise breaks in practice - not by decision, by silent
 * divergence six months later.
 *
 *   bun run gen:native --theme tema-acme.css --out acme.theme.ts
 *
 * `--tema` and `--saida` are still accepted: the CHANGELOGs and the published
 * theme docs quote them.
 *
 * The file may carry a single selector, which serves both schemes, or the
 * `x-light` and `x-dark` pair, which is the convention of the house themes.
 * ------------------------------------------------------------------------- */

const flagIndex = (...names: string[]) =>
  Math.max(...names.map((name) => process.argv.indexOf(name)));

const themeArg = flagIndex("--theme", "--tema");

if (themeArg !== -1) {
  const source = process.argv[themeArg + 1];
  if (!source) {
    console.error("Missing the file: bun run gen:native --theme tema-acme.css");
    process.exit(1);
  }

  const outArg = flagIndex("--out", "--saida");
  const target = outArg !== -1 ? process.argv[outArg + 1]! : source.replace(/\.css$/, ".theme.ts");
  const css = await read(source);

  /** Each `[data-rc-theme="x"] { ... }` block in the file, by name. */
  const blocks = new Map<string, string>();
  for (const block of css.matchAll(/\[data-rc-theme=["']([\w-]+)["']\]\s*\{([\s\S]*?)\}/g)) {
    blocks.set(block[1]!, block[2]!);
  }

  if (blocks.size === 0) {
    console.error(`No [data-rc-theme="..."] in ${source}: it is what declares layer 3.`);
    process.exit(1);
  }

  const colorsOf = (body: string) => {
    const colors: Record<string, string> = {};
    for (const [name, value] of declarations(body)) {
      const color = toNativeColor(value, palette);
      if (color) colors[name] = color;
    }
    return colors;
  };

  // `acme-light` and `acme-dark` are the same theme in two schemes; a lone
  // name dresses both, because a single-scheme theme is a legitimate choice -
  // and better than inventing the other one on our own.
  const names = [...blocks.keys()];
  const base = names[0]!.replace(/-(light|dark)$/, "");
  const light = blocks.get(`${base}-light`) ?? blocks.get(base) ?? blocks.get(names[0]!)!;
  const dark = blocks.get(`${base}-dark`) ?? blocks.get(base) ?? blocks.get(names[0]!)!;

  const map = { light: colorsOf(light), dark: colorsOf(dark) };
  const missing = Object.keys(tokens.themes["rivocode-dark"]).filter(
    (role) => !(role in map.light) || !(role in map.dark),
  );

  await Bun.write(
    target,
    `/* Generated from ${source} by bun run gen:native --theme. Do not edit. */\n` +
      `type ThemeMap = { light: Record<string, string>; dark: Record<string, string> };\n\n` +
      `export const ${base.replace(/-/g, "")}Theme: ThemeMap = ${JSON.stringify(map, null, 2)};\n`,
  );

  console.log(`${target}: ${Object.keys(map.light).length} roles, light and dark.`);
  console.log(
    "\nThe map is not a prop of anything: `RivoProvider` no longer takes a theme object.\n" +
      "To dress the screen, override the --color-* roles in an @theme of the app's global.css and\n" +
      "recompile with `npx rivocode-ui-native-css`. The provider reads the 45 roles from the compiled CSS,\n" +
      "so the class and the color the piece reads through JS say the same thing.\n" +
      "This file still serves as a check for missing roles.",
  );
  if (missing.length > 0) {
    // A missing role is not a detail: the piece that asks for it inherits the
    // RivoCode color, and that only shows up on the client's screen, months later.
    console.error(`\n${missing.length} role(s) without a value in the theme: ${missing.join(", ")}`);
    process.exit(1);
  }
  process.exit(0);
}

if (process.argv.includes("--check")) {
  const committedJson = await read("native/tokens.json").catch(() => "");
  const committedTheme = await read("native/theme.css").catch(() => "");
  if (committedJson !== json || committedTheme !== themeCss) {
    console.error("native/ diverged from the CSS. Run: bun run gen:native");
    process.exit(1);
  }
  console.log("native/ up to date with the CSS.");
  process.exit(0);
}

await Bun.write("native/tokens.json", json);
await Bun.write("native/tokens.ts", ts);
await Bun.write("native/theme.css", themeCss);

console.log(
  `native/tokens.json and tokens.ts: ${palette.size} raw colors, ${
    Object.keys(scales).length
  } scales, 2 themes.`,
);

export {};
