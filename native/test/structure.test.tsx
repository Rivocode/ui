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

describe("Toggle e ToggleGroup", () => {
  test("o toggle anuncia apertado e alterna", () => {
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

  test("no grupo, o padrao desaperta o anterior; multiple acumula", () => {
    const items = [
      { label: "Paga", value: "paga" },
      { label: "Vencida", value: "vencida" },
    ];

    // O padrao e o mesmo do web: sem `multiple`, so um fica apertado.
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

describe("Accordion e Collapsible", () => {
  test("o item fechado esconde o corpo e anuncia expanded ao abrir", () => {
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

  test("o collapsible mostra-esconde com o mesmo contrato", () => {
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
  test("titulo, contexto, etiqueta e acoes no mesmo topo", () => {
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
  test("cada linha e um par rotulo-valor, texto ou no", () => {
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
  test("a caixa reserva a proporcao pedida", () => {
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
  test("arranja midia, texto e acao; so o texto corta, e por prop", () => {
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

    // O corte e `numberOfLines`, que no React Native e prop e nao classe -
    // e ele e do titulo e da descricao, nunca da midia nem da acao.
    const cortados = byType(screen, "Text").filter((node) => node.props.numberOfLines === 1);
    expect(cortados.length).toBe(2);

    // Sem onPress a linha nao e botao: papel so onde ha acao, como no DataList.
    expect(byRole(screen, "button").length).toBe(0);
  });

  test("com onPress a linha inteira e o alvo, e diz titulo e descricao juntos", () => {
    const onPress = mock(() => {});
    const screen = render(
      <Item title="Transportes Cabo Branco" description="3 notas em aberto" onPress={onPress} />,
    );

    const [linha] = byRole(screen, "button");
    expect(linha.props.accessibilityLabel).toBe("Transportes Cabo Branco, 3 notas em aberto");
    // Uma linha de titulo desenha 37px; o dedo pede 44.
    expect(linha.props.className).toContain("min-h-11");

    act(() => linha.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("com acao a direita, o alvo e o texto e o botao continua parada propria", () => {
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

    // O alvo da linha NAO embrulha o botao: um Pressable dentro do outro
    // seguraria o toque no de dentro, e a linha nunca abriria.
    const [linha] = botoes;
    expect(linha.findAll((node) => node.props?.accessibilityRole === "button").length).toBe(1);

    act(() => botoes[1].props.onPress());
    expect(remover).toHaveBeenCalledTimes(1);
    expect(abrir).not.toHaveBeenCalled();
  });

  test("outline poe moldura propria; plain fica solto", () => {
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
  test("porta o modo estreito do web: onde esta, o titulo, e a barra andando", () => {
    const screen = render(<Steps steps={STEPS} current={1} />);

    const texto = textOf(screen);
    expect(texto).toContain("Passo 2 de 3");
    expect(texto).toContain("Itens");
    // A descricao, que o modo estreito do web esconde por falta de largura.
    expect(texto).toContain("O que entra na nota");

    // A regua de bolinhas NAO porta: sem passo clicavel, nao ha botao nenhum.
    expect(byRole(screen, "button").length).toBe(0);

    const [barra] = byClass(screen, /bg-accent/);
    expect(barra.props.style.width).toBe(`${(2 / 3) * 100}%`);
  });

  test("uma parada so do leitor de tela, com a frase inteira", () => {
    const screen = render(<Steps steps={STEPS} current={0} />);

    const [regua] = byRole(screen, "progressbar");
    expect(regua.props.accessible).toBe(true);
    expect(regua.props.accessibilityLabel).toBe("Passo 1 de 3: Cliente");
    expect(regua.props.accessibilityValue).toEqual({ min: 1, max: 3, now: 1 });
  });

  test("indice fora da lista nao quebra a tela, e lista vazia nao desenha nada", () => {
    expect(textOf(render(<Steps steps={STEPS} current={9} />))).toContain("Passo 3 de 3");
    expect(textOf(render(<Steps steps={STEPS} current={-2} />))).toContain("Passo 1 de 3");
    // Lista vazia nao desenha regua nenhuma - so o fundo do provider sobra.
    expect(textOf(render(<Steps steps={[]} current={0} />)).trim()).toBe("");
  });
});

describe("useWizard", () => {
  /** O estado sem desenho: um host que so devolve o que o hook diz. */
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

  test("anda, volta, e para nas duas pontas", async () => {
    const { screen, get } = mount();

    expect(get().isFirst).toBe(true);
    expect(get().isLast).toBe(false);

    await act(async () => void (await get().next()));
    expect(get().step).toBe(1);
    expect(textOf(screen)).toContain("Itens");

    await act(async () => void (await get().next()));
    await act(async () => void (await get().next()));
    // O ultimo passo nao passa do fim.
    expect(get().step).toBe(2);
    expect(get().isLast).toBe(true);

    act(() => get().back());
    act(() => get().back());
    act(() => get().back());
    expect(get().step).toBe(0);
  });

  test("a checagem manda: `false` segura o passo, e ela pode ser assincrona", async () => {
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

  test("goTo aceita o indice do router, e o prende dentro da lista", () => {
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
  test("empilha na ordem escrita: o que avanca fica embaixo, onde o polegar esta", () => {
    const screen = render(
      <WizardFooter>
        <Button variant="ghost" onPress={() => {}}>
          Voltar
        </Button>
        <Button onPress={() => {}}>Continuar</Button>
      </WizardFooter>,
    );

    // Coluna, e nao linha: nada de flex-row, e nenhuma inversao de ordem.
    const [rodape] = byClass(screen, /mt-6 gap-3/);
    expect(rodape.props.className).not.toContain("flex-row");

    const rotulos = byRole(screen, "button").map((node) => node.props.accessibilityLabel);
    expect(rotulos.length).toBe(2);
    expect(textOf(screen).indexOf("Voltar")).toBeLessThan(textOf(screen).indexOf("Continuar"));
  });
});
