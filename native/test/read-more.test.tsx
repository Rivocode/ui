import { describe, expect, mock, test } from "bun:test";

import { Spoiler, Text } from "../src";
import { SPOILER_CLIPPED } from "../src/shared/spoiler";
import { act, byRole, byType, render, textOf } from "./helpers";

function measure(screen: ReturnType<typeof render>, height: number) {
  const inner = byType(screen, "View").find((node) => typeof node.props.onLayout === "function");
  act(() => inner!.props.onLayout({ nativeEvent: { layout: { height, width: 320, x: 0, y: 0 } } }));
}

const clippedAt = (screen: ReturnType<typeof render>, height: number) =>
  byType(screen, "View").some((node) => {
    const style = [node.props.style].flat();
    return style.some((entry) => entry?.maxHeight === height);
  });

const LONG = "A nota fiscal foi cancelada dentro do prazo, e o XML já está no painel.";

describe("Spoiler", () => {
  test("content that fits gets no button and no cut", () => {
    const screen = render(
      <Spoiler maxHeight={120}>
        <Text>{LONG}</Text>
      </Spoiler>,
    );
    measure(screen, 80);

    expect(byRole(screen, "button")).toHaveLength(0);
    expect(textOf(screen)).not.toContain("Ler mais");
    expect(clippedAt(screen, 120)).toBe(false);
  });

  test("overflowing content is cut at the height and says Ler mais, collapsed", () => {
    const screen = render(
      <Spoiler maxHeight={120}>
        <Text>{LONG}</Text>
      </Spoiler>,
    );
    measure(screen, 400);
    const [button] = byRole(screen, "button");

    expect(button!.props.accessibilityState).toEqual({ expanded: false });
    expect(textOf(screen)).toContain("Ler mais");
    expect(clippedAt(screen, 120)).toBe(true);
  });

  test("collapsed, the screen reader hears that the text is cut; open, it no longer does", () => {
    const screen = render(
      <Spoiler maxHeight={120}>
        <Text>{LONG}</Text>
      </Spoiler>,
    );
    measure(screen, 400);
    const hinted = () =>
      byType(screen, "View").filter((node) => node.props.accessibilityHint === SPOILER_CLIPPED);

    expect(hinted()).toHaveLength(1);
    expect(hinted()[0]!.props.accessible).toBe(true);

    act(() => byRole(screen, "button")[0]!.props.onPress());
    expect(hinted()).toHaveLength(0);
  });

  test("a tap opens, announces expanded and changes the text; the second one closes", () => {
    const screen = render(
      <Spoiler maxHeight={120}>
        <Text>{LONG}</Text>
      </Spoiler>,
    );
    measure(screen, 400);

    act(() => byRole(screen, "button")[0]!.props.onPress());
    expect(byRole(screen, "button")[0]!.props.accessibilityState).toEqual({ expanded: true });
    expect(textOf(screen)).toContain("Ler menos");
    expect(clippedAt(screen, 120)).toBe(false);

    act(() => byRole(screen, "button")[0]!.props.onPress());
    expect(textOf(screen)).toContain("Ler mais");
    expect(clippedAt(screen, 120)).toBe(true);
  });

  test("controlled, the tap only notifies", () => {
    const onOpenChange = mock((_: boolean) => {});
    const screen = render(
      <Spoiler maxHeight={120} open={false} onOpenChange={onOpenChange}>
        <Text>{LONG}</Text>
      </Spoiler>,
    );
    measure(screen, 400);

    act(() => byRole(screen, "button")[0]!.props.onPress());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(byRole(screen, "button")[0]!.props.accessibilityState).toEqual({ expanded: false });
  });

  test("defaultOpen starts open, and labels changes the texts", () => {
    const screen = render(
      <Spoiler defaultOpen labels={{ more: "Ver tudo", less: "Ver menos" }}>
        <Text>{LONG}</Text>
      </Spoiler>,
    );
    measure(screen, 400);

    expect(textOf(screen)).toContain("Ver menos");
    expect(clippedAt(screen, 120)).toBe(false);
  });
});
