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

describe("the piece's name comes in through label", () => {
  test("a Checkbox with no text beside it is named by label", () => {
    const screen = render(
      <Checkbox label="Selecionar a nota 4813" checked onCheckedChange={noop} />,
    );
    const [box] = byRole(screen, "checkbox");
    expect(box!.props.accessibilityLabel).toBe("Selecionar a nota 4813");
  });

  test("a Checkbox with text beside it speaks the text, and label replaces the name when given", () => {
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

  test("a Switch with no text beside it takes label to the platform switch", () => {
    const screen = render(<Switch label="Notificar por e-mail" checked onCheckedChange={noop} />);
    const [control] = byType(screen, "Switch");
    expect(control!.props.accessibilityLabel).toBe("Notificar por e-mail");
  });

  test("a Switch with text beside it names the row, not the inner switch", () => {
    const screen = render(
      <Switch label="Notificar por e-mail" checked onCheckedChange={noop}>
        E-mail
      </Switch>,
    );
    expect(byRole(screen, "switch")[0]!.props.accessibilityLabel).toBe("Notificar por e-mail");
    expect(byType(screen, "Switch")[0]!.props.accessibilityLabel).toBeUndefined();
  });

  test("OTPField replaces the default name with label", () => {
    const fallback = render(<OTPField value="" onValueChange={noop} />);
    const spoken = byType(fallback, "TextInput")[0]!.props.accessibilityLabel;
    expect(spoken).toBe("Código de 6 dígitos");

    const named = render(<OTPField label="Código do SMS" value="" onValueChange={noop} />);
    expect(byType(named, "TextInput")[0]!.props.accessibilityLabel).toBe("Código do SMS");
  });

  test("SignaturePad opens the group name with label, and without it with labels.group", () => {
    const group = (screen: ReturnType<typeof render>) =>
      byType(screen, "View").find((node) => /: /.test(String(node.props.accessibilityLabel ?? "")));

    const named = render(<SignaturePad label="Assinatura do locatário" value={null} />);
    const spoken = String(group(named)!.props.accessibilityLabel);
    expect(spoken).toStartWith("Assinatura do locatário: ");

    const fallback = render(<SignaturePad value={null} />);
    expect(String(group(fallback)!.props.accessibilityLabel)).toStartWith("Assinatura: ");
  });
});

describe("the adapters deliver the label under the name the piece reads", () => {
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

  test("forChecked and forDate give label, not the accessibilityLabel the piece ignores", () => {
    for (const props of [forChecked(row as never), forDate(row as never)]) {
      expect(props).toMatchObject({ label: "Campo" });
      expect(Object.keys(props)).not.toContain("accessibilityLabel");
    }
  });

  test("forValue gives both: label for the piece, accessibilityLabel for the TextInput", () => {
    expect(forValue(row as never)).toMatchObject({ label: "Campo", accessibilityLabel: "Campo" });
  });

  test("forText stays on accessibilityLabel, because the Input is the TextInput", () => {
    const props = forText(row as never);
    expect(props.accessibilityLabel).toBe("Campo");
    expect(Object.keys(props)).not.toContain("label");
  });
});

describe("the native catalog", () => {
  test("only Item declares accessibilityLabel, because the row already has its own text", async () => {
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
