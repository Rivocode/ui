/* Gerado de src/shared/signature.ts por bun run gen:compartilhado. Nao editar. */

export type SignaturePoint = {
  x: number;
  y: number;
  time: number;
  pressure?: number;
};

export type SignatureStroke = SignaturePoint[];

export type SignatureValue =
  | { kind: "drawn"; strokes: SignatureStroke[]; width: number; height: number }
  | { kind: "typed"; text: string; font: string; width: number; height: number };

export type SignatureSvgOptions = {
  ink: string;
  paper?: string;
};

export type SignaturePadLabels = {
  group: string;
  placeholder: string;
  instruction: string;
  undo: string;
  clear: string;
  typeMode: string;
  drawMode: string;
  typedName: string;
  empty: string;
  drawn: (strokes: number) => string;
  typed: (text: string) => string;
  undone: string;
  cleared: string;
};

export const SIGNATURE_LABELS: SignaturePadLabels = {
  group: "Assinatura",
  placeholder: "Assine aqui",
  instruction:
    "Desenhe a assinatura com o dedo, a caneta ou o mouse. Se preferir, use Digitar assinatura e escreva o nome.",
  undo: "Desfazer o último traço",
  clear: "Limpar assinatura",
  typeMode: "Digitar assinatura",
  drawMode: "Desenhar assinatura",
  typedName: "Nome para a assinatura",
  empty: "Nenhuma assinatura",
  drawn: (strokes) => `Assinatura desenhada, ${strokes} ${strokes === 1 ? "traço" : "traços"}`,
  typed: (text) => `Assinatura digitada: ${text}`,
  undone: "Último traço desfeito",
  cleared: "Assinatura limpa",
};

export const SIGNATURE_WIDTH = 600;

export const SIGNATURE_BASELINE = 0.72;

export const SIGNATURE_FONT =
  '"Dancing Script", "Great Vibes", "Snell Roundhand", "Segoe Script", "Brush Script MT", cursive';

const MIN_GAP = 1.5;
const THIN = 1.3;
const THICK = 4.4;
const FAST = 2.8;
const EASE = 0.6;

const round = (value: number) => Math.round(value * 100) / 100;

export function signatureSize(ratio = 3): { width: number; height: number } {
  const safe = Number.isFinite(ratio) && ratio > 0 ? ratio : 3;
  return { width: SIGNATURE_WIDTH, height: Math.round(SIGNATURE_WIDTH / safe) };
}

export function isSignatureEmpty(value: SignatureValue | null | undefined): boolean {
  if (!value) return true;
  if (value.kind === "typed") return value.text.trim() === "";
  return !value.strokes.some((stroke) => stroke.length > 0);
}

export function extendStroke(stroke: SignatureStroke, point: SignaturePoint): SignatureStroke {
  const last = stroke[stroke.length - 1];
  if (last && Math.hypot(point.x - last.x, point.y - last.y) < MIN_GAP) return stroke;
  return [...stroke, point];
}

export function strokeWidths(stroke: SignatureStroke): number[] {
  let speed = 0;
  const raw = stroke.map((point, index) => {
    const before = stroke[index - 1];
    if (before) {
      const elapsed = point.time - before.time;
      const distance = Math.hypot(point.x - before.x, point.y - before.y);
      if (elapsed > 0) speed = EASE * (distance / elapsed) + (1 - EASE) * speed;
    }
    const eased = THICK - (THICK - THIN) * Math.min(1, speed / FAST);
    const pressed =
      point.pressure === undefined ? 1 : 0.55 + 0.9 * Math.min(1, Math.max(0, point.pressure));
    return eased * pressed;
  });

  return raw.map((width, index) => {
    const around = [raw[index - 1], width, raw[index + 1]].filter(
      (value): value is number => value !== undefined,
    );
    return around.reduce((sum, value) => sum + value, 0) / around.length;
  });
}

function dot(x: number, y: number, radius: number): string {
  const r = round(radius);
  return (
    `M${round(x - radius)} ${round(y)}` +
    `A${r} ${r} 0 1 0 ${round(x + radius)} ${round(y)}` +
    `A${r} ${r} 0 1 0 ${round(x - radius)} ${round(y)}Z`
  );
}

type Spot = { x: number; y: number };

function side(points: Spot[]): string {
  if (points.length < 3) return points.map((spot) => `L${round(spot.x)} ${round(spot.y)}`).join("");
  let path = "";
  for (let index = 1; index < points.length - 1; index++) {
    const here = points[index]!;
    const next = points[index + 1]!;
    path +=
      `Q${round(here.x)} ${round(here.y)} ` + `${round((here.x + next.x) / 2)} ${round((here.y + next.y) / 2)}`;
  }
  const last = points[points.length - 1]!;
  return path + `L${round(last.x)} ${round(last.y)}`;
}

export function strokePath(stroke: SignatureStroke): string {
  const first = stroke[0];
  if (!first) return "";
  const widths = strokeWidths(stroke);
  const span = stroke.reduce((total, point, index) => {
    const before = stroke[index - 1];
    return before ? total + Math.hypot(point.x - before.x, point.y - before.y) : total;
  }, 0);
  if (stroke.length === 1 || span < MIN_GAP) {
    return dot(first.x, first.y, Math.max(...widths) / 2);
  }

  const left: Spot[] = [];
  const right: Spot[] = [];
  stroke.forEach((point, index) => {
    const from = stroke[Math.max(0, index - 1)]!;
    const to = stroke[Math.min(stroke.length - 1, index + 1)]!;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const radius = widths[index]! / 2;
    const nx = (-dy / length) * radius;
    const ny = (dx / length) * radius;
    left.push({ x: point.x + nx, y: point.y + ny });
    right.push({ x: point.x - nx, y: point.y - ny });
  });

  const end = widths[widths.length - 1]! / 2;
  const start = widths[0]! / 2;
  const back = right.slice().reverse();
  const tail = back[0]!;
  const head = left[0]!;

  return (
    `M${round(head.x)} ${round(head.y)}` +
    side(left) +
    `A${round(end)} ${round(end)} 0 0 0 ${round(tail.x)} ${round(tail.y)}` +
    side(back) +
    `A${round(start)} ${round(start)} 0 0 0 ${round(head.x)} ${round(head.y)}Z`
  );
}

export function signaturePaths(strokes: SignatureStroke[]): string[] {
  return strokes.map(strokePath).filter((path) => path !== "");
}

export type TypedLayout = {
  x: number;
  y: number;
  fontSize: number;
  fit?: number;
};

export function typedLayout(text: string, width: number, height: number): TypedLayout {
  const room = width * 0.84;
  const natural = height * 0.46;
  const floor = height * 0.2;
  const estimate = Math.max(1, text.trim().length) * natural * 0.46;
  const fontSize = estimate > room ? Math.max(floor, (natural * room) / estimate) : natural;
  const needed = Math.max(1, text.trim().length) * fontSize * 0.46;
  return {
    x: round(width / 2),
    y: round(height * SIGNATURE_BASELINE - height * 0.05),
    fontSize: round(fontSize),
    fit: needed > room ? round(room) : undefined,
  };
}

export function escapeMarkup(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function signatureSvg(value: SignatureValue | null, options: SignatureSvgOptions): string {
  if (!value || isSignatureEmpty(value)) return "";
  const { width, height } = value;
  const ink = escapeMarkup(options.ink);
  const paper = options.paper
    ? `<rect width="${width}" height="${height}" fill="${escapeMarkup(options.paper)}"/>`
    : "";

  let body: string;
  if (value.kind === "typed") {
    const layout = typedLayout(value.text, width, height);
    const fit = layout.fit ? ` textLength="${layout.fit}" lengthAdjust="spacingAndGlyphs"` : "";
    body =
      `<text x="${layout.x}" y="${layout.y}" font-family="${escapeMarkup(value.font)}"` +
      ` font-size="${layout.fontSize}" text-anchor="middle" fill="${ink}"${fit}>` +
      `${escapeMarkup(value.text.trim())}</text>`;
  } else {
    body = signaturePaths(value.strokes)
      .map((path) => `<path d="${path}" fill="${ink}"/>`)
      .join("");
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"` +
    ` width="${width}" height="${height}">${paper}${body}</svg>`
  );
}
