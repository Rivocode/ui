#!/usr/bin/env node
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { readFileSync, writeFileSync } from "node:fs";

/**
 * Pré-compila o CSS que o app importa. Roda na raiz do app, onde vivem o
 * global.css e o postcss/tailwind dele: `npx rivocode-ui-native-css`, ou com
 * entrada e saída explícitas: `rivocode-ui-native-css meu.css saida.css`.
 * Mudou classe nova no código, roda de novo.
 *
 * Dois motivos para existir, os dois medidos:
 *
 * 1. O pipeline do metro roda o Tailwind com outra base e deixa @import para
 *    trás, e o compilador nativo explode neles.
 * 2. O Tailwind 4 declara as vars internas (--tw-*) via @property, e o
 *    compilador do react-native-css não lê initial-value de @property: a var
 *    fica órfã e a reserialização do lightningcss falha com "expected an
 *    object-like struct named Specifier". Aqui cada @property vira uma
 *    declaração em :root, que o inliner dele entende.
 */
const input = process.argv[2] ?? "global.css";
const output = process.argv[3] ?? "generated.css";

const css = readFileSync(input, "utf8");
const out = await postcss([tailwind({ base: process.cwd() })]).process(css, {
  from: input,
});

let flat = out.css;

const initials = [];
flat = flat.replace(
  /@property\s+(--[\w-]+)\s*\{[^}]*?\}/g,
  (block, name) => {
    const initial = /initial-value:\s*([^;}]+)/.exec(block)?.[1]?.trim();
    if (initial) initials.push(`  ${name}: ${initial};`);
    return "";
  },
);

if (initials.length > 0) {
  flat = `:root {\n${initials.join("\n")}\n}\n${flat}`;
}

// O bloco `@layer properties { @supports ... }` e o fallback do Tailwind para
// navegador antigo: no nativo e ruido, e as vars dele ja viraram :root acima.
// A remocao conta chaves, porque o bloco tem @supports aninhado.
flat = flat.replace(/@layer properties;\n?/g, "");
const layerAt = flat.indexOf("@layer properties {");
if (layerAt !== -1) {
  let depth = 0;
  let end = layerAt;
  for (let i = flat.indexOf("{", layerAt); i < flat.length; i++) {
    if (flat[i] === "{") depth++;
    if (flat[i] === "}") depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
  flat = flat.slice(0, layerAt) + flat.slice(end);
}

/**
 * Var orfa com fallback cai para o fallback, ate estabilizar: o compilador
 * nativo nao tolera referencia a var nunca declarada, nem com fallback -
 * e o Tailwind gera cadeias como `filter: var(--tw-blur,) var(--tw-sepia,)`.
 * Propriedade que ficar vazia sai junto.
 */
const declaredVars = () => new Set([...flat.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
for (let pass = 0; pass < 5; pass++) {
  const declared = declaredVars();
  const next = flat.replace(
    /var\((--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g,
    (whole, name, fallback) => {
      if (declared.has(name)) return whole;
      return fallback !== undefined ? fallback.trim() : whole;
    },
  );
  if (next === flat) break;
  flat = next;
}
flat = flat.replace(/^\s*[\w-]+:\s*;\n/gm, "");

// Guardrail: se sobrar var usada sem declaracao e sem fallback, o build FALHA
// aqui, com nome, em vez de falhar no metro com "failed to deserialize".
const declared = declaredVars();
const orphans = [...new Set([...flat.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))].filter(
  (name) => !declared.has(name),
);
if (orphans.length > 0) {
  console.error(`vars usadas sem declaracao nem fallback: ${orphans.join(", ")}`);
  process.exit(1);
}

writeFileSync(
  output,
  `/* Gerado por rivocode-ui-native-css a partir de ${input}. Nao editar. */\n${flat}`,
);
console.log(`${output}: ${flat.length} bytes, ${initials.length} @property viraram :root`);
