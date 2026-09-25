import { describe, expect, mock, test } from "bun:test";
import { createElement } from "react";

import { Checkbox, OTPField, Switch } from "../src";
import { forChecked, forDate, forText, forValue } from "../src/form";
import { byRole, byType, render } from "./helpers";

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

const { SignaturePad } = await import("../src/chart");

const noop = () => {};

describe("o nome da peca entra por label", () => {
  test("Checkbox sem texto ao lado e nomeado pelo label", () => {
    const screen = render(
      <Checkbox label="Selecionar a nota 4813" checked onCheckedChange={noop} />,
    );
    const [box] = byRole(screen, "checkbox");
    expect(box!.props.accessibilityLabel).toBe("Selecionar a nota 4813");
  });

  test("Checkbox com texto ao lado fala o texto, e o label troca o nome quando vem", () => {
    const plain = render(
      <Checkbox checked onCheckedChange={noop}>
        Enviar o PDF
      </Checkbox>,
    );
    expect(byRole(plain, "checkbox")[0]!.props.accessibilityLabel).toBeUndefined();

    const named = render(
      <Checkbox label="Aceito os termos" checked onCheckedChange={noop}>
        Li e aceito
      </Checkbox>,
    );
    expect(byRole(named, "checkbox")[0]!.props.accessibilityLabel).toBe("Aceito os termos");
  });

  test("Switch sem texto ao lado leva o label ao interruptor da plataforma", () => {
    const screen = render(<Switch label="Notificar por e-mail" checked onCheckedChange={noop} />);
    const [control] = byType(screen, "Switch");
    expect(control!.props.accessibilityLabel).toBe("Notificar por e-mail");
  });

  test("Switch com texto ao lado nomeia a linha, e nao o interruptor de dentro", () => {
    const screen = render(
      <Switch label="Notificar por e-mail" checked onCheckedChange={noop}>
        E-mail
      </Switch>,
    );
    expect(byRole(screen, "switch")[0]!.props.accessibilityLabel).toBe("Notificar por e-mail");
    expect(byType(screen, "Switch")[0]!.props.accessibilityLabel).toBeUndefined();
  });

  test("OTPField troca o nome padrao pelo label", () => {
    const fallback = render(<OTPField value="" onValueChange={noop} />);
    const spoken = byType(fallback, "TextInput")[0]!.props.accessibilityLabel;
    expect(spoken).toBe("Código de 6 dígitos");

    const named = render(<OTPField label="Código do SMS" value="" onValueChange={noop} />);
    expect(byType(named, "TextInput")[0]!.props.accessibilityLabel).toBe("Código do SMS");
  });

  test("SignaturePad abre o nome do grupo com o label, e sem ele com labels.group", () => {
    const group = (screen: ReturnType<typeof render>) =>
      byType(screen, "View").find((node) => /: /.test(String(node.props.accessibilityLabel ?? "")));

    const named = render(<SignaturePad label="Assinatura do locatário" value={null} />);
    const spoken = String(group(named)!.props.accessibilityLabel);
    expect(spoken).toStartWith("Assinatura do locatário: ");

    const fallback = render(<SignaturePad value={null} />);
    expect(String(group(fallback)!.props.accessibilityLabel)).toStartWith("Assinatura: ");
  });
});

describe("os adaptadores entregam o rotulo no nome que a peca le", () => {
  const row = {
    name: "field" as const,
    value: undefined,
    onChange: mock(noop),
    onBlur: mock(noop),
    ref: mock(noop),
    disabled: undefined,
    accessibilityLabel: "Campo",
    invalid: false,
  };

  test("forChecked e forDate dao label, e nao o accessibilityLabel que a peca ignora", () => {
    for (const props of [forChecked(row as never), forDate(row as never)]) {
      expect(props).toMatchObject({ label: "Campo" });
      expect(Object.keys(props)).not.toContain("accessibilityLabel");
    }
  });

  test("forValue da os dois: label para a peca, accessibilityLabel para o TextInput", () => {
    expect(forValue(row as never)).toMatchObject({ label: "Campo", accessibilityLabel: "Campo" });
  });

  test("forText fica no accessibilityLabel, porque o Input e o TextInput", () => {
    const props = forText(row as never);
    expect(props.accessibilityLabel).toBe("Campo");
    expect(Object.keys(props)).not.toContain("label");
  });
});

describe("o catalogo nativo", () => {
  test("so o Item declara accessibilityLabel, porque a linha ja tem texto proprio", async () => {
    const published = (await Bun.file(
      new URL("../../apps/docs/src/native-props.json", import.meta.url),
    ).json()) as Record<string, { props: { name: string }[] }>;
    expect(Object.keys(published).length).toBeGreaterThan(80);

    const declaring = Object.entries(published)
      .filter(([, entry]) => entry.props.some((prop) => prop.name === "accessibilityLabel"))
      .map(([piece]) => piece);
    expect(declaring).toEqual(["Item"]);
  });
});
