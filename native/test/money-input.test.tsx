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
  test("typing enters from the right, comes out in cents, and R$ stays beside it", () => {
    const onCents = mock((_cents: number | null) => {});
    const { screen, input, type } = mount({ onCents });

    expect(input().props.keyboardType).toBe("number-pad");
    expect(input().props.placeholder).toBe("0,00");
    expect(textOf(screen)).toContain("R$");

    for (const key of "123456") type(key);
    expect(input().props.value).toBe("1.234,56");
    expect(onCents).toHaveBeenLastCalledWith(123456);
  });

  test("deleting everything returns null", () => {
    const onCents = mock((_cents: number | null) => {});
    const { input, erase } = mount({ onCents, start: 5 });

    expect(input().props.value).toBe("0,05");
    erase();
    expect(input().props.value).toBe("");
    expect(onCents).toHaveBeenLastCalledWith(null);
  });

  test("pasting over everything reads the pasted text as the value, through the previous selection", () => {
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

  test("with allowNegative the - adds and removes the sign, and the keyboard gets punctuation", () => {
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

  test("without allowNegative the sign does not get in", () => {
    const { input, type } = mount({ start: 500 });
    type("-");
    expect(input().props.value).toBe("5,00");
  });

  test("outside min and max the field marks itself invalid, without correcting the value", () => {
    const { input, replace } = mount({ min: 1000, max: 50000 });

    replace("5,00");
    expect(input().props.value).toBe("5,00");
    expect(input().props.className.split(" ")).toContain("border-danger");

    replace("100,00");
    expect(input().props.className.split(" ")).not.toContain("border-danger");
  });

  test("on iOS, the post-paste cursor arriving before the text does not become typing", () => {
    const { input, select, replace } = mount({ start: 123456 });

    select(0, 8);
    select(2, 2);
    replace("10");
    expect(input().props.value).toBe("10,00");
  });

  test("without a selection event, pasting over everything is read as a full paste", () => {
    const { input, replace } = mount({ start: 123456 });

    replace("16");
    expect(input().props.value).toBe("16,00");
  });

  test("the recorded selection only applies to the text that was on screen when it arrived", () => {
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

  test("deleting the comma or typing a single digit over everything is still typing", () => {
    const { input, replace } = mount({ start: 123456 });

    replace("1.23456");
    expect(input().props.value).toBe("1.234,56");

    replace("5");
    expect(input().props.value).toBe("0,05");
  });

  test("pasting text that is not a value, or a value too large, keeps what was there", () => {
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
