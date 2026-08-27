#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, readdirSync, watch } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = resolve(HERE, "..");
const REPO = resolve(APP, "..", "..");
const LIB = join(REPO, "native", "src");
const THEME = join(REPO, "native", "theme.css");
const BUILDER = join(REPO, "native", "scripts", "build-css.mjs");
const OUTPUT = join(APP, "generated.css");

const SKIP = new Set([
  "node_modules",
  ".expo",
  ".git",
  "dist",
  "web-build",
  "ios",
  "android",
  "assets",
  "patches",
  ".metro-health-check",
]);
const CODE = /\.(tsx?|jsx?|mjs|cjs)$/;
const WATCHED = /\.(tsx?|jsx?|mjs|cjs|css)$/;
const LITERAL = /"([^"\\\n]*(?:\\.[^"\\\n]*)*)"|'([^'\\\n]*(?:\\.[^'\\\n]*)*)'|`([^`\\]*(?:\\.[^`\\]*)*)`/g;
const SELECTOR = /\.((?:\\.|[A-Za-z0-9_-])+)/g;
const SHAPED = /^-?[a-z][a-z0-9]*(?:-[a-z0-9]|[:[/])/;
const DEBOUNCE = 80;

const argv = process.argv.slice(2);
const divider = argv.indexOf("--");
const flags = divider === -1 ? argv : argv.slice(0, divider);
const command = divider === -1 ? [] : argv.slice(divider + 1);
const watching = flags.includes("--watch") || flags.includes("-w");
const strict = flags.includes("--strict");

function walk(base, files = []) {
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = join(base, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && CODE.test(entry.name)) files.push(full);
  }
  return files;
}

function generatedClasses() {
  const names = new Set();
  for (const match of readFileSync(OUTPUT, "utf8").matchAll(SELECTOR)) {
    names.add(match[1].replace(/\\(.)/g, "$1"));
  }
  return names;
}

function missingClasses() {
  const generated = generatedClasses();
  const missing = new Map();
  for (const file of [...walk(APP), ...walk(LIB)]) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(LITERAL)) {
      const tokens = (match[1] ?? match[2] ?? match[3])
        .replace(/\$\{[^{}]*\}/g, " ")
        .split(/\s+/)
        .filter(Boolean);
      if (!tokens.some((token) => generated.has(token))) continue;
      for (const token of tokens) {
        if (generated.has(token) || token.endsWith("-") || token.includes("$")) continue;
        if (!SHAPED.test(token) || missing.has(token)) continue;
        const line = source.slice(0, match.index).split("\n").length;
        missing.set(token, `${relative(REPO, file)}:${line}`);
      }
    }
  }
  return missing;
}

function report() {
  const missing = missingClasses();
  for (const [token, where] of missing) {
    console.log(`  classe "${token}" usada e nao gerada  ${where}`);
  }
  return missing.size;
}

function build() {
  const started = Date.now();
  const run = spawnSync(process.execPath, [BUILDER], { cwd: APP, stdio: "inherit" });
  if (run.status !== 0) return run.status ?? 1;
  const missing = report();
  console.log(`${Date.now() - started} ms`);
  return strict && missing > 0 ? 1 : 0;
}

function relevant(base, name) {
  if (!name) return false;
  const full = join(base, name);
  if (full === OUTPUT) return false;
  if (name.split(sep).some((part) => SKIP.has(part))) return false;
  return WATCHED.test(name);
}

function startWatching() {
  let timer = null;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(`\n[${new Date().toTimeString().slice(0, 8)}] mudou, regerando`);
      build();
    }, DEBOUNCE);
  };
  watch(APP, { recursive: true }, (_event, name) => {
    if (relevant(APP, name)) rebuild();
  });
  watch(LIB, { recursive: true }, (_event, name) => {
    if (relevant(LIB, name)) rebuild();
  });
  watch(THEME, () => rebuild());
  console.log(`de olho em ${relative(REPO, APP)}, ${relative(REPO, LIB)} e ${relative(REPO, THEME)}`);
}

const status = build();

if (!watching) process.exit(status);

startWatching();

if (command.length > 0) {
  const child = spawn(command[0], command.slice(1), {
    cwd: APP,
    stdio: "inherit",
    env: { ...process.env, PATH: `${join(APP, "node_modules", ".bin")}:${process.env.PATH}` },
  });
  child.on("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 0)));
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => child.kill(signal));
  }
}
