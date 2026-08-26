import { describe, expect, mock, test } from "bun:test";

/* Direto do arquivo, e nao do indice: o indice muda por outras maos enquanto
   a fila do nativo esta sendo portada. */
import { RivoProvider } from "../src/provider";
import { Tree, leavesOf, type TreeNode } from "../src/tree";
import { act, byLabel, byRole, render, textOf } from "./helpers";

const PLAN: TreeNode[] = [
  {
    id: "financeiro",
    label: "Financeiro",
    children: [
      {
        id: "pagar",
        label: "Contas a pagar",
        children: [
          { id: "fornecedores", label: "Fornecedores" },
          { id: "impostos", label: "Impostos" },
        ],
      },
      { id: "receber", label: "Contas a receber" },
    ],
  },
  { id: "marketing", label: "Marketing" },
];

/** O galho na tela de agora, pelo nome falado que a peca monta. */
const branch = (screen: ReturnType<typeof render>, label: string) =>
  byRole(screen, "button").find((node) =>
    String(node.props.accessibilityLabel ?? "").startsWith(label),
  )!;

describe("Tree", () => {
  test("a raiz mostra um nível só, e o galho diz quantas folhas tem", () => {
    const screen = render(
      <Tree items={PLAN} value={[]} onValueChange={() => {}} label="Centro de custo" />,
    );

    expect(textOf(screen)).toContain("Financeiro");
    expect(textOf(screen)).toContain("Marketing");
    // O nivel de dentro nao esta na tela: e essa a diferenca para o web.
    expect(textOf(screen)).not.toContain("Contas a pagar");

    expect(byLabel(screen, "Financeiro, 3 itens").length).toBe(1);
    expect(byRole(screen, "list")[0].props.accessibilityLabel).toBe("Centro de custo");
  });

  test("tocar num galho empurra o nível, e o cabeçalho volta um de cada vez", () => {
    const screen = render(
      <Tree items={PLAN} value={[]} onValueChange={() => {}} label="Centro de custo" />,
    );

    act(() => branch(screen, "Financeiro").props.onPress());
    expect(textOf(screen)).toContain("Contas a pagar");
    expect(textOf(screen)).not.toContain("Marketing");
    expect(byRole(screen, "list")[0].props.accessibilityLabel).toBe("Financeiro");
    expect(byLabel(screen, "Voltar para Centro de custo").length).toBe(1);

    act(() => branch(screen, "Contas a pagar").props.onPress());
    expect(textOf(screen)).toContain("Fornecedores");
    // O caminho inteiro, na ordem em que foi andado.
    expect(textOf(screen)).toContain("Financeiro › Contas a pagar");
    expect(byLabel(screen, "Voltar para Financeiro").length).toBe(1);

    // Voltar sobe UM nivel, e nao volta a raiz.
    act(() => byLabel(screen, "Voltar para Financeiro")[0].props.onPress());
    expect(textOf(screen)).toContain("Contas a receber");
    expect(byLabel(screen, "Voltar para Centro de custo").length).toBe(1);
  });

  test("é controlada: escolher não muda a tela sozinho, avisa quem manda", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Tree items={PLAN} value={[]} onValueChange={onValueChange} label="Centro de custo" />,
    );

    const leaf = byRole(screen, "button").find(
      (node) => node.props.accessibilityState?.selected === false,
    )!;
    act(() => leaf.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(["marketing"]);
    // Nada mudou na tela: quem guarda o valor esta do lado de fora.
    expect(
      byRole(screen, "button").filter((node) => node.props.accessibilityState?.selected === true)
        .length,
    ).toBe(0);
  });

  test("sem multiple, a escolha troca em vez de somar, e galho não escolhe", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Tree
        items={PLAN}
        value={["marketing"]}
        onValueChange={onValueChange}
        label="Centro de custo"
      />,
    );

    // Galho nao tem caixa de marcar quando a escolha e unica: ele so navega.
    expect(byRole(screen, "checkbox").length).toBe(0);

    const chosen = byRole(screen, "button").find(
      (node) => node.props.accessibilityState?.selected === true,
    )!;
    act(() => chosen.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith([]);
  });

  test("multiple: marcar o galho marca todas as folhas debaixo dele", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Tree
        items={PLAN}
        multiple
        value={[]}
        onValueChange={onValueChange}
        label="Centro de custo"
      />,
    );

    act(() => byLabel(screen, "Marcar tudo em Financeiro")[0].props.onPress());
    // As tres folhas, e nunca o id do pai: quem vale e a folha.
    expect(onValueChange).toHaveBeenCalledWith(["fornecedores", "impostos", "receber"]);
  });

  test("multiple: desmarcar o galho cheio tira só as folhas dele", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Tree
        items={PLAN}
        multiple
        value={["fornecedores", "impostos", "receber", "marketing"]}
        onValueChange={onValueChange}
        label="Centro de custo"
      />,
    );

    const box = byLabel(screen, "Marcar tudo em Financeiro")[0];
    expect(box.props.accessibilityState.checked).toBe(true);

    act(() => box.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(["marketing"]);
  });

  test("multiple: o galho meio marcado conta em texto, porque a caixa não tem misto", () => {
    const screen = render(
      <Tree
        items={PLAN}
        multiple
        value={["fornecedores"]}
        onValueChange={() => {}}
        label="Centro de custo"
      />,
    );

    // A caixa fica vazia: cheia, ela prometeria as tres folhas.
    expect(byLabel(screen, "Marcar tudo em Financeiro")[0].props.accessibilityState.checked).toBe(
      false,
    );
    // O que se ve e o que se ouve dizem a mesma conta.
    expect(textOf(screen)).toContain("1 de 3 escolhidos");
    expect(byLabel(screen, "Financeiro, 3 itens, 1 escolhido").length).toBe(1);
  });

  test("multiple: a folha é uma caixa de marcar, e alterna sozinha", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Tree
        items={PLAN}
        multiple
        value={["marketing"]}
        onValueChange={onValueChange}
        label="Centro de custo"
      />,
    );

    const leaf = byRole(screen, "checkbox").find(
      (node) => node.props.accessibilityState?.checked === true,
    )!;
    act(() => leaf.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith([]);
  });

  test("o galho desligado não entra e a caixa dele não marca", () => {
    const onValueChange = mock(() => {});
    const items: TreeNode[] = [
      { id: "raiz", label: "Bloqueado", disabled: true, children: [{ id: "folha", label: "Folha" }] },
    ];
    const screen = render(
      <Tree items={items} multiple value={[]} onValueChange={onValueChange} label="Conta" />,
    );

    const row = branch(screen, "Bloqueado");
    expect(row.props.disabled).toBe(true);
    expect(byLabel(screen, "Marcar tudo em Bloqueado")[0].props.disabled).toBe(true);
  });

  test("o caminho encolhe sozinho quando o galho some da árvore nova", () => {
    const screen = render(
      <Tree items={PLAN} value={[]} onValueChange={() => {}} label="Centro de custo" />,
    );

    act(() => branch(screen, "Financeiro").props.onPress());
    act(() => branch(screen, "Contas a pagar").props.onPress());
    expect(textOf(screen)).toContain("Fornecedores");

    // A consulta se refez e o galho de dentro nao existe mais.
    const trimmed: TreeNode[] = [
      { id: "financeiro", label: "Financeiro", children: [{ id: "receber", label: "Contas a receber" }] },
    ];
    // Com o provider por fora, como o `render` monta: trocando a raiz, o React
    // remontaria a arvore e o caminho se perderia por outro motivo.
    act(() => {
      screen.update(
        <RivoProvider>
          <Tree items={trimmed} value={[]} onValueChange={() => {}} label="Centro de custo" />
        </RivoProvider>,
      );
    });

    // O caminho para no ultimo galho que ainda existe, em vez de mostrar um
    // nivel que a resposta anterior tinha e esta nao tem.
    expect(textOf(screen)).toContain("Contas a receber");
    expect(byLabel(screen, "Voltar para Centro de custo").length).toBe(1);
  });

  test("o nível vazio explica que está vazio", () => {
    const items: TreeNode[] = [];
    const screen = render(
      <Tree items={items} value={[]} onValueChange={() => {}} label="Conta" />,
    );
    expect(textOf(screen)).toContain("Nada dentro deste nível.");
  });
});

describe("leavesOf", () => {
  test("um nó sem filhos é a própria folha, e um galho entrega as de baixo", () => {
    expect(leavesOf({ id: "só", label: "Só" })).toEqual(["só"]);
    expect(leavesOf(PLAN[0]!)).toEqual(["fornecedores", "impostos", "receber"]);
    // Lista vazia de filhos e folha, e nao galho sem nada dentro.
    expect(leavesOf({ id: "vazio", label: "Vazio", children: [] })).toEqual(["vazio"]);
  });
});
