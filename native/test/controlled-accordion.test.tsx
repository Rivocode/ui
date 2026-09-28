import { afterAll, afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { useState } from "react";
import { Pressable } from "react-native";

import { Accordion, AccordionItem, Collapsible, Text, type AccordionProps } from "../src";
import { act, byRole, render, textOf } from "./helpers";

const expanded = (screen: ReturnType<typeof render>) =>
  byRole(screen, "button").map((node) => node.props.accessibilityState.expanded);

const press = (screen: ReturnType<typeof render>, index: number) =>
  act(() => byRole(screen, "button")[index]!.props.onPress());

function Faq(props: Omit<AccordionProps, "children">) {
  return (
    <Accordion {...props}>
      <AccordionItem value="emitir" title="Como emitir?">
        <Text>Pelo botão Emitir nota.</Text>
      </AccordionItem>
      <AccordionItem value="cancelar" title="Como cancelar?">
        <Text>Em até 24 horas.</Text>
      </AccordionItem>
    </Accordion>
  );
}

describe("controlled Accordion", () => {
  test("value decides what opens, and the tap only notifies", () => {
    const onValueChange = mock((_value: string[]) => {});
    const screen = render(<Faq value={["cancelar"]} onValueChange={onValueChange} />);

    expect(expanded(screen)).toEqual([false, true]);
    expect(textOf(screen)).toContain("Em até 24 horas.");
    expect(textOf(screen)).not.toContain("Pelo botão");

    press(screen, 0);
    expect(onValueChange).toHaveBeenLastCalledWith(["emitir"]);
    expect(expanded(screen)).toEqual([false, true]);
  });

  test("whoever controls from outside opens on their own", () => {
    function Outside() {
      const [value, setValue] = useState<string[]>([]);
      return (
        <>
          <Pressable accessibilityRole="link" onPress={() => setValue(["emitir"])}>
            <Text>Ir para emitir</Text>
          </Pressable>
          <Faq value={value} onValueChange={setValue} />
        </>
      );
    }
    const screen = render(<Outside />);
    expect(expanded(screen)).toEqual([false, false]);

    act(() => byRole(screen, "link")[0]!.props.onPress());
    expect(expanded(screen)).toEqual([true, false]);
    expect(textOf(screen)).toContain("Pelo botão Emitir nota.");
  });

  test("multiple leaves several open at the same time", () => {
    const screen = render(<Faq multiple />);
    press(screen, 0);
    press(screen, 1);
    expect(expanded(screen)).toEqual([true, true]);
  });

  test("the default opens one and closes the other, as on the web", () => {
    const onValueChange = mock((_value: string[]) => {});
    const screen = render(<Faq defaultValue={["emitir"]} onValueChange={onValueChange} />);
    expect(expanded(screen)).toEqual([true, false]);

    press(screen, 1);
    expect(expanded(screen)).toEqual([false, true]);
    expect(onValueChange).toHaveBeenLastCalledWith(["cancelar"]);

    press(screen, 1);
    expect(expanded(screen)).toEqual([false, false]);
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  test("an item without value still opens on its own, with defaultOpen", () => {
    const onValueChange = mock((_value: string[]) => {});
    const screen = render(
      <Accordion value={[]} onValueChange={onValueChange}>
        <AccordionItem title="Solto" defaultOpen>
          <Text>Corpo solto.</Text>
        </AccordionItem>
      </Accordion>,
    );
    expect(expanded(screen)).toEqual([true]);
    press(screen, 0);
    expect(expanded(screen)).toEqual([false]);
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("AccordionItem with value and defaultOpen", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  afterEach(() => warn.mockClear());
  afterAll(() => warn.mockRestore());

  test("warns in development that the open state belongs to the root", () => {
    render(
      <Accordion>
        <AccordionItem value="a" title="Item A" defaultOpen>
          <Text>A</Text>
        </AccordionItem>
      </Accordion>,
    );
    expect(warn.mock.calls.some(([message]) => String(message).includes("defaultValue"))).toBe(
      true,
    );
  });
});

describe("controlled Collapsible", () => {
  test("open decides, and onOpenChange receives the next state", () => {
    const onOpenChange = mock((_value: boolean) => {});
    const screen = render(
      <Collapsible label="Ver o detalhe" open onOpenChange={onOpenChange}>
        <Text>O detalhe inteiro.</Text>
      </Collapsible>,
    );
    expect(expanded(screen)).toEqual([true]);
    expect(textOf(screen)).toContain("O detalhe inteiro.");

    press(screen, 0);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(expanded(screen)).toEqual([true]);
    expect(textOf(screen)).toContain("O detalhe inteiro.");
  });

  test("without open, the piece controls itself and still notifies", () => {
    const onOpenChange = mock((_value: boolean) => {});
    const screen = render(
      <Collapsible label="Ver o detalhe" defaultOpen onOpenChange={onOpenChange}>
        <Text>O detalhe inteiro.</Text>
      </Collapsible>,
    );
    press(screen, 0);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(expanded(screen)).toEqual([false]);
    expect(textOf(screen)).not.toContain("O detalhe inteiro.");
  });
});
