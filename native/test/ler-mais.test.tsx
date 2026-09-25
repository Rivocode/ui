import { describe, expect, mock, test } from "bun:test";

import { Spoiler, Text } from "../src";
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
  test("conteudo que cabe nao ganha botao nem corte", () => {
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

  test("conteudo que estoura corta na altura e diz Ler mais, recolhido", () => {
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

  test("o toque abre, anuncia expandido e troca o texto; o segundo fecha", () => {
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

  test("controlado, o toque so avisa", () => {
    const onExpandedChange = mock((_: boolean) => {});
    const screen = render(
      <Spoiler maxHeight={120} expanded={false} onExpandedChange={onExpandedChange}>
        <Text>{LONG}</Text>
      </Spoiler>,
    );
    measure(screen, 400);

    act(() => byRole(screen, "button")[0]!.props.onPress());
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    expect(byRole(screen, "button")[0]!.props.accessibilityState).toEqual({ expanded: false });
  });

  test("defaultExpanded nasce aberto, e labels troca os textos", () => {
    const screen = render(
      <Spoiler defaultExpanded labels={{ more: "Ver tudo", less: "Ver menos" }}>
        <Text>{LONG}</Text>
      </Spoiler>,
    );
    measure(screen, 400);

    expect(textOf(screen)).toContain("Ver menos");
    expect(clippedAt(screen, 120)).toBe(false);
  });
});
