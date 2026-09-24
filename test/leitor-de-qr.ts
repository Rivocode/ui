import jsQR from "jsqr";

export type Shape = { d: string; dark: boolean };

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
    const tone = shape.dark ? 0 : 255;

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
          pixels[pixel] = pixels[pixel + 1] = pixels[pixel + 2] = tone;
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
  const band = Math.floor((margin / viewBox) * width);
  for (let row = 0; row < width; row++) {
    for (let column = 0; column < width; column++) {
      const inside = row >= band && row < width - band && column >= band && column < width - band;
      if (!inside && pixels[(row * width + column) * 4] !== 255) return true;
    }
  }
  return false;
}
