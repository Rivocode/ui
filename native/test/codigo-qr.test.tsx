import { expect, mock, spyOn, test } from "bun:test";
import { createElement } from "react";
import { Text } from "react-native";
import type { ReactTestRenderer } from "react-test-renderer";

import { tokens } from "../tokens";
import { byLabel, byRole, byType, render } from "./helpers";
import { readQr, type Shape } from "../../test/leitor-de-qr";

mock.module("react-native-svg", () => {
  const host = (name: string) => (props: Record<string, unknown>) => createElement(name, props);

  return {
    default: host("Svg"),
    Svg: host("Svg"),
    Circle: host("Circle"),
    Line: host("Line"),
    Path: host("Path"),
    Rect: host("Rect"),
    G: host("G"),
    Text: host("SvgText"),
  };
});

const { QRCode } = await import("../src/chart/qr-code");

const PIX =
  "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D";

const THEMES = ["rivocode-light", "rivocode-dark"] as const;

function shapesOf(screen: ReactTestRenderer) {
  const [svg] = byType(screen, "Svg");
  const viewBox = Number(String(svg!.props.viewBox).split(" ")[2]);
  const width = Number(svg!.props.width);
  const shapes: Shape[] = [];
  for (const node of [...byType(screen, "Rect"), ...byType(screen, "Path")]) {
    const d =
      node.type === "Rect"
        ? `M0 0H${node.props.width}V${node.props.height}H0Z`
        : String(node.props.d);
    shapes.push({ d, color: String(node.props.fill) });
  }
  return { viewBox, width, shapes };
}

for (const theme of THEMES) {
  test(`o desenho nativo decodifica sem inverter no ${theme}, em varios tamanhos e niveis`, () => {
    const cases = [
      { value: PIX, level: "M", size: 200 },
      { value: PIX, level: "H", size: 260 },
      { value: "https://rivocode.com.br", level: "L", size: 120 },
      { value: "35250812345678000190550010000012341000012345", level: "Q", size: 160 },
    ] as const;

    for (const { value, level, size } of cases) {
      const screen = render(<QRCode value={value} label="Código" level={level} size={size} />, {
        theme,
      });
      const { viewBox, width, shapes } = shapesOf(screen);
      expect(width).toBe(size);
      expect(readQr(viewBox, width, shapes)).toBe(value);
    }
  });
}

test("codigo lido por maquina e tinta sobre papel fixos, iguais nos dois temas, e nunca fg sobre surface", () => {
  for (const theme of THEMES) {
    const screen = render(<QRCode value={PIX} label="Código" logo={<Text>R</Text>} />, { theme });
    expect(byType(screen, "Path")[0]!.props.fill).toBe(tokens.code["code-ink"]);
    expect(byType(screen, "Rect")[0]!.props.fill).toBe(tokens.code["code-paper"]);
    expect(byType(screen, "Path")[0]!.props.fill).not.toBe(tokens.themes[theme].fg);
    const plates = byLabel(screen, "Código");
    expect(String(plates[0]!.props.className).split(" ")).toContain("rounded-md");
  }
});

test("e uma imagem com o nome do label", () => {
  const screen = render(<QRCode value={PIX} label="QR Code Pix para Fulano de Tal" />);
  expect(byRole(screen, "image")).toHaveLength(1);
  expect(byLabel(screen, "QR Code Pix para Fulano de Tal")).toHaveLength(1);
});

test("com logo o nivel vira H, o centro e apagado e o codigo ainda decodifica", () => {
  const screen = render(
    <QRCode value={PIX} label="Código" size={300} logo={<Text>R</Text>} />,
    { theme: "rivocode-light" },
  );
  const { viewBox, width, shapes } = shapesOf(screen);
  expect(readQr(viewBox, width, shapes)).toBe(PIX);

  const plain = render(<QRCode value={PIX} label="Código" level="H" size={300} />, {
    theme: "rivocode-light",
  });
  expect(String(byType(screen, "Path")[0]!.props.d).length).toBeLessThan(
    String(byType(plain, "Path")[0]!.props.d).length,
  );
});

test("logo com nivel abaixo de H nao aparece, e o aviso diz por que", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  const screen = render(<QRCode value={PIX} label="Código" level="Q" logo={<Text>R</Text>} />);
  expect(byType(screen, "Text").some((node) => node.props.children === "R")).toBe(false);
  expect(warn.mock.calls.flat().join(" ")).toContain('level="H"');
  warn.mockRestore();
});

test("sem valor, o quadrado guarda o lugar com traco pontilhado na superficie, e nao com a placa branca", () => {
  const screen = render(<QRCode value="" label="Código" size={144} />);
  const [image] = byRole(screen, "image");
  const classes = String(image!.props.className).split(" ");

  expect(byType(screen, "Path")).toHaveLength(0);
  expect(image!.props.style.width).toBe(144);
  expect(image!.props.style.height).toBe(144);
  expect(image!.props.style.backgroundColor).toBeUndefined();
  expect(classes).toContain("border-dashed");
  expect(classes).toContain("bg-surface");
});

test("texto que nao cabe em QR nenhum desenha o aviso no lugar, sem derrubar a arvore, e avisa em dev", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  try {
    const screen = render(<QRCode value={"a".repeat(5000)} label="QR Code da nota" size={160} />);
    const [image] = byRole(screen, "image");

    expect(byType(screen, "Path")).toHaveLength(0);
    expect(String(image!.props.accessibilityLabel)).toContain("QR Code da nota");
    expect(String(image!.props.accessibilityLabel)).toContain("longo demais");
    expect(String(image!.props.className).split(" ")).toContain("border-dashed");
    expect(warn.mock.calls.flat().join(" ")).toContain("QRCode");

    const other = render(
      <QRCode value={"a".repeat(5000)} label="Outro" labels={{ tooLong: "Too long." }} />,
    );
    expect(byType(other, "Text").some((node) => node.props.children === "Too long.")).toBe(true);
  } finally {
    warn.mockRestore();
  }
});
