import { describe, expect, mock, test } from "bun:test";

import { Badge, Button, Checkbox, Select, Switch, Tabs } from "../src";
import { tokens } from "../tokens";
import { act, byClass, byRole, render, textOf } from "./helpers";

describe("Button", () => {
  test("é um botão para o leitor de tela e dispara o onPress", () => {
    const onPress = mock(() => {});
    const screen = render(<Button onPress={onPress}>Emitir nota</Button>);

    const [button] = byRole(screen, "button");
    expect(button).toBeDefined();
    act(() => button.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(textOf(screen)).toContain("Emitir nota");
  });

  test("desabilitado repassa o disabled ao Pressable", () => {
    const screen = render(<Button disabled>Emitir</Button>);
    expect(byRole(screen, "button")[0].props.disabled).toBe(true);
  });

  test("cada variante veste o papel certo, nunca cor literal", () => {
    for (const [variant, expected] of [
      ["primary", "bg-accent"],
      ["destructive", "bg-danger"],
    ] as const) {
      const screen = render(<Button variant={variant}>x</Button>);
      expect(byRole(screen, "button")[0].props.className).toContain(expected);
    }
  });
});

describe("Checkbox", () => {
  test("papel, estado e alternância no toque", () => {
    const onCheckedChange = mock(() => {});
    const screen = render(
      <Checkbox checked={false} onCheckedChange={onCheckedChange}>
        Enviar o PDF
      </Checkbox>,
    );

    const [box] = byRole(screen, "checkbox");
    expect(box.props.accessibilityState.checked).toBe(false);
    act(() => box.props.onPress());
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  test("marcado anuncia checked e desenha o visto", () => {
    const screen = render(<Checkbox checked onCheckedChange={() => {}} />);
    const [box] = byRole(screen, "checkbox");
    expect(box.props.accessibilityState.checked).toBe(true);
    // O visto é borda rotacionada, nunca glyph de fonte.
    expect(byClass(screen, /-rotate-45/).length).toBe(1);
  });
});

describe("Switch", () => {
  test("com rótulo, a linha inteira é o interruptor", () => {
    const onCheckedChange = mock(() => {});
    const screen = render(
      <Switch checked={false} onCheckedChange={onCheckedChange}>
        Tema claro
      </Switch>,
    );
    const [row] = byRole(screen, "switch");
    act(() => row.props.onPress());
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  test("o trilho veste o acento do tema em vigor", () => {
    const dark = render(<Switch checked onCheckedChange={() => {}} />);
    const track = dark.root.findByType("Switch" as never);
    expect(track.props.trackColor.true).toBe(tokens.themes["rivocode-dark"].accent);

    const light = render(<Switch checked onCheckedChange={() => {}} />, {
      theme: "rivocode-light",
    });
    const lightTrack = light.root.findByType("Switch" as never);
    expect(lightTrack.props.trackColor.false).toBe(tokens.themes["rivocode-light"]["border-strong"]);
  });
});

describe("Tabs", () => {
  const items = [
    { label: "Mês", value: "mes" },
    { label: "Ano", value: "ano" },
  ];

  test("cada aba tem papel de tab e a ativa anuncia selected", () => {
    const screen = render(<Tabs items={items} value="mes" onValueChange={() => {}} />);
    const tabs = byRole(screen, "tab");
    expect(tabs.length).toBe(2);
    expect(tabs[0].props.accessibilityState.selected).toBe(true);
    expect(tabs[1].props.accessibilityState.selected).toBe(false);
  });

  test("tocar em outra aba entrega o valor dela", () => {
    const onValueChange = mock(() => {});
    const screen = render(<Tabs items={items} value="mes" onValueChange={onValueChange} />);
    act(() => byRole(screen, "tab")[1].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith("ano");
  });
});

describe("Select", () => {
  const items = [
    { label: "Últimos 30 dias", value: "30" },
    { label: "Este ano", value: "ano" },
  ];

  test("fechado mostra o placeholder e anuncia o valor", () => {
    const screen = render(
      <Select label="Período" items={items} value={null} onValueChange={() => {}} placeholder="Selecione o período" />,
    );
    expect(textOf(screen)).toContain("Selecione o período");
    // A folha começa fechada: nenhuma opção montada.
    expect(textOf(screen)).not.toContain("Este ano");
  });

  test("abre a folha no toque e escolher fecha e entrega o valor", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Select label="Período" items={items} value="30" onValueChange={onValueChange} />,
    );

    const [trigger] = byRole(screen, "button");
    act(() => trigger.props.onPress());
    expect(textOf(screen)).toContain("Este ano");

    const option = byRole(screen, "button").find(
      (node) => node.props.accessibilityState?.selected === false,
    );
    expect(option).toBeDefined();
    act(() => option!.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith("ano");
    // Escolheu, fechou: as opções somem; o gatilho segue mostrando o valor.
    expect(textOf(screen)).not.toContain("Este ano");
    expect(textOf(screen)).toContain("Últimos 30 dias");
  });
});

describe("Badge", () => {
  test("cada tom veste fundo sutil e texto que lê", () => {
    const screen = render(<Badge tone="danger">Vencida</Badge>);
    expect(textOf(screen)).toContain("Vencida");
    expect(byClass(screen, /bg-danger-subtle/).length).toBe(1);
  });
});
