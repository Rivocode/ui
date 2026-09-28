import { describe, expect, mock, test } from "bun:test";
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";

import { FilterBar, FilterChip, type AppliedFilter } from "../src";
import { I18nManager } from "../../test/react-native-mock";
import { act, byClass, byLabel, byRole, byType, render, textOf } from "./helpers";

const APPLIED: AppliedFilter[] = [
  { id: "status", label: "Situação", value: "Em aberto" },
  { id: "customer", label: "Cliente", value: "Clínica São Lucas" },
];

function chipRoot(screen: ReactTestRenderer): ReactTestInstance {
  return byClass(screen, /gap-1 px-2\.5/)[0];
}

function cross(screen: ReactTestRenderer): ReactTestInstance | undefined {
  return byRole(screen, "button").find((node) =>
    String(node.props.accessibilityLabel).startsWith("Remover"),
  );
}

function clearButton(screen: ReactTestRenderer): ReactTestInstance | undefined {
  return byRole(screen, "button").find((node) => textOf2(node).startsWith("Limpar"));
}

function edges(screen: ReactTestRenderer): string[] {
  return byClass(screen, /\bw-px\b/).map((node) =>
    String(node.props.className).includes("left-0") ? "esquerda" : "direita",
  );
}

function settle(screen: ReactTestRenderer, frame: number, content: number): void {
  const [scroller] = byType(screen, "ScrollView");
  act(() => {
    scroller!.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: frame, height: 44 } } });
    scroller!.props.onContentSizeChange(content, 44);
  });
}

function scrollTo(screen: ReactTestRenderer, offset: number, frame: number, content: number): void {
  const [scroller] = byType(screen, "ScrollView");
  act(() =>
    scroller!.props.onScroll({
      nativeEvent: {
        contentOffset: { x: offset, y: 0 },
        contentSize: { width: content, height: 44 },
        layoutMeasurement: { width: frame, height: 44 },
      },
    }),
  );
}

function inRTL<T>(run: () => T): T {
  I18nManager.isRTL = true;
  try {
    return run();
  } finally {
    I18nManager.isRTL = false;
  }
}

function textOf2(node: ReactTestInstance): string {
  const found = node.findAll((child) => typeof child.type === "string" && child.type === "Text");
  return found.map((child) => String(child.props.children ?? "")).join(" ");
}

describe("FilterChip", () => {
  test("the chip shows the field and the value, and the value carries the weight", () => {
    const screen = render(<FilterChip label="Cliente" value="Clínica São Lucas" />);

    expect(textOf(screen)).toContain("Cliente");
    const value = byType(screen, "Text").find(
      (node) => node.props.children === "Clínica São Lucas",
    );
    expect(value!.props.className.split(" ")).toContain("font-rc-medium");
  });

  test("the x says which filter goes, and not just 'Remover'", () => {
    const screen = render(
      <FilterChip label="Cliente" value="Clínica São Lucas" onRemove={() => {}} />,
    );

    expect(byLabel(screen, "Remover filtro Cliente: Clínica São Lucas").length).toBe(1);
  });

  test("a chip without a value falls back to the field name", () => {
    const screen = render(<FilterChip label="Cliente" onRemove={() => {}} />);

    expect(byLabel(screen, "Remover filtro Cliente").length).toBe(1);
  });

  test("the x's name is replaced through labels.remove, as in TagsInput", () => {
    const screen = render(
      <FilterChip
        label="Emissão"
        value="01/08"
        labels={{ remove: (text) => `Tirar o filtro ${text}` }}
        onRemove={() => {}}
      />,
    );

    expect(byLabel(screen, "Tirar o filtro Emissão: 01/08").length).toBe(1);
  });

  test("without onRemove the chip has no x, which is how a locked filter is shown", () => {
    const screen = render(<FilterChip label="Filial" value="Matriz" />);

    expect(byRole(screen, "button").length).toBe(0);
  });

  test("the x's target reaches 44pt without fattening the pill", () => {
    const screen = render(<FilterChip label="Cliente" value="Acme" onRemove={() => {}} />);

    expect(chipRoot(screen).props.className).toContain("h-11");
    expect(byClass(screen, /rounded-pill border border-border/)[0].props.className).toContain(
      "top-2 bottom-2",
    );

    const button = cross(screen)!;
    expect(String(button.props.className).split(" ")).toContain("self-stretch");
    expect(String(button.props.className).split(" ")).toContain("w-4");
    expect(button.props.hitSlop).toEqual({ top: 0, bottom: 0, left: 14, right: 14 });
  });

  test("the touch strip does not shrink with size; the pill does", () => {
    const small = render(<FilterChip label="Cliente" value="Acme" size="sm" />);

    expect(byClass(small, /gap-1 px-2\b/)[0].props.className).toContain("h-11");
    expect(byClass(small, /rounded-pill border border-border/)[0].props.className).toContain(
      "top-2.5 bottom-2.5",
    );
  });

  test("the value is cut to a single line and at 10rem, so it does not push the neighbor", () => {
    const long = "Clínica São Lucas Serviços Médicos e Hospitalares Ltda";
    const screen = render(<FilterChip label="Cliente" value={long} />);
    const value = byType(screen, "Text").find((node) => node.props.children === long)!;

    expect(value.props.numberOfLines).toBe(1);
    expect(value.props.className).toContain("max-w-40");
  });

  test("the chip carries no literal color nor state tone", () => {
    const screen = render(<FilterChip label="Cliente" value="Acme" onRemove={() => {}} />);
    const classes = byClass(screen, /./)
      .map((node) => String(node.props.className))
      .join(" ");

    expect(classes).not.toMatch(/#[0-9a-f]{3,6}|rgba?\(/i);
    expect(classes).not.toMatch(/bg-(success|warning|danger|info)/);
    expect(classes).toContain("rounded-pill");
  });

  test("the disabled chip locks the x and announces it", () => {
    const screen = render(<FilterChip label="Cliente" value="Acme" onRemove={() => {}} disabled />);
    const button = cross(screen)!;

    expect(button.props.disabled).toBe(true);
    expect(button.props.accessibilityState.disabled).toBe(true);
    expect(chipRoot(screen).props.className).toContain("opacity-60");
  });
});

describe("FilterBar", () => {
  test("the row scrolls horizontally and does not wrap", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    const [scroller] = byType(screen, "ScrollView");

    expect(scroller.props.horizontal).toBe(true);
    expect(scroller.props.contentContainerClassName).toContain("flex-row");
    expect(scroller.props.contentContainerClassName).not.toContain("flex-wrap");
    expect(scroller.props.accessibilityRole).toBe("list");
    expect(scroller.props.accessibilityLabel).toBe("Filtros aplicados");
  });

  test("clear stays anchored outside the scrolling stretch", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    const [scroller] = byType(screen, "ScrollView");

    const inside = scroller.findAll(
      (node) => typeof node.type === "string" && node.props?.accessibilityRole === "button",
    );

    expect(byRole(screen, "button").length).toBe(3);
    expect(inside.length).toBe(2);
  });

  test("it does not collapse into a counter: each filter has its own chip", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);

    expect(textOf(screen)).toContain("Situação");
    expect(textOf(screen)).toContain("Cliente");
    expect(textOf(screen)).not.toContain("+1");
  });

  test("the x reports which filter left and delivers what remains", () => {
    const left = mock(() => {});
    const rest = mock(() => {});
    const screen = render(<FilterBar filters={APPLIED} onRemove={left} onFiltersChange={rest} />);

    act(() => byLabel(screen, "Remover filtro Cliente: Clínica São Lucas")[0].props.onPress());

    expect(left).toHaveBeenCalledWith(APPLIED[1]);
    expect(rest).toHaveBeenCalledWith([APPLIED[0]]);
  });

  test("the piece keeps no list of its own: with nobody changing the state, the chip stays there", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);

    act(() => byLabel(screen, "Remover filtro Cliente: Clínica São Lucas")[0].props.onPress());

    expect(textOf(screen)).toContain("Clínica São Lucas");
  });

  test("a filter with removable false appears without an x", () => {
    const screen = render(
      <FilterBar
        filters={[{ id: "branch", label: "Filial", value: "Matriz", removable: false }, ...APPLIED]}
        onFiltersChange={() => {}}
      />,
    );

    expect(textOf(screen)).toContain("Filial");
    expect(byLabel(screen, "Remover filtro Filial: Matriz").length).toBe(0);
    expect(byLabel(screen, "Remover filtro Cliente: Clínica São Lucas").length).toBe(1);
  });

  test("clear appears from two filters on, with the count inside", () => {
    const one = render(<FilterBar filters={[APPLIED[0]!]} onFiltersChange={() => {}} />);
    expect(clearButton(one)).toBeUndefined();

    const two = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    expect(textOf2(clearButton(two)!)).toBe("Limpar 2 filtros");
  });

  test("clearFrom changes the threshold, and with 1 clear shows from the first", () => {
    const screen = render(
      <FilterBar filters={[APPLIED[0]!]} onFiltersChange={() => {}} clearFrom={1} />,
    );

    expect(textOf2(clearButton(screen)!)).toBe("Limpar 1 filtro");
  });

  test("clear notifies first and delivers the empty list afterwards", () => {
    const cleared = mock(() => {});
    const rest = mock(() => {});
    const screen = render(<FilterBar filters={APPLIED} onClear={cleared} onFiltersChange={rest} />);

    act(() => clearButton(screen)!.props.onPress());

    expect(cleared).toHaveBeenCalled();
    expect(rest).toHaveBeenCalledWith([]);
  });

  test("clear keeps the locked filters and counts only the ones that go", () => {
    const locked: AppliedFilter = {
      id: "empresa",
      label: "Empresa",
      value: "Filial",
      removable: false,
    };
    const rest = mock((_: AppliedFilter[]) => {});
    const screen = render(<FilterBar filters={[locked, ...APPLIED]} onFiltersChange={rest} />);

    expect(textOf2(clearButton(screen)!)).toBe("Limpar 2 filtros");
    act(() => clearButton(screen)!.props.onPress());
    expect(rest).toHaveBeenCalledWith([locked]);

    const alone = render(<FilterBar filters={[locked, APPLIED[0]!]} onFiltersChange={() => {}} />);
    expect(clearButton(alone)).toBeUndefined();
  });

  test("with no listener, there is no clear nor x: a button that does nothing is a lie", () => {
    const screen = render(<FilterBar filters={APPLIED} />);

    expect(byRole(screen, "button").length).toBe(0);
  });

  test("the row stays reserved when there is no filter, and what it reserves is a touch target", () => {
    const screen = render(<FilterBar filters={[]} onFiltersChange={() => {}} />);
    const [row] = byClass(screen, /w-full flex-row/);

    expect(row.props.className).toContain("h-11");
    expect(textOf(screen)).toContain("Nenhum filtro aplicado");
  });

  test("reserve false removes the row and keeps the notice mounted", () => {
    const screen = render(<FilterBar filters={[]} onFiltersChange={() => {}} reserve={false} />);
    const [row] = byClass(screen, /w-full flex-row/);

    expect(row.props.className).not.toContain("h-11");
    expect(byLabel(screen, "Nenhum filtro aplicado").length).toBe(1);
  });

  test("the count goes out in a live notice, which is where a listener learns it changed", () => {
    for (const [filters, said] of [
      [[], "Nenhum filtro aplicado"],
      [[APPLIED[0]!], "1 filtro aplicado"],
      [APPLIED, "2 filtros aplicados"],
    ] as const) {
      const screen = render(<FilterBar filters={[...filters]} onFiltersChange={() => {}} />);
      const [live] = byLabel(screen, said);

      expect(live).toBeDefined();
      expect(live.props.accessibilityLiveRegion).toBe("polite");
    }
  });

  test("with a filter on screen the live notice leaves the flow, so it does not open a gap in the row", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    const [live] = byLabel(screen, "2 filtros aplicados");

    expect(live.props.className).toContain("absolute");
    expect(live.props.children).toBe("");
  });

  test("when everything fits, no edge appears", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    settle(screen, 390, 300);

    expect(edges(screen)).toEqual([]);
  });

  test("with a chip hidden on the right, the edge signals that side before any touch", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    settle(screen, 390, 1429);

    expect(edges(screen)).toEqual(["direita"]);
  });

  test("mid-scroll there are hidden filters on both sides, and both edges say so", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    scrollTo(screen, 400, 390, 1429);

    expect(edges(screen).sort()).toEqual(["direita", "esquerda"]);
  });

  test("at the end of the scroll only the back edge remains, because nothing is left ahead", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    scrollTo(screen, 1039, 390, 1429);

    expect(edges(screen)).toEqual(["esquerda"]);
  });

  test("the edge costs no row width nor eats a drag that starts on it", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    settle(screen, 390, 1429);
    const [rule] = byClass(screen, /\bw-px\b/);

    expect(rule!.props.pointerEvents).toBe("none");
    expect(rule!.props.className).toContain("absolute");
    expect(rule!.props.className).toContain("bg-border-strong");
    expect(String(rule!.props.className)).not.toMatch(/#[0-9a-f]{3,6}|rgba?\(/i);
  });

  test("disabled locks the x and clear at once", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} disabled />);

    expect(clearButton(screen)!.props.disabled).toBe(true);
    for (const button of byLabel(screen, "Remover filtro Cliente: Clínica São Lucas")) {
      expect(button.props.disabled).toBe(true);
    }
  });
});

describe("FilterBar in rtl", () => {
  test("at rest the row is already at the reading start, and the edge signals the side left behind", () => {
    const ltr = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    settle(ltr, 390, 1429);
    expect(edges(ltr)).toEqual(["direita"]);

    const screen = inRTL(() => {
      const rendered = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
      settle(rendered, 390, 1429);
      return rendered;
    });

    expect(edges(screen)).toEqual(["esquerda"]);
  });

  test("with the event in hand the math is physical, and the same contentOffset gives the same edge in both directions", () => {
    for (const [offset, said] of [
      [0, "direita"],
      [1039, "esquerda"],
    ] as const) {
      const ltr = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
      scrollTo(ltr, offset, 390, 1429);
      expect(edges(ltr)).toEqual([said]);

      const screen = inRTL(() => {
        const rendered = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
        scrollTo(rendered, offset, 390, 1429);
        return rendered;
      });

      expect(edges(screen)).toEqual([said]);
    }
  });

  test("mid-scroll in rtl both edges keep showing", () => {
    const screen = inRTL(() => {
      const rendered = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
      scrollTo(rendered, 639, 390, 1429);
      return rendered;
    });

    expect(edges(screen).sort()).toEqual(["direita", "esquerda"]);
  });

  test("in rtl, when everything fits, no edge appears", () => {
    const screen = inRTL(() => {
      const rendered = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
      settle(rendered, 390, 300);
      return rendered;
    });

    expect(edges(screen)).toEqual([]);
  });

  test("the ScrollView takes no contentOffset: React Native itself is what stops at the reading start", () => {
    const ltr = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    const screen = inRTL(() => render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />));

    for (const rendered of [ltr, screen]) {
      const [scroller] = byType(rendered, "ScrollView");
      expect(scroller.props.contentOffset).toBeUndefined();
      expect(scroller.props.contentContainerClassName).toContain("flex-row");
      expect(scroller.props.contentContainerClassName).not.toContain("row-reverse");
    }
  });

  test("the row does not mirror again what RN already mirrors: the chip order is the list order", () => {
    const screen = inRTL(() => render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />));
    const said = byType(screen, "Text")
      .map((node) => String(node.props.children ?? ""))
      .filter((text) => text.length > 0);

    expect(said.indexOf("Situação")).toBeLessThan(said.indexOf("Cliente"));
  });

  test("clear is not attached by a physical margin: the space comes from the row gap", () => {
    const screen = render(<FilterBar filters={APPLIED} onFiltersChange={() => {}} />);
    const [row] = byClass(screen, /w-full flex-row/);

    expect(String(row.props.className).split(" ")).toContain("gap-2");
    expect(String(clearButton(screen)!.props.className ?? "")).not.toMatch(/\b(ml|mr)-\d/);
  });
});
