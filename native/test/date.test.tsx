import { describe, expect, mock, setSystemTime, spyOn, test } from "bun:test";
import { Text } from "react-native";

import { AppState } from "../../test/react-native-mock";
import {
  Avatar,
  Button,
  DataList,
  EmptyState,
  Indicator,
  Progress,
  RelativeTime,
  Stat,
} from "../src";
import { tokens } from "../tokens";
import { indicatorWidthComplaint } from "../src/indicator";
import { Meter } from "../src/meter";
import { REFRESH, describeRelative } from "../src/relative-time";
import { act, byClass, byLabel, byRole, byType, render, textOf } from "./helpers";

const ROWS = [
  { id: "1", name: "Clínica São Lucas" },
  { id: "2", name: "Transportes Cabo Branco" },
];

function list(props: Partial<Parameters<typeof DataList<(typeof ROWS)[number]>>[0]> = {}) {
  return (
    <DataList
      data={ROWS}
      keyExtractor={(row) => row.id}
      renderItem={(row) => <Text>{row.name}</Text>}
      {...props}
    />
  );
}

describe("DataList", () => {
  test("data on screen, one node per row", () => {
    const screen = render(list());
    expect(textOf(screen)).toContain("Clínica São Lucas");
    expect(textOf(screen)).toContain("Transportes Cabo Branco");
    // Without onRowPress, a row is not a button: a role only where there is an action.
    expect(byRole(screen, "button").length).toBe(0);
  });

  test("with onRowPress each row becomes a button and delivers the row", () => {
    const onRowPress = mock(() => {});
    const screen = render(list({ onRowPress }));
    const rows = byRole(screen, "button");
    expect(rows.length).toBe(2);
    act(() => rows[1].props.onPress());
    expect(onRowPress).toHaveBeenCalledWith(ROWS[1]);
  });

  test("loading shows a skeleton, and undefined data is loading too", () => {
    for (const props of [{ isLoading: true }, { data: undefined }]) {
      const screen = render(list(props as never));
      expect(textOf(screen)).not.toContain("Clínica São Lucas");
      expect(byClass(screen, /bg-skeleton/).length).toBeGreaterThan(0);
    }
  });

  test("error wins over loading, explains and offers to retry", () => {
    const onRetry = mock(() => {});
    const screen = render(list({ isError: true, isLoading: true, onRetry }));
    expect(textOf(screen)).toContain("Não foi possível carregar a lista.");
    act(() => byRole(screen, "button")[0].props.onPress());
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("filter narrows the list ignoring case and accents, as in DataTable", () => {
    const screen = render(list({ filter: "clinica" }));
    expect(textOf(screen)).toContain("Clínica São Lucas");
    expect(textOf(screen)).not.toContain("Transportes Cabo Branco");
  });

  test("a filter that emptied the list is not an empty query: EmptyState stays reserved", () => {
    const empty = { title: "Nenhuma nota por aqui", description: "Emita a primeira." };
    const screen = render(list({ filter: "zzz", empty }));
    expect(textOf(screen)).toContain("Nenhum resultado para a busca.");
    expect(textOf(screen)).not.toContain("Nenhuma nota por aqui");

    // A truly empty database is still EmptyState, even with a search typed.
    const nothing = render(list({ data: [], filter: "zzz", empty }));
    expect(textOf(nothing)).toContain("Nenhuma nota por aqui");
  });

  test("without filterValue the search sees the whole row, with filterValue only the chosen field", () => {
    // The id is a row field: "1" finds row 1 when nobody says otherwise.
    expect(textOf(render(list({ filter: "1" })))).toContain("Clínica São Lucas");

    const named = render(list({ filter: "1", filterValue: (row) => row.name }));
    expect(textOf(named)).toContain("Nenhum resultado para a busca.");
  });

  test("selectable puts one checkbox per row and returns the keyExtractor keys", () => {
    const onValueChange = mock(() => {});
    const screen = render(list({ selectable: true, value: [], onValueChange }));
    const boxes = byRole(screen, "checkbox");
    expect(boxes.length).toBe(2);
    act(() => boxes[1].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(["2"]);
  });

  test("value rules what is checked, and unchecking removes only that key", () => {
    const onValueChange = mock(() => {});
    const screen = render(list({ selectable: true, value: ["1", "2"], onValueChange }));
    expect(byRole(screen, "checkbox")[0].props.accessibilityState.checked).toBe(true);
    act(() => byRole(screen, "checkbox")[0].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(["2"]);
  });

  test("value and onValueChange speak like the web DataTable", () => {
    const onValueChange = mock((_keys: string[]) => {});
    const screen = render(list({ selectable: true, value: ["1"], onValueChange }));
    const boxes = byRole(screen, "checkbox");
    expect(boxes[0].props.accessibilityState.checked).toBe(true);
    expect(boxes[1].props.accessibilityState.checked).toBe(false);
    act(() => boxes[1].props.onPress());
    expect(onValueChange).toHaveBeenCalledWith(["1", "2"]);
    expect(byRole(screen, "checkbox")[1].props.accessibilityState.checked).toBe(false);
  });

  test("without value the list keeps its own selection", () => {
    const screen = render(list({ selectable: true }));
    expect(byRole(screen, "checkbox")[0].props.accessibilityState.checked).toBe(false);
    act(() => byRole(screen, "checkbox")[0].props.onPress());
    expect(byRole(screen, "checkbox")[0].props.accessibilityState.checked).toBe(true);
  });

  test("the checkbox reaches the finger's 44pt, which it does not have on its own", () => {
    const screen = render(list({ selectable: true }));
    const slop = byRole(screen, "checkbox")[0].props.hitSlop;
    expect(slop.left + 20 + slop.right).toBeGreaterThanOrEqual(44);
    expect(slop.top + 20 + slop.bottom).toBeGreaterThanOrEqual(44);
  });

  test("the key comes from the original index: filtering does not renumber the selection", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      list({
        filter: "transportes",
        selectable: true,
        value: [],
        onValueChange,
        keyExtractor: (_row, index) => String(index),
      }),
    );
    act(() => byRole(screen, "checkbox")[0].props.onPress());
    // It is the second row of the set, and stays so with the filter on.
    expect(onValueChange).toHaveBeenCalledWith(["1"]);
  });

  test("an empty list with no search typed does not talk about searching", () => {
    // Without `empty` and without a filter, the list disappears silently, as it
    // always did - saying "no results for the search" would invent a search
    // that never happened.
    const screen = render(list({ data: [] }));
    expect(textOf(screen)).not.toContain("Nenhum resultado para a busca.");
  });

  test("empty only counts after the query came back, and says why", () => {
    const empty = {
      title: "Nenhuma nota por aqui",
      description: "Quando você emitir a primeira, ela aparece nesta lista.",
    };
    const screen = render(list({ data: [], empty }));
    expect(textOf(screen)).toContain("Nenhuma nota por aqui");

    // The same empty list STILL loading is not empty.
    const loading = render(list({ data: undefined, empty } as never));
    expect(textOf(loading)).not.toContain("Nenhuma nota por aqui");
  });
});

describe("EmptyState", () => {
  test("title, reason and action in place", () => {
    const screen = render(
      <EmptyState
        title="Nada aqui"
        description="Emita a primeira nota."
        action={<Text>Emitir</Text>}
      />,
    );
    expect(textOf(screen)).toContain("Nada aqui");
    expect(textOf(screen)).toContain("Emita a primeira nota.");
    expect(textOf(screen)).toContain("Emitir");
  });
});

describe("EmptyState with a drawing", () => {
  const hidden = (screen: ReturnType<typeof render>) =>
    screen.root.findAll(
      (node) =>
        typeof node.type === "string" &&
        node.props.accessibilityElementsHidden === true &&
        node.props.importantForAccessibility === "no-hide-descendants",
    );

  test("the icon as a function receives the theme's fg-subtle and the web's 32", () => {
    const received: { color: string; size: number }[] = [];
    const screen = render(
      <EmptyState
        icon={(glyph) => {
          received.push(glyph);
          return <Text>lupa</Text>;
        }}
        title="Nada encontrado"
        description="Tente outro filtro."
      />,
      { theme: "rivocode-light" },
    );

    expect(received.length).toBeGreaterThan(0);
    expect(received.at(-1)).toEqual({
      color: tokens.themes["rivocode-light"]["fg-subtle"],
      size: 32,
    });
    expect(received.at(-1)!.color).not.toBe(tokens.themes["rivocode-dark"]["fg-subtle"]);
    expect(hidden(screen)).toHaveLength(1);
    expect(textOf(screen)).toContain("lupa");
  });

  test("the icon as a node is also hidden from the screen reader", () => {
    const screen = render(
      <EmptyState
        icon={<Text>lupa</Text>}
        title="Nada encontrado"
        description="Tente outro filtro."
      />,
    );
    const [wrapper] = hidden(screen);
    expect(wrapper).toBeDefined();
    expect(textOf(screen)).toContain("lupa");
  });

  test("without a drawing, no hidden wrapper is left over", () => {
    const screen = render(<EmptyState title="Nada encontrado" description="Tente outro filtro." />);
    expect(hidden(screen)).toHaveLength(0);
  });

  test("the illustration takes the icon's place", () => {
    const screen = render(
      <EmptyState
        icon={<Text>lupa</Text>}
        illustration={<Text>caixa aberta</Text>}
        title="Nenhuma nota"
        description="Emita a primeira."
      />,
    );
    expect(hidden(screen)).toHaveLength(1);
    expect(textOf(screen)).toContain("caixa aberta");
    expect(textOf(screen)).not.toContain("lupa");
  });

  test("the DataList's empty carries the icon to the EmptyState", () => {
    const screen = render(
      list({
        data: [],
        empty: { title: "Nenhuma nota", description: "Emita a primeira.", icon: <Text>lupa</Text> },
      }),
    );
    expect(hidden(screen)).toHaveLength(1);
    expect(textOf(screen)).toContain("lupa");
  });
});

describe("Stat", () => {
  test("going up is green by default and red with invert", () => {
    const up = render(<Stat label="Faturado" value="R$ 246,7K" delta={20} />);
    expect(byClass(up, /text-success-text/).length).toBe(1);

    const bad = render(<Stat label="Vencidas" value="6" delta={50} invert />);
    expect(byClass(bad, /text-danger-text/).length).toBe(1);
  });
});

describe("Avatar", () => {
  test("the initials come in through fallback, the same name as the web", () => {
    const screen = render(<Avatar fallback="EB" />);
    expect(textOf(screen)).toContain("EB");
    expect(byType(screen, "Image")).toHaveLength(0);
  });

  test("the remote photo comes in through src, and the initials stay under it", () => {
    const screen = render(<Avatar fallback="EB" src="https://exemplo.com/eu.jpg" alt="Emanuel" />);
    const [photo] = byType(screen, "Image");

    expect(photo!.props.source).toEqual({ uri: "https://exemplo.com/eu.jpg" });
    expect(photo!.props.accessibilityLabel).toBe("Emanuel");
    expect(photo!.props.accessible).toBe(true);
    expect(photo!.props.className.split(" ")).toContain("absolute");
    expect(textOf(screen)).toContain("EB");
  });

  test("without alt the photo is hidden from the screen reader, because the name is already beside it", () => {
    const screen = render(<Avatar fallback="EB" src="https://exemplo.com/eu.jpg" />);
    const [photo] = byType(screen, "Image");

    expect(photo!.props.accessible).toBe(false);
  });

  test("a failing photo falls back to the initials, and changing src tries again", () => {
    const screen = render(<Avatar fallback="EB" src="https://exemplo.com/quebrada.jpg" />);

    act(() => byType(screen, "Image")[0]!.props.onError());
    expect(byType(screen, "Image")).toHaveLength(0);
    expect(textOf(screen)).toContain("EB");

    act(() => {
      screen.update(<Avatar fallback="EB" src="https://exemplo.com/outra.jpg" />);
    });
    expect(byType(screen, "Image")).toHaveLength(1);
  });

  test("the frame clips the photo into the pill", () => {
    const screen = render(<Avatar fallback="EB" src="https://exemplo.com/eu.jpg" />);
    const [frame] = byClass(screen, /rounded-pill/);

    expect(frame!.props.className.split(" ")).toContain("overflow-hidden");
    expect(frame!.props.className.split(" ")).toContain("rounded-pill");
  });
});

describe("Progress", () => {
  test("announces role and value, and does not go past 100", () => {
    const screen = render(<Progress value={140} label="Meta do mês" />);
    const [bar] = byRole(screen, "progressbar");
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 100 });
    expect(bar.props.accessibilityLabel).toBe("Meta do mês");
  });

  test("without showValue the bar is still a single element, so the screen reader does not skip it", () => {
    const screen = render(<Progress value={40} label="Envio" />);
    expect(byRole(screen, "progressbar")[0]!.props.accessible).toBe(true);
  });
});

describe("Meter", () => {
  test("it is not a progressbar: a measurement that goes up and down cannot announce loading", () => {
    const screen = render(<Meter value={82} label="Espaço usado" />);
    expect(byRole(screen, "progressbar").length).toBe(0);
    const [meter] = byRole(screen, "text");
    expect(meter.props.accessibilityLabel).toBe("Espaço usado");
  });

  test("its own scale: 8 of 15 paints 53% of the bar and announces the raw value", () => {
    const screen = render(<Meter value={8} max={15} label="Armazenamento" />);
    const [bar] = byClass(screen, /\bbg-accent\b/);
    expect(bar.props.style.width).toBe("53%");

    const [meter] = byRole(screen, "text");
    expect(meter.props.accessibilityValue).toEqual({ min: 0, max: 15, now: 8, text: "53%" });
  });

  test("out of scale does not overflow the bar in either direction", () => {
    const over = render(<Meter value={40} max={15} label="Armazenamento" />);
    expect(byClass(over, /\bbg-accent\b/)[0].props.style.width).toBe("100%");
    // now above max is a RangeInfo outside the specification: the screen reader
    // gets the scale, and the text on screen is what tells the overflow.
    expect(byRole(over, "text")[0].props.accessibilityValue.now).toBe(15);

    const under = render(<Meter value={-4} max={15} label="Armazenamento" />);
    expect(byClass(under, /\bbg-accent\b/)[0].props.style.width).toBe("0%");
  });

  test("valueLabel writes the measurement on screen and is what the screen reader says", () => {
    const screen = render(
      <Meter value={8} max={15} label="Armazenamento" valueLabel="8 GB de 15 GB" />,
    );
    expect(textOf(screen)).toContain("Armazenamento");
    expect(textOf(screen)).toContain("8 GB de 15 GB");
    expect(byRole(screen, "text")[0].props.accessibilityValue.text).toBe("8 GB de 15 GB");
  });

  test("showValue writes the percentage, and without it the bar goes alone", () => {
    const shown = render(<Meter value={8} max={15} label="Armazenamento" showValue />);
    expect(textOf(shown)).toContain("53%");

    const bare = render(<Meter value={8} max={15} label="Armazenamento" />);
    expect(textOf(bare)).not.toContain("53%");
  });
});

describe("Indicator", () => {
  test("the count sits on top of the child, and the screen reader hears the sentence and not the number", () => {
    const screen = render(
      <Indicator count={3} label="3 notificações">
        <Button onPress={() => {}}>Avisos</Button>
      </Indicator>,
    );

    expect(textOf(screen)).toContain("3");

    const [pastilha] = byLabel(screen, "3 notificações");
    expect(pastilha.props.accessible).toBe(true);
    expect(pastilha.props.accessibilityRole).toBe("text");
    expect(pastilha.props.className).toContain("absolute");

    // The child is still a button: the mark does not wrap what it counts, or
    // the inner target would vanish for the screen reader.
    expect(byRole(screen, "button").length).toBe(1);
  });

  test("zero draws nothing, and above the ceiling it shows the ceiling with a plus", () => {
    const zero = render(
      <Indicator count={0} label="Nenhum aviso">
        <Text>Sino</Text>
      </Indicator>,
    );
    expect(byLabel(zero, "Nenhum aviso").length).toBe(0);

    const muitos = render(
      <Indicator count={140} label="Mais de 99 notificações">
        <Text>Sino</Text>
      </Indicator>,
    );
    expect(textOf(muitos)).toContain("99+");

    const proprio = render(
      <Indicator count={12} max={9} label="Mais de 9 notificações">
        <Text>Sino</Text>
      </Indicator>,
    );
    expect(textOf(proprio)).toContain("9+");
  });

  test("a wide child is flagged in __DEV__: the badge covers content, and nothing reserves space", () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    try {
      const screen = render(
        <Indicator count={3} label="3 notificações">
          <Text>Uma linha inteira de conteúdo</Text>
        </Indicator>,
      );
      const [wrapper] = byClass(screen, /\bself-start\b/);

      act(() => {
        wrapper!.props.onLayout({ nativeEvent: { layout: { width: 320 } } });
        wrapper!.props.onLayout({ nativeEvent: { layout: { width: 320 } } });
      });

      expect(warn.mock.calls.length).toBe(1);
      expect(String(warn.mock.calls[0]![0])).toContain("[rivocode/ui-native]");
      expect(String(warn.mock.calls[0]![0])).toContain("320px");
    } finally {
      warn.mockRestore();
    }
  });

  test("a small target is not flagged: the bell, the bar item and the avatar fit in 48px", () => {
    expect(indicatorWidthComplaint(48)).toBeUndefined();
    expect(indicatorWidthComplaint(49)).toContain("49px");
  });

  test("the dot marks without counting, and still announces itself", () => {
    const screen = render(
      <Indicator dot label="Há mensagens novas">
        <Text>Sino</Text>
      </Indicator>,
    );

    expect(byLabel(screen, "Há mensagens novas").length).toBe(1);
    expect(textOf(screen).trim()).toBe("Sino");
  });
});

describe("RelativeTime", () => {
  const AGORA = new Date("2026-08-26T12:00:00");
  const antes = (ms: number) => new Date(AGORA.getTime() - ms);
  const texto = (element: Parameters<typeof render>[0]) => textOf(render(element)).trim();

  test("the unit and the plural, backward and forward", () => {
    expect(texto(<RelativeTime value={antes(30_000)} now={AGORA} />)).toBe("agora");
    expect(texto(<RelativeTime value={antes(60_000)} now={AGORA} />)).toBe("há 1 minuto");
    expect(texto(<RelativeTime value={antes(120_000)} now={AGORA} />)).toBe("há 2 minutos");
    expect(texto(<RelativeTime value={antes(3_600_000)} now={AGORA} />)).toBe("há 1 hora");
    expect(texto(<RelativeTime value={antes(3 * 86_400_000)} now={AGORA} />)).toBe("há 3 dias");
    expect(texto(<RelativeTime value={antes(60 * 86_400_000)} now={AGORA} />)).toBe("há 2 meses");

    const depois = new Date(AGORA.getTime() + 3 * 86_400_000);
    expect(texto(<RelativeTime value={depois} now={AGORA} />)).toBe("em 3 dias");

    // Accepts whatever comes: Date, ISO or milliseconds.
    expect(texto(<RelativeTime value={antes(120_000).toISOString()} now={AGORA} />)).toBe(
      "há 2 minutos",
    );
    expect(texto(<RelativeTime value={antes(120_000).getTime()} now={AGORA} />)).toBe(
      "há 2 minutos",
    );
  });

  test("rounds with sign, like the web: 90 minutes ago is 1 hour ago, and ahead it is in 2", () => {
    expect(texto(<RelativeTime value={antes(90 * 60_000)} now={AGORA} />)).toBe("há 1 hora");
    const depois = new Date(AGORA.getTime() + 90 * 60_000);
    expect(texto(<RelativeTime value={depois} now={AGORA} />)).toBe("em 2 horas");
  });

  test("an invalid date becomes a dash, with no invented number and no clock", () => {
    expect(texto(<RelativeTime value="não é data" now={AGORA} />)).toBe("—");
    expect(describeRelative(new Date(Number.NaN), AGORA)).toEqual({ text: "—", step: null });
  });

  test("cutoff swaps the relative text for the date, in formatDate's format", () => {
    const velho = new Date("2026-01-05T09:00:00");
    expect(texto(<RelativeTime value={velho} cutoff="month" now={AGORA} />)).toBe("05/01/2026");
    // Without cutoff, it keeps counting.
    expect(texto(<RelativeTime value={velho} now={AGORA} />)).toBe("há 8 meses");
  });

  test("the step follows the distance, and a date already past has no step", () => {
    expect(describeRelative(antes(90_000), AGORA).step).toBe(REFRESH.minute);
    expect(describeRelative(antes(5 * 3_600_000), AGORA).step).toBe(REFRESH.hour);
    expect(describeRelative(antes(3 * 86_400_000), AGORA).step).toBe(REFRESH.day);
    expect(REFRESH.now).toBeLessThan(REFRESH.minute);
    expect(REFRESH.minute).toBeLessThan(REFRESH.hour);
    expect(REFRESH.hour).toBeLessThan(REFRESH.day);

    // An absolute date for a past instant never changes again: no clock.
    const antigo = antes(400 * 86_400_000);
    expect(describeRelative(antigo, AGORA, "month").step).toBeNull();

    // In the future the same date becomes relative again as it gets close, so
    // there the clock keeps running.
    const futuro = new Date(AGORA.getTime() + 400 * 86_400_000);
    expect(describeRelative(futuro, AGORA, "month").step).toBe(REFRESH.year);
  });

  test("without now the text refreshes on returning from the background; with now it stays still", () => {
    setSystemTime(new Date("2026-08-26T12:00:00"));

    const vivo = render(<RelativeTime value={new Date("2026-08-26T11:58:00")} />);
    const parado = render(<RelativeTime value={new Date("2026-08-26T11:58:00")} now={AGORA} />);
    expect(textOf(vivo).trim()).toBe("há 2 minutos");

    // The device slept for an hour: the JS timer did not run meanwhile, and it
    // is the return that refreshes the text.
    setSystemTime(new Date("2026-08-26T13:00:00"));
    act(() => AppState.setState("background"));
    act(() => AppState.setState("active"));

    expect(textOf(vivo).trim()).toBe("há 1 hora");
    expect(textOf(parado).trim()).toBe("há 2 minutos");

    act(() => vivo.unmount());
    setSystemTime();
  });
});
