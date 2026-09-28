import { describe, expect, test } from "bun:test";
import { Text } from "react-native";

import { Code } from "../src/code";
import { Timeline, type TimelineEvent } from "../src/timeline";
import { byClass, byLabel, byRole, byType, render, textOf } from "./helpers";

const HISTORY: TimelineEvent[] = [
  { title: "Nota emitida", at: "12/03 às 14:20", by: "Ana Duarte", tone: "neutral" },
  {
    title: "Autorizada pela Sefaz",
    at: "12/03 às 14:22",
    by: "Sistema",
    tone: "success",
    description: "Protocolo 135250000123456",
  },
  { title: "Pagamento", at: "em 3 dias", tone: "accent", pending: true },
];

describe("Timeline", () => {
  test("the line is a list and each event is a single stop, with a position", () => {
    const screen = render(<Timeline items={HISTORY} label="Histórico da nota 4471" />);

    expect(byLabel(screen, "Histórico da nota 4471").length).toBe(1);
    expect(byRole(screen, "list").length).toBe(1);

    // One stop per event, and not one more: title, stamp and author do not
    // split into three screen reader stops.
    const stops = screen.root.findAll(
      (node) => typeof node.type === "string" && node.props?.accessible === true,
    );
    expect(stops.length).toBe(HISTORY.length);
  });

  test("each event's label says what changed, when, by whom and where it is", () => {
    const screen = render(<Timeline items={HISTORY} />);

    expect(byLabel(screen, "1 de 3: Nota emitida, 12/03 às 14:20, por Ana Duarte").length).toBe(1);
    expect(
      byLabel(
        screen,
        "2 de 3: Autorizada pela Sefaz, 12/03 às 14:22, por Sistema. Protocolo 135250000123456",
      ).length,
    ).toBe(1);
  });

  test("a future event says it has not happened yet, and the marker stays hollow", () => {
    const screen = render(<Timeline items={HISTORY} />);

    expect(byLabel(screen, "3 de 3: Pagamento, ainda não aconteceu, em 3 dias").length).toBe(1);

    // Hollow is a border without fill - and never the tone color, which would
    // promise the event already happened.
    const hollow = byClass(screen, /border-border-strong/);
    expect(hollow.length).toBe(1);
    expect(hollow[0].props.className).toContain("bg-bg");
    expect(hollow[0].props.className).not.toContain("bg-accent");
  });

  test("the tone paints the marker, event by event", () => {
    const screen = render(<Timeline items={HISTORY} />);

    expect(byClass(screen, /bg-border-strong/).length).toBe(1);
    expect(byClass(screen, /bg-success/).length).toBe(1);
  });

  test("the last event hangs no line nor slack below it", () => {
    const screen = render(<Timeline items={HISTORY} />);

    expect(byClass(screen, /w-px/).length).toBe(HISTORY.length - 1);
    expect(byClass(screen, /pb-5/).length).toBe(HISTORY.length - 1);
  });

  test("the stamp and the author come out on the same line, and the detail below", () => {
    const screen = render(<Timeline items={HISTORY} />);
    const text = textOf(screen);

    expect(text).toContain("12/03 às 14:20 · Ana Duarte");
    expect(text).toContain("Protocolo 135250000123456");
  });

  test("a hand-written label wins over the assembled sentence", () => {
    const screen = render(
      <Timeline
        items={[{ title: "Cancelada", accessibilityLabel: "Nota cancelada pelo emitente" }]}
      />,
    );

    expect(byLabel(screen, "Nota cancelada pelo emitente").length).toBe(1);
    expect(byLabel(screen, "1 de 1: Cancelada").length).toBe(0);
  });

  test("with no event at all it does not draw an empty line", () => {
    const screen = render(<Timeline items={[]} />);
    expect(byRole(screen, "list").length).toBe(0);
  });
});

describe("Code", () => {
  test("comes out in the code typeface, with a background, and the long press copies", () => {
    const screen = render(<Code>app.json</Code>);
    const [piece] = byType(screen, "Text");

    expect(textOf(screen)).toContain("app.json");
    expect(piece.props.className).toContain("bg-surface-raised");
    // The code typeface comes in through style, not through a class -
    // `mono-font.test.tsx` tells why.
    expect([piece.props.style].flat(3)[0]).toHaveProperty("fontFamily");
    expect(piece.props.selectable).toBe(true);
  });

  test("it neither scrolls sideways nor cuts: the snippet wraps along with the sentence", () => {
    const screen = render(
      <Text className="text-base text-fg">
        Abra o <Code>node_modules/@rivocode/ui-native/src/index.ts</Code> e confira.
      </Text>,
    );

    // Its own scrolling belongs to CodeBlock, which is another piece: inside a
    // paragraph it would be a trap for the finger scrolling the screen.
    expect(byType(screen, "ScrollView").length).toBe(0);
    for (const node of byType(screen, "Text")) {
      expect(node.props.numberOfLines).toBeUndefined();
    }
  });

  test("it does not pin a font size: inside the sentence it inherits the outer text's", () => {
    const screen = render(<Code>slug</Code>);
    const [piece] = byType(screen, "Text");

    expect(piece.props.className).not.toMatch(/(^|\s)text-(xs|sm|base|md|lg|xl)(\s|$)/);
  });

  test("the consumer's class wins over the piece's, and selecting turns off", () => {
    const screen = render(
      <Code className="text-danger-text" selectable={false}>
        emitida_em
      </Code>,
    );
    const [piece] = byType(screen, "Text");

    expect(piece.props.className).toContain("text-danger-text");
    expect(piece.props.className).not.toContain("text-fg-muted");
    expect(piece.props.selectable).toBe(false);
  });
});
