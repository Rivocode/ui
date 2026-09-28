import { describe, expect, mock, test } from "bun:test";
import { View } from "react-native";

import { Banner, Button, IconButton } from "../src";
import { act, byLabel, byRole, render, textOf } from "./helpers";

const SIDE = { sm: 32, md: 44, lg: 48 } as const;

describe("IconButton", () => {
  test("label is the name, and the icon stays hidden from the screen reader", () => {
    const onPress = mock(() => {});
    const screen = render(
      <IconButton label="Excluir nota" onPress={onPress}>
        <View testID="glifo" />
      </IconButton>,
    );

    const [button] = byLabel(screen, "Excluir nota");
    expect(button.props.accessibilityRole).toBe("button");
    act(() => button.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);

    const glyph = screen.root.findByProps({ testID: "glifo" });
    let hidden = false;
    for (let node = glyph.parent; node; node = node.parent) {
      if (node.props?.accessibilityElementsHidden) hidden = true;
    }
    expect(hidden).toBe(true);
  });

  test("the type refuses an icon button without a name", () => {
    // @ts-expect-error label is required
    const missing = <IconButton>{null}</IconButton>;
    expect(missing).toBeDefined();
  });

  test("the name comes in only through label, and the type refuses accessibilityLabel", () => {
    const refused = (
      // @ts-expect-error the button's name is label, as on the web
      <IconButton label="Excluir nota" accessibilityLabel="Apagar">
        {null}
      </IconButton>
    );
    expect(refused).toBeDefined();
  });

  test("every size reaches a 44 target, with hitSlop only where the drawing is smaller", () => {
    for (const size of ["sm", "md", "lg"] as const) {
      const [button] = byRole(
        render(
          <IconButton label={size} size={size}>
            {null}
          </IconButton>,
        ),
        "button",
      );
      const slop = button.props.hitSlop as { top: number; left: number } | undefined;
      expect(SIDE[size] + 2 * (slop?.top ?? 0)).toBeGreaterThanOrEqual(44);
      expect(SIDE[size] + 2 * (slop?.left ?? 0)).toBeGreaterThanOrEqual(44);
      if (size !== "sm") expect(slop).toBeUndefined();
    }
  });

  test("the square comes from the same class vocabulary as Button", () => {
    const icon = byRole(
      render(
        <IconButton label="Excluir" variant="danger">
          {null}
        </IconButton>,
      ),
      "button",
    )[0].props.className.split(" ");
    const button = byRole(
      render(<Button variant="danger">x</Button>),
      "button",
    )[0].props.className.split(" ");

    expect(icon).toContain("size-11");
    expect(icon).toContain("bg-danger");
    expect(button).toContain("bg-danger");
  });

  test("the function receives the variant color and the glyph size", () => {
    const seen: { color: string; size: number }[] = [];
    render(
      <IconButton label="Baixar" variant="secondary" size="lg">
        {(glyph) => {
          seen.push(glyph);
          return null;
        }}
      </IconButton>,
    );
    expect(seen[0]!.size).toBe(20);
    expect(seen[0]!.color).toMatch(/^#|^rgb/);
  });

  test("loading swaps the icon for the spinner, locks the touch and announces busy", () => {
    const screen = render(
      <IconButton label="Sincronizar" loading>
        <View testID="glifo" />
      </IconButton>,
    );
    const [button] = byLabel(screen, "Sincronizar");
    expect(button.props.disabled).toBe(true);
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true });
    expect(screen.root.findAllByProps({ testID: "glifo" })).toHaveLength(0);
    expect(screen.root.findAllByType("ActivityIndicator" as never).length).toBeGreaterThan(0);
  });

  test("disabled announces the state", () => {
    const [button] = byLabel(
      render(
        <IconButton label="Excluir" disabled>
          {null}
        </IconButton>,
      ),
      "Excluir",
    );
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: false });
  });
});

describe("Banner", () => {
  test("warning and danger come out as alert, and the announcement is immediate", () => {
    for (const tone of ["warning", "danger"] as const) {
      const [root] = byRole(render(<Banner tone={tone} description="Fatura em atraso" />), "alert");
      expect(root).toBeDefined();
      expect(root.props.accessibilityLiveRegion).toBe("assertive");
    }
  });

  test("info and success do not interrupt", () => {
    for (const tone of ["info", "success"] as const) {
      const screen = render(<Banner tone={tone} description="Manutenção no domingo" />);
      expect(byRole(screen, "alert")).toHaveLength(0);
      const [root] = byRole(screen, "none");
      expect(root.props.accessibilityLiveRegion).toBe("polite");
    }
  });

  test("title, description and actions appear in the strip", () => {
    const screen = render(
      <Banner
        tone="danger"
        title="Fatura em atraso"
        description="A emissão será suspensa em 10/10."
        actions={
          <Button size="sm" variant="secondary">
            Pagar com Pix
          </Button>
        }
      />,
    );
    const text = textOf(screen);
    expect(text).toContain("Fatura em atraso");
    expect(text).toContain("A emissão será suspensa em 10/10.");
    expect(text).toContain("Pagar com Pix");
  });

  test("paints the tone background and the bottom line, across the full width", () => {
    const [root] = byRole(render(<Banner tone="warning" description="Modo de teste" />), "alert");
    const tokens = (root.props.className as string).split(" ");
    expect(tokens).toContain("bg-warning-subtle");
    expect(tokens).toContain("border-b");
    expect(tokens).toContain("w-full");
  });

  test("onDismiss turns on the x with a name and a 44 target", () => {
    const onDismiss = mock(() => {});
    const screen = render(<Banner description="Manutenção" onDismiss={onDismiss} />);
    const [close] = byLabel(screen, "Fechar aviso");
    expect(close.props.className.split(" ")).toContain("size-6");
    expect(24 + 2 * close.props.hitSlop).toBeGreaterThanOrEqual(44);
    act(() => close.props.onPress());
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test("without onDismiss there is no button", () => {
    expect(byRole(render(<Banner description="Manutenção" />), "button")).toHaveLength(0);
  });

  test("the icon as a function receives the tone color and comes out hidden", () => {
    const seen: { color: string; size: number }[] = [];
    const screen = render(
      <Banner
        tone="danger"
        description="Fatura em atraso"
        icon={(glyph) => {
          seen.push(glyph);
          return <View testID="simbolo" />;
        }}
      />,
    );
    expect(seen[0]!.size).toBe(16);
    const symbol = screen.root.findByProps({ testID: "simbolo" });
    expect(symbol.parent!.props.accessibilityElementsHidden).toBe(true);
  });
});
