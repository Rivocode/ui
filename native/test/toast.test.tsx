import { describe, expect, mock, test } from "bun:test";
import { View } from "react-native";

import { Alert } from "../src";
import { tokens } from "../tokens";
import { act, byClass, byLabel, byRole, render, textOf } from "./helpers";

describe("Alert", () => {
  test("without onDismiss there is no button, which stays the default", () => {
    const screen = render(<Alert tone="warning" title="Certificado vence em 5 dias" />);
    expect(byRole(screen, "button")).toHaveLength(0);
  });

  test("onDismiss turns on the x, named Fechar aviso", () => {
    const onDismiss = mock(() => {});
    const screen = render(
      <Alert tone="warning" title="Certificado vence em 5 dias" onDismiss={onDismiss} />,
    );
    const [close] = byLabel(screen, "Fechar aviso");
    expect(close!.props.accessibilityRole).toBe("button");
    act(() => close!.props.onPress());
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test("labels.dismiss changes the x's name", () => {
    const screen = render(
      <Alert title="Nota emitida" onDismiss={() => {}} labels={{ dismiss: "Dispensar o aviso" }} />,
    );
    expect(byLabel(screen, "Dispensar o aviso")).toHaveLength(1);
    expect(byLabel(screen, "Fechar aviso")).toHaveLength(0);
  });

  test("the x paints in the tone's text color", () => {
    const screen = render(<Alert tone="danger" title="Falhou" onDismiss={() => {}} />);
    const strokes = byClass(screen, /rotate-45/);
    expect(strokes).toHaveLength(2);
    for (const stroke of strokes) {
      expect(stroke.props.className.split(" ")).toContain("bg-danger-text");
      expect(stroke.props.className.split(" ")).not.toContain("bg-info-text");
    }
  });

  test("the icon stays hidden from the screen reader and the text stays on screen", () => {
    const screen = render(
      <Alert title="Nota emitida" icon={<View testID="glifo" />}>
        O PDF chega por e-mail.
      </Alert>,
    );
    const glyph = screen.root.findByProps({ testID: "glifo" });
    let hidden = false;
    for (let node = glyph.parent; node; node = node.parent) {
      if (node.props?.accessibilityElementsHidden) hidden = true;
    }
    expect(hidden).toBe(true);
    expect(textOf(screen)).toContain("Nota emitida");
    expect(textOf(screen)).toContain("O PDF chega por e-mail.");
  });

  test("the icon function receives the tone's text color", () => {
    const seen: { color: string; size: number }[] = [];
    render(
      <Alert
        tone="success"
        title="Pago"
        icon={(glyph) => {
          seen.push(glyph);
          return null;
        }}
      />,
    );
    expect(seen).toHaveLength(1);
    expect(seen[0]!.size).toBe(16);
    expect(seen[0]!.color).toBe(tokens.themes["rivocode-dark"]["success-text"]);
  });
});
