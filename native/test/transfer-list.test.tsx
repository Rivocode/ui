import { beforeEach, describe, expect, mock, test } from "bun:test";
import { useState } from "react";
import { AccessibilityInfo } from "react-native";

import { TransferList, type TransferListItem, type TransferListProps } from "../src";
import { act, byLabel, byRole, render, textOf } from "./helpers";

const spoken = AccessibilityInfo as unknown as {
  announced: readonly string[];
  clearAnnouncements: () => void;
};

beforeEach(() => spoken.clearAnnouncements());

const ITEMS: TransferListItem[] = [
  { value: "sp", label: "São Paulo" },
  { value: "jp", label: "João Pessoa" },
  { value: "rec", label: "Recife" },
  { value: "nat", label: "Natal", disabled: true },
];

function Controlled({
  start = [],
  onValueChange,
  ...props
}: Partial<TransferListProps> & { start?: string[] }) {
  const [value, setValue] = useState(start);
  return (
    <TransferList
      items={ITEMS}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
      {...props}
    />
  );
}

const pressBox = (screen: ReturnType<typeof render>, label: string) => {
  const found = byRole(screen, "checkbox").find(
    (box) => box.findAll((node) => node.props?.children === label).length > 0,
  );
  if (!found) throw new Error(`no checkbox ${label}`);
  act(() => found.props.onPress());
  return found;
};

const pressButton = (screen: ReturnType<typeof render>, label: string) => {
  const found = byRole(screen, "button").find(
    (button) => button.findAll((node) => node.props?.children === label).length > 0,
  );
  if (!found) throw new Error(`no button ${label}`);
  act(() => found.props.onPress());
  return found;
};

describe("TransferList", () => {
  test("both lists are born from value, with title and count", () => {
    const screen = render(<Controlled start={["rec"]} />);
    const text = textOf(screen);

    expect(text).toContain("Disponíveis");
    expect(text).toContain("3 itens");
    expect(text).toContain("Escolhidos");
    expect(text).toContain("1 item");
    expect(byLabel(screen, "Buscar em Disponíveis")).toHaveLength(1);
    expect(byLabel(screen, "Buscar em Escolhidos")).toHaveLength(1);
    expect(byRole(screen, "checkbox")).toHaveLength(4);
  });

  test("checking and moving calls the controller and announces with the right plural", () => {
    const onValueChange = mock((_: string[]) => {});
    const screen = render(<Controlled onValueChange={onValueChange} />);

    pressBox(screen, "Recife");
    expect(textOf(screen)).toContain("1 de 4 selecionados");
    pressButton(screen, "Mover selecionados para Escolhidos");

    expect(onValueChange).toHaveBeenLastCalledWith(["rec"]);
    expect(spoken.announced).toEqual(["1 item movido para Escolhidos"]);

    pressButton(screen, "Mover todos para Escolhidos");
    expect(onValueChange).toHaveBeenLastCalledWith(["rec", "sp", "jp"]);
    expect(spoken.announced.at(-1)).toBe("2 itens movidos para Escolhidos");
  });

  test("a disabled item cannot be checked and stays behind", () => {
    const screen = render(<Controlled />);
    const natal = byRole(screen, "checkbox").find(
      (box) => box.findAll((node) => node.props?.children === "Natal").length > 0,
    )!;

    expect(natal.props.accessibilityState).toEqual({ checked: false, disabled: true });
    pressButton(screen, "Mover todos para Escolhidos");
    expect(textOf(screen)).toContain("1 item");
  });

  test("with nothing checked, move selected stays off", () => {
    const screen = render(<Controlled />);
    const button = byRole(screen, "button").find(
      (node) => node.findAll((child) => child.props?.children === "Mover selecionados para Escolhidos").length > 0,
    )!;

    expect(button.props.accessibilityState?.disabled ?? button.props.disabled).toBe(true);
  });

  test("the search ignores accents, and with no result says nothing was found", () => {
    const screen = render(<Controlled />);
    const search = byLabel(screen, "Buscar em Disponíveis")[0]!;

    act(() => search.props.onChangeText("joao"));
    expect(byRole(screen, "checkbox")).toHaveLength(1);
    expect(textOf(screen)).toContain("João Pessoa");

    act(() => search.props.onChangeText("manaus"));
    expect(textOf(screen)).toContain("Nada encontrado");
    expect(textOf(screen)).toContain("Nenhum item");
  });

  test("labels changes the names, and the announcement follows", () => {
    const screen = render(
      <Controlled searchable={false} labels={{ available: "Permissões", chosen: "Concedidas" }} />,
    );

    expect(byLabel(screen, "Buscar em Permissões")).toHaveLength(0);
    pressBox(screen, "Recife");
    pressButton(screen, "Mover selecionados para Concedidas");
    expect(spoken.announced).toEqual(["1 item movido para Concedidas"]);
  });

  test("disabled, nothing moves", () => {
    const onValueChange = mock((_: string[]) => {});
    const screen = render(<Controlled disabled onValueChange={onValueChange} />);

    for (const box of byRole(screen, "checkbox")) {
      expect(box.props.accessibilityState.disabled).toBe(true);
    }
    pressButton(screen, "Mover todos para Escolhidos");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(spoken.announced).toEqual([]);
  });

  test("with five thousand items, moving all does not scan the whole list per item", () => {
    const many: TransferListItem[] = Array.from({ length: 5000 }, (_, index) => ({
      value: `k${index}`,
      label: `Cliente ${index}`,
    }));
    const onValueChange = mock((_: string[]) => {});
    const screen = render(<Controlled items={many} searchable={false} onValueChange={onValueChange} />);
    const real = Array.prototype.includes;
    let scanned = 0;
    Array.prototype.includes = function (this: unknown[], ...args: Parameters<typeof real>) {
      if (this.length >= 1000) scanned += this.length;
      return real.apply(this, args);
    };
    try {
      pressButton(screen, "Mover todos para Escolhidos");
    } finally {
      Array.prototype.includes = real;
    }
    expect(onValueChange.mock.calls.at(-1)![0]).toHaveLength(5000);
    expect(scanned).toBeLessThan(500_000);
  });
});
