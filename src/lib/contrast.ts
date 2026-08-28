export const MIN_BODY = 7;
export const MIN_TEXT = 4.5;
export const MIN_NON_TEXTUAL = 3;
export const MIN_CHART = 3;
export const MIN_DISABLED = 1.6;
export const LIVE_OVER_DISABLED = 1.4;

export type ColorMap = Record<string, string>;
export type ThemeMap = { light: ColorMap; dark: ColorMap };
export type Finding = { ok: boolean; line: string };

export type Srgb = {
  red: number;
  green: number;
  blue: number;
  alpha: number;
  outside?: boolean;
};
export type Refusal = "mix" | "syntax";

type Triple = [number, number, number];
type Matrix = [Triple, Triple, Triple];

const GAMUT_SLACK = 0.5;

const IDENTITY: Matrix = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

const LMS_FROM_OKLAB: Matrix = [
  [0.9999999984505198, 0.3963377921737679, 0.2158037580607588],
  [1.0000000088817609, -0.1055613423236563, -0.0638541747717059],
  [1.0000000546724108, -0.0894841820949658, -1.2914855378640917],
];

const XYZ_FROM_LMS: Matrix = [
  [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
  [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
  [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816],
];

const LINEAR_SRGB_FROM_XYZ: Matrix = [
  [12831 / 3959, -329 / 214, -1974 / 3959],
  [-851781 / 878810, 1648619 / 878810, 36519 / 878810],
  [705 / 12673, -2585 / 12673, 705 / 667],
];

const XYZ_D65_FROM_D50: Matrix = [
  [0.955473421488075, -0.02309845494876471, 0.06325924320057072],
  [-0.0283697093338637, 1.0099953980813041, 0.021041441191917323],
  [0.012314014864481998, -0.020507649298898964, 1.3303659366080753],
];

const XYZ_FROM_P3: Matrix = [
  [608311 / 1250200, 189793 / 714400, 198249 / 1000160],
  [35783 / 156275, 247089 / 357200, 198249 / 2500400],
  [0, 32229 / 714400, 5220557 / 5000800],
];

const XYZ_FROM_A98: Matrix = [
  [573536 / 994567, 263643 / 1420810, 187206 / 994567],
  [591459 / 1989134, 6239551 / 9945670, 374412 / 4972835],
  [53769 / 1989134, 351524 / 4972835, 4929758 / 4972835],
];

const XYZ_FROM_PROPHOTO: Matrix = [
  [0.7977666449006423, 0.13518129740053308, 0.0313477341283922],
  [0.2880748288194013, 0.711835234241873, 0.00008993693872564],
  [0, 0, 0.8251046025104602],
];

const XYZ_FROM_REC2020: Matrix = [
  [63426534 / 99577255, 20160776 / 139408157, 47086771 / 278816314],
  [26158966 / 99577255, 472592308 / 697040785, 8267143 / 139408157],
  [0, 19567812 / 697040785, 295819943 / 278816314],
];

const WHITE_D50: Triple = [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585];

const LAB_EPSILON = 216 / 24389;
const LAB_KAPPA = 24389 / 27;

const OKLAB_CHROMA_FULL = 0.4;
const LAB_AXIS_FULL = 125;
const LCH_CHROMA_FULL = 150;

const ANGLE_IN_DEGREES: Record<string, number> = {
  deg: 1,
  grad: 0.9,
  rad: 180 / Math.PI,
  turn: 360,
};

function apply(matrix: Matrix, vector: Triple): Triple {
  return matrix.map(
    (row) => row[0] * vector[0] + row[1] * vector[1] + row[2] * vector[2],
  ) as Triple;
}

function bounded(value: number, top: number): number {
  return Math.max(0, Math.min(top, value));
}

function channel(value: number): number {
  const ratio = value / 255;
  return ratio <= 0.04045 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
}

function signed(value: number, curve: (size: number) => number): number {
  const size = Math.abs(value);
  return (value < 0 ? -1 : 1) * curve(size);
}

function gammaEncode(value: number): number {
  const size = Math.abs(value);
  return size <= 0.0031308
    ? value * 12.92
    : signed(value, (part) => 1.055 * part ** (1 / 2.4) - 0.055);
}

function gammaDecode(value: number): number {
  const size = Math.abs(value);
  return size <= 0.04045 ? value / 12.92 : signed(value, (part) => ((part + 0.055) / 1.055) ** 2.4);
}

function a98Decode(value: number): number {
  return signed(value, (size) => size ** (563 / 256));
}

function prophotoDecode(value: number): number {
  const size = Math.abs(value);
  return size <= 16 / 512 ? value / 16 : signed(value, (part) => part ** 1.8);
}

const REC2020_ALPHA = 1.09929682680944;
const REC2020_BETA = 0.018053968510807;

function rec2020Decode(value: number): number {
  const size = Math.abs(value);
  return size < REC2020_BETA * 4.5
    ? value / 4.5
    : signed(value, (part) => ((part + REC2020_ALPHA - 1) / REC2020_ALPHA) ** (1 / 0.45));
}

function keepLinear(value: number): number {
  return value;
}

const SPACES: Record<
  string,
  { decode: (value: number) => number; matrix?: Matrix; d50?: boolean }
> = {
  srgb: { decode: gammaDecode },
  "srgb-linear": { decode: keepLinear },
  "display-p3": { decode: gammaDecode, matrix: XYZ_FROM_P3 },
  "a98-rgb": { decode: a98Decode, matrix: XYZ_FROM_A98 },
  "prophoto-rgb": { decode: prophotoDecode, matrix: XYZ_FROM_PROPHOTO, d50: true },
  rec2020: { decode: rec2020Decode, matrix: XYZ_FROM_REC2020 },
  xyz: { decode: keepLinear, matrix: IDENTITY },
  "xyz-d65": { decode: keepLinear, matrix: IDENTITY },
  "xyz-d50": { decode: keepLinear, matrix: IDENTITY, d50: true },
};

export const COLOR_SPACES: string[] = [
  "hex",
  "rgb",
  "hsl",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "color",
];

function scalar(token: string, whole: number): number | undefined {
  if (token.toLowerCase() === "none") return 0;
  const percent = token.endsWith("%");
  const raw = Number.parseFloat(percent ? token.slice(0, -1) : token);
  if (!Number.isFinite(raw)) return undefined;
  return percent ? (raw * whole) / 100 : raw;
}

function share(token: string): number | undefined {
  const raw = scalar(token, 100);
  return raw === undefined ? undefined : raw / 100;
}

function degrees(token: string): number | undefined {
  if (token.toLowerCase() === "none") return 0;
  const unit = /(deg|grad|rad|turn)$/i.exec(token);
  const raw = Number.parseFloat(unit ? token.slice(0, -unit[1]!.length) : token);
  if (!Number.isFinite(raw)) return undefined;
  return raw * (unit ? ANGLE_IN_DEGREES[unit[1]!.toLowerCase()]! : 1);
}

function fromHex(digits: string): Srgb | undefined {
  const size = digits.length;
  if (size !== 3 && size !== 4 && size !== 6 && size !== 8) return undefined;
  const step = size <= 4 ? 1 : 2;
  const at = (index: number) => {
    const part = digits.slice(index * step, index * step + step);
    return parseInt(step === 1 ? part + part : part, 16);
  };
  return {
    red: at(0),
    green: at(1),
    blue: at(2),
    alpha: size === 4 || size === 8 ? at(3) / 255 : 1,
  };
}

function fields(body: string, count: number): { parts: string[]; alpha: number } | undefined {
  const flat = body.replace(/,/g, " ");
  const halves = flat.split("/");
  if (halves.length > 2) return undefined;
  let parts = halves[0]!.trim().split(/\s+/).filter(Boolean);
  let opacity = halves[1]?.trim();

  if (opacity === undefined && parts.length === count + 1) {
    opacity = parts[count];
    parts = parts.slice(0, count);
  }
  if (parts.length !== count) return undefined;
  if (opacity !== undefined && /\s/.test(opacity)) return undefined;

  const alpha = opacity === undefined ? 1 : scalar(opacity, 1);
  if (alpha === undefined) return undefined;
  return { parts, alpha: bounded(alpha, 1) };
}

function fromLinear(linear: Triple, alpha: number): Srgb {
  const bytes = linear.map((part) => gammaEncode(part) * 255) as Triple;
  return {
    red: bounded(bytes[0], 255),
    green: bounded(bytes[1], 255),
    blue: bounded(bytes[2], 255),
    alpha,
    outside: bytes.some((part) => part < -GAMUT_SLACK || part > 255 + GAMUT_SLACK),
  };
}

function hueToBytes(hue: number, saturation: number, lightness: number): Triple {
  const turn = ((hue % 360) + 360) % 360;
  const reach = saturation * Math.min(lightness, 1 - lightness);
  const at = (offset: number) => {
    const step = (offset + turn / 30) % 12;
    return lightness - reach * Math.max(-1, Math.min(step - 3, 9 - step, 1));
  };
  return [at(0) * 255, at(8) * 255, at(4) * 255];
}

function readRgb(body: string): Srgb | undefined {
  const found = fields(body, 3);
  if (!found) return undefined;
  const bytes = found.parts.map((part) => scalar(part, 255));
  if (bytes.some((part) => part === undefined)) return undefined;
  const [red, green, blue] = bytes as Triple;
  return {
    red: bounded(red, 255),
    green: bounded(green, 255),
    blue: bounded(blue, 255),
    alpha: found.alpha,
  };
}

function readHsl(body: string): Srgb | undefined {
  const found = fields(body, 3);
  if (!found) return undefined;
  const hue = degrees(found.parts[0]!);
  const saturation = share(found.parts[1]!);
  const lightness = share(found.parts[2]!);
  if (hue === undefined || saturation === undefined || lightness === undefined) return undefined;
  const [red, green, blue] = hueToBytes(hue, bounded(saturation, 1), bounded(lightness, 1));
  return { red, green, blue, alpha: found.alpha };
}

function readHwb(body: string): Srgb | undefined {
  const found = fields(body, 3);
  if (!found) return undefined;
  const hue = degrees(found.parts[0]!);
  const white = share(found.parts[1]!);
  const black = share(found.parts[2]!);
  if (hue === undefined || white === undefined || black === undefined) return undefined;

  if (white + black >= 1) {
    const gray = (white / (white + black)) * 255;
    return { red: gray, green: gray, blue: gray, alpha: found.alpha };
  }

  const pure = hueToBytes(hue, 1, 0.5);
  const paint = (part: number) => (part / 255) * (1 - white - black) * 255 + white * 255;
  return { red: paint(pure[0]), green: paint(pure[1]), blue: paint(pure[2]), alpha: found.alpha };
}

function oklabToSrgb(lightness: number, first: number, second: number, alpha: number) {
  const cones = apply(LMS_FROM_OKLAB, [lightness, first, second]).map(
    (part) => part ** 3,
  ) as Triple;
  return fromLinear(apply(LINEAR_SRGB_FROM_XYZ, apply(XYZ_FROM_LMS, cones)), alpha);
}

function labToSrgb(lightness: number, first: number, second: number, alpha: number) {
  const fromY = (lightness + 16) / 116;
  const fromX = fromY + first / 500;
  const fromZ = fromY - second / 200;
  const relative: Triple = [
    fromX ** 3 > LAB_EPSILON ? fromX ** 3 : (116 * fromX - 16) / LAB_KAPPA,
    lightness > 8 ? fromY ** 3 : lightness / LAB_KAPPA,
    fromZ ** 3 > LAB_EPSILON ? fromZ ** 3 : (116 * fromZ - 16) / LAB_KAPPA,
  ];
  const d50 = relative.map((part, at) => part * WHITE_D50[at]!) as Triple;
  return fromLinear(apply(LINEAR_SRGB_FROM_XYZ, apply(XYZ_D65_FROM_D50, d50)), alpha);
}

function polar(chroma: number, hue: number): [number, number] {
  const radians = (hue * Math.PI) / 180;
  return [chroma * Math.cos(radians), chroma * Math.sin(radians)];
}

function readOklab(body: string): Srgb | undefined {
  const found = fields(body, 3);
  if (!found) return undefined;
  const lightness = scalar(found.parts[0]!, 1);
  const first = scalar(found.parts[1]!, OKLAB_CHROMA_FULL);
  const second = scalar(found.parts[2]!, OKLAB_CHROMA_FULL);
  if (lightness === undefined || first === undefined || second === undefined) return undefined;
  return oklabToSrgb(lightness, first, second, found.alpha);
}

function readOklch(body: string): Srgb | undefined {
  const found = fields(body, 3);
  if (!found) return undefined;
  const lightness = scalar(found.parts[0]!, 1);
  const chroma = scalar(found.parts[1]!, OKLAB_CHROMA_FULL);
  const hue = degrees(found.parts[2]!);
  if (lightness === undefined || chroma === undefined || hue === undefined) return undefined;
  const [first, second] = polar(Math.max(0, chroma), hue);
  return oklabToSrgb(lightness, first, second, found.alpha);
}

function readLab(body: string): Srgb | undefined {
  const found = fields(body, 3);
  if (!found) return undefined;
  const lightness = scalar(found.parts[0]!, 100);
  const first = scalar(found.parts[1]!, LAB_AXIS_FULL);
  const second = scalar(found.parts[2]!, LAB_AXIS_FULL);
  if (lightness === undefined || first === undefined || second === undefined) return undefined;
  return labToSrgb(lightness, first, second, found.alpha);
}

function readLch(body: string): Srgb | undefined {
  const found = fields(body, 3);
  if (!found) return undefined;
  const lightness = scalar(found.parts[0]!, 100);
  const chroma = scalar(found.parts[1]!, LCH_CHROMA_FULL);
  const hue = degrees(found.parts[2]!);
  if (lightness === undefined || chroma === undefined || hue === undefined) return undefined;
  const [first, second] = polar(Math.max(0, chroma), hue);
  return labToSrgb(lightness, first, second, found.alpha);
}

function readSpace(body: string): Srgb | undefined {
  const found = fields(body, 4);
  if (!found) return undefined;
  const space = SPACES[found.parts[0]!.toLowerCase()];
  if (!space) return undefined;
  const numbers = found.parts.slice(1).map((part) => scalar(part, 1));
  if (numbers.some((part) => part === undefined)) return undefined;

  let carried = (numbers as Triple).map(space.decode) as Triple;
  if (space.matrix) carried = apply(space.matrix, carried);
  if (space.d50) carried = apply(XYZ_D65_FROM_D50, carried);
  if (space.matrix) carried = apply(LINEAR_SRGB_FROM_XYZ, carried);
  return fromLinear(carried, found.alpha);
}

const READERS: Record<string, (body: string) => Srgb | undefined> = {
  rgb: readRgb,
  rgba: readRgb,
  hsl: readHsl,
  hsla: readHsl,
  hwb: readHwb,
  lab: readLab,
  lch: readLch,
  oklab: readOklab,
  oklch: readOklch,
  color: readSpace,
};

function reading(value: string): { color?: Srgb; refusal?: Refusal } {
  const trimmed = value.trim();
  const digits = /^#([\da-f]+)$/i.exec(trimmed);
  if (digits) {
    const color = fromHex(digits[1]!);
    return color ? { color } : { refusal: "syntax" };
  }

  const call = /^([a-z][a-z\d-]*)\(([\s\S]*)\)$/i.exec(trimmed);
  if (!call) return { refusal: "syntax" };

  const family = call[1]!.toLowerCase();
  if (family === "color-mix") return { refusal: "mix" };

  const read = READERS[family];
  if (!read) return { refusal: "syntax" };

  const found = read(call[2]!);
  return found ? { color: found } : { refusal: "syntax" };
}

export function readColor(value: string): Srgb | undefined {
  return reading(value).color;
}

export function refusalOf(value: string): Refusal | undefined {
  return reading(value).refusal;
}

export function outsideSrgb(value: string): boolean {
  return reading(value).color?.outside === true;
}

function hexOf(color: Srgb): string {
  return `#${[color.red, color.green, color.blue]
    .map((part) => bounded(Math.round(part), 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function toHex(value: string): string | undefined {
  const color = readColor(value);
  return color && color.alpha >= 1 ? hexOf(color) : undefined;
}

function luminance(value: string): number {
  const color = readColor(value);
  if (!color) return Number.NaN;
  return 0.2126 * channel(color.red) + 0.7152 * channel(color.green) + 0.0722 * channel(color.blue);
}

export function contrastRatio(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
}

function blend(color: Srgb, alpha: number, under: Srgb): string {
  const mix = (front: number, below: number) => alpha * front + (1 - alpha) * below;
  return hexOf({
    red: mix(color.red, under.red),
    green: mix(color.green, under.green),
    blue: mix(color.blue, under.blue),
    alpha: 1,
  });
}

export function compose(value: string, background: string): string {
  const color = readColor(value);
  if (!color) return value;
  if (color.alpha >= 1) return hexOf(color);
  const under = readColor(background);
  if (!under) return value;
  return blend(color, color.alpha, under);
}

export function rawTokens(css: string): ColorMap {
  const raw: ColorMap = {};
  for (const [, name, value] of css.matchAll(/(--rc-[\w-]+)\s*:\s*([^;]+);/g)) {
    raw[name!] = value!.trim();
  }
  return raw;
}

export function resolveTokens(values: ColorMap, from: ColorMap): ColorMap {
  const resolved: ColorMap = {};
  for (const [name, value] of Object.entries(values)) {
    const reference = /^var\((--rc-[\w-]+)\)$/.exec(value);
    resolved[name] = reference ? (from[reference[1]!] ?? value) : value;
  }
  return resolved;
}

export function readTokens(css: string): ColorMap {
  const raw = rawTokens(css);
  return resolveTokens(raw, raw);
}

export const CSS_PAIRS: Array<[string, string, number]> = [
  ["--rc-fg", "--rc-bg", MIN_BODY],
  ["--rc-fg", "--rc-surface", MIN_BODY],
  ["--rc-fg", "--rc-surface-raised", MIN_BODY],
  ["--rc-fg-muted", "--rc-bg", MIN_TEXT],
  ["--rc-fg-muted", "--rc-surface", MIN_TEXT],
  ["--rc-fg-muted", "--rc-surface-raised", MIN_TEXT],
  ["--rc-fg-subtle", "--rc-bg", MIN_TEXT],
  ["--rc-fg-subtle", "--rc-surface", MIN_TEXT],
  ["--rc-fg-subtle", "--rc-surface-raised", MIN_TEXT],
  ["--rc-accent-text", "--rc-bg", MIN_TEXT],
  ["--rc-accent-text", "--rc-surface-raised", MIN_TEXT],
  ["--rc-accent-text", "--rc-surface", MIN_TEXT],
  ["--rc-accent-fg", "--rc-accent", MIN_TEXT],
  ["--rc-success-text", "--rc-bg", MIN_TEXT],
  ["--rc-warning-text", "--rc-bg", MIN_TEXT],
  ["--rc-danger-text", "--rc-bg", MIN_TEXT],
  ["--rc-info-text", "--rc-bg", MIN_TEXT],
  ["--rc-success-text", "--rc-surface", MIN_TEXT],
  ["--rc-warning-text", "--rc-surface", MIN_TEXT],
  ["--rc-danger-text", "--rc-surface", MIN_TEXT],
  ["--rc-info-text", "--rc-surface", MIN_TEXT],
  ["--rc-danger-text", "--rc-surface-raised", MIN_TEXT],
  ["--rc-success-fg", "--rc-success", MIN_TEXT],
  ["--rc-warning-fg", "--rc-warning", MIN_TEXT],
  ["--rc-danger-fg", "--rc-danger", MIN_TEXT],
  ["--rc-info-fg", "--rc-info", MIN_TEXT],
];

export const CSS_COMPOSED_PAIRS: Array<[string, string, string, number]> = [
  ["--rc-info-text", "--rc-info-subtle", "--rc-bg", MIN_TEXT],
  ["--rc-info-text", "--rc-info-subtle", "--rc-surface", MIN_TEXT],
  ["--rc-success-text", "--rc-success-subtle", "--rc-bg", MIN_TEXT],
  ["--rc-success-text", "--rc-success-subtle", "--rc-surface", MIN_TEXT],
  ["--rc-warning-text", "--rc-warning-subtle", "--rc-bg", MIN_TEXT],
  ["--rc-warning-text", "--rc-warning-subtle", "--rc-surface", MIN_TEXT],
  ["--rc-danger-text", "--rc-danger-subtle", "--rc-bg", MIN_TEXT],
  ["--rc-danger-text", "--rc-danger-subtle", "--rc-surface", MIN_TEXT],
  ["--rc-accent-text", "--rc-accent-subtle", "--rc-bg", MIN_TEXT],
  ["--rc-accent-text", "--rc-accent-subtle", "--rc-surface", MIN_TEXT],
  ["--rc-fg", "--rc-accent-subtle", "--rc-surface-raised", MIN_BODY],
  ["--rc-accent-text", "--rc-accent-subtle", "--rc-surface-raised", MIN_TEXT],
  ["--rc-danger-text", "--rc-danger-subtle", "--rc-surface-raised", MIN_TEXT],
  ["--rc-fg", "--rc-accent-subtle", "--rc-bg", MIN_BODY],
  ["--rc-fg", "--rc-accent-subtle", "--rc-surface", MIN_BODY],
  ["--rc-accent-text", "--rc-selected", "--rc-surface", MIN_TEXT],
  ["--rc-fg", "--rc-selected", "--rc-bg", MIN_BODY],
  ["--rc-fg", "--rc-selected", "--rc-surface", MIN_BODY],
  ["--rc-fg", "--rc-selected", "--rc-surface-raised", MIN_BODY],
];

export const CSS_BOUNDARIES: Array<[string, string | string[], number]> = [
  ["--rc-border-strong", "--rc-bg", MIN_NON_TEXTUAL],
  ["--rc-border-strong", "--rc-surface", MIN_NON_TEXTUAL],
  ["--rc-border-strong", "--rc-surface-raised", MIN_NON_TEXTUAL],
  ["--rc-ring", "--rc-bg", MIN_NON_TEXTUAL],
  ["--rc-ring", "--rc-surface", MIN_NON_TEXTUAL],
  ["--rc-danger", "--rc-surface", MIN_NON_TEXTUAL],
  ["--rc-surface-raised", "--rc-accent-text", MIN_NON_TEXTUAL],
  ["--rc-accent-text", ["--rc-skeleton", "--rc-bg"], MIN_NON_TEXTUAL],
  ["--rc-accent-text", ["--rc-skeleton", "--rc-surface"], MIN_NON_TEXTUAL],
  ["--rc-accent-text", ["--rc-skeleton", "--rc-surface-raised"], MIN_NON_TEXTUAL],
];

export const CSS_DISABLED_OVER = ["--rc-bg", "--rc-surface", "--rc-surface-raised"];

export const CSS_CHECKED = "--rc-accent-text";
export const CSS_UNCHECKED = "--rc-border-strong";
export const CSS_CHECKED_OVER = ["--rc-bg", "--rc-surface", "--rc-surface-raised"];

export const CSS_SERIES = Array.from({ length: 8 }, (_, index) => `--rc-chart-${index + 1}`);

function clippedHex(value: string): string {
  const color = readColor(value);
  return color ? hexOf(color) : value.trim();
}

function wideGamutNote(colors: ColorMap, strip: string): Finding | undefined {
  const wide = Object.entries(colors)
    .filter(([, value]) => outsideSrgb(value))
    .map(([name, value]) => `${name.replace(strip, "")} (${value.trim()} → ${clippedHex(value)})`);
  if (wide.length === 0) return undefined;
  return {
    ok: true,
    line:
      `  nota   ${wide.length} ${wide.length === 1 ? "papel descreve" : "papéis descrevem"} tom` +
      ` fora do sRGB. A tela corta o excedente canal por canal, e é o valor cortado que foi` +
      ` medido — o mesmo pixel que o navegador pinta: ${wide.join(", ")}`,
  };
}

export function checkThemeCss(name: string, tokens: ColorMap): Finding[] {
  const findings: Finding[] = [{ ok: true, line: `\n${name}` }];
  const wide = wideGamutNote(tokens, "--rc-");
  if (wide) findings.push(wide);
  const say = (ok: boolean, line: string) => findings.push({ ok, line: `  ${line}` });

  const series = CSS_SERIES.flatMap(
    (serie) =>
      [
        [serie, "--rc-bg", MIN_CHART],
        [serie, "--rc-surface", MIN_CHART],
      ] as Array<[string, string, number]>,
  );

  for (const [front, over, min] of [...CSS_PAIRS, ...series]) {
    const a = tokens[front];
    const b = tokens[over];
    if (!a || !b) {
      say(false, `FALTA  ${front} sobre ${over}`);
      continue;
    }
    if (!toHex(a) || !toHex(b)) {
      say(false, `FALHA  ${front} ou ${over} não resolveu para uma cor opaca que a conta lê`);
      continue;
    }
    const ratio = contrastRatio(a, b);
    const ok = ratio >= min;
    say(ok, `${ok ? "ok   " : "FALHA"} ${front} sobre ${over}  ${ratio.toFixed(2)}:1 (min ${min})`);
  }

  for (const [line, over, min] of CSS_BOUNDARIES) {
    const layers = Array.isArray(over) ? over : [over];
    const where = layers.join(" em ");
    const color = tokens[line];
    const background = stack(tokens, layers);
    if (!color || !background) {
      say(false, `FALTA  ${line} sobre ${where}`);
      continue;
    }
    const ratio = contrastRatio(compose(color, background), background);
    const ok = ratio >= min;
    say(
      ok,
      `${ok ? "ok   " : "FALHA"} ${line} sobre ${where}  ${ratio.toFixed(2)}:1 (min ${min}, 1.4.11)`,
    );
  }

  for (const over of CSS_DISABLED_OVER) {
    const disabled = tokens["--rc-border-disabled"];
    const live = tokens["--rc-border-strong"];
    const background = tokens[over];
    if (!disabled || !live || !background) {
      say(false, `FALTA  --rc-border-disabled sobre ${over}`);
      continue;
    }

    const ratio = contrastRatio(compose(disabled, background), background);
    const liveRatio = contrastRatio(compose(live, background), background);
    const visible = ratio >= MIN_DISABLED;
    const weaker = liveRatio / ratio >= LIVE_OVER_DISABLED;
    say(
      visible && weaker,
      `${visible && weaker ? "ok   " : "FALHA"} --rc-border-disabled sobre ${over}` +
        `  ${ratio.toFixed(2)}:1 (min ${MIN_DISABLED}, e a viva pesa` +
        ` ${(liveRatio / ratio).toFixed(2)}x, min ${LIVE_OVER_DISABLED}x)`,
    );
  }

  for (const over of CSS_CHECKED_OVER) {
    const on = tokens[CSS_CHECKED];
    const off = tokens[CSS_UNCHECKED];
    const background = tokens[over];
    if (!on || !off || !background) {
      say(false, `FALTA  ${CSS_CHECKED} sobre ${over}`);
      continue;
    }

    const onRatio = contrastRatio(compose(on, background), background);
    const offRatio = contrastRatio(compose(off, background), background);
    const visible = onRatio >= MIN_NON_TEXTUAL;
    const notWeaker = onRatio >= offRatio;
    say(
      visible && notWeaker,
      `${visible && notWeaker ? "ok   " : "FALHA"} ${CSS_CHECKED} sobre ${over}` +
        `  ${onRatio.toFixed(2)}:1 (min ${MIN_NON_TEXTUAL}, 1.4.11, e o controle marcado não` +
        ` pesa menos que o desmarcado, a ${offRatio.toFixed(2)}:1)`,
    );
  }

  for (const [front, subtle, underName, min] of CSS_COMPOSED_PAIRS) {
    const text = tokens[front];
    const alphaBackground = tokens[subtle];
    const under = tokens[underName];
    if (!text || !alphaBackground || !under) {
      say(false, `FALTA  ${front} sobre ${subtle}`);
      continue;
    }

    const background = compose(alphaBackground, under);
    const ratio = contrastRatio(text, background);
    const ok = ratio >= min;
    say(
      ok,
      `${ok ? "ok   " : "FALHA"} ${front} sobre ${subtle} em ${underName}` +
        `  ${ratio.toFixed(2)}:1 (min ${min})`,
    );
  }

  return findings;
}

export type Pair = { front: string; layers: string[]; min: number; note?: string };
export type LayerPair = { front: string; fill: string; alpha: number; min: number; note: string };

const BACKGROUNDS = ["bg", "surface", "surface-raised"];
const STATES = ["success", "warning", "danger", "info"];

export const MAP_PAIRS: Pair[] = [];

const pair = (front: string, layers: string[], min: number, note?: string) =>
  MAP_PAIRS.push({ front, layers, min, note });

for (const background of BACKGROUNDS) {
  pair("fg", [background], MIN_BODY);
  pair("fg-muted", [background], MIN_TEXT);
  pair("fg-subtle", [background], MIN_TEXT);
  pair("accent-text", [background], MIN_TEXT);
  for (const state of STATES) pair(`${state}-text`, [background], MIN_TEXT);

  pair("accent-text", ["accent-subtle", background], MIN_TEXT);
  pair("fg", ["accent-subtle", background], MIN_BODY);
  pair("fg", ["selected", background], MIN_BODY);
  for (const state of STATES) pair(`${state}-text`, [`${state}-subtle`, background], MIN_TEXT);
}

pair("accent-fg", ["accent"], MIN_TEXT);
for (const state of STATES) pair(`${state}-fg`, [state], MIN_TEXT);

pair("accent-fg", ["accent-active"], MIN_TEXT, "botão primário sob o dedo");

pair("fg", ["selected", "selected", "surface"], MIN_BODY, "dia do intervalo sob o dedo");

export const MAP_BOUNDARIES: Pair[] = [];

for (const background of BACKGROUNDS) {
  MAP_BOUNDARIES.push({ front: "border-strong", layers: [background], min: MIN_NON_TEXTUAL });
  for (const state of STATES) {
    if (background === "surface-raised") continue;
    MAP_BOUNDARIES.push({ front: state, layers: [background], min: MIN_NON_TEXTUAL });
  }
  for (let index = 1; index <= 8; index++) {
    if (background === "surface-raised") continue;
    MAP_BOUNDARIES.push({ front: `chart-${index}`, layers: [background], min: MIN_NON_TEXTUAL });
  }
}

MAP_BOUNDARIES.push({
  front: "border-strong",
  layers: ["selected", "surface"],
  min: MIN_NON_TEXTUAL,
  note: "hoje dentro do intervalo",
});

MAP_BOUNDARIES.push({
  front: "surface-raised",
  layers: ["accent-text"],
  min: MIN_NON_TEXTUAL,
  note: "tique e ponto dentro do preenchimento marcado",
});

for (const background of ["bg", "surface"]) {
  MAP_BOUNDARIES.push({
    front: "fg",
    layers: ["skeleton", background],
    min: MIN_NON_TEXTUAL,
    note: "pino do Slider dentro do trilho vazio",
  });
  MAP_BOUNDARIES.push({
    front: "border-strong",
    layers: ["skeleton", background],
    min: MIN_NON_TEXTUAL,
    note: "borda do pino do Slider dentro do trilho vazio",
  });
  MAP_BOUNDARIES.push({
    front: "accent-text",
    layers: ["skeleton", background],
    min: MIN_NON_TEXTUAL,
    note: "barra cheia do Meter e do Progress dentro do trilho",
  });
}

export const MAP_LAYER_PAIRS: LayerPair[] = [
  {
    front: "danger-fg",
    fill: "danger",
    alpha: 0.9,
    min: MIN_TEXT,
    note: "botão destrutivo sob o dedo (active:opacity-90)",
  },
];

export const MAP_CHECKED = "accent-text";
export const MAP_UNCHECKED = "border-strong";
export const MAP_CHECKED_OVER = ["bg", "surface", "surface-raised"];

export const WITHOUT_PAIR: Record<string, string> = {
  overlay:
    "Tarja atrás da folha e do diálogo. Nenhuma peça escreve nela: o conteúdo pousa em `surface`, que já é medido.",
  border:
    "Divisória fraca, decorativa. A fronteira que precisa ser percebida é `border-strong`, medida acima.",
  "fg-disabled": "Texto desabilitado, que a WCAG isenta.",
  "border-disabled":
    "Sem uso em `native/src`: o desabilitado no toque é `opacity-50` na camada inteira, e não um papel de cor. O par com piso e teto do web não tem o que medir aqui.",
  ring: "Não há foco de teclado no toque, e a classe não aparece em `native/src` uma vez sequer.",
  "accent-hover":
    "Não há ponteiro no toque. O estado que existe é o pressionado, medido em `accent-active`.",
  "line-hover": "Mesmo motivo do `accent-hover`.",
};

export const MEASURED_ROLES: string[] = (() => {
  const roles = new Set<string>();
  for (const item of [...MAP_PAIRS, ...MAP_BOUNDARIES]) {
    roles.add(item.front);
    for (const layer of item.layers) roles.add(layer);
  }
  for (const item of MAP_LAYER_PAIRS) {
    roles.add(item.front);
    roles.add(item.fill);
  }
  for (const role of [MAP_CHECKED, MAP_UNCHECKED, ...MAP_CHECKED_OVER]) roles.add(role);
  return [...roles];
})();

export const MAP_ROLES: string[] = [...new Set([...MEASURED_ROLES, ...Object.keys(WITHOUT_PAIR)])];

function solid(value: string | undefined, background: string): string | undefined {
  if (!value) return undefined;
  const composed = compose(value, background);
  return toHex(composed);
}

function stack(colors: ColorMap, layers: string[]): string | undefined {
  let background = toHex(colors[layers.at(-1)!] ?? "");
  if (!background) return undefined;
  for (let index = layers.length - 2; index >= 0; index--) {
    const next = solid(colors[layers[index]!], background);
    if (!next) return undefined;
    background = next;
  }
  return background;
}

function ratioOf(colors: ColorMap, item: Pair): number {
  const background = stack(colors, item.layers);
  if (!background) return Number.NaN;
  const front = solid(colors[item.front], background);
  if (!front) return Number.NaN;
  return contrastRatio(front, background);
}

function faded(value: string, alpha: number, background: string): string | undefined {
  const color = readColor(value);
  const under = readColor(background);
  if (!color || !under) return undefined;
  return blend(color, alpha * color.alpha, under);
}

const LAYER_OVER = ["bg", "surface"];

function layerRatio(colors: ColorMap, item: LayerPair): number {
  let worst = Number.POSITIVE_INFINITY;
  for (const background of LAYER_OVER) {
    const under = stack(colors, [background]);
    if (!under) return Number.NaN;
    const fill = faded(colors[item.fill] ?? "", item.alpha, under);
    const front = faded(colors[item.front] ?? "", item.alpha, under);
    if (!fill || !front) return Number.NaN;
    worst = Math.min(worst, contrastRatio(front, fill));
  }
  return worst;
}

export function checkThemeMap(
  name: string,
  map: ThemeMap,
  roles: readonly string[] = MAP_ROLES,
): Finding[] {
  const findings: Finding[] = [];
  const say = (ok: boolean, line: string) => findings.push({ ok, line: `  ${line}` });

  for (const scheme of ["light", "dark"] as const) {
    const colors = map[scheme];
    findings.push({ ok: true, line: `\n${name} / ${scheme}` });

    const wide = wideGamutNote(colors, "");
    if (wide) findings.push(wide);

    const missing = roles.filter((role) => !colors[role]);
    if (missing.length > 0) {
      say(
        false,
        `FALTA  ${missing.length} ${missing.length === 1 ? "papel" : "papéis"} sem valor: ` +
          missing.join(", "),
      );
    }

    for (const item of [...MAP_PAIRS, ...MAP_BOUNDARIES]) {
      const ratio = ratioOf(colors, item);
      const ok = ratio >= item.min;
      const where = item.layers.join(" em ");
      const norm = item.min === MIN_NON_TEXTUAL ? ", 1.4.11" : "";
      const why = item.note ? `  ${item.note}` : "";
      say(
        ok,
        `${ok ? "ok   " : "FALHA"} ${item.front} sobre ${where}  ` +
          `${Number.isNaN(ratio) ? "sem medida" : `${ratio.toFixed(2)}:1`}` +
          ` (min ${item.min}${norm})${why}`,
      );
    }

    for (const item of MAP_LAYER_PAIRS) {
      const worst = layerRatio(colors, item);
      const ok = worst >= item.min;
      say(
        ok,
        `${ok ? "ok   " : "FALHA"} ${item.front} sobre ${item.fill} a ${item.alpha * 100}%` +
          ` da camada  ${Number.isNaN(worst) ? "sem medida" : `${worst.toFixed(2)}:1`}` +
          ` (min ${item.min})  ${item.note}`,
      );
    }

    for (const over of MAP_CHECKED_OVER) {
      const on = ratioOf(colors, { front: MAP_CHECKED, layers: [over], min: MIN_NON_TEXTUAL });
      const off = ratioOf(colors, { front: MAP_UNCHECKED, layers: [over], min: MIN_NON_TEXTUAL });
      const ok = on >= MIN_NON_TEXTUAL && on >= off;
      say(
        ok,
        `${ok ? "ok   " : "FALHA"} ${MAP_CHECKED} sobre ${over}  ` +
          `${Number.isNaN(on) ? "sem medida" : `${on.toFixed(2)}:1`}` +
          ` (min ${MIN_NON_TEXTUAL}, 1.4.11)  trilho, caixa e círculo marcados, e eles não` +
          ` pesam menos que o desmarcado, a ${Number.isNaN(off) ? "sem medida" : `${off.toFixed(2)}:1`}`,
      );
    }
  }

  return findings;
}
