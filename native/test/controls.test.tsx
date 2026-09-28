import { describe, expect, mock, test } from "bun:test";
import type { ReactTestInstance } from "react-test-renderer";

import { Badge, Button, Checkbox, Select, Switch, Tabs } from "../src";
import { tokens } from "../tokens";
import { act, byClass, byLabel, byRole, render, textOf } from "./helpers";

const hostParent = (node: { parent: unknown }) => {
  let current = node.parent as {
    type: unknown;
    parent: unknown;
    props: Record<string, unknown>;
  } | null;
  while (current && typeof current.type !== "string") current = current.parent as typeof current;
  return current;
};

describe("Button", () => {
  test("is a button for the screen reader and fires onPress", () => {
    const onPress = mock(() => {});
    const screen = render(<Button onPress={onPress}>Emitir nota</Button>);

    const [button] = byRole(screen, "button");
    expect(button).toBeDefined();
    act(() => button.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(textOf(screen)).toContain("Emitir nota");
  });

  test("disabled passes disabled to the Pressable AND announces the state", () => {
    const screen = render(<Button disabled>Emitir</Button>);
    const [button] = byRole(screen, "button");
    expect(button.props.disabled).toBe(true);
    // Dimming with opacity-50 does not reach the screen reader: without this it
    // announces an active button that does not respond to touch.
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: false });
  });

  test("loading locks the touch, announces busy and puts the wait before the label", () => {
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
    // The spinner is decoration: what tells it is busy is accessibilityState,
    // as on the web, where it comes out with aria-hidden.
    expect(indicator.props.accessibilityElementsHidden).toBe(true);
  });

  test("the touch target respects both platforms' minimum", () => {
    // 44pt is Apple's minimum, 48dp Android's: md and lg have to pass both, or
    // the decision not to shrink touch targets is worth nothing.
    expect(byRole(render(<Button size="md">x</Button>), "button")[0].props.className).toContain(
      "h-11",
    );
    expect(byRole(render(<Button size="lg">x</Button>), "button")[0].props.className).toContain(
      "h-12",
    );
  });

  test("the small button grows the target without growing the drawing", () => {
    // Raising sm to 44 would make it identical to md, and the variant exists
    // for the dense row - table, card, action bar. What grows is the touch
    // area, with hitSlop: 32 + 6 on each side gives Apple's 44.
    const button = byRole(render(<Button size="sm">x</Button>), "button")[0];

    expect(button.props.className).toContain("h-8");
    expect(button.props.hitSlop).toEqual({ top: 6, bottom: 6, left: 0, right: 0 });
  });

  test("a button already past the minimum gets no extra area", () => {
    // hitSlop on a large button steals the neighbor's touch for nothing in return.
    const button = byRole(render(<Button size="md">x</Button>), "button")[0];

    expect(button.props.hitSlop).toBeUndefined();
  });

  test("the consumer's class wins over the piece's, for the client wrapper", () => {
    const screen = render(<Button className="h-14 rounded-pill">x</Button>);
    const root = byRole(screen, "button")[0].props.className as string;
    expect(root).toContain("h-14");
    expect(root).not.toContain("h-11");
    expect(root).toContain("rounded-pill");
    expect(root).not.toContain("rounded-md");
  });

  test("each variant wears the right role, never a literal color", () => {
    for (const [variant, expected] of [
      ["primary", "bg-accent"],
      ["danger", "bg-danger"],
    ] as const) {
      const screen = render(<Button variant={variant}>x</Button>);
      expect(byRole(screen, "button")[0].props.className).toContain(expected);
    }
  });
});

describe("Checkbox", () => {
  test("role, state and toggling on tap", () => {
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

  test("checked announces checked and draws the checkmark", () => {
    const screen = render(<Checkbox label="Aceito" checked onCheckedChange={() => {}} />);
    const [box] = byRole(screen, "checkbox");
    expect(box.props.accessibilityState.checked).toBe(true);
    // The checkmark is a rotated border, never a font glyph.
    const marks = byClass(screen, /-rotate-45/);
    expect(marks.length).toBe(1);

    // The same accent as the Switch track: with the full lime, the checked box
    // measured 1.21:1 over the page in the light theme and lost its boundary.
    expect(byClass(screen, /border-accent-text bg-accent-text/).length).toBe(1);
    expect(byClass(screen, /bg-accent(?![\w-])/).length).toBe(0);
    expect(marks[0].props.className).toContain("border-surface-raised");
    expect(marks[0].props.className).not.toContain("border-accent-fg");
  });

  test("indeterminate announces mixed and draws the full dash, without the checkmark", () => {
    const screen = render(
      <Checkbox label="Todas" checked={false} indeterminate onCheckedChange={() => {}} />,
    );
    const [box] = byRole(screen, "checkbox");
    expect(box.props.accessibilityState.checked).toBe("mixed");

    expect(byClass(screen, /-rotate-45/).length).toBe(0);
    const [filled] = byClass(screen, /rounded-sm/);
    expect(filled!.props.className.split(" ")).toContain("bg-accent-text");
    expect(filled!.props.className.split(" ")).not.toContain("bg-surface");
    const dash = byClass(screen, /h-0\.5/);
    expect(dash.length).toBe(1);
    expect(dash[0]!.props.className.split(" ")).toContain("bg-surface-raised");
  });

  test("indeterminate wins over checked, and the tap checks everything", () => {
    const onCheckedChange = mock(() => {});
    const screen = render(
      <Checkbox label="Todas" checked indeterminate onCheckedChange={onCheckedChange} />,
    );
    const [box] = byRole(screen, "checkbox");
    expect(box.props.accessibilityState.checked).toBe("mixed");
    expect(byClass(screen, /-rotate-45/).length).toBe(0);
    act(() => box.props.onPress());
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

describe("Switch", () => {
  test("with a label, the whole row is the switch", () => {
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

  test("the on track wears the accent that reads over the background", () => {
    const dark = render(<Switch label="Modo escuro" checked onCheckedChange={() => {}} />);
    const track = dark.root.findByType("Switch" as never);
    expect(track.props.trackColor.true).toBe(tokens.themes["rivocode-dark"]["accent-text"]);

    const light = render(<Switch label="Modo escuro" checked onCheckedChange={() => {}} />, {
      theme: "rivocode-light",
    });
    const lightTrack = light.root.findByType("Switch" as never);
    expect(lightTrack.props.trackColor.true).toBe(tokens.themes["rivocode-light"]["accent-text"]);
    expect(lightTrack.props.trackColor.true).not.toBe(tokens.themes["rivocode-light"].accent);
    expect(lightTrack.props.thumbColor).toBe(tokens.themes["rivocode-light"]["surface-raised"]);
    expect(lightTrack.props.trackColor.false).toBe(
      tokens.themes["rivocode-light"]["border-strong"],
    );
  });
});

const touchHeight = (node: { props: Record<string, unknown> }, room: number) => {
  const token = String(node.props.className)
    .split(" ")
    .find((part) => /^h-\d+(\.\d+)?$/.test(part));
  const slop = node.props.hitSlop as { top?: number; bottom?: number } | undefined;
  const top = Math.min(slop?.top ?? 0, room);
  const bottom = Math.min(slop?.bottom ?? 0, room);
  return Number(token!.slice(2)) * 4 + top + bottom;
};

describe("Tabs", () => {
  const items = [
    { label: "Mês", value: "mes" },
    { label: "Ano", value: "ano" },
  ];

  test("each tab reaches the 44pt touch target with the slack that fits inside the row", () => {
    const screen = render(<Tabs items={items} value="mes" onValueChange={() => {}} />);
    const tabs = byRole(screen, "tab");
    expect(tabs.length).toBe(2);
    const row = String(hostParent(tabs[0]!)?.props.className).split(" ");
    const room = row.includes("p-0.5") ? 2 : row.includes("p-1") ? 4 : 0;
    for (const tab of tabs) expect(touchHeight(tab, room)).toBeGreaterThanOrEqual(44);
  });

  test("each tab has the tab role and the active one announces selected", () => {
    const screen = render(<Tabs items={items} value="mes" onValueChange={() => {}} />);
    const tabs = byRole(screen, "tab");
    expect(tabs.length).toBe(2);
    expect(tabs[0].props.accessibilityState.selected).toBe(true);
    expect(tabs[1].props.accessibilityState.selected).toBe(false);
  });

  test("tapping another tab delivers its value", () => {
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

  const many = [
    { label: "Serviço", value: "servico" },
    { label: "Produto", value: "produto" },
    { label: "Frete", value: "frete" },
  ];

  test("multiple: choosing does NOT close the sheet, to leave time to choose more", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Select
        label="Categorias"
        items={many}
        multiple
        value={["servico"]}
        onValueChange={onValueChange}
      />,
    );
    act(() => byLabel(screen, "Categorias")[0].props.onPress());

    const option = byRole(screen, "checkbox").find(
      (node) => node.props.accessibilityState?.checked === false,
    );
    act(() => option!.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(["servico", "produto"]);
    expect(textOf(screen)).toContain("Frete");
  });

  test("multiple: tapping again unchecks, and only that value goes out", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Select
        label="Categorias"
        items={many}
        multiple
        value={["servico", "frete"]}
        onValueChange={onValueChange}
      />,
    );
    act(() => byLabel(screen, "Categorias")[0].props.onPress());
    const marked = byRole(screen, "checkbox").filter(
      (node) => node.props.accessibilityState?.checked === true,
    );
    expect(marked.length).toBe(2);
    act(() => marked[0].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(["frete"]);
  });

  test("multiple: the checked item is a checkbox, not a button with a silent state", () => {
    const screen = render(
      <Select
        label="Categorias"
        items={many}
        multiple
        value={["servico"]}
        onValueChange={() => {}}
      />,
    );
    act(() => byLabel(screen, "Categorias")[0].props.onPress());
    // Checkbox role: tapping toggles and the sheet stays: it is what the screen
    // reader needs to hear, and TalkBack does not announce "selected button" properly.
    expect(byRole(screen, "checkbox").length).toBe(3);
  });

  test("multiple: the trigger says how many, on screen and to the screen reader", () => {
    const none = render(
      <Select
        label="Categorias"
        items={many}
        multiple
        value={[]}
        onValueChange={() => {}}
        placeholder="Escolha as categorias"
      />,
    );
    expect(textOf(none)).toContain("Escolha as categorias");

    const one = render(
      <Select
        label="Categorias"
        items={many}
        multiple
        value={["frete"]}
        onValueChange={() => {}}
      />,
    );
    // With only one, its name says more than the count.
    expect(textOf(one)).toContain("Frete");

    const three = render(
      <Select
        label="Categorias"
        items={many}
        multiple
        value={["servico", "produto", "frete"]}
        onValueChange={() => {}}
      />,
    );
    expect(textOf(three)).toContain("3 selecionados");
    expect(byLabel(three, "Categorias")[0].props.accessibilityValue.text).toBe("3 selecionados");
  });

  test("multiple: the sheet offers an explicit way to finish", () => {
    const screen = render(
      <Select
        label="Categorias"
        items={many}
        multiple
        value={["servico"]}
        onValueChange={() => {}}
      />,
    );
    act(() => byLabel(screen, "Categorias")[0].props.onPress());
    // By the text it shows: the Pressable's spoken name comes from the inner
    // Text, and an accessibilityLabel repeating it would be decoration.
    const textIn = (node: ReactTestInstance) =>
      node
        .findAllByType("Text" as never)
        .map((child) => String(child.props.children))
        .join("");
    const done = byRole(screen, "button").find((node) => textIn(node) === "Concluir");
    expect(done).toBeDefined();
    act(() => done!.props.onPress());
    expect(textOf(screen)).not.toContain("Frete");
  });

  test("closed, it shows the placeholder and announces the value", () => {
    const screen = render(
      <Select
        label="Período"
        items={items}
        value={null}
        onValueChange={() => {}}
        placeholder="Selecione o período"
      />,
    );
    expect(textOf(screen)).toContain("Selecione o período");
    // The sheet starts closed: no option mounted.
    expect(textOf(screen)).not.toContain("Este ano");
  });

  test("opens the sheet on tap, and choosing closes it and delivers the value", () => {
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
    // Chose, closed: the options disappear; the trigger keeps showing the value.
    expect(textOf(screen)).not.toContain("Este ano");
    expect(textOf(screen)).toContain("Últimos 30 dias");
  });
});

describe("Badge", () => {
  test("each tone wears a subtle background and readable text", () => {
    const screen = render(<Badge tone="danger">Vencida</Badge>);
    expect(textOf(screen)).toContain("Vencida");
    expect(byClass(screen, /bg-danger-subtle/).length).toBe(1);
  });
});
