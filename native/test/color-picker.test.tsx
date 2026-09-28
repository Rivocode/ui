import { describe, expect, mock, test } from "bun:test";
import type { ReactTestRenderer } from "react-test-renderer";

import { ColorPicker, normalizeColor } from "../src/color-picker";
import { RivoProvider } from "../src/provider";
import { act, byLabel, byRole, render } from "./helpers";

const MARCA = [
  { value: "#d4f34a", label: "Lima" },
  { value: "#3ddc97", label: "Teal" },
  { value: "#f2b21c", label: "Âmbar" },
  { value: "#6aa9ff", label: "Azul" },
];

/** The hexadecimal field, which is the only TextInput in the tree. */
function hexField(screen: ReactTestRenderer) {
  return byLabel(screen, "Código hexadecimal da cor")[0]!;
}

describe("normalizeColor", () => {
  test("accepts what gets pasted from anywhere and always returns the same shape", () => {
    expect(normalizeColor("#0f8")).toBe("#00ff88");
    expect(normalizeColor("BFDD3A")).toBe("#bfdd3a");
    expect(normalizeColor("  #D4F34A  ")).toBe("#d4f34a");
  });

  test("what is not a color yet returns null, and eight digits are left out", () => {
    expect(normalizeColor("#d4f")).toBe("#dd44ff");
    expect(normalizeColor("#d4f3")).toBeNull();
    expect(normalizeColor("d4f34aff")).toBeNull();
    expect(normalizeColor("lima")).toBeNull();
  });
});

describe("ColorPicker", () => {
  test("the swatches are a radio group, not a handful of buttons", () => {
    const screen = render(
      <ColorPicker
        label="Cor da marca"
        value="#d4f34a"
        onValueChange={() => {}}
        swatches={MARCA}
      />,
    );

    expect(byRole(screen, "radiogroup")[0]!.props.accessibilityLabel).toBe("Cor da marca");
    expect(byRole(screen, "radio")).toHaveLength(4);
  });

  test("the name carries the value, and without a name the swatch still announces itself", () => {
    const named = render(<ColorPicker value="" onValueChange={() => {}} swatches={[MARCA[0]!]} />);
    expect(byLabel(named, "Lima, #d4f34a")).toHaveLength(1);

    const bare = render(<ColorPicker value="" onValueChange={() => {}} swatches={["#d4f34a"]} />);
    expect(byLabel(bare, "Cor #d4f34a")).toHaveLength(1);
  });

  test("the chosen one is spoken, not just painted", () => {
    const screen = render(
      <ColorPicker value="#3DDC97" onValueChange={() => {}} swatches={MARCA} />,
    );

    // The value arrives in uppercase and still matches: the comparison is normalized.
    expect(byLabel(screen, "Teal, #3ddc97")[0]!.props.accessibilityState).toEqual({
      checked: true,
      disabled: undefined,
    });
    expect(byLabel(screen, "Lima, #d4f34a")[0]!.props.accessibilityState.checked).toBe(false);
  });

  test("with no chosen color, no swatch is chosen", () => {
    const screen = render(<ColorPicker value="" onValueChange={() => {}} swatches={MARCA} />);
    const marked = byRole(screen, "radio").filter(
      (node) => node.props.accessibilityState.checked === true,
    );
    expect(marked).toHaveLength(0);
  });

  test("tapping a swatch returns the normalized hexadecimal", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <ColorPicker value="" onValueChange={onValueChange} swatches={["#D4F34A", "#AbC"]} />,
    );

    act(() => byLabel(screen, "Cor #D4F34A")[0]!.props.onPress());
    expect(onValueChange).toHaveBeenLastCalledWith("#d4f34a");
    act(() => byLabel(screen, "Cor #AbC")[0]!.props.onPress());
    expect(onValueChange).toHaveBeenLastCalledWith("#aabbcc");
  });

  test("the target measures 44 and the colored drawing measures 32, inside it", () => {
    const screen = render(<ColorPicker value="" onValueChange={() => {}} swatches={["#d4f34a"]} />);

    const [target] = byRole(screen, "radio");
    expect(target!.props.className).toContain("size-11");

    const [chip] = screen.root.findAll(
      (node) =>
        typeof node.type === "string" &&
        (node.props?.style as { backgroundColor?: string } | undefined)?.backgroundColor ===
          "#d4f34a",
    );
    expect(chip!.props.className).toContain("size-8");
  });

  test("the chosen mark is on the outside, and its place always exists", () => {
    const screen = render(
      <ColorPicker value="#d4f34a" onValueChange={() => {}} swatches={MARCA} />,
    );

    // A 2px border on all of them: lighting it only on selection would shift the drawing.
    for (const swatch of byRole(screen, "radio")) {
      expect(swatch.props.className).toContain("border-2");
    }
    expect(String(byLabel(screen, "Lima, #d4f34a")[0]!.props.className).split(" ")).toContain(
      "border-accent",
    );
    expect(byLabel(screen, "Teal, #3ddc97")[0]!.props.className).toContain("border-transparent");
  });

  test("the swatches split into rows of `columns`, because there is no grid in RN", () => {
    const screen = render(
      <ColorPicker
        value=""
        onValueChange={() => {}}
        columns={2}
        swatches={["#111111", "#222222", "#333333", "#444444", "#555555"]}
      />,
    );

    const rows = screen.root.findAll(
      (node) =>
        typeof node.type === "string" &&
        typeof node.props?.className === "string" &&
        node.props.className.startsWith("flex-row gap-2"),
    );
    // Five swatches in two columns: three rows, the last with only one.
    expect(rows).toHaveLength(3);
    expect(rows[2]!.props.children).toHaveLength(1);
  });

  test("the default range is computed, not a hand-written brand palette", () => {
    const screen = render(<ColorPicker value="" onValueChange={() => {}} />);
    // Ten hues in three lightnesses, the same as the web.
    expect(byRole(screen, "radio")).toHaveLength(30);
  });

  test("the field accepts what the person pastes and returns six lowercase digits", () => {
    const onValueChange = mock(() => {});
    const screen = render(<ColorPicker value="" onValueChange={onValueChange} swatches={MARCA} />);

    act(() => hexField(screen).props.onChangeText("#0F8"));
    expect(onValueChange).toHaveBeenCalledWith("#00ff88");
  });

  test("text that is not a color yet keeps the draft and notifies nobody", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <ColorPicker value="#d4f34a" onValueChange={onValueChange} swatches={MARCA} />,
    );

    act(() => hexField(screen).props.onChangeText("#d4f3"));
    expect(onValueChange).toHaveBeenCalledTimes(0);
    expect(hexField(screen).props.value).toBe("#d4f3");

    // On leaving without finishing, the field goes back to the last good value.
    act(() => hexField(screen).props.onBlur());
    expect(hexField(screen).props.value).toBe("#d4f34a");
    expect(onValueChange).toHaveBeenCalledTimes(0);
  });

  test("a color changed from outside drags the draft along", () => {
    // The state adjustment during render, without an effect that renders twice:
    // another swatch chosen, or another client loaded.
    const screen = render(<ColorPicker value="#d4f34a" onValueChange={() => {}} />);
    expect(hexField(screen).props.value).toBe("#d4f34a");

    act(() => {
      screen.update(
        <RivoProvider>
          <ColorPicker value="#3ddc97" onValueChange={() => {}} />
        </RivoProvider>,
      );
    });
    expect(hexField(screen).props.value).toBe("#3ddc97");
  });

  test("the keyboard is alphanumeric, with no capitalization or autocorrect, and fits one color", () => {
    const screen = render(<ColorPicker value="" onValueChange={() => {}} />);
    const field = hexField(screen);

    // A number keyboard has no `a` to `f` nor a hash sign.
    expect(field.props.keyboardType).toBe("default");
    expect(field.props.autoCapitalize).toBe("none");
    expect(field.props.autoCorrect).toBe(false);
    expect(field.props.maxLength).toBe(7);
  });

  test("hideInput removes the field, and with it the only text that says the color", () => {
    const screen = render(
      <ColorPicker value="#d4f34a" onValueChange={() => {}} swatches={MARCA} hideInput />,
    );
    expect(byLabel(screen, "Código hexadecimal da cor")).toHaveLength(0);
    // The swatch state still says which one it is, which is the channel left.
    expect(byRole(screen, "radio").some((node) => node.props.accessibilityState.checked)).toBe(
      true,
    );
  });

  test("disabled neither picks nor types", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <ColorPicker value="" onValueChange={onValueChange} swatches={MARCA} disabled />,
    );

    expect(byLabel(screen, "Lima, #d4f34a")[0]!.props.disabled).toBe(true);
    expect(hexField(screen).props.editable).toBe(false);
  });
});
