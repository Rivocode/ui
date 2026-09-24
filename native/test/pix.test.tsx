import { expect, mock, test } from "bun:test";
import { createElement } from "react";
import { Text } from "react-native";

import { buildPixPayload, isValidPixKey, parsePixPayload } from "../src";
import { act, byLabel, byRole, byType, render, textOf } from "./helpers";
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
  };
});

const { PixCode } = await import("../src/chart/pix-code");

const STATIC =
  "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D";

const PAYLOAD = buildPixPayload({
  key: "+5583988112233",
  name: "Clínica São Lucas",
  city: "João Pessoa",
  amount: 1284.5,
  txid: "NF4813",
});

test("as funcoes puras atravessam pelo espelho, com o exemplo do manual e as chaves do DICT", () => {
  expect(
    buildPixPayload({ key: "123e4567-e12b-12d1-a456-426655440000", name: "Fulano de Tal", city: "BRASILIA" }),
  ).toBe(STATIC);
  expect(parsePixPayload(PAYLOAD)!.amount).toBe(1284.5);
  expect(parsePixPayload(`${STATIC.slice(0, -4)}0000`)).toBeNull();
  expect(isValidPixKey("+5561912345678")).toBe(true);
  expect(isValidPixKey("529.982.247-25")).toBe(false);
});

for (const theme of ["rivocode-light", "rivocode-dark"] as const) {
  test(`o QR do PixCode decodifica sem inverter no proprio copia e cola, no ${theme}`, () => {
    const screen = render(<PixCode payload={PAYLOAD} size={240} />, { theme });
    const [svg] = byType(screen, "Svg");
    const viewBox = Number(String(svg!.props.viewBox).split(" ")[2]);
    const shapes: Shape[] = [...byType(screen, "Rect"), ...byType(screen, "Path")].map((node) => ({
      color: String(node.props.fill),
      d: node.type === "Rect" ? `M0 0H${node.props.width}V${node.props.height}H0Z` : String(node.props.d),
    }));
    expect(readQr(viewBox, 240, shapes)).toBe(PAYLOAD);
  });
}

test("valor e recebedor saem do codigo, sem Intl, e o nome da imagem diz os dois", () => {
  const screen = render(<PixCode payload={PAYLOAD} />);
  expect(textOf(screen)).toContain("R$ 1.284,50");
  expect(textOf(screen)).toContain("para Clinica Sao Lucas");
  expect(byLabel(screen, "QR Code Pix de R$ 1.284,50 para Clinica Sao Lucas")).toHaveLength(1);
});

test("o copiar vem de fora, recebe o copia e cola e some quando nao ha o que copiar", () => {
  const renderCopy = mock((payload: string) => <Text>copiar {payload.length}</Text>);
  const screen = render(<PixCode payload={PAYLOAD} renderCopy={renderCopy} />);
  expect(renderCopy).toHaveBeenCalledWith(PAYLOAD);
  expect(textOf(screen)).toContain(`copiar ${PAYLOAD.length}`);

  renderCopy.mockClear();
  render(<PixCode payload={PAYLOAD} renderCopy={renderCopy} expired />);
  render(<PixCode payload="" renderCopy={renderCopy} loading />);
  render(<PixCode payload={`${STATIC.slice(0, -4)}0000`} renderCopy={renderCopy} />);
  expect(renderCopy).not.toHaveBeenCalled();
});

test("codigo com crc errado vira aviso, e nao QR", () => {
  const screen = render(<PixCode payload={`${STATIC.slice(0, -4)}0000`} />);
  expect(byRole(screen, "alert")).toHaveLength(1);
  expect(byRole(screen, "image")).toHaveLength(0);
});

test("expirado tira o QR e oferece gerar outro", () => {
  const onRenew = mock(() => {});
  const screen = render(<PixCode payload={PAYLOAD} expired onRenew={onRenew} />);
  expect(byRole(screen, "image")).toHaveLength(0);
  expect(textOf(screen)).toContain("Este código Pix expirou.");
  expect(textOf(screen)).not.toContain(PAYLOAD);

  const [renew] = byRole(screen, "button");
  act(() => renew!.props.onPress());
  expect(onRenew).toHaveBeenCalledTimes(1);
});

test("carregando marca o lugar e diz que esta ocupado", () => {
  const screen = render(<PixCode payload="" loading />);
  const busy = screen.root.findAll(
    (node) => typeof node.type === "string" && node.props.accessibilityState?.busy === true,
  );
  expect(busy.length).toBeGreaterThan(0);
  expect(byRole(screen, "image")).toHaveLength(0);
  expect(byRole(screen, "alert")).toHaveLength(0);
});
