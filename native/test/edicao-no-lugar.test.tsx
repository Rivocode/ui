import { describe, expect, mock, test } from "bun:test";

import { Editable } from "../src/editable";
import { act, byLabel, byRole, byType, render, textOf } from "./helpers";

const field = (screen: ReturnType<typeof render>) => byType(screen, "TextInput")[0];

describe("Editable", () => {
  test("fechada, o valor viaja no nome e o toque longo é a porta", () => {
    const screen = render(
      <Editable value="Clínica São Lucas" onValueChange={() => {}} label="Nome do cliente" />,
    );

    expect(textOf(screen)).toContain("Clínica São Lucas");
    const preview = byRole(screen, "button")[0];
    expect(preview.props.accessibilityLabel).toBe("Nome do cliente: Clínica São Lucas");
    expect(preview.props.accessibilityHint).toBe("Toque e segure para editar");
    // O toque curto nao abre: num painel de leitura o dedo encosta em tudo
    // enquanto rola, e o teclado subiria a cada esbarrao.
    expect(preview.props.onPress).toBeUndefined();
    expect(byType(screen, "TextInput").length).toBe(0);

    act(() => preview.props.onLongPress());
    expect(byType(screen, "TextInput").length).toBe(1);
  });

  test("quem ouve a tela tem a mesma porta, pela ação de toque longo", () => {
    const screen = render(
      <Editable value="Ana Duarte" onValueChange={() => {}} label="Responsável" />,
    );

    const preview = byRole(screen, "button")[0];
    expect(preview.props.accessibilityActions).toEqual([{ name: "longpress", label: "Editar" }]);

    act(() => preview.props.onAccessibilityAction({ nativeEvent: { actionName: "longpress" } }));
    expect(byType(screen, "TextInput").length).toBe(1);
  });

  test("o campo abre com o texto de agora, selecionado e com o teclado de pé", () => {
    const screen = render(
      <Editable value="Ana Duarte" onValueChange={() => {}} label="Responsável" />,
    );
    act(() => byRole(screen, "button")[0].props.onLongPress());

    const input = field(screen);
    expect(input.props.value).toBe("Ana Duarte");
    expect(input.props.accessibilityLabel).toBe("Responsável");
    expect(input.props.autoFocus).toBe(true);
    expect(input.props.selectTextOnFocus).toBe(true);
    // O retorno confirma, e a tecla precisa dizer isso antes de ser tocada.
    expect(input.props.returnKeyType).toBe("done");
  });

  test("o retorno confirma, e só ele", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Editable value="Ana Duarte" onValueChange={onValueChange} label="Responsável" />,
    );

    act(() => byRole(screen, "button")[0].props.onLongPress());
    act(() => field(screen).props.onChangeText("Ana Duarte Lima"));
    // Digitar nao avisa ninguem: a peca e controlada e o rascunho e dela.
    expect(onValueChange).not.toHaveBeenCalled();

    act(() => field(screen).props.onSubmitEditing());
    expect(onValueChange).toHaveBeenCalledWith("Ana Duarte Lima");
    // Fechou: o campo saiu da tela.
    expect(byType(screen, "TextInput").length).toBe(0);
  });

  test("sair do campo não salva - é o Cancelar que tira o foco", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Editable value="Ana Duarte" onValueChange={onValueChange} label="Responsável" />,
    );

    act(() => byRole(screen, "button")[0].props.onLongPress());
    act(() => field(screen).props.onChangeText("rascunho perdido"));

    // O campo tem `onBlur` do proprio Input, para a borda; salvar ali faria o
    // Cancelar salvar no caminho de cancelar.
    act(() => field(screen).props.onBlur({}));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(byType(screen, "TextInput").length).toBe(1);
  });

  test("o Cancelar desfaz, e o campo reabre com o valor de verdade", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Editable value="Ana Duarte" onValueChange={onValueChange} label="Responsável" />,
    );

    act(() => byRole(screen, "button")[0].props.onLongPress());
    act(() => field(screen).props.onChangeText("rascunho perdido"));

    // Aberta, a peca tem UM botao: o `Cancelar`. O texto virou campo, e o
    // campo nao e botao.
    const buttons = byRole(screen, "button");
    expect(buttons.length).toBe(1);
    act(() => buttons[0].props.onPress());

    expect(onValueChange).not.toHaveBeenCalled();
    expect(textOf(screen)).toContain("Ana Duarte");
    expect(textOf(screen)).not.toContain("rascunho perdido");

    // O rascunho nasce do valor a cada abertura: o descartado nao volta.
    act(() => byRole(screen, "button")[0].props.onLongPress());
    expect(field(screen).props.value).toBe("Ana Duarte");
  });

  test("confirmar sem mexer não avisa ninguém", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Editable value="Ana Duarte" onValueChange={onValueChange} label="Responsável" />,
    );

    act(() => byRole(screen, "button")[0].props.onLongPress());
    act(() => field(screen).props.onSubmitEditing());
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("vazio mostra o traço e anuncia que está vazio", () => {
    const screen = render(<Editable value="" onValueChange={() => {}} label="Apelido" />);

    expect(textOf(screen)).toContain("—");
    expect(byLabel(screen, "Apelido: vazio").length).toBe(1);
  });

  test("desligada não abre", () => {
    const screen = render(
      <Editable value="Ana Duarte" onValueChange={() => {}} label="Responsável" disabled />,
    );

    const preview = byRole(screen, "button")[0];
    expect(preview.props.disabled).toBe(true);
    expect(preview.props.accessibilityState).toEqual({ disabled: true });
  });
});
