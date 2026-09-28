import { afterEach, expect, mock, spyOn, test } from "bun:test";
import { AccessibilityInfo } from "react-native";
import type { View } from "react-native";
import { useState, type RefObject } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";

import { RivoProvider, Tour, type TourProps, type TourStep } from "../src";
import { act, byRole, byType, render, textOf } from "./helpers";

type Measured = { x: number; y: number; width: number; height: number };

function target(box: Measured | null): RefObject<View | null> {
  if (!box) return { current: null };
  return {
    current: {
      measureInWindow: (done: (...values: number[]) => void) =>
        done(box.x, box.y, box.width, box.height),
    } as unknown as View,
  };
}

const NEW = { x: 20, y: 100, width: 120, height: 44 };
const SEARCH = { x: 20, y: 200, width: 300, height: 44 };
const EXPORT = { x: 200, y: 400, width: 100, height: 40 };

function steps(missing: number[] = []): TourStep[] {
  return [
    { target: target(missing.includes(0) ? null : NEW), title: "Crie um cliente", description: "Comece pelo cadastro." },
    { target: target(missing.includes(1) ? null : SEARCH), title: "Ache pelo CNPJ" },
    { target: target(missing.includes(2) ? null : EXPORT), title: "Exporte a lista" },
  ];
}

function Harness(props: Partial<TourProps> & { initialStep?: number; list?: TourStep[] }) {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(props.initialStep ?? 0);
  return (
    <Tour
      steps={props.list ?? steps()}
      {...props}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        props.onOpenChange?.(next);
      }}
      step={step}
      onStepChange={(next) => {
        setStep(next);
        props.onStepChange?.(next);
      }}
    />
  );
}

function press(screen: ReactTestRenderer, label: string) {
  const button = byRole(screen, "button").find(
    (node) => node.findAll((child) => child.props?.children === label).length > 0,
  );
  if (!button) throw new Error(`sem botão "${label}"`);
  act(() => button.props.onPress());
}

function hasButton(screen: ReactTestRenderer, label: string) {
  return byRole(screen, "button").some(
    (node) => node.findAll((child) => child.props?.children === label).length > 0,
  );
}

afterEach(() => {
  AccessibilityInfo.clearAnnouncements();
});

test("fechado nao monta nada", () => {
  const screen = render(
    <Tour steps={steps()} open={false} onOpenChange={() => {}} step={0} onStepChange={() => {}} />,
  );
  expect(textOf(screen)).not.toContain("Crie um cliente");
});

test("aberto, a folha mostra o contador, o titulo como cabecalho e o texto", () => {
  const screen = render(<Harness />);
  expect(textOf(screen)).toContain("Passo 1 de 3");
  expect(textOf(screen)).toContain("Comece pelo cadastro.");
  const [heading] = byRole(screen, "header");
  expect(heading!.props.children).toBe("Crie um cliente");
  expect(hasButton(screen, "Voltar")).toBe(false);
});

test("o leitor de tela nao vaza para a tela de tras", () => {
  const screen = render(<Harness />);
  const modal = byType(screen, "View").filter((node) => node.props.accessibilityViewIsModal);
  expect(modal).toHaveLength(1);
});

test("a mascara cerca o alvo medido, com folga, e deixa o recorte vazio", () => {
  const screen = render(<Harness />);
  const bands = byType(screen, "View").filter((node) =>
    String(node.props.className ?? "").split(" ").includes("bg-overlay"),
  );
  expect(bands).toHaveLength(4);
  const [top, bottom, left, right] = bands.map((node) => node.props.style);
  expect(top).toEqual({ height: 94 });
  expect(bottom).toEqual({ top: 150 });
  expect(left).toEqual({ top: 94, height: 56, width: 14 });
  expect(right).toEqual({ top: 94, height: 56, left: 146 });
});

test("Proximo e Voltar andam e avisam o pai, e a troca e anunciada", () => {
  const onStepChange = mock((_: number) => {});
  const screen = render(<Harness onStepChange={onStepChange} />);

  press(screen, "Próximo");
  expect(textOf(screen)).toContain("Passo 2 de 3");
  expect(AccessibilityInfo.announced).toContain("Passo 2 de 3. Ache pelo CNPJ");

  press(screen, "Voltar");
  expect(onStepChange.mock.calls.map(([step]) => step)).toEqual([1, 0]);
  expect(textOf(screen)).toContain("Passo 1 de 3");
});

test("a abertura nao anuncia: o cabecalho ja diz", () => {
  render(<Harness />);
  expect(AccessibilityInfo.announced).toHaveLength(0);
});

test("no ultimo passo Concluir fecha e chama onFinish, e nao onSkip", () => {
  const onFinish = mock(() => {});
  const onSkip = mock((_: number) => {});
  const screen = render(<Harness initialStep={2} onFinish={onFinish} onSkip={onSkip} />);

  expect(hasButton(screen, "Próximo")).toBe(false);
  press(screen, "Concluir");

  expect(onFinish).toHaveBeenCalledTimes(1);
  expect(onSkip).not.toHaveBeenCalled();
  expect(textOf(screen)).not.toContain("Exporte a lista");
});

test("Pular tour fecha com o passo da desistencia", () => {
  const onSkip = mock((_: number) => {});
  const onOpenChange = mock((_: boolean) => {});
  const screen = render(<Harness initialStep={1} onSkip={onSkip} onOpenChange={onOpenChange} />);

  press(screen, "Pular tour");

  expect(onSkip).toHaveBeenCalledWith(1);
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test("o voltar do Android pula o tour", () => {
  const onSkip = mock((_: number) => {});
  const screen = render(<Harness onSkip={onSkip} />);
  const [modal] = byType(screen, "Modal");

  act(() => modal!.props.onRequestClose());

  expect(onSkip).toHaveBeenCalledWith(0);
});

test("ref vazio pula o passo, com aviso em desenvolvimento", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  const screen = render(<Harness list={steps([1])} />);

  press(screen, "Próximo");

  expect(textOf(screen)).toContain("Passo 3 de 3");
  expect(warn).toHaveBeenCalledTimes(1);
  expect(String(warn.mock.calls[0]?.[0])).toContain("passo 2");
  warn.mockRestore();
});

test("sem alvo nenhum o tour fecha sem chamar onFinish nem onSkip", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  const onFinish = mock(() => {});
  const onSkip = mock((_: number) => {});
  const onOpenChange = mock((_: boolean) => {});
  const screen = render(
    <Harness
      list={steps([0, 1, 2])}
      onFinish={onFinish}
      onSkip={onSkip}
      onOpenChange={onOpenChange}
    />,
  );

  expect(textOf(screen)).not.toContain("Passo");
  expect(onOpenChange).toHaveBeenCalledWith(false);
  expect(onFinish).not.toHaveBeenCalled();
  expect(onSkip).not.toHaveBeenCalled();
  warn.mockRestore();
});

test("labels troca os textos", () => {
  const screen = render(
    <Harness labels={{ next: "Next", counter: (position, total) => `${position}/${total}` }} />,
  );
  expect(hasButton(screen, "Next")).toBe(true);
  expect(textOf(screen)).toContain("1/3");
});

function bands(screen: ReactTestRenderer) {
  return byType(screen, "View")
    .filter((node) => String(node.props.className ?? "").split(" ").includes("bg-overlay"))
    .map((node) => node.props.style);
}

test("o recorte desconta onde a raiz do Modal comeca na janela, e nao cai pela barra de status", () => {
  let screen!: ReactTestRenderer;
  act(() => {
    screen = create(
      <RivoProvider>
        <Harness />
      </RivoProvider>,
      {
        createNodeMock: (element) =>
          element.props?.accessibilityViewIsModal
            ? {
                measureInWindow: (done: (...values: number[]) => void) => done(0, -24, 400, 844),
              }
            : null,
      },
    );
  });
  const root = byType(screen, "View").find((node) => node.props.accessibilityViewIsModal)!;
  act(() => root.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 844 } } }));
  const [top] = bands(screen);
  expect(top).toEqual({ height: 118 });
  act(() => screen.unmount());
});

test("ref sem measureInWindow pula o passo com aviso, e nao deixa o tour mudo e invisivel", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  const onOpenChange = mock((_: boolean) => {});
  const list = steps();
  list[0] = { ...list[0]!, target: { current: {} as unknown as View } };
  const screen = render(<Harness list={list} onOpenChange={onOpenChange} />);

  expect(textOf(screen)).toContain("Passo 2 de 3");
  expect(warn).toHaveBeenCalledTimes(1);
  expect(String(warn.mock.calls[0]?.[0])).toContain("passo 1");
  warn.mockRestore();
});

function sheet(screen: ReactTestRenderer) {
  return byType(screen, "View").find((node) =>
    String(node.props.className ?? "").split(" ").includes("bg-surface"),
  )!;
}

test("com o alvo na metade de baixo, a folha sobe para cima e nao cobre a barra de abas", () => {
  const TAB = { x: 0, y: 780, width: 390, height: 56 };
  const list: TourStep[] = [{ target: target(TAB), title: "As abas" }];
  const screen = render(<Harness list={list} />);
  const root = byType(screen, "View").find((node) => node.props.accessibilityViewIsModal)!;
  act(() => root.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 844 } } }));

  const classes = String(sheet(screen).props.className).split(" ");
  expect(classes).toContain("top-0");
  expect(classes).not.toContain("bottom-0");
});

test("com o alvo na metade de cima, a folha continua embaixo", () => {
  const screen = render(<Harness />);
  const root = byType(screen, "View").find((node) => node.props.accessibilityViewIsModal)!;
  act(() => root.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 844 } } }));

  const classes = String(sheet(screen).props.className).split(" ");
  expect(classes).toContain("bottom-0");
  expect(classes).not.toContain("top-0");
});
