import { describe, expect, mock, test } from "bun:test";
import type { ReactTestRenderer } from "react-test-renderer";

import { ColorPicker, normalizeColor } from "../src/color-picker";
import { RivoProvider } from "../src/provider";
import { act, byLabel, byRole, render } from "./helpers";

const MARCA = [
  { value: "#d4f34a", label: "Lima" },
  { value: "#3ddc97", label: "Teal" },
  { value: "#f2b21c", label: "Âmbar" },
  { value: "#6aa9ff", label: "Azul" },
];

/** O campo hexadecimal, que e o unico TextInput da arvore. */
function hexField(screen: ReactTestRenderer) {
  return byLabel(screen, "Código hexadecimal da cor")[0]!;
}

describe("normalizeColor", () => {
  test("aceita o que se cola de qualquer lugar e devolve sempre a mesma forma", () => {
    expect(normalizeColor("#0f8")).toBe("#00ff88");
    expect(normalizeColor("BFDD3A")).toBe("#bfdd3a");
    expect(normalizeColor("  #D4F34A  ")).toBe("#d4f34a");
  });

  test("o que ainda nao e cor devolve null, e oito digitos ficam de fora", () => {
    expect(normalizeColor("#d4f")).toBe("#dd44ff");
    expect(normalizeColor("#d4f3")).toBeNull();
    expect(normalizeColor("d4f34aff")).toBeNull();
    expect(normalizeColor("lima")).toBeNull();
  });
});

describe("ColorPicker", () => {
  test("as amostras sao um grupo de radio, e nao um punhado de botoes", () => {
    const screen = render(
      <ColorPicker
        label="Cor da marca"
        value="#d4f34a"
        onValueChange={() => {}}
        swatches={MARCA}
      />,
    );

    expect(byRole(screen, "radiogroup")[0]!.props.accessibilityLabel).toBe("Cor da marca");
    expect(byRole(screen, "radio")).toHaveLength(4);
  });

  test("o nome carrega o valor, e sem nome a amostra ainda se anuncia", () => {
    const named = render(<ColorPicker value="" onValueChange={() => {}} swatches={[MARCA[0]!]} />);
    expect(byLabel(named, "Lima, #d4f34a")).toHaveLength(1);

    const bare = render(<ColorPicker value="" onValueChange={() => {}} swatches={["#d4f34a"]} />);
    expect(byLabel(bare, "Cor #d4f34a")).toHaveLength(1);
  });

  test("o escolhido e dito, e nao so pintado", () => {
    const screen = render(
      <ColorPicker value="#3DDC97" onValueChange={() => {}} swatches={MARCA} />,
    );

    // O valor chega em maiuscula e ainda casa: a comparacao e normalizada.
    expect(byLabel(screen, "Teal, #3ddc97")[0]!.props.accessibilityState).toEqual({
      checked: true,
      disabled: undefined,
    });
    expect(byLabel(screen, "Lima, #d4f34a")[0]!.props.accessibilityState.checked).toBe(false);
  });

  test("sem cor escolhida, nenhuma amostra esta escolhida", () => {
    const screen = render(<ColorPicker value="" onValueChange={() => {}} swatches={MARCA} />);
    const marked = byRole(screen, "radio").filter(
      (node) => node.props.accessibilityState.checked === true,
    );
    expect(marked).toHaveLength(0);
  });

  test("tocar uma amostra devolve o hexadecimal normalizado", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <ColorPicker value="" onValueChange={onValueChange} swatches={["#D4F34A"]} />,
    );

    act(() => byLabel(screen, "Cor #D4F34A")[0]!.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith("#D4F34A");
  });

  test("o alvo mede 44 e o desenho colorido mede 32, por dentro dele", () => {
    const screen = render(<ColorPicker value="" onValueChange={() => {}} swatches={["#d4f34a"]} />);

    const [target] = byRole(screen, "radio");
    expect(target!.props.className).toContain("size-11");

    const [chip] = screen.root.findAll(
      (node) =>
        typeof node.type === "string" &&
        (node.props?.style as { backgroundColor?: string } | undefined)?.backgroundColor ===
          "#d4f34a",
    );
    expect(chip!.props.className).toContain("size-8");
  });

  test("a marca do escolhido e por fora, e o lugar dela existe sempre", () => {
    const screen = render(
      <ColorPicker value="#d4f34a" onValueChange={() => {}} swatches={MARCA} />,
    );

    // Borda de 2px em todas: acende-la so ao escolher moveria o desenho.
    for (const swatch of byRole(screen, "radio")) {
      expect(swatch.props.className).toContain("border-2");
    }
    expect(String(byLabel(screen, "Lima, #d4f34a")[0]!.props.className).split(" ")).toContain(
      "border-accent",
    );
    expect(byLabel(screen, "Teal, #3ddc97")[0]!.props.className).toContain("border-transparent");
  });

  test("as amostras se dividem em linhas de `columns`, porque nao ha grade no RN", () => {
    const screen = render(
      <ColorPicker
        value=""
        onValueChange={() => {}}
        columns={2}
        swatches={["#111111", "#222222", "#333333", "#444444", "#555555"]}
      />,
    );

    const rows = screen.root.findAll(
      (node) =>
        typeof node.type === "string" &&
        typeof node.props?.className === "string" &&
        node.props.className.startsWith("flex-row gap-2"),
    );
    // Cinco amostras em duas colunas: tres linhas, a ultima com uma so.
    expect(rows).toHaveLength(3);
    expect(rows[2]!.props.children).toHaveLength(1);
  });

  test("o leque padrao e calculado, e nao uma paleta de marca escrita a mao", () => {
    const screen = render(<ColorPicker value="" onValueChange={() => {}} />);
    // Dez matizes em tres claridades, os mesmos do web.
    expect(byRole(screen, "radio")).toHaveLength(30);
  });

  test("o campo aceita o que a pessoa cola e devolve seis digitos minusculos", () => {
    const onValueChange = mock(() => {});
    const screen = render(<ColorPicker value="" onValueChange={onValueChange} swatches={MARCA} />);

    act(() => hexField(screen).props.onChangeText("#0F8"));
    expect(onValueChange).toHaveBeenCalledWith("#00ff88");
  });

  test("texto que ainda nao e cor guarda o rascunho e nao avisa ninguem", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <ColorPicker value="#d4f34a" onValueChange={onValueChange} swatches={MARCA} />,
    );

    act(() => hexField(screen).props.onChangeText("#d4f3"));
    expect(onValueChange).toHaveBeenCalledTimes(0);
    expect(hexField(screen).props.value).toBe("#d4f3");

    // Ao sair sem terminar, o campo volta ao ultimo valor bom.
    act(() => hexField(screen).props.onBlur());
    expect(hexField(screen).props.value).toBe("#d4f34a");
    expect(onValueChange).toHaveBeenCalledTimes(0);
  });

  test("a cor que muda por fora arrasta o rascunho junto", () => {
    // O ajuste de estado durante o render, sem um efeito que renderize duas
    // vezes: outra amostra escolhida, ou outro cliente carregado.
    const screen = render(<ColorPicker value="#d4f34a" onValueChange={() => {}} />);
    expect(hexField(screen).props.value).toBe("#d4f34a");

    act(() => {
      screen.update(
        <RivoProvider>
          <ColorPicker value="#3ddc97" onValueChange={() => {}} />
        </RivoProvider>,
      );
    });
    expect(hexField(screen).props.value).toBe("#3ddc97");
  });

  test("o teclado e o alfanumerico, sem maiuscula nem corretor, e cabe uma cor", () => {
    const screen = render(<ColorPicker value="" onValueChange={() => {}} />);
    const field = hexField(screen);

    // Teclado de numeros nao tem `a` a `f` nem cerquilha.
    expect(field.props.keyboardType).toBe("default");
    expect(field.props.autoCapitalize).toBe("none");
    expect(field.props.autoCorrect).toBe(false);
    expect(field.props.maxLength).toBe(7);
  });

  test("hideInput tira o campo, e com ele o unico texto que diz a cor", () => {
    const screen = render(
      <ColorPicker value="#d4f34a" onValueChange={() => {}} swatches={MARCA} hideInput />,
    );
    expect(byLabel(screen, "Código hexadecimal da cor")).toHaveLength(0);
    // O estado da amostra continua dizendo qual e, que e o canal que sobra.
    expect(byRole(screen, "radio").some((node) => node.props.accessibilityState.checked)).toBe(
      true,
    );
  });

  test("desabilitado nao escolhe nem digita", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <ColorPicker value="" onValueChange={onValueChange} swatches={MARCA} disabled />,
    );

    expect(byLabel(screen, "Lima, #d4f34a")[0]!.props.disabled).toBe(true);
    expect(hexField(screen).props.editable).toBe(false);
  });
});
