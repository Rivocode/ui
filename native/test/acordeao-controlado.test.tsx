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

describe("Accordion controlado", () => {
  test("value decide quem abre, e o toque só avisa", () => {
    const onValueChange = mock((_value: string[]) => {});
    const screen = render(<Faq value={["cancelar"]} onValueChange={onValueChange} />);

    expect(expanded(screen)).toEqual([false, true]);
    expect(textOf(screen)).toContain("Em até 24 horas.");
    expect(textOf(screen)).not.toContain("Pelo botão");

    press(screen, 0);
    expect(onValueChange).toHaveBeenLastCalledWith(["emitir"]);
    expect(expanded(screen)).toEqual([false, true]);
  });

  test("quem controla de fora abre por conta própria", () => {
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

  test("multiple deixa vários abertos ao mesmo tempo", () => {
    const screen = render(<Faq multiple />);
    press(screen, 0);
    press(screen, 1);
    expect(expanded(screen)).toEqual([true, true]);
  });

  test("o padrão abre um e fecha o outro, como no web", () => {
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

  test("item sem value continua abrindo sozinho, com defaultOpen", () => {
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

describe("AccordionItem com value e defaultOpen", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  afterEach(() => warn.mockClear());
  afterAll(() => warn.mockRestore());

  test("avisa em desenvolvimento que o aberto é da raiz", () => {
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

describe("Collapsible controlado", () => {
  test("open decide, e onOpenChange recebe o próximo estado", () => {
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

  test("sem open, a peça se controla e ainda avisa", () => {
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
