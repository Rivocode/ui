import { afterAll, beforeAll, describe, expect, mock, setSystemTime, test } from "bun:test";

import {
  Calendar,
  Combobox,
  DatePicker,
  DateRangePicker,
  Menu,
  Slider,
  Text,
  formatDate,
} from "../src";
import { act, byLabel, byRole, render, textOf } from "./helpers";

describe("Combobox", () => {
  const items = [
    { label: "Clínica São Lucas", value: "1" },
    { label: "Transportes Cabo Branco", value: "2" },
  ];

  test("abre com busca, filtra sem acento, e escolher fecha", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Combobox items={items} value={null} onValueChange={onValueChange} label="Cliente" />,
    );

    act(() => byLabel(screen, "Cliente")[0].props.onPress());
    expect(textOf(screen)).toContain("Transportes Cabo Branco");

    const search = screen.root.findByType("TextInput" as never);
    act(() => search.props.onChangeText("clinica"));
    expect(textOf(screen)).toContain("Clínica São Lucas");
    expect(textOf(screen)).not.toContain("Transportes Cabo Branco");

    const option = byRole(screen, "button").find(
      (node) => node.props.accessibilityState?.selected === false,
    );
    act(() => option!.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith("1");
  });

  test("multiple: escolher marca e mantém a folha e a busca de pé", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Combobox
        items={items}
        multiple
        value={["1"]}
        onValueChange={onValueChange}
        label="Clientes"
      />,
    );
    act(() => byLabel(screen, "Clientes")[0].props.onPress());

    const option = byRole(screen, "checkbox").find(
      (node) => node.props.accessibilityState?.checked === false,
    );
    act(() => option!.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(["1", "2"]);
    // Folha aberta e busca no lugar: dá para digitar o próximo nome.
    expect(textOf(screen)).toContain("Clínica São Lucas");
  });

  test("multiple: o gatilho conta quantos, e com um só diz o nome", () => {
    const two = render(
      <Combobox
        items={items}
        multiple
        value={["1", "2"]}
        onValueChange={() => {}}
        label="Clientes"
      />,
    );
    expect(textOf(two)).toContain("2 selecionados");
    expect(byLabel(two, "Clientes")[0].props.accessibilityValue.text).toBe("2 selecionados");

    const one = render(
      <Combobox items={items} multiple value={["2"]} onValueChange={() => {}} label="Clientes" />,
    );
    expect(textOf(one)).toContain("Transportes Cabo Branco");
  });

  test("busca sem resultado explica, em vez de sumir em silencio", () => {
    const screen = render(
      <Combobox items={items} value={null} onValueChange={() => {}} label="Cliente" />,
    );
    act(() => byLabel(screen, "Cliente")[0].props.onPress());
    const search = screen.root.findByType("TextInput" as never);
    act(() => search.props.onChangeText("zzz"));
    expect(textOf(screen)).toContain("Confira a grafia");
  });
});

describe("Calendar e DatePicker", () => {
  test("formatDate fala o formato daqui", () => {
    expect(formatDate("2026-08-25")).toBe("25/08/2026");
  });

  test("escolher um dia entrega o ISO daquele dia", () => {
    const onValueChange = mock(() => {});
    const screen = render(<Calendar value="2026-08-10" onValueChange={onValueChange} />);
    expect(textOf(screen)).toContain("Agosto de 2026");

    act(() => byLabel(screen, "25/08/2026")[0].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith("2026-08-25");
  });

  test("fora dos limites o dia desliga", () => {
    const screen = render(
      <Calendar value="2026-08-10" onValueChange={() => {}} min="2026-08-05" max="2026-08-20" />,
    );
    expect(byLabel(screen, "04/08/2026")[0].props.accessibilityState.disabled).toBe(true);
    expect(byLabel(screen, "12/08/2026")[0].props.accessibilityState.disabled).toBe(false);
  });

  test("o DatePicker mostra a data formatada e fecha ao escolher", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <DatePicker value="2026-08-10" onValueChange={onValueChange} label="Vencimento" />,
    );
    expect(textOf(screen)).toContain("10/08/2026");

    act(() => byLabel(screen, "Vencimento")[0].props.onPress());
    act(() => byLabel(screen, "15/08/2026")[0].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith("2026-08-15");
    // Fechou: o calendario nao esta mais montado.
    expect(byLabel(screen, "15/08/2026").length).toBe(0);
  });
});

describe("Slider", () => {
  test("anuncia papel, valor e responde as acoes do leitor de tela", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Slider value={40} onValueChange={onValueChange} min={0} max={100} step={10} label="Meta" />,
    );

    const [slider] = byRole(screen, "adjustable");
    expect(slider.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 40 });

    act(() => slider.props.onAccessibilityAction({ nativeEvent: { actionName: "increment" } }));
    expect(onValueChange).toHaveBeenCalledWith(50);
    act(() => slider.props.onAccessibilityAction({ nativeEvent: { actionName: "decrement" } }));
    expect(onValueChange).toHaveBeenCalledWith(30);
  });
});

describe("Menu", () => {
  test("agir fecha antes de agir, e o tom danger veste vermelho", () => {
    const calls: string[] = [];
    const screen = render(
      <Menu
        open
        onOpenChange={(next) => calls.push(`open:${next}`)}
        title="Nota 4813"
        actions={[
          { label: "Baixar o PDF", onSelect: () => calls.push("pdf") },
          { label: "Cancelar nota", tone: "danger", onSelect: () => calls.push("cancelar") },
        ]}
      />,
    );

    expect(textOf(screen)).toContain("Baixar o PDF");
    const danger = byRole(screen, "button").find((node) =>
      /text-danger-text/.test(String(node.children?.[0]?.props?.className ?? "")),
    );

    const [first] = byRole(screen, "button").filter((node) => node.props.onPress);
    act(() => first.props.onPress());
    expect(calls[0]).toBe("open:false");
    expect(danger).toBeDefined();
  });

  const acoes = [{ label: "Baixar o PDF", onSelect: () => {} }];

  test("children vira a area do toque longo, e o toque longo abre", () => {
    const calls: string[] = [];
    const screen = render(
      <Menu
        open={false}
        onOpenChange={(next) => calls.push(`open:${next}`)}
        title="Nota 4813"
        actions={acoes}
        triggerClassName="flex-1"
      >
        <Text>Nota 4813</Text>
      </Menu>,
    );

    const trigger = byRole(screen, "button").find((node) => node.props.onLongPress);
    expect(trigger).toBeDefined();
    expect(String(trigger!.props.className).split(" ")).toContain("flex-1");
    expect(textOf(screen)).toContain("Nota 4813");
    expect(textOf(screen)).not.toContain("Baixar o PDF");

    act(() => trigger!.props.onLongPress());
    expect(calls).toEqual(["open:true"]);
  });

  test("o leitor de tela tem a mesma porta, pela acao longpress", () => {
    const calls: string[] = [];
    const screen = render(
      <Menu
        open={false}
        onOpenChange={(next) => calls.push(`open:${next}`)}
        title="Nota 4813"
        actions={acoes}
      >
        <Text>Nota 4813</Text>
      </Menu>,
    );

    const trigger = byRole(screen, "button").find((node) => node.props.onLongPress)!;
    const names = (trigger.props.accessibilityActions as { name: string }[]).map((one) => one.name);
    expect(names).toContain("longpress");
    expect(String(trigger.props.accessibilityHint)).toContain("segure");

    act(() => trigger.props.onAccessibilityAction({ nativeEvent: { actionName: "longpress" } }));
    expect(calls).toEqual(["open:true"]);

    act(() => trigger.props.onAccessibilityAction({ nativeEvent: { actionName: "activate" } }));
    expect(calls).toEqual(["open:true"]);
  });

  test("sem children nao nasce area de toque longo", () => {
    const screen = render(
      <Menu open onOpenChange={() => {}} title="Nota 4813" actions={acoes} />,
    );

    expect(byRole(screen, "button").filter((node) => node.props.onLongPress)).toHaveLength(0);
  });
});

describe("DateRangePicker", () => {
  beforeAll(() => setSystemTime(new Date("2026-08-15T12:00:00")));
  afterAll(() => setSystemTime());

  const open = (screen: ReturnType<typeof render>) =>
    act(() => byLabel(screen, "Período")[0].props.onPress());

  /* O Button nativo nao carrega accessibilityLabel: o nome dele e o Text de
     dentro, como no aparelho. Entao o localizador do teste procura por ele. */
  const buttonWith = (screen: ReturnType<typeof render>, text: string) =>
    byRole(screen, "button").find(
      (node) =>
        node.findAll((child) => child.type === "Text" && child.props.children === text).length > 0,
    )!;

  test("o gatilho mostra o intervalo por extenso, e o vazio cai no placeholder", () => {
    const vazio = render(<DateRangePicker value={null} onValueChange={() => {}} label="Período" />);
    expect(textOf(vazio)).toContain("Escolha o período");

    const cheio = render(
      <DateRangePicker
        value={{ from: "2026-08-05", to: "2026-08-20" }}
        onValueChange={() => {}}
        label="Período"
      />,
    );
    expect(textOf(cheio)).toContain("05/08/2026 – 20/08/2026");
    expect(byLabel(cheio, "Período")[0].props.accessibilityValue.text).toBe(
      "05/08/2026 – 20/08/2026",
    );
  });

  test("as duas pontas saem na mesma grade, e a peca ordena os toques", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <DateRangePicker value={null} onValueChange={onValueChange} label="Período" />,
    );

    open(screen);
    expect(textOf(screen)).toContain("Toque no primeiro dia");

    // Fim antes do comeco: o dedo toca 20 e depois 5.
    act(() => byLabel(screen, "20/08/2026")[0].props.onPress());
    expect(textOf(screen)).toContain("20/08/2026 – toque no último dia.");

    act(() => byLabel(screen, "05/08/2026")[0].props.onPress());
    // Sai ordenado: a validacao de fim-antes-do-comeco deixou de ser do app.
    expect(textOf(screen)).toContain("05/08/2026 – 20/08/2026");

    // O meio do intervalo tambem se anuncia escolhido: a faixa pintada nao
    // existe para quem ouve a grade.
    expect(byLabel(screen, "12/08/2026")[0].props.accessibilityState.selected).toBe(true);
    expect(byLabel(screen, "25/08/2026")[0].props.accessibilityState.selected).toBe(false);

    // Nada saiu ainda: quem aplica e o botao.
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("Aplicar so liga com as duas pontas, e entrega o intervalo fechado", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <DateRangePicker value={null} onValueChange={onValueChange} label="Período" />,
    );

    open(screen);
    const aplicar = () => buttonWith(screen, "Aplicar");
    expect(aplicar().props.disabled).toBe(true);

    act(() => byLabel(screen, "05/08/2026")[0].props.onPress());
    // Com meia escolha ele continua desligado: a listagem nunca recebe um
    // periodo que comeca e nao termina.
    expect(aplicar().props.disabled).toBe(true);

    act(() => byLabel(screen, "09/08/2026")[0].props.onPress());
    expect(aplicar().props.disabled).toBe(false);

    act(() => aplicar().props.onPress());
    expect(onValueChange).toHaveBeenCalledWith({ from: "2026-08-05", to: "2026-08-09" });
    // Fechou: a grade nao esta mais montada.
    expect(byLabel(screen, "09/08/2026").length).toBe(0);
  });

  test("Limpar entrega null, e os limites continuam desligando o dia", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <DateRangePicker
        value={{ from: "2026-08-05", to: "2026-08-20" }}
        onValueChange={onValueChange}
        label="Período"
        min="2026-08-03"
      />,
    );

    open(screen);
    expect(byLabel(screen, "02/08/2026")[0].props.accessibilityState.disabled).toBe(true);

    act(() => buttonWith(screen, "Limpar").props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(null);
  });

  test("o terceiro toque recomeca o intervalo em vez de esticar o anterior", () => {
    const screen = render(
      <DateRangePicker value={null} onValueChange={() => {}} label="Período" />,
    );

    open(screen);
    act(() => byLabel(screen, "05/08/2026")[0].props.onPress());
    act(() => byLabel(screen, "09/08/2026")[0].props.onPress());
    act(() => byLabel(screen, "15/08/2026")[0].props.onPress());

    expect(textOf(screen)).toContain("15/08/2026 – toque no último dia.");
  });
});
