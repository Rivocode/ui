import { describe, expect, mock, test } from "bun:test";
import { Text } from "react-native";

import {
  CheckboxGroup,
  Fieldset,
  InputGroup,
  MaskedInput,
  NumberField,
  OTPField,
  PasswordInput,
  RadioGroup,
  SearchInput,
  TagsInput,
} from "../src";
import { act, byClass, byLabel, byRole, render, textOf } from "./helpers";

describe("RadioGroup", () => {
  const items = [
    { label: "Boleto", value: "boleto" },
    { label: "Pix", value: "pix", description: "Cai na hora" },
  ];

  test("papel de radio, checked na escolhida, e o toque escolhe", () => {
    const onValueChange = mock(() => {});
    const screen = render(<RadioGroup items={items} value="pix" onValueChange={onValueChange} />);

    const radios = byRole(screen, "radio");
    expect(radios.length).toBe(2);
    // `checked`, e nao `selected`: e o estado que o papel radio pede, o que o
    // ColorPicker ja usava e o que o contrato do web nomeia. Com `selected`, o
    // VoiceOver le a opcao como "selecionada" e nao anuncia marcada.
    expect(radios[1].props.accessibilityState.checked).toBe(true);
    expect(radios[0].props.accessibilityState.checked).toBe(false);
    expect(radios[1].props.accessibilityState.selected).toBeUndefined();
    expect(textOf(screen)).toContain("Cai na hora");

    // O círculo vazado marca com `accent-text`, e não com a lima cheia: no
    // tema claro a borda e o ponto mediam 1,21:1 sobre a página.
    expect(byClass(screen, /border-accent-text/).length).toBe(1);
    expect(byClass(screen, /bg-accent-text/).length).toBe(1);
    expect(byClass(screen, /bg-accent(?![\w-])/).length).toBe(0);

    act(() => radios[0].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith("boleto");
  });
});

describe("CheckboxGroup", () => {
  const items = [
    { label: "PDF", value: "pdf" },
    { label: "XML", value: "xml" },
  ];

  test("marcar acrescenta, desmarcar retira, sem perder o resto", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <CheckboxGroup items={items} value={["pdf"]} onValueChange={onValueChange} />,
    );

    const boxes = byRole(screen, "checkbox");
    act(() => boxes[1].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(["pdf", "xml"]);

    act(() => boxes[0].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith([]);
  });
});

describe("MaskedInput", () => {
  test("mostra com pontuacao, entrega so digitos, e para na capacidade", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <MaskedInput
        mask="##.###.###/####-##"
        value="12345678000190"
        onValueChange={onValueChange}
      />,
    );

    const input = screen.root.findByType("TextInput" as never);
    expect(input.props.value).toBe("12.345.678/0001-90");

    act(() => input.props.onChangeText("12.345.678/0001-901"));
    expect(onValueChange).toHaveBeenCalledWith("12345678000190");
  });
});

describe("NumberField", () => {
  test("os passos respeitam os limites, e o campo anuncia o valor", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <NumberField value={2} onValueChange={onValueChange} min={1} max={3} label="Parcelas" />,
    );

    act(() => byLabel(screen, "Aumentar Parcelas")[0].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(3);

    act(() => byLabel(screen, "Diminuir Parcelas")[0].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(1);

    expect(byLabel(screen, "Parcelas")[0].props.accessibilityValue).toEqual({ text: "2" });
  });

  test("no limite, o passo daquele lado desliga", () => {
    const screen = render(
      <NumberField value={3} onValueChange={() => {}} min={1} max={3} label="Parcelas" />,
    );
    expect(byLabel(screen, "Aumentar Parcelas")[0].props.disabled).toBe(true);
    expect(byLabel(screen, "Diminuir Parcelas")[0].props.disabled).toBe(false);
  });
});

describe("OTPField", () => {
  test("uma caixa por digito, e onValueComplete so no ultimo", () => {
    const onValueComplete = mock(() => {});
    const onValueChange = mock(() => {});
    const screen = render(
      <OTPField
        length={4}
        value="12"
        onValueChange={onValueChange}
        onValueComplete={onValueComplete}
      />,
    );

    expect(textOf(screen)).toContain("1");
    expect(textOf(screen)).toContain("2");

    const input = screen.root.findByType("TextInput" as never);
    act(() => input.props.onChangeText("123"));
    expect(onValueComplete).not.toHaveBeenCalled();

    act(() => input.props.onChangeText("1234"));
    expect(onValueChange).toHaveBeenCalledWith("1234");
    expect(onValueComplete).toHaveBeenCalledWith("1234");
  });
});

describe("SearchInput", () => {
  test("o limpar so existe quando ha o que limpar, e limpa", () => {
    const onValueChange = mock(() => {});
    const empty = render(<SearchInput value="" onValueChange={() => {}} />);
    expect(byLabel(empty, "Limpar a busca").length).toBe(0);

    const filled = render(<SearchInput value="clinica" onValueChange={onValueChange} />);
    act(() => byLabel(filled, "Limpar a busca")[0].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith("");
  });
});

describe("Fieldset", () => {
  test("legenda, descricao e os campos dentro", () => {
    const screen = render(
      <Fieldset legend="Cobrança" description="Como o cliente paga.">
        <Text>campos</Text>
      </Fieldset>,
    );
    expect(textOf(screen)).toContain("Cobrança");
    expect(textOf(screen)).toContain("Como o cliente paga.");
    expect(textOf(screen)).toContain("campos");
  });
});

describe("InputGroup", () => {
  test("prefixo, sufixo e o botao com nome pela acao, tudo numa moldura so", () => {
    const onValueChange = mock(() => {});
    const onPress = mock(() => {});
    const screen = render(
      <InputGroup
        value="120"
        onValueChange={onValueChange}
        prefix="R$"
        suffix=",00"
        actions={[{ label: "Limpar o valor", onPress, children: "×" }]}
        accessibilityLabel="Valor"
      />,
    );

    expect(textOf(screen)).toContain("R$");
    expect(textOf(screen)).toContain(",00");

    const input = screen.root.findByType("TextInput" as never);
    act(() => input.props.onChangeText("125"));
    expect(onValueChange).toHaveBeenCalledWith("125");

    const action = byLabel(screen, "Limpar o valor")[0];
    expect(action.props.accessibilityRole).toBe("button");
    act(() => action.props.onPress());
    expect(onPress).toHaveBeenCalled();
  });

  test("invalid pinta a moldura, e o campo de dentro nao ganha borda propria", () => {
    const screen = render(<InputGroup value="" onValueChange={() => {}} invalid />);
    expect(byClass(screen, /border-danger/).length).toBe(1);
    const input = screen.root.findByType("TextInput" as never);
    expect(input.props.className).not.toContain("border");
  });
});

describe("PasswordInput", () => {
  test("o botao diz a acao e troca com o estado; sair do campo esconde de novo", () => {
    const screen = render(<PasswordInput value="segredo" onValueChange={() => {}} />);
    const input = screen.root.findByType("TextInput" as never);
    expect(input.props.secureTextEntry).toBe(true);

    act(() => byLabel(screen, "Mostrar senha")[0].props.onPress());
    expect(screen.root.findByType("TextInput" as never).props.secureTextEntry).toBe(false);
    expect(byLabel(screen, "Mostrar senha").length).toBe(0);

    act(() => byLabel(screen, "Esconder senha")[0].props.onPress());
    expect(screen.root.findByType("TextInput" as never).props.secureTextEntry).toBe(true);

    act(() => byLabel(screen, "Mostrar senha")[0].props.onPress());
    act(() => screen.root.findByType("TextInput" as never).props.onBlur({}));
    expect(screen.root.findByType("TextInput" as never).props.secureTextEntry).toBe(true);
  });
});

describe("TagsInput", () => {
  test("o separador digitado fecha a ficha, e a repetida nao entra duas vezes", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <TagsInput value={["pix"]} onValueChange={onValueChange} accessibilityLabel="Etiquetas" />,
    );

    const input = screen.root.findByType("TextInput" as never);
    act(() => input.props.onChangeText("urgente,"));
    expect(onValueChange).toHaveBeenCalledWith(["pix", "urgente"]);

    onValueChange.mockClear();
    act(() => input.props.onChangeText("pix,"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("Enter fecha sem soltar o teclado, e sair do campo fecha o que sobrou", () => {
    const onValueChange = mock(() => {});
    const screen = render(<TagsInput value={[]} onValueChange={onValueChange} />);
    const input = screen.root.findByType("TextInput" as never);
    expect(input.props.submitBehavior).toBe("submit");

    act(() => input.props.onChangeText("boleto"));
    act(() => input.props.onSubmitEditing());
    expect(onValueChange).toHaveBeenCalledWith(["boleto"]);

    onValueChange.mockClear();
    act(() => input.props.onChangeText("nota"));
    act(() => input.props.onBlur({}));
    expect(onValueChange).toHaveBeenCalledWith(["nota"]);
  });

  test("cada ficha diz o que remove, e o teto fecha o campo", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <TagsInput value={["pix", "boleto"]} onValueChange={onValueChange} max={2} />,
    );

    act(() => byLabel(screen, "Remover pix")[0].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(["boleto"]);

    expect(screen.root.findByType("TextInput" as never).props.editable).toBe(false);
  });
});
