import { describe, expect, mock, test } from "bun:test";

import { Combobox, Select, type ComboboxItemGroup, type SelectItemGroup } from "../src";
import { act, byLabel, byRole, byType, render, textOf } from "./helpers";

const headers = (screen: ReturnType<typeof render>) =>
  byRole(screen, "header").map((node) => String(node.props.children));

describe("Select with groups", () => {
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

  test("the sheet becomes sections, and each family is announced as a header", () => {
    const screen = render(
      <Select items={groups} value={null} onValueChange={() => {}} label="Cidade" />,
    );
    act(() => byLabel(screen, "Cidade")[0].props.onPress());

    expect(byType(screen, "SectionList").length).toBe(1);
    expect(headers(screen)).toEqual(["Cidade", "Paraíba", "Pernambuco"]);
    expect(textOf(screen)).toContain("Campina Grande");
    expect(textOf(screen)).toContain("Recife");
  });

  test("choosing inside a group delivers the value, and the trigger finds the label in the group", () => {
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

  test("multiple with groups checks by checkbox and counts by the total", () => {
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

  test("a flat list stays without sections and without group headers", () => {
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

describe("Combobox with groups", () => {
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

  test("the search filters within the family and removes the empty family", () => {
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

  test("with nothing in any group, it explains instead of showing a loose header", () => {
    const screen = render(
      <Combobox items={groups} value={null} onValueChange={() => {}} label="Cidade" />,
    );
    act(() => byLabel(screen, "Cidade")[0].props.onPress());
    const search = screen.root.findByType("TextInput" as never);
    act(() => search.props.onChangeText("zzz"));
    expect(headers(screen)).toEqual(["Cidade"]);
    expect(textOf(screen)).toContain("Confira a grafia");
  });

  test("the trigger finds the label inside the group", () => {
    const screen = render(
      <Combobox items={groups} value="cg" onValueChange={() => {}} label="Cidade" />,
    );
    expect(byLabel(screen, "Cidade")[0].props.accessibilityValue.text).toBe("Campina Grande");
  });
});
