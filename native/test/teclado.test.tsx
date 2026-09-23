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

describe("um KeyboardProvider so, e o RivoProvider e quem o poe", () => {
  test("sem nada por fora, o RivoProvider monta exatamente um", () => {
    const before = board.providers;
    const screen = render(<Text>tela</Text>);
    expect(board.providers - before).toBe(1);
    act(() => screen.unmount());
    expect(board.providers).toBe(before);
  });

  test("o app que ja tinha o seu continua com um, e nao com dois", () => {
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

describe("a folha sobe com o teclado", () => {
  test("o fundo da folha acompanha cada quadro do teclado, e volta ao fechar", () => {
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

  test("com reduzir movimento, pula para o lugar final no inicio e ignora os quadros", () => {
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

  test("o painel encolhe no espaco que sobra, em vez de passar do topo da tela", () => {
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

  test("o Combobox abre a busca na folha, e a folha e a lista cedem ao teclado", () => {
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

describe("o Dialog tambem desvia", () => {
  test("o cartao central sobe no espaco acima do teclado", () => {
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

describe("ScrollArea: a tela de formulario", () => {
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

  test("rola ate o campo em foco, com folga, e o toque na lista nao fecha o teclado", () => {
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

  test("a altura do rodape entra na conta, para o campo parar acima do botao", () => {
    const screen = render(form(true));
    expect(scrollOf(screen).props.bottomOffset).toBe(16);

    act(() => riserOf(screen).props.onLayout({ nativeEvent: { layout: { height: 72 } } }));
    expect(scrollOf(screen).props.bottomOffset).toBe(88);
  });

  test("o rodape sobe quadro a quadro com o teclado, e desce ao fechar", () => {
    const screen = render(form(true));
    expect(liftOf(screen)).toBe(0);
    frame(90, 300);
    expect(liftOf(screen)).toBe(-90);
    end(300);
    expect(liftOf(screen)).toBe(-300);
    end(0);
    expect(liftOf(screen)).toBe(0);
  });

  test("com reduzir movimento, o rodape pula direto para cima do teclado", () => {
    reduceMotion(true);
    const screen = render(form(true));
    start(300);
    expect(liftOf(screen)).toBe(-300);
    frame(90, 300);
    expect(liftOf(screen)).toBe(-300);
    start(0);
    expect(liftOf(screen)).toBe(0);
  });

  test("sem rodape, nada fica preso embaixo da rolagem", () => {
    const screen = render(form());
    const risers = byType(screen, "View").filter(
      (node) => (node.props.style as { transform?: unknown } | undefined)?.transform !== undefined,
    );
    expect(risers).toHaveLength(0);
  });
});
