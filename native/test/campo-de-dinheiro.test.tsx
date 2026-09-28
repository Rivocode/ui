import { describe, expect, mock, test } from "bun:test";
import { useState } from "react";

import { CurrencyInput, type CurrencyInputProps } from "../src";
import { act, byType, render, textOf } from "./helpers";

function Controlled(props: Omit<CurrencyInputProps, "value" | "onValueChange"> & { start?: number | null; onCents?: (cents: number | null) => void }) {
  const { start = null, onCents, ...rest } = props;
  const [cents, setCents] = useState<number | null>(start);
  return (
    <CurrencyInput
      {...rest}
      value={cents}
      onValueChange={(next) => {
        setCents(next);
        onCents?.(next);
      }}
    />
  );
}

function mount(props: Parameters<typeof Controlled>[0] = {}) {
  const screen = render(<Controlled {...props} />);
  const input = () => byType(screen, "TextInput")[0]!;
  const type = (key: string) => act(() => input().props.onChangeText(input().props.value + key));
  const erase = () => act(() => input().props.onChangeText(input().props.value.slice(0, -1)));
  const select = (start: number, end: number) =>
    act(() => input().props.onSelectionChange({ nativeEvent: { selection: { start, end } } }));
  const replace = (text: string) => act(() => input().props.onChangeText(text));
  return { screen, input, type, erase, select, replace };
}

describe("CurrencyInput", () => {
  test("a digitacao entra pela direita, sai em centavos, e o R$ fica ao lado", () => {
    const onCents = mock((_cents: number | null) => {});
    const { screen, input, type } = mount({ onCents });

    expect(input().props.keyboardType).toBe("number-pad");
    expect(input().props.placeholder).toBe("0,00");
    expect(textOf(screen)).toContain("R$");

    for (const key of "123456") type(key);
    expect(input().props.value).toBe("1.234,56");
    expect(onCents).toHaveBeenLastCalledWith(123456);
  });

  test("apagar tudo devolve null", () => {
    const onCents = mock((_cents: number | null) => {});
    const { input, erase } = mount({ onCents, start: 5 });

    expect(input().props.value).toBe("0,05");
    erase();
    expect(input().props.value).toBe("");
    expect(onCents).toHaveBeenLastCalledWith(null);
  });

  test("colar por cima de tudo le o texto colado como valor, pela selecao de antes", () => {
    const onCents = mock((_cents: number | null) => {});
    const { input, select, replace } = mount({ onCents, start: 123450 });

    select(0, 8);
    replace("150");
    expect(input().props.value).toBe("150,00");
    expect(onCents).toHaveBeenLastCalledWith(15000);

    select(0, 6);
    replace("R$ 1.234,56");
    expect(input().props.value).toBe("1.234,56");
  });

  test("com allowNegative o - poe e tira o sinal, e o teclado ganha a pontuacao", () => {
    const onCents = mock((_cents: number | null) => {});
    const { input, type } = mount({ onCents, allowNegative: true });

    expect(input().props.keyboardType).toBe("numbers-and-punctuation");

    type("-");
    expect(input().props.value).toBe("-");
    type("5");
    expect(input().props.value).toBe("-0,05");
    expect(onCents).toHaveBeenLastCalledWith(-5);
    type("-");
    expect(input().props.value).toBe("0,05");
  });

  test("sem allowNegative o sinal nao entra", () => {
    const { input, type } = mount({ start: 500 });
    type("-");
    expect(input().props.value).toBe("5,00");
  });

  test("fora de min e max o campo se marca invalido, sem corrigir o valor", () => {
    const { input, replace } = mount({ min: 1000, max: 50000 });

    replace("5,00");
    expect(input().props.value).toBe("5,00");
    expect(input().props.className.split(" ")).toContain("border-danger");

    replace("100,00");
    expect(input().props.className.split(" ")).not.toContain("border-danger");
  });

  test("no iOS, o cursor de depois da colagem chegando antes do texto nao vira digitacao", () => {
    const { input, select, replace } = mount({ start: 123456 });

    select(0, 8);
    select(2, 2);
    replace("10");
    expect(input().props.value).toBe("10,00");
  });

  test("sem evento de selecao, colar por cima de tudo e lido como colagem inteira", () => {
    const { input, replace } = mount({ start: 123456 });

    replace("16");
    expect(input().props.value).toBe("16,00");
  });

  test("a selecao gravada so vale para o texto que estava na tela quando ela chegou", () => {
    const onValueChange = mock((_cents: number | null) => {});
    let setOutside: (cents: number) => void = () => {};
    function Outside() {
      const [cents, setCents] = useState(123456);
      setOutside = setCents;
      return <CurrencyInput value={cents} onValueChange={onValueChange} />;
    }
    const screen = render(<Outside />);
    const input = () => byType(screen, "TextInput")[0]!;

    act(() => input().props.onSelectionChange({ nativeEvent: { selection: { start: 0, end: 8 } } }));
    act(() => setOutside(567890));
    expect(input().props.value).toBe("5.678,90");

    act(() => input().props.onChangeText("5.678,901"));
    expect(onValueChange).toHaveBeenLastCalledWith(5678901);
  });

  test("apagar a virgula ou digitar um so digito por cima de tudo continua sendo digitacao", () => {
    const { input, replace } = mount({ start: 123456 });

    replace("1.23456");
    expect(input().props.value).toBe("1.234,56");

    replace("5");
    expect(input().props.value).toBe("0,05");
  });

  test("colar texto que nao e valor, ou valor grande demais, deixa o que estava", () => {
    const onCents = mock((_cents: number | null) => {});
    const { input, select, replace } = mount({ start: 500, onCents });

    select(0, 4);
    replace("R$ 10 - desconto 2");
    expect(input().props.value).toBe("5,00");

    select(0, 4);
    replace("1234567890123,45");
    expect(input().props.value).toBe("5,00");
    expect(onCents).not.toHaveBeenCalled();
  });
});
