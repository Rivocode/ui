import { afterEach, describe, expect, test } from "bun:test";
import { AccessibilityInfo, Text } from "react-native";
import { KeyboardProvider, keyboard } from "react-native-keyboard-controller";
import { create, type ReactTestInstance } from "react-test-renderer";

import { Button, Combobox, Dialog, Field, Input, RivoProvider, ScrollArea, Sheet } from "../src";
import { act, byLabel, byType, render } from "./helpers";

type Keyboard = {
  providers: number;
  listening: number;
  start: (to: number) => void;
  frame: (at: number, to: number) => void;
  end: (to: number) => void;
  reset: () => void;
};

const board = keyboard as unknown as Keyboard;

const reduceMotion = (enabled: boolean) =>
  act(() =>
    (AccessibilityInfo as unknown as { setReduceMotion: (next: boolean) => void }).setReduceMotion(
      enabled,
    ),
  );

const start = (to: number) => act(() => board.start(to));
const frame = (at: number, to: number) => act(() => board.frame(at, to));
const end = (to: number) => act(() => board.end(to));

afterEach(() => {
  reduceMotion(false);
  act(() => board.reset());
});

const modalOf = (screen: ReturnType<typeof render>): ReactTestInstance => {
  const found = byType(screen, "View").filter((node) => node.props.accessibilityViewIsModal);
  expect(found).toHaveLength(1);
  return found[0]!;
};

const paddingOf = (screen: ReturnType<typeof render>) =>
  (modalOf(screen).props.style as { paddingBottom: number }).paddingBottom;

const riserOf = (screen: ReturnType<typeof render>): ReactTestInstance => {
  const found = byType(screen, "View").filter(
    (node) => (node.props.style as { transform?: unknown } | undefined)?.transform !== undefined,
  );
  expect(found).toHaveLength(1);
  return found[0]!;
};

const liftOf = (screen: ReturnType<typeof render>) =>
  (riserOf(screen).props.style as { transform: { translateY: number }[] }).transform[0]!
    .translateY + 0;

describe("a single KeyboardProvider, and RivoProvider is what puts it there", () => {
  test("with nothing outside, RivoProvider mounts exactly one", () => {
    const before = board.providers;
    const screen = render(<Text>tela</Text>);
    expect(board.providers - before).toBe(1);
    act(() => screen.unmount());
    expect(board.providers).toBe(before);
  });

  test("an app that already had its own keeps one, not two", () => {
    const before = board.providers;
    let screen!: ReturnType<typeof create>;
    act(() => {
      screen = create(
        <KeyboardProvider>
          <RivoProvider>
            <Text>tela</Text>
          </RivoProvider>
        </KeyboardProvider>,
      );
    });
    expect(board.providers - before).toBe(1);
    act(() => screen.unmount());
  });
});

describe("the sheet rises with the keyboard", () => {
  test("the sheet bottom follows every keyboard frame, and comes back on close", () => {
    const screen = render(
      <Sheet open onOpenChange={() => {}} title="Buscar cliente">
        <Input value="" onChangeText={() => {}} />
      </Sheet>,
    );
    expect(board.listening).toBeGreaterThan(0);
    expect(paddingOf(screen)).toBe(0);

    start(320);
    expect(paddingOf(screen)).toBe(0);
    frame(120, 320);
    expect(paddingOf(screen)).toBe(120);
    frame(260, 320);
    expect(paddingOf(screen)).toBe(260);
    end(320);
    expect(paddingOf(screen)).toBe(320);

    start(0);
    frame(100, 0);
    expect(paddingOf(screen)).toBe(100);
    end(0);
    expect(paddingOf(screen)).toBe(0);
  });

  test("with reduce motion, it jumps to the final place at the start and ignores the frames", () => {
    reduceMotion(true);
    const screen = render(
      <Sheet open onOpenChange={() => {}} title="Buscar cliente">
        <Input value="" onChangeText={() => {}} />
      </Sheet>,
    );

    start(320);
    expect(paddingOf(screen)).toBe(320);
    frame(120, 320);
    expect(paddingOf(screen)).toBe(320);
    end(320);
    expect(paddingOf(screen)).toBe(320);

    start(0);
    expect(paddingOf(screen)).toBe(0);
    frame(200, 0);
    expect(paddingOf(screen)).toBe(0);
  });

  test("the panel shrinks into the remaining space, instead of going past the top of the screen", () => {
    const screen = render(
      <Sheet open onOpenChange={() => {}} title="Buscar cliente">
        <Text>lista</Text>
      </Sheet>,
    );
    const modal = modalOf(screen);
    expect(String(modal.props.className).split(" ")).toContain("justify-end");
    expect(String(modal.props.className).split(" ")).toContain("pt-16");

    const panel = byType(screen, "View").filter((node) =>
      String(node.props.className ?? "")
        .split(" ")
        .includes("rounded-t-xl"),
    );
    expect(panel).toHaveLength(1);
    expect(String(panel[0]!.props.className).split(" ")).toContain("shrink");
  });

  test("Combobox opens the search in the sheet, and the sheet and the list yield to the keyboard", () => {
    const screen = render(
      <Combobox
        items={[
          { label: "Clínica São Lucas", value: "1" },
          { label: "Transportes Cabo Branco", value: "2" },
        ]}
        value={null}
        onValueChange={() => {}}
        label="Cliente"
      />,
    );
    act(() => byLabel(screen, "Cliente")[0]!.props.onPress());

    const search = byType(screen, "TextInput");
    expect(search).toHaveLength(1);
    expect(search[0]!.props.autoFocus).toBe(true);
    expect(modalOf(screen).findAll((node) => node === search[0]).length).toBe(1);

    const [list] = byType(screen, "ScrollView");
    expect(String(list!.props.className).split(" ")).toContain("shrink");
    expect(list!.props.keyboardShouldPersistTaps).toBe("handled");

    start(336);
    frame(336, 336);
    expect(paddingOf(screen)).toBe(336);
  });
});

describe("Dialog also avoids it", () => {
  test("the centered card rises into the space above the keyboard", () => {
    const screen = render(
      <Dialog open onOpenChange={() => {}} title="Renomear">
        <Input value="" onChangeText={() => {}} />
      </Dialog>,
    );
    expect(paddingOf(screen)).toBe(0);
    frame(200, 300);
    expect(paddingOf(screen)).toBe(200);
    end(300);
    expect(paddingOf(screen)).toBe(300);

    const [card] = byType(screen, "View").filter((node) =>
      String(node.props.className ?? "")
        .split(" ")
        .includes("items-center"),
    );
    expect(String(card!.props.className).split(" ")).toContain("p-6");
    expect(card!.props.style).toEqual({ pointerEvents: "box-none" });
  });
});

describe("ScrollArea: the form screen", () => {
  const form = (footer?: boolean) => (
    <ScrollArea
      contentContainerClassName="gap-4 p-5"
      footer={footer ? <Button onPress={() => {}}>Emitir nota</Button> : undefined}
    >
      <Field label="Descrição">
        <Input value="" onChangeText={() => {}} />
      </Field>
    </ScrollArea>
  );

  const scrollOf = (screen: ReturnType<typeof render>) => {
    const found = byType(screen, "KeyboardAwareScrollView");
    expect(found).toHaveLength(1);
    return found[0]!;
  };

  test("scrolls to the focused field, with slack, and a tap on the list does not close the keyboard", () => {
    const screen = render(form());
    const scroll = scrollOf(screen);
    expect(scroll.props.bottomOffset).toBe(16);
    expect(scroll.props.keyboardShouldPersistTaps).toBe("handled");
    expect(scroll.props.className).toBeUndefined();
    expect(scroll.props.contentContainerClassName).toBeUndefined();
    expect(scroll.props.style).toEqual({ flex: 1 });
    const content = scroll.props.children.props.className.split(" ");
    expect(content).toContain("gap-4");
    expect(content).toContain("p-5");
  });

  test("the footer height enters the math, so the field stops above the button", () => {
    const screen = render(form(true));
    expect(scrollOf(screen).props.bottomOffset).toBe(16);

    act(() => riserOf(screen).props.onLayout({ nativeEvent: { layout: { height: 72 } } }));
    expect(scrollOf(screen).props.bottomOffset).toBe(88);
  });

  test("the footer rises frame by frame with the keyboard, and drops on close", () => {
    const screen = render(form(true));
    expect(liftOf(screen)).toBe(0);
    frame(90, 300);
    expect(liftOf(screen)).toBe(-90);
    end(300);
    expect(liftOf(screen)).toBe(-300);
    end(0);
    expect(liftOf(screen)).toBe(0);
  });

  test("with reduce motion, the footer jumps straight above the keyboard", () => {
    reduceMotion(true);
    const screen = render(form(true));
    start(300);
    expect(liftOf(screen)).toBe(-300);
    frame(90, 300);
    expect(liftOf(screen)).toBe(-300);
    start(0);
    expect(liftOf(screen)).toBe(0);
  });

  test("without a footer, nothing gets stuck under the scroll", () => {
    const screen = render(form());
    const risers = byType(screen, "View").filter(
      (node) => (node.props.style as { transform?: unknown } | undefined)?.transform !== undefined,
    );
    expect(risers).toHaveLength(0);
  });
});
