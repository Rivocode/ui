import { describe, expect, mock, test } from "bun:test";

import { Combobox, Select, type ComboboxItemGroup, type SelectItemGroup } from "../src";
import { act, byLabel, byRole, byType, render, textOf } from "./helpers";

const headers = (screen: ReturnType<typeof render>) =>
  byRole(screen, "header").map((node) => String(node.props.children));

describe("Select com grupos", () => {
  const groups: SelectItemGroup[] = [
    {
      label: "Paraíba",
      items: [
        { label: "João Pessoa", value: "jpa" },
        { label: "Campina Grande", value: "cg" },
      ],
    },
    { label: "Pernambuco", items: [{ label: "Recife", value: "rec" }] },
  ];

  test("a folha vira seções, e cada família é anunciada como cabeçalho", () => {
    const screen = render(
      <Select items={groups} value={null} onValueChange={() => {}} label="Cidade" />,
    );
    act(() => byLabel(screen, "Cidade")[0].props.onPress());

    expect(byType(screen, "SectionList").length).toBe(1);
    expect(headers(screen)).toEqual(["Cidade", "Paraíba", "Pernambuco"]);
    expect(textOf(screen)).toContain("Campina Grande");
    expect(textOf(screen)).toContain("Recife");
  });

  test("escolher dentro de um grupo entrega o valor, e o gatilho acha o rótulo no grupo", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Select items={groups} value="rec" onValueChange={onValueChange} label="Cidade" />,
    );
    expect(byLabel(screen, "Cidade")[0].props.accessibilityValue.text).toBe("Recife");

    act(() => byLabel(screen, "Cidade")[0].props.onPress());
    const options = byRole(screen, "button").filter(
      (node) => node.props.accessibilityState?.selected !== undefined,
    );
    expect(options.length).toBe(3);
    expect(options.filter((node) => node.props.accessibilityState.selected).length).toBe(1);

    act(() => options[1]!.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith("cg");
  });

  test("multiple com grupos marca por checkbox e conta pelo total", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Select
        items={groups}
        multiple
        value={["jpa", "rec"]}
        onValueChange={onValueChange}
        label="Cidades"
      />,
    );
    expect(textOf(screen)).toContain("2 selecionados");

    act(() => byLabel(screen, "Cidades")[0].props.onPress());
    const unchecked = byRole(screen, "checkbox").find(
      (node) => node.props.accessibilityState.checked === false,
    );
    act(() => unchecked!.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(["jpa", "rec", "cg"]);
  });

  test("lista rasa continua sem seção e sem cabeçalho de grupo", () => {
    const screen = render(
      <Select
        items={[{ label: "Mensal", value: "m" }]}
        value={null}
        onValueChange={() => {}}
        label="Período"
      />,
    );
    act(() => byLabel(screen, "Período")[0].props.onPress());
    expect(byType(screen, "SectionList").length).toBe(0);
    expect(headers(screen)).toEqual(["Período"]);
  });
});

describe("Combobox com grupos", () => {
  const groups: ComboboxItemGroup[] = [
    {
      label: "Paraíba",
      items: [
        { label: "João Pessoa", value: "jpa" },
        { label: "Campina Grande", value: "cg" },
      ],
    },
    { label: "Pernambuco", items: [{ label: "Recife", value: "rec", description: "Capital" }] },
  ];

  test("a busca filtra dentro da família e some com a família vazia", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Combobox items={groups} value={null} onValueChange={onValueChange} label="Cidade" />,
    );
    act(() => byLabel(screen, "Cidade")[0].props.onPress());
    expect(headers(screen)).toEqual(["Cidade", "Paraíba", "Pernambuco"]);

    const search = screen.root.findByType("TextInput" as never);
    act(() => search.props.onChangeText("joao"));
    expect(headers(screen)).toEqual(["Cidade", "Paraíba"]);
    expect(textOf(screen)).toContain("João Pessoa");
    expect(textOf(screen)).not.toContain("Recife");

    const [option] = byRole(screen, "button").filter(
      (node) => node.props.accessibilityState?.selected === false,
    );
    act(() => option!.props.onPress());
    expect(onValueChange).toHaveBeenCalledWith("jpa");
  });

  test("sem nada em grupo nenhum, explica em vez de mostrar cabeçalho solto", () => {
    const screen = render(
      <Combobox items={groups} value={null} onValueChange={() => {}} label="Cidade" />,
    );
    act(() => byLabel(screen, "Cidade")[0].props.onPress());
    const search = screen.root.findByType("TextInput" as never);
    act(() => search.props.onChangeText("zzz"));
    expect(headers(screen)).toEqual(["Cidade"]);
    expect(textOf(screen)).toContain("Confira a grafia");
  });

  test("o gatilho acha o rótulo dentro do grupo", () => {
    const screen = render(
      <Combobox items={groups} value="cg" onValueChange={() => {}} label="Cidade" />,
    );
    expect(byLabel(screen, "Cidade")[0].props.accessibilityValue.text).toBe("Campina Grande");
  });
});
