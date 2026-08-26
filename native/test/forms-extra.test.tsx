import { describe, expect, mock, test } from "bun:test";
import { Text } from "react-native";

import {
  CheckboxGroup,
  Fieldset,
  MaskedInput,
  NumberField,
  OTPField,
  RadioGroup,
  SearchInput,
} from "../src";
import { act, byLabel, byRole, render, textOf } from "./helpers";

describe("RadioGroup", () => {
  const items = [
    { label: "Boleto", value: "boleto" },
    { label: "Pix", value: "pix", description: "Cai na hora" },
  ];

  test("papel de radio, selected na escolhida, e o toque escolhe", () => {
    const onValueChange = mock(() => {});
    const screen = render(<RadioGroup items={items} value="pix" onValueChange={onValueChange} />);

    const radios = byRole(screen, "radio");
    expect(radios.length).toBe(2);
    expect(radios[1].props.accessibilityState.selected).toBe(true);
    expect(textOf(screen)).toContain("Cai na hora");

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
