import { type Srgb, readColor } from "../lib/contrast";

export const DTCG_VERSION = "2025.10";
export const EXTENSION = "br.com.rivocode";
export const TOKEN_SUFFIX = ".tokens.json";
export const RESOLVER = "rivocode.resolver.json";

export type DtcgType =
  | "color"
  | "dimension"
  | "duration"
  | "cubicBezier"
  | "number"
  | "fontFamily"
  | "fontWeight"
  | "shadow";

export type DtcgToken = {
  $type: DtcgType;
  $value: unknown;
  $description?: string;
  $extensions?: Record<string, Record<string, unknown>>;
};

export type DtcgGroup = { [name: string]: DtcgGroup | DtcgToken | string };

export type Skipped = { scope: string; variable: string; value: string; reason: string };

export type CssSource = { file: string; css: string };

export type DtcgExport = {
  files: Record<string, object>;
  themes: string[];
  skipped: Skipped[];
  count: number;
};

type Rule = { at: boolean; selector: string; values: Map<string, string> };

type Entry = { path: string[]; token: DtcgToken };

type Scope = { name: string; entries: Map<string, Entry> };

function rules(css: string): Rule[] {
  const found = new Map<string, Rule>();
  const stack: string[] = [];
  let buffer = "";

  const close = () => {
    const hit = /^\s*--([\w-]+)\s*:([\s\S]*)$/.exec(buffer);
    buffer = "";
    const selector = stack[stack.length - 1];
    if (!hit || !selector) return;
    const key = stack.join(" >> ");
    const rule = found.get(key) ?? {
      at: stack.some((header) => header.startsWith("@")),
      selector,
      values: new Map<string, string>(),
    };
    rule.values.set(hit[1]!, hit[2]!.trim());
    found.set(key, rule);
  };

  for (const char of css.replace(/\/\*[\s\S]*?\*\//g, " ")) {
    if (char === "{") {
      stack.push(buffer.replace(/\s+/g, " ").trim());
      buffer = "";
    } else if (char === "}") {
      close();
      stack.pop();
    } else if (char === ";") {
      close();
    } else {
      buffer += char;
    }
  }

  return [...found.values()].filter((rule) => !rule.at);
}

const isRoot = (selector: string) => selector.split(",").some((part) => part.trim() === ":root");

const densitiesOf = (selector: string) =>
  [...selector.matchAll(/\[data-rc-density=["']([\w-]+)["']\]/g)].map((hit) => hit[1]!);

const themeOf = (selector: string) => /\[data-rc-theme=["']([\w-]+)["']\]/.exec(selector)?.[1];

function palettePath(name: string) {
  const parts = name.replace(/^rc-p-/, "").split("-");
  const last = parts[parts.length - 1]!;
  return /^\d+$/.test(last) && parts.length > 1
    ? ["palette", parts.slice(0, -1).join("-"), last]
    : ["palette", parts.join("-")];
}

function rolePath(name: string, type: DtcgType) {
  const bare = name.replace(/^rc-/, "");
  if (type === "color") return ["color", bare];
  const [head, ...rest] = bare.split("-");
  return [head!, rest.length > 0 ? rest.join("-") : "default"];
}

function substitute(value: string, lookups: ReadonlyArray<Map<string, string>>, depth = 0): string {
  if (depth > 12) return value;
  const next = value.replace(
    /var\(\s*--([\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))*[^()]*))?\)/g,
    (whole, name: string, fallback?: string) => {
      for (const lookup of lookups) {
        const hit = lookup.get(name);
        if (hit !== undefined) return hit;
      }
      return fallback?.trim() ?? whole;
    },
  );
  return next === value ? value : substitute(next, lookups, depth + 1);
}

const round = (value: number, places = 4) => Math.round(value * 10 ** places) / 10 ** places;

const byte = (value: number) => Math.min(255, Math.max(0, Math.round(value)));

function colorValue(color: Srgb) {
  const channels = [color.red, color.green, color.blue].map(byte);
  const value: Record<string, unknown> = {
    colorSpace: "srgb",
    components: channels.map((channel) => round(channel / 255)),
  };
  if (color.alpha < 1) value.alpha = round(color.alpha);
  value.hex = `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  return value;
}

function splitTop(value: string, separator: RegExp) {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (depth === 0 && separator.test(char)) {
      if (current.trim()) parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function dimension(value: string) {
  const hit = /^(-?[\d.]+)(px|rem)?$/.exec(value);
  if (!hit || (hit[2] === undefined && Number(hit[1]) !== 0)) return undefined;
  return { value: Number(hit[1]), unit: hit[2] ?? "px" };
}

function shadowValue(value: string) {
  const layers: Array<Record<string, unknown>> = [];
  for (const layer of splitTop(value, /,/)) {
    const words = splitTop(layer, /\s/);
    const lengths: Array<{ value: number; unit: string }> = [];
    let color: Srgb | undefined;
    let inset = false;
    for (const word of words) {
      if (word === "inset") inset = true;
      else if (dimension(word)) lengths.push(dimension(word)!);
      else color = readColor(word);
    }
    if (!color || lengths.length < 2 || lengths.length > 4) return undefined;
    const zero = { value: 0, unit: "px" };
    layers.push({
      color: colorValue(color),
      offsetX: lengths[0],
      offsetY: lengths[1],
      blur: lengths[2] ?? zero,
      spread: lengths[3] ?? zero,
      ...(inset ? { inset: true } : {}),
    });
  }
  if (layers.length === 0) return undefined;
  return layers.length === 1 ? layers[0] : layers;
}

type Typed =
  | { token: Omit<DtcgToken, "$extensions">; original?: string }
  | { reason: string };

function typed(name: string, literal: string): Typed {
  const bare = name.replace(/^rc-/, "");

  if (literal === "none" || literal === "initial" || literal === "") {
    return {
      reason:
        "vazio de propósito: o gancho existe para o tema que quiser usá-lo, e 'none' não tem tipo no DTCG",
    };
  }

  if (bare.startsWith("font-")) {
    const families = splitTop(literal, /,/).map((family) => family.replace(/^["']|["']$/g, ""));
    return { token: { $type: "fontFamily", $value: families.length === 1 ? families[0] : families } };
  }

  if (bare.startsWith("weight-") && /^\d+$/.test(literal)) {
    return { token: { $type: "fontWeight", $value: Number(literal) } };
  }

  if (/^(shadow|glow)-|^accent-shadow$/.test(bare)) {
    const shadow = shadowValue(literal);
    return shadow
      ? { token: { $type: "shadow", $value: shadow } }
      : { reason: "sombra que não se decompõe em deslocamento, desfoque, espalhamento e cor" };
  }

  const color = readColor(literal);
  if (color) return { token: { $type: "color", $value: colorValue(color) } };

  const curve = /^cubic-bezier\(([^)]+)\)$/.exec(literal);
  if (curve) {
    const points = curve[1]!.split(",").map((point) => Number(point.trim()));
    if (points.length === 4 && points.every(Number.isFinite)) {
      return { token: { $type: "cubicBezier", $value: points } };
    }
  }

  const length = /^(-?[\d.]+)(px|rem)$/.exec(literal);
  if (length) {
    return { token: { $type: "dimension", $value: { value: Number(length[1]), unit: length[2] } } };
  }

  const time = /^([\d.]+)(ms|s)$/.exec(literal);
  if (time) {
    return { token: { $type: "duration", $value: { value: Number(time[1]), unit: time[2] } } };
  }

  if (/^-?[\d.]+$/.test(literal)) return { token: { $type: "number", $value: Number(literal) } };

  const em = /^(-?[\d.]+)em$/.exec(literal);
  if (em) {
    return {
      token: {
        $type: "number",
        $value: Number(em[1]),
        $description: "Em em: multiplica o tamanho da fonte. O DTCG só aceita px e rem em dimensão.",
      },
      original: literal,
    };
  }

  const fluid = /^clamp\(([\s\S]+)\)$/.exec(literal);
  if (fluid) {
    const top = splitTop(fluid[1]!, /,/)[2];
    const size = top ? /^(-?[\d.]+)(px|rem)$/.exec(top) : null;
    if (size) {
      return {
        token: {
          $type: "dimension",
          $value: { value: Number(size[1]), unit: size[2] },
          $description:
            "Fluido no CSS, entre o mínimo e o máximo do clamp(). Aqui vai o máximo, que é o tamanho da tela larga.",
        },
        original: literal,
      };
    }
  }

  if (literal.startsWith("linear(")) {
    return {
      reason:
        "a curva de mola é linear(), e o DTCG só tem curva cubic-bezier: a mola sai pelos números de amortecimento e rigidez, em spring.*",
    };
  }

  return { reason: "não tem tipo no DTCG 2025.10" };
}

function nest(entries: Iterable<Entry>, description: string): DtcgGroup {
  const root: DtcgGroup = { $description: description };
  for (const { path, token } of entries) {
    let group = root;
    for (const step of path.slice(0, -1)) {
      group[step] ??= {};
      group = group[step] as DtcgGroup;
    }
    group[path[path.length - 1]!] = token;
  }
  return root;
}

export function exportDtcg(house: string, clientThemes: CssSource[] = []): DtcgExport {
  const houseRules = rules(house);
  const clientRules = clientThemes.flatMap((source) => rules(source.css));

  const rootValues = new Map<string, string>();
  const densityValues = new Map<string, Map<string, string>>();
  const densityNames = new Set<string>();

  for (const rule of houseRules) {
    const densities = densitiesOf(rule.selector);
    if (isRoot(rule.selector)) {
      for (const [name, value] of rule.values) rootValues.set(name, value);
    }
    for (const density of densities) {
      const into = densityValues.get(density) ?? new Map<string, string>();
      for (const [name, value] of rule.values) {
        into.set(name, value);
        densityNames.add(name);
      }
      densityValues.set(density, into);
    }
  }

  const clientRoot = new Map<string, string>();
  for (const rule of clientRules) {
    if (isRoot(rule.selector)) for (const [name, value] of rule.values) clientRoot.set(name, value);
  }

  const themeRules = new Map<string, Map<string, string>>();
  for (const rule of clientThemes.length > 0 ? clientRules : houseRules) {
    const theme = themeOf(rule.selector);
    if (!theme) continue;
    const into = themeRules.get(theme) ?? new Map<string, string>();
    for (const [name, value] of rule.values) if (name.startsWith("rc-")) into.set(name, value);
    themeRules.set(theme, into);
  }

  const skipped: Skipped[] = [];

  const palette: Scope = { name: "palette", entries: new Map() };
  const scales: Scope = { name: "scales", entries: new Map() };

  const place = (
    scope: Scope,
    name: string,
    value: string,
    lookups: Array<Map<string, string>>,
    path: (type: DtcgType) => string[],
    reach: Scope[],
  ) => {
    const literal = substitute(value, lookups);
    const result = typed(name, literal);
    if ("reason" in result) {
      skipped.push({ scope: scope.name, variable: `--${name}`, value, reason: result.reason });
      return;
    }
    const extension: Record<string, unknown> = { css: `--${name}` };
    if (result.original) extension.value = result.original;
    const token: DtcgToken = { ...result.token, $extensions: { [EXTENSION]: extension } };

    const reference = /^var\(\s*--([\w-]+)\s*\)$/.exec(value);
    if (reference) {
      for (const target of reach) {
        const hit = target.entries.get(reference[1]!);
        if (hit && hit.token.$type === token.$type) {
          token.$value = `{${hit.path.join(".")}}`;
          break;
        }
      }
    }

    scope.entries.set(name, { path: path(token.$type), token });
  };

  for (const [name, value] of rootValues) {
    if (!name.startsWith("rc-") || densityNames.has(name)) continue;
    if (name.startsWith("rc-p-")) {
      place(palette, name, value, [rootValues], () => palettePath(name), []);
    }
  }
  for (const [name, value] of rootValues) {
    if (!name.startsWith("rc-") || densityNames.has(name) || name.startsWith("rc-p-")) continue;
    place(scales, name, value, [rootValues], (type) => rolePath(name, type), [palette]);
  }

  const densities: Scope[] = [];
  const comfortable = densityValues.get("comfortable") ?? new Map<string, string>();
  for (const [density, values] of densityValues) {
    const merged = new Map([...comfortable, ...values]);
    const scope: Scope = { name: `density-${density}`, entries: new Map() };
    for (const [name, value] of merged) {
      place(scope, name, value, [merged, rootValues], (type) => rolePath(name, type), [palette]);
    }
    densities.push(scope);
  }

  const themes: Scope[] = [];
  for (const [theme, values] of themeRules) {
    const scope: Scope = { name: theme, entries: new Map() };
    const lookups = [values, clientRoot, rootValues];
    const order = [...values.keys()].sort(
      (one, other) => Number(/^var\(/.test(values.get(one)!) && !/^var\(--rc-p-/.test(values.get(one)!)) -
        Number(/^var\(/.test(values.get(other)!) && !/^var\(--rc-p-/.test(values.get(other)!)),
    );
    for (const name of order) {
      place(scope, name, values.get(name)!, lookups, (type) => rolePath(name, type), [
        scope,
        palette,
        scales,
      ]);
    }
    const sorted = new Map([...values.keys()].filter((name) => scope.entries.has(name)).map((name) => [name, scope.entries.get(name)!]));
    scope.entries = sorted;
    themes.push(scope);
  }

  const file = (scope: Scope) => `${scope.name}${TOKEN_SUFFIX}`;
  const files: Record<string, object> = {
    [file(palette)]: nest(
      palette.entries.values(),
      "Camada 1 do @rivocode/ui: a paleta crua. Nenhuma peça lê daqui; os papéis do tema apontam para cá.",
    ),
    [file(scales)]: nest(
      scales.entries.values(),
      "Escala e forma do @rivocode/ui: tipografia, altura de linha, empilhamento, foco, raio, espaçamento de letra, peso e movimento. Não mudam com o tema de cor.",
    ),
  };
  for (const scope of densities) {
    files[file(scope)] = nest(
      scope.entries.values(),
      `Densidade ${scope.name.replace(/^density-/, "")}: altura de controle, respiro de painel e de item. Os dois arquivos de densidade têm os mesmos tokens, e servem de modo um ao outro.`,
    );
  }
  for (const scope of themes) {
    files[file(scope)] = nest(
      scope.entries.values(),
      `Camada 3, o tema ${scope.name}: os papéis que as peças pintam. Os aliases apontam para a paleta e para a escala; carregue os dois arquivos junto.`,
    );
  }

  const contexts = (scopes: Scope[]) =>
    Object.fromEntries(scopes.map((scope) => [scope.name.replace(/^density-/, ""), [{ $ref: file(scope) }]]));

  const modifiers: Record<string, object> = {};
  if (densities.length > 0) {
    modifiers.density = {
      description: "A mesma tela em duas alturas.",
      contexts: contexts(densities),
      default: densityValues.has("comfortable") ? "comfortable" : densities[0]!.name.replace(/^density-/, ""),
    };
  }
  if (themes.length > 0) {
    modifiers.theme = {
      description: "O tema de cor. O tema vem por último, e por isso vence a forma que ele redefinir.",
      contexts: contexts(themes),
      default: themes[0]!.name,
    };
  }

  files[RESOLVER] = {
    $schema: `https://www.designtokens.org/schemas/${DTCG_VERSION}/resolver.json`,
    name: "@rivocode/ui",
    version: DTCG_VERSION,
    sets: {
      base: {
        description: "Paleta, escala e forma: o que todo tema herda.",
        sources: [{ $ref: file(palette) }, { $ref: file(scales) }],
      },
    },
    modifiers,
    resolutionOrder: [
      { $ref: "#/sets/base" },
      ...Object.keys(modifiers).map((modifier) => ({ $ref: `#/modifiers/${modifier}` })),
    ],
  };

  const count = [palette, scales, ...densities, ...themes].reduce(
    (total, scope) => total + scope.entries.size,
    0,
  );

  return { files, themes: themes.map((scope) => scope.name), skipped, count };
}
