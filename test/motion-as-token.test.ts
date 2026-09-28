import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { __unstable__loadDesignSystem } from "tailwindcss";

const shape = readFileSync("src/tokens/forma.css", "utf8");
const contract = readFileSync("src/tokens/contract.css", "utf8");

const rootBlock = shape.slice(shape.indexOf(":root"), shape.indexOf("}"));
const reducedBlock = shape.slice(shape.indexOf("@media (prefers-reduced-motion"));

const declared = (css: string) =>
  new Map([...css.matchAll(/(--rc-[\w-]+):\s*([^;]+);/g)].map((hit) => [hit[1]!, hit[2]!.trim()]));

const root = declared(rootBlock);
const reduced = declared(reducedBlock);

const SETTLED = 0.001;
const SAMPLES = 40;

function position(damping: number, stiffness: number, seconds: number) {
  const natural = Math.sqrt(stiffness);
  if (damping >= 1) return 1 - Math.exp(-natural * seconds) * (1 + natural * seconds);
  const damped = natural * Math.sqrt(1 - damping * damping);
  const decay = damping * natural;
  return (
    1 -
    Math.exp(-decay * seconds) * (Math.cos(damped * seconds) + (decay / damped) * Math.sin(damped * seconds))
  );
}

function settleMs(damping: number, stiffness: number) {
  let last = 0;
  for (let ms = 1; ms < 5000; ms++) {
    if (Math.abs(1 - position(damping, stiffness, ms / 1000)) >= SETTLED) last = ms;
  }
  return Math.ceil((last + 1) / 10) * 10;
}

function springCurve(damping: number, stiffness: number, ms: number) {
  const points = Array.from({ length: SAMPLES + 1 }, (_, index) =>
    index === SAMPLES ? 1 : Math.round(position(damping, stiffness, ((index / SAMPLES) * ms) / 1000) * 1000) / 1000,
  );
  return `linear(${points.join(", ")})`;
}

const FAMILIES = [...root.keys()]
  .map((name) => /^--rc-spring-([\w]+)-stiffness$/.exec(name)?.[1])
  .filter((family): family is string => family !== undefined);

test("every spring in forma.css is the math of its own stiffness and its own damping", () => {
  expect(FAMILIES).toEqual(["spatial", "expressive", "effects"]);

  const wrong: string[] = [];
  for (const family of FAMILIES) {
    const damping = Number(root.get(`--rc-spring-${family}-damping`));
    const stiffness = Number(root.get(`--rc-spring-${family}-stiffness`));
    expect(damping).toBeGreaterThan(0);
    expect(stiffness).toBeGreaterThan(0);

    const ms = settleMs(damping, stiffness);
    const curve = springCurve(damping, stiffness, ms);
    if (root.get(`--rc-duration-${family}`) !== `${ms}ms`) {
      wrong.push(`  --rc-duration-${family}: ${ms}ms;`);
    }
    if (root.get(`--rc-ease-${family}`) !== curve) wrong.push(`  --rc-ease-${family}: ${curve};`);
  }

  expect(wrong).toEqual([]);
});

test("the spatial spring overshoots the target and comes back, and the effects spring arrives without overshooting", () => {
  const peak = (family: string) =>
    Math.max(
      ...root
        .get(`--rc-ease-${family}`)!
        .replace(/^linear\(|\)$/g, "")
        .split(",")
        .map(Number),
    );
  expect(peak("expressive")).toBeGreaterThan(1.01);
  expect(peak("spatial")).toBeGreaterThan(1);
  expect(peak("spatial")).toBeLessThan(peak("expressive"));
  expect(peak("effects")).toBe(1);
});

test("every duration in forma.css drops to zero when the person asks for reduced motion", () => {
  const durations = [...root.keys()].filter((name) => name.startsWith("--rc-duration-"));
  expect(durations.length).toBeGreaterThanOrEqual(7);
  for (const name of durations) expect(reduced.get(name)).toBe("0ms");
  expect([...reduced.keys()].sort()).toEqual(durations.sort());
});

test("every duration and every curve becomes a utility in the Tailwind contract", () => {
  const durations = [...root.keys()].filter((name) => name.startsWith("--rc-duration-"));
  const curves = [...root.keys()].filter((name) => name.startsWith("--rc-ease"));
  expect(curves.length).toBeGreaterThanOrEqual(7);

  for (const name of durations) {
    const step = name.replace("--rc-duration-", "");
    expect(contract).toContain(`--transition-duration-${step}: var(${name});`);
  }
  for (const name of curves) {
    const utility = name === "--rc-ease" ? "--ease-rc" : name.replace("--rc-ease-", "--ease-rc-");
    expect(contract).toContain(`${utility}: var(${name});`);
  }
});

async function loadStylesheet(id: string, base: string) {
  let path = isAbsolute(id) ? id : resolve(base, id);
  if (!id.startsWith(".") && !isAbsolute(id)) {
    path = join(process.cwd(), "node_modules", id);
    if (!(await Bun.file(path).exists())) path = join(process.cwd(), "node_modules", id, "index.css");
  }
  return { path, base: dirname(path), content: await Bun.file(path).text() };
}

test("Tailwind compiles the duration and the curve by the intent name", async () => {
  const system = await __unstable__loadDesignSystem(readFileSync("src/styles.css", "utf8"), {
    base: resolve("src"),
    loadStylesheet,
    loadModule: () => Promise.reject(new Error("no plugin")),
  });

  const [fast, spatial, enter, springy] = system.candidatesToCss([
    "duration-fast",
    "duration-spatial",
    "ease-rc-enter",
    "ease-rc-spatial",
  ]);

  expect(fast).toContain("transition-duration: var(--rc-duration-fast)");
  expect(spatial).toContain("transition-duration: var(--rc-duration-spatial)");
  expect(enter).toContain("transition-timing-function: var(--rc-ease-enter)");
  expect(springy).toContain("transition-timing-function: var(--rc-ease-spatial)");
});

test("native receives the cubic curves and the spring numbers, and not the linear()", async () => {
  const { tokens } = await import("../native/tokens");
  const easings = tokens.easings as Record<string, readonly number[]>;
  const scales = tokens.scales as Record<string, number>;

  expect(easings["ease-enter"]).toEqual([0.05, 0.7, 0.1, 1]);
  expect(easings["ease-exit"]).toEqual([0.3, 0, 0.8, 0.15]);
  expect(Object.keys(easings)).not.toContain("ease-spatial");
  for (const family of FAMILIES) {
    expect(scales[`spring-${family}-stiffness`]).toBe(Number(root.get(`--rc-spring-${family}-stiffness`)));
    expect(scales[`duration-${family}`]).toBeGreaterThan(0);
  }
});
