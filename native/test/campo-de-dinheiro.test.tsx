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
});
