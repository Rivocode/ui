import { describe, expect, mock, test } from "bun:test";

import { Editable } from "../src/editable";
import { act, byLabel, byRole, byType, render, textOf } from "./helpers";

const field = (screen: ReturnType<typeof render>) => byType(screen, "TextInput")[0];

describe("Editable", () => {
  test("closed, the value travels in the name and the long press is the door", () => {
    const screen = render(
      <Editable value="Clínica São Lucas" onValueChange={() => {}} label="Nome do cliente" />,
    );

    expect(textOf(screen)).toContain("Clínica São Lucas");
    const preview = byRole(screen, "button")[0];
    expect(preview.props.accessibilityLabel).toBe("Nome do cliente: Clínica São Lucas");
    expect(preview.props.accessibilityHint).toBe("Toque e segure para editar");
    // A short tap does not open: on a reading dashboard the finger touches
    // everything while scrolling, and the keyboard would pop up at every bump.
    expect(preview.props.onPress).toBeUndefined();
    expect(byType(screen, "TextInput").length).toBe(0);

    act(() => preview.props.onLongPress());
    expect(byType(screen, "TextInput").length).toBe(1);
  });

  test("whoever listens to the screen has the same door, through the long-press action", () => {
    const screen = render(
      <Editable value="Ana Duarte" onValueChange={() => {}} label="Responsável" />,
    );

    const preview = byRole(screen, "button")[0];
    expect(preview.props.accessibilityActions).toEqual([{ name: "longpress", label: "Editar" }]);

    act(() => preview.props.onAccessibilityAction({ nativeEvent: { actionName: "longpress" } }));
    expect(byType(screen, "TextInput").length).toBe(1);
  });

  test("the field opens with the current text, selected and with the keyboard up", () => {
    const screen = render(
      <Editable value="Ana Duarte" onValueChange={() => {}} label="Responsável" />,
    );
    act(() => byRole(screen, "button")[0].props.onLongPress());

    const input = field(screen);
    expect(input.props.value).toBe("Ana Duarte");
    expect(input.props.accessibilityLabel).toBe("Responsável");
    expect(input.props.autoFocus).toBe(true);
    expect(input.props.selectTextOnFocus).toBe(true);
    // Return confirms, and the key needs to say so before being tapped.
    expect(input.props.returnKeyType).toBe("done");
  });

  test("return confirms, and only it", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Editable value="Ana Duarte" onValueChange={onValueChange} label="Responsável" />,
    );

    act(() => byRole(screen, "button")[0].props.onLongPress());
    act(() => field(screen).props.onChangeText("Ana Duarte Lima"));
    // Typing notifies nobody: the piece is controlled and the draft is its own.
    expect(onValueChange).not.toHaveBeenCalled();

    act(() => field(screen).props.onSubmitEditing());
    expect(onValueChange).toHaveBeenCalledWith("Ana Duarte Lima");
    // Closed: the field left the screen.
    expect(byType(screen, "TextInput").length).toBe(0);
  });

  test("leaving the field does not save - it is Cancelar that takes the focus away", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Editable value="Ana Duarte" onValueChange={onValueChange} label="Responsável" />,
    );

    act(() => byRole(screen, "button")[0].props.onLongPress());
    act(() => field(screen).props.onChangeText("rascunho perdido"));

    // The field has the Input's own `onBlur`, for the border; saving there
    // would make Cancelar save on its way to cancelling.
    act(() => field(screen).props.onBlur({}));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(byType(screen, "TextInput").length).toBe(1);
  });

  test("Cancelar undoes, and the field reopens with the real value", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Editable value="Ana Duarte" onValueChange={onValueChange} label="Responsável" />,
    );

    act(() => byRole(screen, "button")[0].props.onLongPress());
    act(() => field(screen).props.onChangeText("rascunho perdido"));

    // Open, the piece has ONE button: `Cancelar`. The text became a field, and
    // the field is not a button.
    const buttons = byRole(screen, "button");
    expect(buttons.length).toBe(1);
    act(() => buttons[0].props.onPress());

    expect(onValueChange).not.toHaveBeenCalled();
    expect(textOf(screen)).toContain("Ana Duarte");
    expect(textOf(screen)).not.toContain("rascunho perdido");

    // The draft is born from the value on every opening: the discarded one does not come back.
    act(() => byRole(screen, "button")[0].props.onLongPress());
    expect(field(screen).props.value).toBe("Ana Duarte");
  });

  test("confirming without changing notifies nobody", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Editable value="Ana Duarte" onValueChange={onValueChange} label="Responsável" />,
    );

    act(() => byRole(screen, "button")[0].props.onLongPress());
    act(() => field(screen).props.onSubmitEditing());
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("empty shows the dash and announces that it is empty", () => {
    const screen = render(<Editable value="" onValueChange={() => {}} label="Apelido" />);

    expect(textOf(screen)).toContain("—");
    expect(byLabel(screen, "Apelido: vazio").length).toBe(1);
  });

  test("disabled does not open", () => {
    const screen = render(
      <Editable value="Ana Duarte" onValueChange={() => {}} label="Responsável" disabled />,
    );

    const preview = byRole(screen, "button")[0];
    expect(preview.props.disabled).toBe(true);
    expect(preview.props.accessibilityState).toEqual({ disabled: true });
  });
});
