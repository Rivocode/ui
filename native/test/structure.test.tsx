import { describe, expect, mock, test } from "bun:test";
import { Text } from "react-native";

import {
  Accordion,
  AccordionItem,
  AspectRatio,
  Badge,
  Button,
  Collapsible,
  DescriptionItem,
  DescriptionList,
  Item,
  PageHeader,
  Steps,
  Toggle,
  ToggleGroup,
  WizardFooter,
  useWizard,
} from "../src";
import { act, byClass, byRole, byType, render, textOf } from "./helpers";

const touchHeight = (node: { props: Record<string, unknown> }, room: number) => {
  const token = String(node.props.className)
    .split(" ")
    .find((part) => /^h-\d+(\.\d+)?$/.test(part));
  const slop = node.props.hitSlop as { top?: number; bottom?: number } | undefined;
  const top = Math.min(slop?.top ?? 0, room);
  const bottom = Math.min(slop?.bottom ?? 0, room);
  return Number(token!.slice(2)) * 4 + top + bottom;
};

describe("Toggle and ToggleGroup", () => {
  test("the toggle announces pressed and toggles", () => {
    const onPressedChange = mock(() => {});
    const screen = render(
      <Toggle pressed onPressedChange={onPressedChange}>
        Negrito
      </Toggle>,
    );
    const [toggle] = byRole(screen, "togglebutton");
    expect(toggle.props.accessibilityState.selected).toBe(true);
    act(() => toggle.props.onPress());
    expect(onPressedChange).toHaveBeenCalledWith(false);
  });

  test("the toggle reaches the 44pt touch target, alone and in the group", () => {
    const alone = render(
      <Toggle pressed={false} onPressedChange={() => {}}>
        Negrito
      </Toggle>,
    );
    const group = render(
      <ToggleGroup
        items={[
          { label: "Paga", value: "paga" },
          { label: "Vencida", value: "vencida" },
        ]}
        value={[]}
        onValueChange={() => {}}
      />,
    );
    const toggles = [...byRole(alone, "togglebutton"), ...byRole(group, "togglebutton")];
    expect(toggles.length).toBeGreaterThanOrEqual(3);
    for (const toggle of toggles) expect(touchHeight(toggle, 0)).toBeGreaterThanOrEqual(44);
  });

  test("in the group, the default unpresses the previous one; multiple accumulates", () => {
    const items = [
      { label: "Paga", value: "paga" },
      { label: "Vencida", value: "vencida" },
    ];

    // The default is the same as the web: without `multiple`, only one stays pressed.
    const single = mock(() => {});
    const one = render(<ToggleGroup items={items} value={["paga"]} onValueChange={single} />);
    act(() => byRole(one, "togglebutton")[1].props.onPress());
    expect(single).toHaveBeenCalledWith(["vencida"]);

    const multi = mock(() => {});
    const many = render(
      <ToggleGroup items={items} value={["paga"]} onValueChange={multi} multiple />,
    );
    act(() => byRole(many, "togglebutton")[1].props.onPress());
    expect(multi).toHaveBeenCalledWith(["paga", "vencida"]);
  });
});

describe("Accordion and Collapsible", () => {
  test("the closed item hides the body and announces expanded on opening", () => {
    const screen = render(
      <Accordion>
        <AccordionItem title="Como emitir?">
          <Text>Pelo botão Emitir nota.</Text>
        </AccordionItem>
      </Accordion>,
    );

    expect(textOf(screen)).not.toContain("Pelo botão");
    const [trigger] = byRole(screen, "button");
    expect(trigger.props.accessibilityState.expanded).toBe(false);

    act(() => trigger.props.onPress());
    expect(textOf(screen)).toContain("Pelo botão Emitir nota.");
  });

  test("the collapsible shows and hides with the same contract", () => {
    const screen = render(
      <Collapsible label="Ver o detalhe" defaultOpen>
        <Text>O detalhe inteiro.</Text>
      </Collapsible>,
    );
    expect(textOf(screen)).toContain("O detalhe inteiro.");
    act(() => byRole(screen, "button")[0].props.onPress());
    expect(textOf(screen)).not.toContain("O detalhe inteiro.");
  });
});

describe("PageHeader", () => {
  test("title, context, tag and actions in the same header", () => {
    const screen = render(
      <PageHeader
        title="Notas fiscais"
        description="Agosto, até agora."
        badge={<Badge tone="accent">beta</Badge>}
        actions={<Text>Emitir</Text>}
      />,
    );
    for (const chunk of ["Notas fiscais", "Agosto, até agora.", "beta", "Emitir"]) {
      expect(textOf(screen)).toContain(chunk);
    }
  });
});

describe("DescriptionList", () => {
  test("each row is a label-value pair, text or node", () => {
    const screen = render(
      <DescriptionList>
        <DescriptionItem label="Número">4813</DescriptionItem>
        <DescriptionItem label="Situação">
          <Badge tone="success">Paga</Badge>
        </DescriptionItem>
      </DescriptionList>,
    );
    expect(textOf(screen)).toContain("Número");
    expect(textOf(screen)).toContain("4813");
    expect(textOf(screen)).toContain("Paga");
  });
});

describe("AspectRatio", () => {
  test("the box reserves the requested ratio", () => {
    const screen = render(
      <AspectRatio ratio={16 / 9}>
        <Text>mapa</Text>
      </AspectRatio>,
    );
    const box = screen.root.findAll(
      (node) => typeof node.type === "string" && node.props.style?.aspectRatio === 16 / 9,
    );
    expect(box.length).toBe(1);
  });
});

describe("Item", () => {
  test("arranges media, text and action; only the text is cut, and by prop", () => {
    const screen = render(
      <Item
        media={<Badge>NF</Badge>}
        title="Clínica São Lucas"
        description="Nota 4471 · vence amanhã"
        actions={<Text>R$ 1,2K</Text>}
      />,
    );

    const texto = textOf(screen);
    expect(texto).toContain("Clínica São Lucas");
    expect(texto).toContain("Nota 4471");
    expect(texto).toContain("R$ 1,2K");

    // The cut is `numberOfLines`, which in React Native is a prop and not a
    // class - and it belongs to the title and the description, never to the
    // media nor the action.
    const cortados = byType(screen, "Text").filter((node) => node.props.numberOfLines === 1);
    expect(cortados.length).toBe(2);

    // Without onPress the row is not a button: a role only where there is an action, as in DataList.
    expect(byRole(screen, "button").length).toBe(0);
  });

  test("with onPress the whole row is the target, and says title and description together", () => {
    const onPress = mock(() => {});
    const screen = render(
      <Item title="Transportes Cabo Branco" description="3 notas em aberto" onPress={onPress} />,
    );

    const [linha] = byRole(screen, "button");
    expect(linha.props.accessibilityLabel).toBe("Transportes Cabo Branco, 3 notas em aberto");
    // A single title line draws 37px; the finger asks for 44.
    expect(linha.props.className).toContain("min-h-11");

    act(() => linha.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("with an action on the right, the target is the text and the button stays its own stop", () => {
    const abrir = mock(() => {});
    const remover = mock(() => {});
    const screen = render(
      <Item
        title="Boleto 88"
        onPress={abrir}
        actions={
          <Button size="sm" variant="ghost" onPress={remover}>
            Remover
          </Button>
        }
      />,
    );

    const botoes = byRole(screen, "button");
    expect(botoes.length).toBe(2);

    // The row target does NOT wrap the button: a Pressable inside another
    // would hold the touch in the inner one, and the row would never open.
    const [linha] = botoes;
    expect(linha.findAll((node) => node.props?.accessibilityRole === "button").length).toBe(1);

    act(() => botoes[1].props.onPress());
    expect(remover).toHaveBeenCalledTimes(1);
    expect(abrir).not.toHaveBeenCalled();
  });

  test("outline puts its own frame; plain stays loose", () => {
    const outline = render(<Item title="Pix" variant="outline" />);
    expect(byClass(outline, /rounded-lg border border-border bg-surface/).length).toBe(1);

    const plain = render(<Item title="Pix" />);
    expect(byClass(plain, /border-border/).length).toBe(0);
  });
});

const STEPS = [
  { id: "client", title: "Cliente" },
  { id: "items", title: "Itens", description: "O que entra na nota" },
  { id: "review", title: "Conferir" },
];

describe("Steps", () => {
  test("ports the web's narrow mode: where you are, the title, and the moving bar", () => {
    const screen = render(<Steps steps={STEPS} step={1} />);

    const texto = textOf(screen);
    expect(texto).toContain("Passo 2 de 3");
    expect(texto).toContain("Itens");
    // The description, which the web's narrow mode hides for lack of width.
    expect(texto).toContain("O que entra na nota");

    // The dot rail does NOT port: with no clickable step, there is no button at all.
    expect(byRole(screen, "button").length).toBe(0);

    const [barra] = byClass(screen, /bg-accent/);
    expect(barra.props.style.width).toBe(`${(2 / 3) * 100}%`);
  });

  test("a single screen reader stop, with the whole sentence", () => {
    const screen = render(<Steps steps={STEPS} step={0} />);

    const [regua] = byRole(screen, "progressbar");
    expect(regua.props.accessible).toBe(true);
    expect(regua.props.accessibilityLabel).toBe("Passo 1 de 3: Cliente");
    expect(regua.props.accessibilityValue).toEqual({ min: 1, max: 3, now: 1 });
  });

  test("an index outside the list does not break the screen, and an empty list draws nothing", () => {
    expect(textOf(render(<Steps steps={STEPS} step={9} />))).toContain("Passo 3 de 3");
    expect(textOf(render(<Steps steps={STEPS} step={-2} />))).toContain("Passo 1 de 3");
    // An empty list draws no rail at all - only the provider background is left.
    expect(textOf(render(<Steps steps={[]} step={0} />)).trim()).toBe("");
  });
});

describe("useWizard", () => {
  /** The state without a drawing: a host that only returns what the hook says. */
  function Wizard({ onState }: { onState: (state: ReturnType<typeof useWizard>) => void }) {
    const wizard = useWizard(STEPS);
    onState(wizard);
    return <Text>{wizard.current?.title}</Text>;
  }

  const mount = () => {
    let state!: ReturnType<typeof useWizard>;
    const screen = render(<Wizard onState={(next) => (state = next)} />);
    return { screen, get: () => state };
  };

  test("moves forward, back, and stops at both ends", async () => {
    const { screen, get } = mount();

    expect(get().isFirst).toBe(true);
    expect(get().isLast).toBe(false);

    await act(async () => void (await get().next()));
    expect(get().step).toBe(1);
    expect(textOf(screen)).toContain("Itens");

    await act(async () => void (await get().next()));
    await act(async () => void (await get().next()));
    // The last step does not go past the end.
    expect(get().step).toBe(2);
    expect(get().isLast).toBe(true);

    act(() => get().back());
    act(() => get().back());
    act(() => get().back());
    expect(get().step).toBe(0);
  });

  test("the check rules: `false` holds the step, and it can be asynchronous", async () => {
    const { get } = mount();

    let andou = true;
    await act(async () => {
      andou = await get().next(async () => false);
    });
    expect(andou).toBe(false);
    expect(get().step).toBe(0);

    await act(async () => {
      andou = await get().next(async () => true);
    });
    expect(andou).toBe(true);
    expect(get().step).toBe(1);
  });

  test("two taps on next during the async check move a single step", async () => {
    const { get } = mount();
    let release!: (ok: boolean) => void;
    const validate = mock(
      () =>
        new Promise<boolean>((resolve) => {
          release = resolve;
        }),
    );

    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    await act(async () => {
      first = get().next(validate);
      second = get().next(validate);
    });
    expect(validate).toHaveBeenCalledTimes(1);
    await act(async () => {
      release(true);
      await first;
    });
    expect(await second).toBe(false);
    expect(get().step).toBe(1);
  });

  test("goTo accepts the router's index, and clamps it inside the list", () => {
    const { get } = mount();

    act(() => get().goTo(2));
    expect(get().step).toBe(2);
    act(() => get().goTo(90));
    expect(get().step).toBe(2);
    act(() => get().goTo(-1));
    expect(get().step).toBe(0);
  });
});

describe("WizardFooter", () => {
  test("stacks in the written order: what advances stays at the bottom, where the thumb is", () => {
    const screen = render(
      <WizardFooter>
        <Button variant="ghost" onPress={() => {}}>
          Voltar
        </Button>
        <Button onPress={() => {}}>Continuar</Button>
      </WizardFooter>,
    );

    // A column, not a row: no flex-row, and no order reversal.
    const [rodape] = byClass(screen, /mt-6 gap-3/);
    expect(rodape.props.className).not.toContain("flex-row");

    const rotulos = byRole(screen, "button").map((node) => node.props.accessibilityLabel);
    expect(rotulos.length).toBe(2);
    expect(textOf(screen).indexOf("Voltar")).toBeLessThan(textOf(screen).indexOf("Continuar"));
  });
});
