import { describe, expect, mock, test } from "bun:test";
import { View } from "react-native";

import { AILabel, Conversation, Message, PromptInput, ToolCall } from "../src/ai";
import * as root from "../src";
import { flatListScrolls } from "../../test/react-native-mock";
import { act, byLabel, byRole, byType, render, textOf } from "./helpers";

type Node = { children: unknown[]; props: Record<string, unknown> };

const textIn = (node: unknown): string =>
  typeof node === "string"
    ? node
    : node && typeof node === "object" && "children" in node
      ? (node as Node).children.map(textIn).join("")
      : "";

const buttonWith = (screen: Parameters<typeof byRole>[0], text: string) =>
  byRole(screen, "button").find((node) => textIn(node) === text)!;

const classesOf = (node: { props: { className?: string } }) =>
  (node.props.className ?? "").split(" ");

describe("PromptInput", () => {
  test("o botao envia o texto, e campo vazio nao envia", () => {
    const onSubmit = mock<(value: string) => void>(() => {});
    const full = render(
      <PromptInput value="Quanto faturei?" onValueChange={() => {}} onSubmit={onSubmit} />,
    );
    const [send] = byLabel(full, "Enviar mensagem");
    act(() => send.props.onPress());
    expect(onSubmit).toHaveBeenCalledWith("Quanto faturei?");

    const blank = render(<PromptInput value="   " onValueChange={() => {}} onSubmit={onSubmit} />);
    const [idle] = byLabel(blank, "Enviar mensagem");
    expect(idle.props.disabled).toBe(true);
  });

  test("o campo tem nome e repassa cada tecla", () => {
    const onValueChange = mock<(value: string) => void>(() => {});
    const screen = render(
      <PromptInput value="" onValueChange={onValueChange} onSubmit={() => {}} />,
    );
    const [field] = byLabel(screen, "Mensagem");

    expect(field.type).toBe("TextInput");
    expect(field.props.multiline).toBe(true);
    act(() => field.props.onChangeText("oi"));
    expect(onValueChange).toHaveBeenCalledWith("oi");
  });

  test("em streaming o enviar vira parar", () => {
    const onStop = mock(() => {});
    const screen = render(
      <PromptInput
        value="proxima"
        onValueChange={() => {}}
        onSubmit={() => {}}
        streaming
        onStop={onStop}
      />,
    );

    expect(byLabel(screen, "Enviar mensagem")).toHaveLength(0);
    act(() => byLabel(screen, "Parar resposta")[0]!.props.onPress());
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  test("desabilitado nao edita nem envia", () => {
    const screen = render(
      <PromptInput value="texto" onValueChange={() => {}} onSubmit={() => {}} disabled />,
    );

    expect(byLabel(screen, "Mensagem")[0]!.props.editable).toBe(false);
    expect(byLabel(screen, "Enviar mensagem")[0]!.props.disabled).toBe(true);
  });

  test("o contador bate no teto no tom de perigo", () => {
    const screen = render(
      <PromptInput
        value="12345"
        onValueChange={() => {}}
        onSubmit={() => {}}
        showCount
        maxLength={5}
      />,
    );
    const count = screen.root.findAll(
      (node) => node.type === "Text" && node.props.children === "5/5",
    )[0]!;

    expect(classesOf(count)).toContain("text-danger-text");
  });
});

describe("Message", () => {
  test("o nome de quem fala e o alinhamento saem do papel", () => {
    const screen = render(
      <>
        <Message role="user">Quanto faturei?</Message>
        <Message role="assistant">R$ 48.200,00.</Message>
      </>,
    );

    const [user] = byLabel(screen, "Você");
    const [assistant] = byLabel(screen, "Assistente");
    expect(classesOf(user!)).toContain("flex-row-reverse");
    expect(classesOf(assistant!)).not.toContain("flex-row-reverse");
  });

  test("em streaming anuncia busy e esconde as acoes", () => {
    const screen = render(
      <Message role="assistant" streaming onCopy={() => {}} onRetry={() => {}}>
        Consultando
      </Message>,
    );

    expect(byLabel(screen, "Assistente")[0]!.props.accessibilityState).toEqual({ busy: true });
    expect(textOf(screen)).not.toContain("Tentar de novo");
  });

  test("terminada, copiar e tentar de novo chamam quem pediu", () => {
    const onCopy = mock(() => {});
    const onRetry = mock(() => {});
    const screen = render(
      <Message role="assistant" onCopy={onCopy} onRetry={onRetry}>
        R$ 48.200,00
      </Message>,
    );
    const buttons = byRole(screen, "button");

    expect(buttons).toHaveLength(2);
    act(() => buttons[0]!.props.onPress());
    act(() => buttons[1]!.props.onPress());
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("o erro sai em texto no tom de perigo", () => {
    const screen = render(<Message role="assistant" error="A resposta foi interrompida." />);
    const error = screen.root.findAll(
      (node) => node.type === "Text" && node.props.children === "A resposta foi interrompida.",
    )[0]!;

    expect(classesOf(error)).toContain("text-danger-text");
  });
});

describe("Conversation", () => {
  const ITEMS = [
    { id: "1", role: "user" as const, text: "Oi" },
    { id: "2", role: "assistant" as const, text: "Olá" },
  ];

  test("a lista e invertida, e a mais nova vem primeiro nos dados", () => {
    const screen = render(
      <Conversation
        items={ITEMS}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <Message role={item.role}>{item.text}</Message>}
      />,
    );
    const [list] = byType(screen, "FlatList");

    expect(list!.props.inverted).toBe(true);
    expect(list!.props.accessibilityLabel).toBe("Conversa");
    const text = textOf(screen);
    expect(text.indexOf("Olá")).toBeGreaterThan(-1);
    expect(text.indexOf("Olá")).toBeLessThan(text.indexOf("Oi"));
  });

  test("rolar para cima mostra o botao, e o botao volta ao fim", () => {
    flatListScrolls.length = 0;
    const screen = render(
      <Conversation
        items={ITEMS}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <Message role={item.role}>{item.text}</Message>}
      />,
    );
    const [list] = byType(screen, "FlatList");

    expect(textOf(screen)).not.toContain("Ir para o fim");
    act(() => list!.props.onScroll({ nativeEvent: { contentOffset: { y: 300 } } }));
    expect(textOf(screen)).toContain("Ir para o fim");
    expect(byType(screen, "FlatList")[0]!.props.maintainVisibleContentPosition).toEqual({
      minIndexForVisible: 0,
    });

    const [jump] = byRole(screen, "button");
    act(() => jump!.props.onPress());
    expect(flatListScrolls.at(-1)?.offset).toBe(0);
    expect(textOf(screen)).not.toContain("Ir para o fim");
  });

  test("vazia, as sugestoes entregam o texto", () => {
    const onSuggestion = mock<(value: string) => void>(() => {});
    const screen = render(
      <Conversation
        items={[] as typeof ITEMS}
        keyExtractor={(item) => item.id}
        renderItem={() => <View />}
        empty={{
          title: "Pergunte sobre as suas notas",
          description: "O assistente lê as notas emitidas nesta conta.",
          suggestions: ["Quanto faturei em agosto?"],
        }}
        onSuggestion={onSuggestion}
      />,
    );

    expect(textOf(screen)).toContain("Pergunte sobre as suas notas");
    act(() => byRole(screen, "button")[0]!.props.onPress());
    expect(onSuggestion).toHaveBeenCalledWith("Quanto faturei em agosto?");
  });
});

describe("ToolCall", () => {
  test("todo estado sai com texto, e o gatilho diz o nome e o estado", () => {
    const STATES = [
      ["pending", "Pendente"],
      ["running", "Rodando"],
      ["done", "Concluída"],
      ["error", "Erro"],
      ["approval", "Aguardando aprovação"],
    ] as const;

    for (const [status, text] of STATES) {
      const screen = render(<ToolCall name="buscar_notas" status={status} />);
      expect(textOf(screen)).toContain(text);
      expect(byLabel(screen, `buscar_notas, ${text}`)).toHaveLength(1);
    }
  });

  test("rodando gira e anuncia busy", () => {
    const screen = render(<ToolCall name="buscar_notas" status="running" />);
    expect(byType(screen, "ActivityIndicator").length).toBeGreaterThan(0);
  });

  test("aguardando aprovacao, os dois botoes chamam quem pediu", () => {
    const onApprove = mock(() => {});
    const onReject = mock(() => {});
    const screen = render(
      <ToolCall
        name="emitir_nota"
        status="approval"
        input={{ valor: 1200 }}
        onApprove={onApprove}
        onReject={onReject}
      />,
    );

    expect(textOf(screen)).toContain('"valor": 1200');
    act(() => buttonWith(screen, "Aprovar").props.onPress());
    act(() => buttonWith(screen, "Recusar").props.onPress());
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  test("fechado esconde a entrada, e o toque abre", () => {
    const screen = render(<ToolCall name="buscar_notas" status="done" output="3 notas" />);
    const [trigger] = byLabel(screen, "buscar_notas, Concluída");

    expect(textOf(screen)).not.toContain("3 notas");
    act(() => trigger!.props.onPress());
    expect(textOf(screen)).toContain("3 notas");
  });
});

describe("AILabel", () => {
  test("sem explicacao, o leitor ouve por extenso e nao ha botao", () => {
    const screen = render(<AILabel />);
    expect(byLabel(screen, "Conteúdo gerado por IA")).toHaveLength(1);
    expect(byRole(screen, "button")).toHaveLength(0);
  });

  test("com explicacao, o toque abre a folha", () => {
    const screen = render(<AILabel explanation="Resumo feito a partir das notas de agosto." />);
    expect(textOf(screen)).not.toContain("Resumo feito");

    act(() => byLabel(screen, "Conteúdo gerado por IA")[0]!.props.onPress());
    expect(textOf(screen)).toContain("Resumo feito");
  });
});

test("as cinco saem de @rivocode/ui-native/ai, e nao do indice da raiz", () => {
  for (const name of ["AILabel", "Conversation", "Message", "PromptInput", "ToolCall"]) {
    expect(name in root).toBe(false);
  }
});
