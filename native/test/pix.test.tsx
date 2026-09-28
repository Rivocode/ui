import { expect, mock, test } from "bun:test";
import { createElement } from "react";
import { AccessibilityInfo, Text } from "react-native";

import type { PixCodeLabels } from "../src/chart";

import { buildPixPayload, isValidPixKey, parsePixPayload, RivoProvider } from "../src";
import { act, byLabel, byRole, byType, render, textOf } from "./helpers";
import { readQr, type Shape } from "../../test/qr-reader";

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

test("the pure functions cross over through the mirror, with the manual's example and the DICT keys", () => {
  expect(
    buildPixPayload({ key: "123e4567-e12b-12d1-a456-426655440000", name: "Fulano de Tal", city: "BRASILIA" }),
  ).toBe(STATIC);
  expect(parsePixPayload(PAYLOAD)!.amount).toBe(1284.5);
  expect(parsePixPayload(`${STATIC.slice(0, -4)}0000`)).toBeNull();
  expect(isValidPixKey("+5561912345678")).toBe(true);
  expect(isValidPixKey("529.982.247-25")).toBe(false);
});

for (const theme of ["rivocode-light", "rivocode-dark"] as const) {
  test(`the PixCode QR decodes without inverting into its own copy-and-paste code, in ${theme}`, () => {
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

test("amount and receiver come from the code, without Intl, and the image name says both", () => {
  const screen = render(<PixCode payload={PAYLOAD} />);
  expect(textOf(screen)).toContain("R$ 1.284,50");
  expect(textOf(screen)).toContain("para Clinica Sao Lucas");
  expect(byLabel(screen, "QR Code Pix de R$ 1.284,50 para Clinica Sao Lucas")).toHaveLength(1);
});

test("copy comes from outside, receives the copy-and-paste code and disappears when there is nothing to copy", () => {
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

test("a code with a wrong crc becomes a notice, not a QR", () => {
  const screen = render(<PixCode payload={`${STATIC.slice(0, -4)}0000`} />);
  expect(byRole(screen, "alert")).toHaveLength(1);
  expect(byRole(screen, "image")).toHaveLength(0);
});

test("expired removes the QR and offers to generate another", () => {
  const onRenew = mock(() => {});
  const screen = render(<PixCode payload={PAYLOAD} expired onRenew={onRenew} />);
  expect(byRole(screen, "image")).toHaveLength(0);
  expect(textOf(screen)).toContain("Este código Pix expirou.");
  expect(textOf(screen)).not.toContain(PAYLOAD);

  const [renew] = byRole(screen, "button");
  act(() => renew!.props.onPress());
  expect(onRenew).toHaveBeenCalledTimes(1);
});

test("loading holds the place and says it is busy", () => {
  const screen = render(<PixCode payload="" loading />);
  const busy = screen.root.findAll(
    (node) => typeof node.type === "string" && node.props.accessibilityState?.busy === true,
  );
  expect(busy.length).toBeGreaterThan(0);
  expect(byRole(screen, "image")).toHaveLength(0);
  expect(byRole(screen, "alert")).toHaveLength(0);
});

const spoken = AccessibilityInfo as unknown as {
  announced: readonly string[];
  clearAnnouncements: () => void;
};

test("a copy-and-paste code with surrounding spaces goes trimmed to the QR, the screen and copy", () => {
  const renderCopy = mock((_payload: string) => <Text>copiar</Text>);
  const screen = render(<PixCode payload={`\n  ${PAYLOAD} \n`} size={240} renderCopy={renderCopy} />);
  const [svg] = byType(screen, "Svg");
  const viewBox = Number(String(svg!.props.viewBox).split(" ")[2]);
  const shapes: Shape[] = [...byType(screen, "Rect"), ...byType(screen, "Path")].map((node) => ({
    color: String(node.props.fill),
    d: node.type === "Rect" ? `M0 0H${node.props.width}V${node.props.height}H0Z` : String(node.props.d),
  }));

  expect(readQr(viewBox, 240, shapes)).toBe(PAYLOAD);
  expect(renderCopy).toHaveBeenCalledWith(PAYLOAD);
  expect(byType(screen, "Text").some((node) => node.props.children === PAYLOAD)).toBe(true);
});

test("every text of the piece comes from labels, including the receiver's \"para\" and the QR name", () => {
  const labels: Partial<PixCodeLabels> = {
    receiver: (name) => `to ${name}`,
    code: (amount, receiver) => `Pix QR ${amount ?? ""} ${receiver ?? ""}`.trim(),
  };
  const screen = render(<PixCode payload={PAYLOAD} labels={labels} />);
  expect(textOf(screen)).toContain("to Clinica Sao Lucas");
  expect(byLabel(screen, "Pix QR R$ 1.284,50 Clinica Sao Lucas")).toHaveLength(1);
});

test("expiring, loading and finishing loading are spoken to the screen reader", () => {
  spoken.clearAnnouncements();
  const screen = render(<PixCode payload="" loading />);
  expect(spoken.announced).toEqual(["Gerando o código Pix…"]);

  act(() => screen.update(<RivoProvider><PixCode payload={PAYLOAD} /></RivoProvider>));
  expect(spoken.announced).toEqual(["Gerando o código Pix…", "Código Pix pronto."]);

  act(() => screen.update(<RivoProvider><PixCode payload={PAYLOAD} expired /></RivoProvider>));
  expect(spoken.announced).toEqual([
    "Gerando o código Pix…",
    "Código Pix pronto.",
    "Este código Pix expirou.",
  ]);
});
