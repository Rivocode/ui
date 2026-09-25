import { beforeEach, expect, mock, test } from "bun:test";
import { createElement, useState } from "react";
import { AccessibilityInfo } from "react-native";
import type { ReactTestRenderer } from "react-test-renderer";

import { tokens } from "../tokens";
import { act, byLabel, byRole, byType, render } from "./helpers";

mock.module("react-native-svg", () => {
  const host = (name: string) => (props: Record<string, unknown>) => createElement(name, props);

  return {
    default: host("Svg"),
    Svg: host("Svg"),
    Circle: host("Circle"),
    Line: host("Line"),
    Path: host("Path"),
    Rect: host("Rect"),
    G: host("G"),
    Text: host("SvgText"),
  };
});

const { SignaturePad, signatureToSvg } = await import("../src/chart/signature-pad");
const { isSignatureEmpty } = await import("../src/chart");
type SignatureValue = import("../src/chart/signature-pad").SignatureValue;

type Responder = {
  onStartShouldSetPanResponder: () => boolean;
  onPanResponderTerminationRequest: () => boolean;
  onPanResponderGrant: (event: unknown) => void;
  onPanResponderMove: (event: unknown) => void;
  onPanResponderRelease: () => void;
  onPanResponderTerminate: () => void;
};

const { panResponders } = (await import("react-native")) as unknown as {
  panResponders: Responder[];
};

const spoken = AccessibilityInfo as unknown as {
  announced: readonly string[];
  clearAnnouncements: () => void;
};

beforeEach(() => {
  panResponders.length = 0;
  spoken.clearAnnouncements();
});

const touch = (x: number, y: number, timestamp: number, force?: number) => ({
  nativeEvent: { locationX: x, locationY: y, timestamp, force },
});

function pad(screen: ReactTestRenderer) {
  return byRole(screen, "image")[0]!;
}

function lay(screen: ReactTestRenderer, width = 300) {
  act(() => pad(screen).props.onLayout({ nativeEvent: { layout: { width, height: width / 3 } } }));
}

function stroke(points: Array<[number, number]>, force?: number) {
  const responder = panResponders.at(-1)!;
  const [first, ...rest] = points;
  let time = 0;
  act(() => responder.onPanResponderGrant(touch(first![0], first![1], (time += 16), force)));
  for (const [x, y] of rest) act(() => responder.onPanResponderMove(touch(x, y, (time += 16), force)));
  act(() => responder.onPanResponderRelease());
}

function Controlled({
  initial = null,
  onChange,
  ...props
}: {
  initial?: SignatureValue | null;
  onChange?: (value: SignatureValue | null) => void;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  defaultMode?: "draw" | "type";
}) {
  const [value, setValue] = useState<SignatureValue | null>(initial);
  return (
    <SignaturePad
      {...props}
      accessibilityLabel="Assinatura do locatário"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

function button(screen: ReactTestRenderer, name: string) {
  return byRole(screen, "button").find(
    (node) =>
      node.props.accessibilityLabel === name ||
      node.findAll((inner) => inner.type === "Text" && inner.props.children === name).length > 0,
  )!;
}

const press = (screen: ReactTestRenderer, name: string) =>
  act(() => button(screen, name).props.onPress());

test("o dedo desenha em unidades do desenho, e o traco so vira valor ao soltar", () => {
  const onChange = mock((_value: SignatureValue | null) => {});
  const screen = render(<Controlled onChange={onChange} />);
  lay(screen);

  expect(panResponders.at(-1)!.onStartShouldSetPanResponder()).toBe(true);
  expect(panResponders.at(-1)!.onPanResponderTerminationRequest()).toBe(false);

  stroke([
    [30, 50],
    [90, 60],
    [150, 40],
  ]);
  expect(onChange).toHaveBeenCalledTimes(1);
  const value = onChange.mock.calls[0]![0]!;
  expect(value.kind === "drawn" && value.strokes[0]!.map(({ x, y }) => [x, y])).toEqual([
    [60, 100],
    [180, 120],
    [300, 80],
  ]);
  expect(pad(screen).props.accessibilityLabel).toBe(
    "Assinatura do locatário: Assinatura desenhada, 1 traço",
  );
  expect(byType(screen, "Path").filter((node) => node.props.fill === tokens.signature["signature-ink"])).toHaveLength(1);
});

test("a forca do toque vira pressao, e sem forca nao se inventa uma", () => {
  const onChange = mock((_value: SignatureValue | null) => {});
  const screen = render(<Controlled onChange={onChange} />);
  lay(screen);

  stroke([[10, 10]], 0.7);
  stroke([[40, 10]]);
  const value = onChange.mock.lastCall![0]!;
  if (value.kind !== "drawn") throw new Error("esperava tracos");
  expect(value.strokes[0]![0]!.pressure).toBe(0.7);
  expect("pressure" in value.strokes[1]![0]!).toBe(false);
});

test("o papel, a tinta e a guia saem do token fixo, e nao do tema, nos dois esquemas", () => {
  for (const theme of ["rivocode-light", "rivocode-dark"] as const) {
    const screen = render(<Controlled />, { theme });
    expect(pad(screen).props.style.backgroundColor).toBe(tokens.signature["signature-paper"]);
    expect(byType(screen, "Line")[0]!.props.stroke).toBe(tokens.signature["signature-guide"]);
    const hint = byType(screen, "Text").find((node) => node.props.children === "Assine aqui")!;
    expect(hint.props.style.color).toBe(tokens.signature["signature-guide"]);
  }
});

test("desfazer e limpar devolvem null quando a area esvazia, e o leitor de tela ouve", () => {
  const onChange = mock((_value: SignatureValue | null) => {});
  const screen = render(<Controlled onChange={onChange} />);
  lay(screen);

  expect(button(screen, "Limpar assinatura").props.accessibilityState.disabled).toBe(true);
  stroke([[10, 50], [60, 50]]);
  stroke([[10, 80], [60, 20]]);

  press(screen, "Desfazer o último traço");
  const after = onChange.mock.lastCall![0]!;
  expect(after.kind === "drawn" && after.strokes.length).toBe(1);
  expect(spoken.announced).toContain("Último traço desfeito");

  press(screen, "Limpar assinatura");
  expect(onChange.mock.lastCall![0]).toBeNull();
  expect(spoken.announced).toContain("Assinatura limpa");
});

test("digitar assinatura troca o traco pelo nome, e voltar devolve os tracos", () => {
  const onChange = mock((_value: SignatureValue | null) => {});
  const screen = render(<Controlled onChange={onChange} />);
  lay(screen);
  stroke([[10, 50], [60, 50]]);

  press(screen, "Digitar assinatura");
  expect(onChange.mock.lastCall![0]).toBeNull();
  const input = byLabel(screen, "Nome para a assinatura").find((node) => node.type === "TextInput")!;
  act(() => input.props.onChangeText("Ana Souza"));
  expect(onChange.mock.lastCall![0]).toMatchObject({ kind: "typed", text: "Ana Souza" });
  expect(byType(screen, "SvgText")[0]!.props.children).toBe("Ana Souza");
  expect(byType(screen, "SvgText")[0]!.props.fill).toBe(tokens.signature["signature-ink"]);

  press(screen, "Desenhar assinatura");
  const back = onChange.mock.lastCall![0]!;
  expect(back.kind === "drawn" && back.strokes.length).toBe(1);
});

test("desabilitada e so leitura nao aceitam o dedo", () => {
  const onChange = mock((_value: SignatureValue | null) => {});
  const disabled = render(<Controlled onChange={onChange} disabled />);
  lay(disabled);
  expect(panResponders.at(-1)!.onStartShouldSetPanResponder()).toBe(false);
  expect(button(disabled, "Digitar assinatura").props.accessibilityState.disabled).toBe(true);

  const readOnly = render(
    <Controlled
      onChange={onChange}
      readOnly
      initial={{ kind: "drawn", strokes: [[{ x: 1, y: 1, time: 0 }]], width: 600, height: 200 }}
    />,
  );
  expect(panResponders.at(-1)!.onStartShouldSetPanResponder()).toBe(false);
  expect(byLabel(readOnly, "Limpar assinatura")).toHaveLength(0);
  expect(onChange).not.toHaveBeenCalled();
});

test("invalid pinta a borda de perigo", () => {
  const screen = render(<Controlled invalid />);
  const classes = String(pad(screen).props.className).split(/\s+/);
  expect(classes).toContain("border-danger");
  expect(classes).not.toContain("border-border-strong");
});

test("o SVG exportado no nativo sai com a tinta do token, e vazio e string vazia", () => {
  const value: SignatureValue = {
    kind: "drawn",
    strokes: [[{ x: 10, y: 100, time: 0 }, { x: 80, y: 120, time: 16 }]],
    width: 600,
    height: 200,
  };
  expect(signatureToSvg(value)).toContain(`fill="${tokens.signature["signature-ink"]}"`);
  expect(signatureToSvg(value, { paper: true })).toContain(
    `fill="${tokens.signature["signature-paper"]}"`,
  );
  expect(signatureToSvg(null)).toBe("");
  expect(isSignatureEmpty(null)).toBe(true);
});

const nameInput = (screen: ReactTestRenderer) =>
  byLabel(screen, "Nome para a assinatura").find((node) => node.type === "TextInput");

test("o pai zerar o value apaga o nome do campo, e voltar a desenhar nao ressuscita o traco", () => {
  let reset!: () => void;
  let current: SignatureValue | null = null;
  function Resettable() {
    const [value, setValue] = useState<SignatureValue | null>(null);
    reset = () => setValue(null);
    current = value;
    return <SignaturePad value={value} onValueChange={setValue} />;
  }
  const screen = render(<Resettable />);
  lay(screen);
  stroke([[10, 50], [60, 50]]);
  press(screen, "Digitar assinatura");
  act(() => nameInput(screen)!.props.onChangeText("Ana Souza"));

  act(() => reset());
  expect(nameInput(screen)!.props.value).toBe("");

  act(() => nameInput(screen)!.props.onChangeText("x"));
  expect(current).toMatchObject({ kind: "typed", text: "x" });

  act(() => nameInput(screen)!.props.onChangeText(""));
  press(screen, "Desenhar assinatura");
  expect(current).toBeNull();
  const ink = byType(screen, "Path").filter(
    (node) => node.props.fill === tokens.signature["signature-ink"],
  );
  expect(ink).toHaveLength(0);
});

test("limpar um nome que veio de fora continua no modo de digitar", () => {
  const screen = render(
    <Controlled initial={{ kind: "typed", text: "Ana", font: "cursive", width: 600, height: 200 }} />,
  );
  expect(nameInput(screen)).toBeDefined();

  press(screen, "Limpar assinatura");

  expect(nameInput(screen)?.props.value).toBe("");
  expect(button(screen, "Desenhar assinatura")).toBeDefined();
});
