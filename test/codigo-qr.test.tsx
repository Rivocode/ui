import { expect, spyOn, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { QRCode, type QRCodeProps } from "../src/components/qr-code";
import { contrastRatio } from "../src/lib/contrast";
import { RivoProvider } from "../src/provider/rivo-provider";
import { encodeQr, type QrLevel } from "../src/shared/qr";
import { darkNearEdge, paintOf, readQr, shapesOf } from "./leitor-de-qr";

const PIX =
  "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D";

const THEMES = ["rivocode-light", "rivocode-dark"] as const;
type Theme = (typeof THEMES)[number];

function draw(props: Partial<QRCodeProps> & { value: string }, theme: Theme = "rivocode-dark") {
  const { container } = render(
    <RivoProvider scope="local" theme={theme}>
      <QRCode label="Código de teste" {...props} />
    </RivoProvider>,
  );
  const svg = container.querySelector("svg")!;
  const viewBox = Number(svg.getAttribute("viewBox")!.split(" ")[2]);
  const width = Number(svg.getAttribute("width"));
  return { container, svg, viewBox, width, shapes: shapesOf(svg) };
}

const text = (length: number) =>
  Array.from({ length }, (_, index) => "abcdefghijklmnopqrstuvwxyz0123456789"[(index * 7) % 36]).join("");

const CASES: Array<{ value: string; level: QrLevel; size: number }> = [
  { value: "https://rivocode.com.br", level: "L", size: 120 },
  { value: PIX, level: "M", size: 192 },
  { value: PIX, level: "Q", size: 240 },
  { value: PIX, level: "H", size: 256 },
  { value: "NFE 2508 1234 5678 9012 3456 5500 1000 0012 3410 0000 1234", level: "Q", size: 160 },
  { value: "35250812345678000190550010000012341000012345", level: "H", size: 160 },
  { value: "Pão de açúcar, café e maçã", level: "M", size: 200 },
  { value: text(600), level: "M", size: 480 },
  { value: text(1200), level: "L", size: 560 },
  { value: text(1000), level: "H", size: 720 },
];

for (const theme of THEMES) {
  for (const { value, level, size } of CASES) {
    test(`o svg rasterizado decodifica sem inverter, no ${theme}: ${value.length} caracteres, nivel ${level}, ${size}px`, () => {
      const { viewBox, width, shapes } = draw({ value, level, size }, theme);
      expect(width).toBe(size);
      expect(readQr(viewBox, width, shapes)).toBe(value);
    });
  }
}

test("a versao cresce com o texto e com o nivel, e o raster continua lendo", () => {
  const versions = CASES.map(({ value, level }) => encodeQr(value, level).version);
  expect(Math.min(...versions)).toBeLessThanOrEqual(3);
  expect(Math.max(...versions)).toBeGreaterThanOrEqual(25);
});

test("com logo e nivel H, o codigo com o centro apagado ainda decodifica", () => {
  for (const value of [PIX, text(300), "https://rivocode.com.br/pagar/8b3da2f39a4140d1"]) {
    const { container, viewBox, width, shapes } = draw({
      value,
      size: 320,
      logo: <span data-testid="marca">R</span>,
    });
    expect(container.querySelector("[data-testid='marca']")).not.toBeNull();
    expect(container.querySelector("[role='img']")!.getAttribute("data-level")).toBe("H");
    expect(readQr(viewBox, width, shapes)).toBe(value);
  }
});

test("o logo apaga os modulos do centro: o desenho com logo tem menos modulos que o sem", () => {
  const plain = draw({ value: PIX, level: "H" }).shapes.at(-1)!.d;
  const holed = draw({ value: PIX, logo: <span>R</span> }).shapes.at(-1)!.d;
  expect(holed.length).toBeLessThan(plain.length);
});

test("logo com nivel abaixo de H nao aparece, e o aviso diz por que", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  const { container } = draw({ value: PIX, level: "M", logo: <span data-testid="marca">R</span> });
  expect(container.querySelector("[data-testid='marca']")).toBeNull();
  expect(warn.mock.calls.flat().join(" ")).toContain('level="H"');
  warn.mockRestore();
});

test("a margem de silencio tem 4 modulos, pintada com o papel e sem modulo nenhum", () => {
  for (const theme of THEMES) {
    for (const value of ["a", PIX, text(500)]) {
      const { viewBox, shapes } = draw({ value, level: "M" }, theme);
      const matrix = encodeQr(value, "M");
      expect(viewBox).toBe(matrix.size + 8);
      expect(darkNearEdge(viewBox, viewBox * 4, shapes, 4)).toBe(false);
      expect(darkNearEdge(viewBox, viewBox * 4, shapes, 5)).toBe(true);
    }
  }
});

test("codigo lido por maquina e escuro sobre claro nos dois temas, com a mesma tinta e o mesmo papel", () => {
  const painted = THEMES.map((theme) => {
    const { svg } = draw({ value: PIX }, theme);
    const rect = svg.querySelector("rect")!;
    const path = svg.querySelector("path")!;
    expect(rect.getAttribute("class")!.split(" ")).toContain("fill-code-paper");
    expect(path.getAttribute("class")!.split(" ")).toContain("fill-code-ink");
    return { paper: paintOf(rect), ink: paintOf(path) };
  });

  expect(painted[0]).toEqual(painted[1]!);
  for (const { paper, ink } of painted) {
    expect(contrastRatio(ink, paper)).toBeGreaterThan(15);
    expect(contrastRatio(ink, "#000000")).toBeLessThan(contrastRatio(paper, "#000000"));
  }
});

test("a placa de papel tem canto arredondado, e o logo pousa no papel com a tinta do codigo", () => {
  const { container } = draw({ value: PIX, logo: <span>R</span> });
  const plate = container.querySelector("[role='img']")!.getAttribute("class")!.split(" ");
  expect(plate).toContain("rounded-md");
  expect(plate).toContain("bg-code-paper");
  expect(plate).toContain("overflow-hidden");

  const logo = container.querySelector("[role='img'] > div")!.getAttribute("class")!.split(" ");
  expect(logo).toContain("bg-code-paper");
  expect(logo).toContain("text-code-ink");
  expect(logo).not.toContain("bg-surface");
});

test("e uma imagem com nome, e o desenho fica fora da arvore de acessibilidade", () => {
  render(<QRCode value={PIX} label="QR Code Pix para Fulano de Tal" />);
  const image = screen.getByRole("img", { name: "QR Code Pix para Fulano de Tal" });
  expect(image.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  expect(image.textContent).toBe("");
});

test("sem valor, o quadrado guarda o lugar e nao desenha modulo nenhum", () => {
  const { svg, width } = draw({ value: "", size: 144 });
  expect(width).toBe(144);
  expect(svg.querySelector("path")).toBeNull();
  expect(svg.querySelector("rect")).not.toBeNull();
});

test("a versao 1 guarda 17, 14, 11 e 7 bytes, e a 40 guarda 2953 no L e 1273 no H", () => {
  const capacity: Record<QrLevel, number> = { L: 17, M: 14, Q: 11, H: 7 };
  for (const [level, bytes] of Object.entries(capacity) as Array<[QrLevel, number]>) {
    expect(encodeQr("x".repeat(bytes), level).version).toBe(1);
    expect(encodeQr("x".repeat(bytes + 1), level).version).toBe(2);
  }
  expect(encodeQr("x".repeat(2953), "L").version).toBe(40);
  expect(encodeQr("x".repeat(1273), "H").version).toBe(40);
  expect(() => encodeQr("x".repeat(2954), "L")).toThrow(RangeError);
  expect(() => encodeQr("x".repeat(1274), "H")).toThrow(RangeError);
});

test("numero e alfanumerico ocupam menos que byte: 41 digitos e 25 maiusculas cabem na versao 1-L", () => {
  expect(encodeQr("1".repeat(41), "L").version).toBe(1);
  expect(encodeQr("1".repeat(42), "L").version).toBe(2);
  expect(encodeQr("A".repeat(25), "L").version).toBe(1);
  expect(encodeQr("A".repeat(26), "L").version).toBe(2);
});

test("a versao 23 poe o alinhamento em 78, como a ISO/IEC 18004; o jsQR diz 74 e por isso nao le 23-L", () => {
  const { modules, version } = encodeQr(text(1050), "L");
  expect(version).toBe(23);
  const alignment = (cx: number, cy: number) =>
    [-2, -1, 0, 1, 2].every((dy) =>
      [-2, -1, 0, 1, 2].every(
        (dx) => modules[cy + dy]![cx + dx] === (Math.max(Math.abs(dx), Math.abs(dy)) !== 1),
      ),
    );
  for (const center of [6, 30, 54, 78, 102]) expect(alignment(center, 54)).toBe(true);
  expect(alignment(74, 54)).toBe(false);
});

test("cada uma das oito mascaras aparece em algum texto, e o codigo de cada uma decodifica", () => {
  const byMask = new Map<number, string>();
  for (let length = 1; length < 400 && byMask.size < 8; length++) {
    const value = text(length);
    const { mask } = encodeQr(value, "M");
    if (!byMask.has(mask)) byMask.set(mask, value);
  }
  expect(byMask.size).toBe(8);

  for (const value of byMask.values()) {
    const side = encodeQr(value, "M").size + 8;
    const { viewBox, width, shapes } = draw({ value, level: "M", size: side * 4 });
    expect(readQr(viewBox, width, shapes)).toBe(value);
  }
});
