import { beforeEach, describe, expect, mock, test } from "bun:test";
import { useState } from "react";
import { AccessibilityInfo } from "react-native";

import { Autocomplete, type AutocompleteItemGroup, type AutocompleteProps } from "../src";
import { act, byRole, byType, render, textOf } from "./helpers";

const spoken = AccessibilityInfo as unknown as {
  announced: readonly string[];
  clearAnnouncements: () => void;
};

beforeEach(() => spoken.clearAnnouncements());

const CITIES = ["João Pessoa", "Campina Grande", "Cabedelo", "Bayeux", "Patos"];

function Controlled(props: Partial<AutocompleteProps> & { onChange?: (value: string) => void }) {
  const [value, setValue] = useState(props.value ?? "");
  return (
    <Autocomplete
      items={CITIES}
      label="Cidade"
      placeholder="Cidade"
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        props.onChange?.(next);
      }}
    />
  );
}

const field = (screen: ReturnType<typeof render>) => byRole(screen, "combobox")[0]!;
const input = (screen: ReturnType<typeof render>) => byType(screen, "TextInput")[0]!;
const suggestions = (screen: ReturnType<typeof render>) =>
  byRole(screen, "button").filter((node) => node.props.accessibilityState?.selected !== undefined);
const done = (screen: ReturnType<typeof render>) =>
  byRole(screen, "button").find((node) =>
    node.findAll((child) => child.props.children === "Concluir").length > 0,
  )!;
const labels = (screen: ReturnType<typeof render>) =>
  suggestions(screen).map((node) => node.props.accessibilityLabel);

describe("native Autocomplete", () => {
  test("the closed field is a combobox with name, value and expanded state", () => {
    const screen = render(<Controlled value="Cabedelo" />);
    const closed = field(screen);
    expect(closed.props.accessibilityLabel).toBe("Cidade");
    expect(closed.props.accessibilityValue.text).toBe("Cabedelo");
    expect(closed.props.accessibilityState.expanded).toBe(false);
    expect(byType(screen, "TextInput")).toHaveLength(0);

    act(() => closed.props.onPress());
    expect(field(screen).props.accessibilityState.expanded).toBe(true);
    expect(input(screen).props.autoFocus).toBe(true);
    expect(input(screen).props.accessibilityLabel).toBe("Cidade");
  });

  test("without text, the placeholder is what the screen reader hears as the value", () => {
    const screen = render(<Controlled />);
    expect(field(screen).props.accessibilityValue.text).toBe("Cidade");
  });

  test("the text filters the suggestions ignoring accents and case", () => {
    const screen = render(<Controlled />);
    act(() => field(screen).props.onPress());
    expect(labels(screen)).toEqual(CITIES);

    act(() => input(screen).props.onChangeText("joao"));
    expect(labels(screen)).toEqual(["João Pessoa"]);

    act(() => input(screen).props.onChangeText("CA"));
    expect(labels(screen)).toEqual(["Campina Grande", "Cabedelo"]);
  });

  test("text outside the list counts: every keystroke reaches onValueChange and stays in the field on submit", () => {
    const onChange = mock(() => {});
    const screen = render(<Controlled onChange={onChange} />);
    act(() => field(screen).props.onPress());
    act(() => input(screen).props.onChangeText("Sousa"));

    expect(onChange).toHaveBeenLastCalledWith("Sousa");
    expect(suggestions(screen)).toHaveLength(0);
    expect(textOf(screen)).toContain("Nenhuma sugestão. O texto digitado vale assim mesmo.");

    act(() => done(screen).props.onPress());
    expect(field(screen).props.accessibilityState.expanded).toBe(false);
    expect(field(screen).props.accessibilityValue.text).toBe("Sousa");
  });

  test("tapping a suggestion fills in the whole text and closes the sheet", () => {
    const onChange = mock(() => {});
    const screen = render(<Controlled onChange={onChange} />);
    act(() => field(screen).props.onPress());
    act(() => input(screen).props.onChangeText("camp"));
    act(() => suggestions(screen)[0]!.props.onPress());

    expect(onChange).toHaveBeenLastCalledWith("Campina Grande");
    expect(field(screen).props.accessibilityState.expanded).toBe(false);
    expect(field(screen).props.accessibilityValue.text).toBe("Campina Grande");
  });

  test("the suggestion equal to the text comes out marked as chosen, and only it", () => {
    const screen = render(<Controlled value="patos" />);
    act(() => field(screen).props.onPress());
    const marked = suggestions(screen).filter((node) => node.props.accessibilityState.selected);
    expect(marked.map((node) => node.props.accessibilityLabel)).toEqual(["Patos"]);
  });

  test("each suggestion is a button with its own name and a 44pt target", () => {
    const screen = render(<Controlled />);
    act(() => field(screen).props.onPress());
    for (const node of suggestions(screen)) {
      expect(node.props.accessibilityRole).toBe("button");
      expect(CITIES).toContain(node.props.accessibilityLabel);
      expect(String(node.props.className).split(" ")).toContain("min-h-11");
    }
    expect(suggestions(screen)).toHaveLength(CITIES.length);
  });

  test("the suggestion count is announced on open and on every change, and only with the sheet open", () => {
    const screen = render(<Controlled />);
    expect(spoken.announced).toEqual([]);

    act(() => field(screen).props.onPress());
    expect(spoken.announced).toEqual(["5 sugestões."]);

    act(() => input(screen).props.onChangeText("joao"));
    act(() => input(screen).props.onChangeText("xyz"));
    expect(spoken.announced).toEqual(["5 sugestões.", "1 sugestão.", "Nenhuma sugestão."]);
  });

  test("groups become sections with a header, and a group with no suggestion disappears", () => {
    const groups: AutocompleteItemGroup[] = [
      { label: "Paraíba", items: ["João Pessoa", "Campina Grande"] },
      { label: "Pernambuco", items: ["Recife", "Caruaru"] },
    ];
    const screen = render(<Controlled items={groups} />);
    act(() => field(screen).props.onPress());
    expect(byType(screen, "SectionList")).toHaveLength(1);
    const headers = () => byRole(screen, "header").map((node) => String(node.props.children));
    expect(headers()).toEqual(["Cidade", "Paraíba", "Pernambuco"]);

    act(() => input(screen).props.onChangeText("recife"));
    expect(headers()).toEqual(["Cidade", "Pernambuco"]);
    expect(labels(screen)).toEqual(["Recife"]);
  });

  test("disabled announces the state and does not open", () => {
    const screen = render(<Controlled disabled />);
    expect(field(screen).props.accessibilityState.disabled).toBe(true);
    const pressable = screen.root.findAll(
      (node) => node.props.accessibilityRole === "combobox" && typeof node.type !== "string",
    )[0]!;
    expect(pressable.props.disabled).toBe(true);
  });
});

