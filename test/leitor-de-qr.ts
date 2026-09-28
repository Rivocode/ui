import { readFileSync } from "node:fs";
import { join } from "node:path";

import jsQR from "jsqr";

import { readColor, readTokens } from "../src/lib/contrast";

export type Shape = { d: string; color: string };

const TOKENS = join(import.meta.dir, "../src/tokens");
const read = (file: string) => readFileSync(join(TOKENS, file), "utf8");
const ROOT = read("palette.css") + "\n" + read("scales.css");
const THEMES = new Map<string, Record<string, string>>();

function tokensOf(theme: string | null) {
  const key = theme ?? "";
  const known = THEMES.get(key);
  if (known) return known;
  const found = readTokens(theme ? `${ROOT}\n${read(`themes/${theme}.css`)}` : ROOT);
  THEMES.set(key, found);
  return found;
}

export function paintOf(node: Element) {
  const fill = (node.getAttribute("class") ?? "").split(" ").find((name) => name.startsWith("fill-"));
  if (!fill) throw new Error(`<${node.tagName}> sem classe fill-*: a cor nao sai de token`);
  const theme = node.closest("[data-rc-theme]")?.getAttribute("data-rc-theme") ?? null;
  const color = tokensOf(theme)[`--rc-${fill.slice("fill-".length)}`];
  if (!color || !readColor(color)) {
    throw new Error(`${fill} nao resolve para cor ${theme ? `no tema ${theme}` : "sem tema montado"}`);
  }
  return color;
}

export function shapesOf(svg: Element): Shape[] {
  return [...svg.querySelectorAll("rect, path")].map((node) => ({
    color: paintOf(node),
    d:
      node.tagName.toLowerCase() === "rect"
        ? `M0 0H${node.getAttribute("width")}V${node.getAttribute("height")}H0Z`
        : node.getAttribute("d")!,
  }));
}

type Edge = { x0: number; y0: number; x1: number; y1: number };

function edgesOf(d: string) {
  const edges: Edge[] = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;

  const line = (toX: number, toY: number) => {
    if (toY !== y) edges.push({ x0: x, y0: y, x1: toX, y1: toY });
    x = toX;
    y = toY;
  };

  for (const [, command, rest] of d.matchAll(/([MmHhVvLlZz])([^MmHhVvLlZz]*)/g)) {
    const numbers = (rest!.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
    switch (command) {
      case "M":
      case "m": {
        const relative = command === "m";
        x = relative ? x + numbers[0]! : numbers[0]!;
        y = relative ? y + numbers[1]! : numbers[1]!;
        startX = x;
        startY = y;
        for (let index = 2; index + 1 < numbers.length; index += 2) {
          line(relative ? x + numbers[index]! : numbers[index]!, relative ? y + numbers[index + 1]! : numbers[index + 1]!);
        }
        break;
      }
      case "L":
      case "l":
        for (let index = 0; index + 1 < numbers.length; index += 2) {
          line(command === "l" ? x + numbers[index]! : numbers[index]!, command === "l" ? y + numbers[index + 1]! : numbers[index + 1]!);
        }
        break;
      case "H":
      case "h":
        for (const value of numbers) line(command === "h" ? x + value : value, y);
        break;
      case "V":
      case "v":
        for (const value of numbers) line(x, command === "v" ? y + value : value);
        break;
      default:
        line(startX, startY);
    }
  }
  return edges;
}

export function rasterize(viewBox: number, width: number, shapes: Shape[]) {
  const pixels = new Uint8ClampedArray(width * width * 4);
  for (let index = 0; index < pixels.length; index += 4) {
    pixels[index] = pixels[index + 1] = pixels[index + 2] = 128;
    pixels[index + 3] = 255;
  }

  const scale = viewBox / width;
  for (const shape of shapes) {
    const edges = edgesOf(shape.d);
    const paint = readColor(shape.color);
    if (!paint) throw new Error(`cor que o leitor nao entende: ${shape.color}`);
    const tone = [paint.red, paint.green, paint.blue].map(Math.round);

    for (let row = 0; row < width; row++) {
      const at = (row + 0.5) * scale;
      const crossings: Array<{ x: number; winding: number }> = [];
      for (const edge of edges) {
        const down = edge.y0 <= at && at < edge.y1;
        const up = edge.y1 <= at && at < edge.y0;
        if (!down && !up) continue;
        const x = edge.x0 + ((at - edge.y0) / (edge.y1 - edge.y0)) * (edge.x1 - edge.x0);
        crossings.push({ x, winding: down ? 1 : -1 });
      }
      crossings.sort((one, other) => one.x - other.x);

      let winding = 0;
      for (let index = 0; index < crossings.length - 1; index++) {
        winding += crossings[index]!.winding;
        if (winding === 0) continue;
        const from = Math.max(0, Math.ceil(crossings[index]!.x / scale - 0.5));
        const to = Math.min(width - 1, Math.ceil(crossings[index + 1]!.x / scale - 0.5) - 1);
        for (let column = from; column <= to; column++) {
          const pixel = (row * width + column) * 4;
          pixels[pixel] = tone[0]!;
          pixels[pixel + 1] = tone[1]!;
          pixels[pixel + 2] = tone[2]!;
        }
      }
    }
  }
  return pixels;
}

export function readQr(viewBox: number, width: number, shapes: Shape[]) {
  const pixels = rasterize(viewBox, width, shapes);
  return jsQR(pixels, width, width, { inversionAttempts: "dontInvert" })?.data ?? null;
}

export function darkNearEdge(viewBox: number, width: number, shapes: Shape[], margin: number) {
  const pixels = rasterize(viewBox, width, shapes);
  const paper = readColor(shapes[0]!.color)!;
  const tone = [paper.red, paper.green, paper.blue].map(Math.round);
  const band = Math.floor((margin / viewBox) * width);
  for (let row = 0; row < width; row++) {
    for (let column = 0; column < width; column++) {
      const inside = row >= band && row < width - band && column >= band && column < width - band;
      const at = (row * width + column) * 4;
      if (inside) continue;
      if (tone.some((part, channel) => pixels[at + channel] !== part)) return true;
    }
  }
  return false;
}
