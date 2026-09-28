import { beforeEach, describe, expect, mock, test } from "bun:test";
import { useState } from "react";
import { AccessibilityInfo } from "react-native";

import {
  Questionnaire,
  type QuestionnaireAnswers,
  type QuestionnaireProps,
  type QuestionnaireQuestion,
} from "../src";
import { act, byLabel, byRole, byType, render, textOf } from "./helpers";

const spoken = AccessibilityInfo as unknown as {
  announced: readonly string[];
  clearAnnouncements: () => void;
};

beforeEach(() => spoken.clearAnnouncements());

const ITEMS: QuestionnaireQuestion[] = [
  {
    name: "regime",
    title: "Qual é o regime da empresa?",
    description: "Está no cartão do CNPJ.",
    type: "single",
    required: true,
    choices: [
      { label: "Simples Nacional", value: "simples" },
      { label: "Lucro Presumido", value: "presumido" },
    ],
  },
  {
    name: "canais",
    title: "Por onde a nota chega?",
    type: "multiple",
    other: true,
    choices: [
      { label: "E-mail", value: "email" },
      { label: "WhatsApp", value: "whatsapp" },
    ],
  },
  { name: "obs", title: "Algo mais?", type: "text" },
];

type Spies = Partial<Pick<QuestionnaireProps, "onSubmit" | "onStatusChange" | "labels">> & {
  items?: QuestionnaireQuestion[];
  start?: string;
};

function Survey({ items = ITEMS, start, ...props }: Spies) {
  const [item, setItem] = useState(start ?? items[0]!.name);
  const [value, setValue] = useState<QuestionnaireAnswers>({});
  return (
    <Questionnaire
      items={items}
      item={item}
      onItemChange={setItem}
      value={value}
      onValueChange={setValue}
      onSubmit={props.onSubmit ?? (() => {})}
      onStatusChange={props.onStatusChange}
      labels={props.labels}
    />
  );
}

type Screen = ReturnType<typeof render>;
type Node = ReturnType<typeof byRole>[number];

const textIn = (node: Node | string): string =>
  typeof node === "string" ? node : node.children.map(textIn).join("");

const named = (screen: Screen, role: string, text: string) =>
  byRole(screen, role).find(
    (node) => node.props.accessibilityLabel === text || textIn(node).trim() === text,
  );

const buttonNamed = (screen: Screen, text: string) => named(screen, "button", text);

const press = (screen: Screen, label: string) => {
  const target = named(screen, "radio", label) ?? named(screen, "checkbox", label);
  if (!target) throw new Error(`nao achei ${label}`);
  act(() => target.props.onPress());
};

const tap = (screen: Screen, text: string) => {
  const button = buttonNamed(screen, text);
  if (!button) throw new Error(`sem botao ${text}`);
  act(() => button.props.onPress());
};

describe("Questionnaire", () => {
  test("mostra uma pergunta por vez, com o progresso em texto e em barra", () => {
    const screen = render(<Survey />);
    const text = textOf(screen);
    expect(text).toContain("Pergunta 1 de 3");
    expect(text).toContain("Qual é o regime da empresa?");
    expect(text).not.toContain("Por onde a nota chega?");
    const bar = byRole(screen, "progressbar")[0]!;
    expect(bar.props.accessibilityValue.now).toBe(33);
    expect(byRole(screen, "radio")).toHaveLength(2);
    expect(byRole(screen, "radiogroup")[0]!.props.accessibilityLabel).toBe(
      "Qual é o regime da empresa?",
    );
  });

  test("obrigatoria sem resposta nao avanca, mostra e anuncia o erro, e nao oferece pular", () => {
    const screen = render(<Survey />);
    expect(buttonNamed(screen, "Pular")).toBeUndefined();
    tap(screen, "Próxima");
    expect(textOf(screen)).toContain("Responda esta pergunta para continuar.");
    expect(textOf(screen)).toContain("Pergunta 1 de 3");
    expect(spoken.announced).toContain("Responda esta pergunta para continuar.");
  });

  test("responder marca a opcao, limpa o erro, e avancar anuncia a proxima", () => {
    const screen = render(<Survey />);
    tap(screen, "Próxima");
    press(screen, "Lucro Presumido");
    expect(byLabel(screen, "Lucro Presumido")[0]!.props.accessibilityState.checked).toBe(true);
    expect(textOf(screen)).not.toContain("Responda esta pergunta");

    tap(screen, "Próxima");
    expect(textOf(screen)).toContain("Pergunta 2 de 3");
    expect(spoken.announced).toContain("Pergunta 2 de 3. Por onde a nota chega?");
    expect(byRole(screen, "checkbox")).toHaveLength(2);
  });

  test("opcional vale por resposta ou por pular; sem nenhum, o erro pede um dos dois", () => {
    const onStatusChange = mock((_name: string, _status: string) => {});
    const screen = render(<Survey start="canais" onStatusChange={onStatusChange} />);
    tap(screen, "Próxima");
    expect(textOf(screen)).toContain("Responda ou pule esta pergunta.");

    press(screen, "E-mail");
    expect(onStatusChange).toHaveBeenLastCalledWith("canais", "answered");
    tap(screen, "Pular");
    expect(onStatusChange).toHaveBeenLastCalledWith("canais", "skipped");
    expect(textOf(screen)).toContain("Pergunta 3 de 3");
  });

  test("o campo outra resposta entra na lista do multiple, e o envio limpa pulada e vazia", () => {
    const onSubmit = mock((_answers: QuestionnaireAnswers) => {});
    const screen = render(<Survey onSubmit={onSubmit} />);
    press(screen, "Simples Nacional");
    tap(screen, "Próxima");
    press(screen, "WhatsApp");
    const other = byLabel(screen, "Outra resposta").find((node) => node.props.onChangeText)!;
    act(() => other.props.onChangeText("Correio"));
    tap(screen, "Próxima");
    expect(buttonNamed(screen, "Enviar")).toBeDefined();
    tap(screen, "Pular");

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]![0]).toEqual({
      regime: "simples",
      canais: ["whatsapp", "Correio"],
    });
  });

  test("o envio valida tudo e leva a primeira pergunta invalida", () => {
    const onSubmit = mock(() => {});
    const screen = render(<Survey start="obs" onSubmit={onSubmit} />);
    const input = byType(screen, "TextInput")[0]!;
    act(() => input.props.onChangeText("Nada"));
    tap(screen, "Enviar");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(textOf(screen)).toContain("Pergunta 1 de 3");
    expect(textOf(screen)).toContain("Responda esta pergunta para continuar.");
  });

  test("pergunta desabilitada aparece, nao responde, e nao trava o caminho", () => {
    const onSubmit = mock((_answers: QuestionnaireAnswers) => {});
    const items: QuestionnaireQuestion[] = [
      { ...ITEMS[0]!, required: true, disabled: true },
      { name: "obs", title: "Algo mais?", type: "text", required: true },
    ];
    const screen = render(<Survey items={items} onSubmit={onSubmit} />);
    const radio = byRole(screen, "radio")[0]!;
    expect(radio.props.accessibilityState.disabled).toBe(true);
    tap(screen, "Próxima");
    expect(textOf(screen)).toContain("Pergunta 2 de 2");
    act(() => byType(screen, "TextInput")[0]!.props.onChangeText("Ok"));
    tap(screen, "Enviar");
    expect(onSubmit.mock.calls[0]![0]).toEqual({ obs: "Ok" });
  });

  test("labels troca os textos, com os mesmos nomes do web", () => {
    const screen = render(
      <Survey labels={{ progress: (current, total) => `${current}/${total}`, next: "Seguir" }} />,
    );
    expect(textOf(screen)).toContain("1/3");
    expect(buttonNamed(screen, "Seguir")).toBeDefined();
  });

  test("voltar fica desabilitado na primeira e volta depois", () => {
    const screen = render(<Survey start="canais" />);
    tap(screen, "Voltar");
    expect(textOf(screen)).toContain("Pergunta 1 de 3");
    expect(buttonNamed(screen, "Voltar")!.props.accessibilityState?.disabled).toBe(true);
  });
});
