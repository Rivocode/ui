import { describe, expect, mock, spyOn, test } from "bun:test";
import { Text } from "react-native";

import {
  CheckboxGroup,
  Fieldset,
  Input,
  InputGroup,
  MaskedInput,
  NumberField,
  OTPField,
  PasswordInput,
  RadioGroup,
  SearchInput,
  TagsInput,
  Textarea,
} from "../src";
import { act, byClass, byLabel, byRole, render, textOf } from "./helpers";

describe("RadioGroup", () => {
  const items = [
    { label: "Boleto", value: "boleto" },
    { label: "Pix", value: "pix", description: "Cai na hora" },
  ];

  test("radio role, checked on the chosen one, and a tap chooses", () => {
    const onValueChange = mock(() => {});
    const screen = render(<RadioGroup items={items} value="pix" onValueChange={onValueChange} />);

    const radios = byRole(screen, "radio");
    expect(radios.length).toBe(2);
    // `checked`, not `selected`: it is the state the radio role asks for, what
    // ColorPicker already used and what the web contract names. With `selected`,
    // VoiceOver reads the option as "selected" and does not announce it checked.
    expect(radios[1].props.accessibilityState.checked).toBe(true);
    expect(radios[0].props.accessibilityState.checked).toBe(false);
    expect(radios[1].props.accessibilityState.selected).toBeUndefined();
    expect(textOf(screen)).toContain("Cai na hora");

    // The hollow circle marks with `accent-text`, not with the full lime: in
    // the light theme the border and the dot measured 1.21:1 over the page.
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

  test("checking adds, unchecking removes, without losing the rest", () => {
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

describe("onValueChange on text fields", () => {
  test("Input and Textarea deliver the text in onValueChange, and onChangeText is still called", () => {
    for (const Field of [Input, Textarea]) {
      const onValueChange = mock((_value: string) => {});
      const onChangeText = mock((_value: string) => {});
      const screen = render(<Field value="" onValueChange={onValueChange} onChangeText={onChangeText} />);
      const input = screen.root.findByType("TextInput" as never);

      act(() => input.props.onChangeText("Pix"));
      expect(onValueChange).toHaveBeenCalledWith("Pix");
      expect(onChangeText).toHaveBeenCalledWith("Pix");
    }
  });
});

describe("MaskedInput", () => {
  test("shows with punctuation, delivers only digits, and stops at capacity", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <MaskedInput
        mask="99.999.999/9999-99"
        value="12345678000190"
        onValueChange={onValueChange}
      />,
    );

    const input = screen.root.findByType("TextInput" as never);
    expect(input.props.value).toBe("12.345.678/0001-90");

    act(() => input.props.onChangeText("12.345.678/0001-901"));
    expect(onValueChange).toHaveBeenCalledWith("12345678000190", "12.345.678/0001-90");
  });

  test("with * in the mask the letter comes in uppercase, and the keyboard stops being numeric", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <MaskedInput
        mask="**.***.***/****-99"
        value="12ABC34501DE35"
        onValueChange={onValueChange}
      />,
    );

    const input = screen.root.findByType("TextInput" as never);
    expect(input.props.value).toBe("12.ABC.345/01DE-35");
    expect(input.props.keyboardType).toBe("default");
    expect(input.props.autoCapitalize).toBe("characters");

    act(() => input.props.onChangeText("12.abc.345/01de-3x5"));
    expect(onValueChange).toHaveBeenCalledWith("12ABC34501DE35", "12.ABC.345/01DE-35");
  });

  test("with only 9 in the mask the keyboard stays numeric", () => {
    const screen = render(
      <MaskedInput mask="99999-999" value="58000000" onValueChange={() => {}} />,
    );
    const input = screen.root.findByType("TextInput" as never);
    expect(input.props.keyboardType).toBe("number-pad");
  });

  test("the boleto mask punctuates the bank line and switches to the utility line when it starts with 8", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <MaskedInput
        mask="boleto"
        value="10492006506100010004200997263900989810000021403"
        onValueChange={onValueChange}
      />,
    );

    const input = screen.root.findByType("TextInput" as never);
    expect(input.props.value).toBe("10492.00650 61000.100042 00997.263900 9 89810000021403");
    expect(input.props.keyboardType).toBe("number-pad");

    act(() =>
      input.props.onChangeText("84630000000-3 29990296202-4 00410136000-8 00200644114-79"),
    );
    expect(onValueChange).toHaveBeenCalledWith(
      "846300000003299902962024004101360008002006441147",
      "84630000000-3 29990296202-4 00410136000-8 00200644114-7",
    );
  });

  test("the 44 barcode digits pasted into the boleto mask stay without the line punctuation", () => {
    const barcode = "10499898100000214032006561000100040099726390";
    const onValueChange = mock(() => {});
    const screen = render(<MaskedInput mask="boleto" value={barcode} onValueChange={onValueChange} />);

    const input = screen.root.findByType("TextInput" as never);
    expect(input.props.value).toBe(barcode);

    act(() => input.props.onChangeText(` ${barcode}\n`));
    expect(onValueChange).toHaveBeenCalledWith(barcode, barcode);

    const line = render(
      <MaskedInput
        mask="boleto"
        value={"10492006506100010004200997263900989810000021403".slice(0, 44)}
        onValueChange={() => {}}
      />,
    );
    expect(line.root.findByType("TextInput" as never).props.value).toBe(
      "10492.00650 61000.100042 00997.263900 9 89810000021",
    );
  });

  test("accepts the web names, and the 9 of a hand-written mask is a digit", () => {
    const onValueChange = mock((_clean: string, _masked: string) => {});
    const screen = render(<MaskedInput mask="cpf" value="12345678909" onValueChange={onValueChange} />);
    const input = screen.root.findByType("TextInput" as never);
    expect(input.props.value).toBe("123.456.789-09");
    expect(input.props.keyboardType).toBe("number-pad");

    act(() => input.props.onChangeText("123.456.789-0"));
    expect(onValueChange).toHaveBeenLastCalledWith("1234567890", "123.456.789-0");

    const phone = render(<MaskedInput mask="(99) 9999-9999" value="8332221111" onValueChange={() => {}} />);
    expect(phone.root.findByType("TextInput" as never).props.value).toBe("(83) 3222-1111");
  });

  test("cnpj and placa open the letter keyboard, and the letter arrives in uppercase", () => {
    const onValueChange = mock((_clean: string, _masked: string) => {});
    const screen = render(<MaskedInput mask="placa" value="" onValueChange={onValueChange} />);
    const input = screen.root.findByType("TextInput" as never);
    expect(input.props.keyboardType).toBe("default");

    act(() => input.props.onChangeText("abc1d23"));
    expect(onValueChange).toHaveBeenLastCalledWith("ABC1D23", "ABC1D23");

    const cnpj = render(<MaskedInput mask="cnpj" value="12ABC34501DE35" onValueChange={() => {}} />);
    expect(cnpj.root.findByType("TextInput" as never).props.value).toBe("12.ABC.345/01DE-35");
  });

  test("telefone switches mask at the ninth digit, and moeda delivers the on-screen digits, like the web's raw value", () => {
    const phone = render(<MaskedInput mask="telefone" value="83999998888" onValueChange={() => {}} />);
    expect(phone.root.findByType("TextInput" as never).props.value).toBe("(83) 99999-8888");

    const onValueChange = mock((_clean: string, _masked: string) => {});
    const money = render(<MaskedInput mask="moeda" value="5" onValueChange={onValueChange} />);
    const input = money.root.findByType("TextInput" as never);
    expect(input.props.value).toBe("0,05");
    expect(input.props.keyboardType).toBe("number-pad");

    act(() => input.props.onChangeText("0,051"));
    expect(onValueChange).toHaveBeenLastCalledWith("051", "0,51");

    act(() => input.props.onChangeText("0,0"));
    expect(onValueChange).toHaveBeenLastCalledWith("", "");

    act(() => input.props.onChangeText("5"));
    expect(onValueChange).toHaveBeenLastCalledWith("005", "0,05");

    const kept = render(<MaskedInput mask="moeda" value="005" onValueChange={() => {}} />);
    expect(kept.root.findByType("TextInput" as never).props.value).toBe("0,05");
  });
});

describe("NumberField", () => {
  test("the steps respect the limits, and the field announces the value", () => {
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

  test("at the limit, the step on that side turns off", () => {
    const screen = render(
      <NumberField value={3} onValueChange={() => {}} min={1} max={3} label="Parcelas" />,
    );
    expect(byLabel(screen, "Aumentar Parcelas")[0].props.disabled).toBe(true);
    expect(byLabel(screen, "Diminuir Parcelas")[0].props.disabled).toBe(false);
  });

  test("the middle field can shrink, or the + step falls out of the box", () => {
    const screen = render(<NumberField value={2} onValueChange={() => {}} label="Parcelas" />);

    const field = byClass(screen, /border-l/)[0]!;
    expect(String(field.props.className).split(" ")).toContain("min-w-0");
    expect(String(field.props.className).split(" ")).toContain("flex-1");
  });
});

describe("OTPField", () => {
  test("one box per digit, and onValueComplete only on the last", () => {
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

  test("the field name agrees with the number of digits", () => {
    const many = render(<OTPField length={4} value="" onValueChange={() => {}} />);
    expect(byLabel(many, "Código de 4 dígitos").length).toBe(1);

    const one = render(<OTPField length={1} value="" onValueChange={() => {}} />);
    expect(byLabel(one, "Código de 1 dígito").length).toBe(1);
  });
});

describe("SearchInput", () => {
  test("clear only exists when there is something to clear, and clears it", () => {
    const onValueChange = mock(() => {});
    const empty = render(<SearchInput value="" onValueChange={() => {}} />);
    expect(byLabel(empty, "Limpar a busca").length).toBe(0);

    const filled = render(<SearchInput value="clinica" onValueChange={onValueChange} />);
    act(() => byLabel(filled, "Limpar a busca")[0].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith("");
  });
});

describe("Fieldset", () => {
  test("legend, description and the fields inside", () => {
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
  test("prefix, suffix and the button named by its action, all in a single frame", () => {
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

  test("invalid paints the frame, and the inner field gets no border of its own", () => {
    const screen = render(<InputGroup value="" onValueChange={() => {}} invalid />);
    expect(byClass(screen, /border-danger/).length).toBe(1);
    const input = screen.root.findByType("TextInput" as never);
    expect(input.props.className).not.toContain("border");
  });
});

describe("PasswordInput", () => {
  test("the button says the action and changes with the state; leaving the field hides again", () => {
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
  test("labels.remove names the x, as on the web", () => {
    const named = render(
      <TagsInput value={["pix"]} onValueChange={() => {}} labels={{ remove: (tag) => `Tirar ${tag}` }} />,
    );
    expect(byLabel(named, "Tirar pix").length).toBe(1);

    const fallback = render(<TagsInput value={["pix"]} onValueChange={() => {}} />);
    expect(byLabel(fallback, "Remover pix").length).toBe(1);
  });

  test("a typed separator closes the chip, and a repeated one does not get in twice", () => {
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

  test("Enter closes without dismissing the keyboard, and leaving the field closes what is left", () => {
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

  test("each chip says what it removes, and the ceiling closes the field", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <TagsInput value={["pix", "boleto"]} onValueChange={onValueChange} max={2} />,
    );

    act(() => byLabel(screen, "Remover pix")[0].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(["boleto"]);

    expect(screen.root.findByType("TextInput" as never).props.editable).toBe(false);
  });
});

describe("the old mask", () => {
  test("MaskedInput warns when the mask still uses #, which since 1.0 is fixed punctuation", () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});

    try {
      render(<MaskedInput mask="##.###" value="" onValueChange={() => {}} />);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]?.[0])).toContain('"9"');

      warn.mockClear();
      render(<MaskedInput mask="99.999" value="" onValueChange={() => {}} />);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});
