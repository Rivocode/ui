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

  test("desabilitado repassa o disabled ao Pressable E anuncia o estado", () => {
    const screen = render(<Button disabled>Emitir</Button>);
    const [button] = byRole(screen, "button");
    expect(button.props.disabled).toBe(true);
    // Escurecer com opacity-50 nao chega ao leitor de tela: sem isto ele
    // anuncia um botao ativo que nao responde ao toque.
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: false });
  });

  test("carregando trava o toque, anuncia busy e poe a espera antes do rotulo", () => {
    const onPress = mock(() => {});
    const screen = render(
      <Button loading onPress={onPress}>
        Emitir
      </Button>,
    );
    const [button] = byRole(screen, "button");
    expect(button.props.disabled).toBe(true);
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true });
    expect(textOf(screen)).toContain("Emitir");

    const [indicator] = screen.root.findAllByType("ActivityIndicator" as never);
    expect(indicator).toBeDefined();
    // O rodinha e enfeite: quem conta que esta ocupado e o accessibilityState,
    // como no web, onde ele sai com aria-hidden.
    expect(indicator.props.accessibilityElementsHidden).toBe(true);
  });

  test("o alvo de toque respeita o minimo das duas plataformas", () => {
    // 44pt e o minimo da Apple, 48dp o do Android: md e lg tem que passar nos
    // dois, senao a decisao de nao encolher alvo de toque nao vale nada.
    expect(byRole(render(<Button size="md">x</Button>), "button")[0].props.className).toContain(
      "h-11",
    );
    expect(byRole(render(<Button size="lg">x</Button>), "button")[0].props.className).toContain(
      "h-12",
    );
  });

  test("a classe de quem usa vence a da peca, para o wrapper de cliente", () => {
    const screen = render(<Button className="h-14 rounded-pill">x</Button>);
    const root = byRole(screen, "button")[0].props.className as string;
    expect(root).toContain("h-14");
    expect(root).not.toContain("h-11");
    expect(root).toContain("rounded-pill");
    expect(root).not.toContain("rounded-md");
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
