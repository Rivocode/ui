import { describe, expect, mock, test } from "bun:test";

/* Direto do arquivo, e nao do indice, como as irmas desta leva. */
import type { TreeNode } from "../src/tree";
import { TreeSelect } from "../src/tree-select";
import { act, byLabel, byRole, render, textOf } from "./helpers";

const PLAN: TreeNode[] = [
  {
    id: "financeiro",
    label: "Financeiro",
    children: [
      { id: "pagar", label: "Contas a pagar" },
      { id: "receber", label: "Contas a receber" },
    ],
  },
  { id: "marketing", label: "Marketing" },
];

/* O gatilho e o botao que leva o nome da peca; a folha aberta poe o mesmo
   nome na lista da arvore, que e `list` e nao `button`. */
const trigger = (screen: ReturnType<typeof render>) =>
  byRole(screen, "button").find((node) => node.props.accessibilityLabel === "Centro de custo")!;

/* O `Aplicar` e o unico botao pintado de acento na folha: o fundo escurecido
   e o `bg-overlay`, e as linhas da arvore nao tem fundo proprio. */
const apply = (screen: ReturnType<typeof render>) =>
  byRole(screen, "button").find((node) => node.props.className?.includes("bg-accent "))!;

describe("TreeSelect", () => {
  test("o gatilho resume com as mesmas palavras do Select, e conta só as folhas que existem", () => {
    const one = render(
      <TreeSelect items={PLAN} value={["pagar"]} onValueChange={() => {}} label="Centro de custo" />,
    );
    // Com uma escolha so vale o nome dela, como no `summarize` das outras duas.
    expect(textOf(one)).toContain("Contas a pagar");
    expect(trigger(one).props.accessibilityValue.text).toBe("Contas a pagar");

    const many = render(
      <TreeSelect
        items={PLAN}
        value={["pagar", "receber", "sumiu"]}
        onValueChange={() => {}}
        label="Centro de custo"
      />,
    );
    // "sumiu" nao e folha desta arvore: contar tres seria o gatilho mentindo.
    expect(trigger(many).props.accessibilityValue.text).toBe("2 selecionados");
  });

  test("a folha abre com a árvore dentro, e o rodapé conta o rascunho", () => {
    const screen = render(
      <TreeSelect items={PLAN} value={[]} onValueChange={() => {}} label="Centro de custo" />,
    );

    act(() => trigger(screen).props.onPress());
    expect(textOf(screen)).toContain("Financeiro");
    expect(textOf(screen)).toContain("Nada escolhido");

    act(() => byLabel(screen, "Marcar tudo em Financeiro")[0].props.onPress());
    // A conta do rodape anda enquanto a pessoa marca, sem ninguem confirmar.
    expect(textOf(screen)).toContain("2 selecionados");
  });

  test("marcar não confirma, e sair pela lateral desiste", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <TreeSelect items={PLAN} value={[]} onValueChange={onValueChange} label="Centro de custo" />,
    );

    act(() => trigger(screen).props.onPress());
    act(() => byLabel(screen, "Marcar tudo em Financeiro")[0].props.onPress());
    expect(onValueChange).not.toHaveBeenCalled();

    act(() => byLabel(screen, "Fechar")[0].props.onPress());
    // O toque no fundo escurecido e o gesto de quem se arrependeu: nada saiu.
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("aplicar entrega as folhas e fecha a folha", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <TreeSelect items={PLAN} value={[]} onValueChange={onValueChange} label="Centro de custo" />,
    );

    act(() => trigger(screen).props.onPress());
    act(() => byLabel(screen, "Marcar tudo em Financeiro")[0].props.onPress());
    act(() => apply(screen).props.onPress());

    // As folhas, e nunca o id do pai - a regra do web atravessa inteira.
    expect(onValueChange).toHaveBeenCalledWith(["pagar", "receber"]);
    // Folha fechada: a arvore saiu da tela.
    expect(textOf(screen)).not.toContain("Contas a receber");
  });

  test("o rascunho descartado não volta na próxima abertura", () => {
    const screen = render(
      <TreeSelect items={PLAN} value={[]} onValueChange={() => {}} label="Centro de custo" />,
    );

    act(() => trigger(screen).props.onPress());
    act(() => byLabel(screen, "Marcar tudo em Financeiro")[0].props.onPress());
    expect(textOf(screen)).toContain("2 selecionados");

    act(() => byLabel(screen, "Fechar")[0].props.onPress());
    act(() => trigger(screen).props.onPress());
    expect(textOf(screen)).toContain("Nada escolhido");
  });

  test("desligado não abre a folha", () => {
    const screen = render(
      <TreeSelect
        items={PLAN}
        value={[]}
        onValueChange={() => {}}
        label="Centro de custo"
        disabled
      />,
    );
    expect(trigger(screen).props.disabled).toBe(true);
    expect(textOf(screen)).not.toContain("Financeiro");
  });
});
