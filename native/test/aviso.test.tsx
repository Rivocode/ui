import { describe, expect, mock, test } from "bun:test";
import { View } from "react-native";

import { Alert } from "../src";
import { tokens } from "../tokens";
import { act, byClass, byLabel, byRole, render, textOf } from "./helpers";

describe("Alert", () => {
  test("sem onDismiss nao ha botao, que continua sendo o padrao", () => {
    const screen = render(<Alert tone="warning" title="Certificado vence em 5 dias" />);
    expect(byRole(screen, "button")).toHaveLength(0);
  });

  test("onDismiss liga o xis, com Fechar aviso de nome", () => {
    const onDismiss = mock(() => {});
    const screen = render(
      <Alert tone="warning" title="Certificado vence em 5 dias" onDismiss={onDismiss} />,
    );
    const [close] = byLabel(screen, "Fechar aviso");
    expect(close!.props.accessibilityRole).toBe("button");
    act(() => close!.props.onPress());
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test("labels.dismiss troca o nome do xis", () => {
    const screen = render(
      <Alert title="Nota emitida" onDismiss={() => {}} labels={{ dismiss: "Dispensar o aviso" }} />,
    );
    expect(byLabel(screen, "Dispensar o aviso")).toHaveLength(1);
    expect(byLabel(screen, "Fechar aviso")).toHaveLength(0);
  });

  test("o xis pinta na cor do texto do tom", () => {
    const screen = render(<Alert tone="danger" title="Falhou" onDismiss={() => {}} />);
    const strokes = byClass(screen, /rotate-45/);
    expect(strokes).toHaveLength(2);
    for (const stroke of strokes) {
      expect(stroke.props.className.split(" ")).toContain("bg-danger-text");
      expect(stroke.props.className.split(" ")).not.toContain("bg-info-text");
    }
  });

  test("o icone fica escondido do leitor e o texto continua na tela", () => {
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

  test("a funcao do icone recebe a cor do texto do tom", () => {
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
