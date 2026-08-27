import { readFileSync } from "node:fs";

const COMPILED_CSS = new URL("../../examples/native/generated.css", import.meta.url);

type Sheet = {
  declarations: Map<string, number>;
  values: Map<string, string>;
  rules: { className: string; declarations: Map<string, string> }[];
};

let cached: Sheet | undefined;
let source: string | undefined;

function withoutAtRules(css: string): string {
  const kept: string[] = [];
  let at = 0;
  while (at < css.length) {
    if (css[at] !== "@") {
      kept.push(css[at]!);
      at += 1;
      continue;
    }
    let depth = 0;
    while (at < css.length) {
      const char = css[at];
      at += 1;
      if (char === "{") depth += 1;
      else if (char === "}") {
        depth -= 1;
        if (depth === 0) break;
      } else if (char === ";" && depth === 0) break;
    }
  }
  return kept.join("");
}

function declarationsOf(body: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const piece of body.split(";")) {
    const colon = piece.indexOf(":");
    if (colon < 0) continue;
    found.set(piece.slice(0, colon).trim(), piece.slice(colon + 1).trim());
  }
  return found;
}

export function compiledCss(): string {
  source ??= readFileSync(COMPILED_CSS, "utf8");
  return source;
}

export function dressCompiledCss(css: string | undefined) {
  source = css;
  cached = undefined;
}

function parseSheet(): Sheet {
  const css = compiledCss().replace(/\/\*[\s\S]*?\*\//g, "");

  const declarations = new Map<string, number>();
  const values = new Map<string, string>();
  for (const hit of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const name = hit[1]!;
    declarations.set(name, (declarations.get(name) ?? 0) + 1);
    values.set(name, hit[2]!.replace(/\s+/g, " ").trim());
  }

  const rules: Sheet["rules"] = [];
  for (const hit of withoutAtRules(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const body = declarationsOf(hit[2]!);
    for (const selector of hit[1]!.split(",")) {
      const single = /^\.((?:\\.|[^\s:>+~,\\])+)$/.exec(selector.trim());
      if (single) rules.push({ className: single[1]!.replace(/\\/g, ""), declarations: body });
    }
  }

  return { declarations, values, rules };
}

function sheet(): Sheet {
  cached ??= parseSheet();
  return cached;
}

function splitTop(args: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let at = 0; at < args.length; at++) {
    const char = args[at];
    if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    else if (char === "," && depth === 0) {
      parts.push(args.slice(start, at).trim());
      start = at + 1;
    }
  }
  parts.push(args.slice(start).trim());
  return parts;
}

function resolveValue(value: string, vars: Record<string, string>, scheme: "light" | "dark") {
  const { declarations, values } = sheet();
  let current = value;

  for (let pass = 0; pass < 6; pass++) {
    const next = current
      .replace(/var\((--[\w-]+)\s*(?:,([^()]*))?\)/g, (whole, name: string, fallback?: string) => {
        const inlined = declarations.get(name) === 1;
        const live = vars[name];
        if (!inlined && live !== undefined) return live;
        return values.get(name) ?? fallback?.trim() ?? whole;
      })
      .replace(/light-dark\(((?:[^()]|\([^()]*\))*)\)/g, (whole, args: string) => {
        const pair = splitTop(args);
        return (scheme === "light" ? pair[0] : pair[1]) ?? whole;
      });
    if (next === current) break;
    current = next;
  }

  return current.replace(/\s+/g, " ").trim();
}

export function variableDeclarations(): Map<string, number> {
  return new Map(sheet().declarations);
}

export function declaredColor(
  worn: Iterable<string>,
  property: string,
  scheme: "light" | "dark",
  vars: Record<string, string> = {},
): string | undefined {
  const names = new Set(worn);

  let declared: string | undefined;
  for (const rule of sheet().rules) {
    if (!names.has(rule.className)) continue;
    const found = rule.declarations.get(property);
    if (found !== undefined) declared = found;
  }

  return declared === undefined ? undefined : resolveValue(declared, vars, scheme);
}
