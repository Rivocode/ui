import { describe, expect, mock, test } from "bun:test";
import { AccessibilityInfo, View } from "react-native";

import {
  AILabel,
  Conversation,
  Message,
  PromptInput,
  ToolCall,
  type PromptInputLabels,
} from "../src/ai";
import * as root from "../src";
import { flatListScrolls } from "../../test/react-native-mock";
import { RivoProvider } from "../src";
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
  test("the button sends the text, and an empty field does not send", () => {
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

  test("the field has a name and passes on every keystroke", () => {
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

  test("while streaming, send becomes stop", () => {
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

  test("disabled neither edits nor sends", () => {
    const screen = render(
      <PromptInput value="texto" onValueChange={() => {}} onSubmit={() => {}} disabled />,
    );

    expect(byLabel(screen, "Mensagem")[0]!.props.editable).toBe(false);
    expect(byLabel(screen, "Enviar mensagem")[0]!.props.disabled).toBe(true);
  });

  test("the counter hits the ceiling in the danger tone", () => {
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

  test("the hint and the spelled-out count reach the field through accessibilityHint", () => {
    const screen = render(
      <PromptInput
        value="12"
        onValueChange={() => {}}
        onSubmit={() => {}}
        showCount
        maxLength={5}
      />,
    );
    const [field] = byLabel(screen, "Mensagem");
    const hint = field!.props.accessibilityHint as string;

    expect(hint).toContain("A tecla de retorno quebra a linha");
    expect(hint).toContain("2 de 5 caracteres");

    const count = screen.root.findAll(
      (node) => node.type === "Text" && node.props.children === "2/5",
    )[0]!;
    expect(count.props.importantForAccessibility).toBe("no-hide-descendants");
    expect(count.props.accessibilityElementsHidden).toBe(true);
  });

  test("without showCount, the hint goes alone, with no count", () => {
    const screen = render(
      <PromptInput value="12" onValueChange={() => {}} onSubmit={() => {}} maxLength={5} />,
    );
    const hint = byLabel(screen, "Mensagem")[0]!.props.accessibilityHint as string;
    expect(hint).not.toContain("caracteres");
  });

  test("hitting the ceiling announces the limit once, and going back below re-arms it", () => {
    const spoken = AccessibilityInfo as unknown as {
      announced: readonly string[];
      clearAnnouncements: () => void;
    };
    spoken.clearAnnouncements();
    const field = (value: string) => (
      <PromptInput value={value} onValueChange={() => {}} onSubmit={() => {}} maxLength={5} />
    );
    const screen = render(field("1234"));
    const again = (value: string) => screen.update(<RivoProvider>{field(value)}</RivoProvider>);
    expect(spoken.announced).toHaveLength(0);

    act(() => again("12345"));
    expect(spoken.announced).toEqual(["Limite de 5 caracteres atingido."]);
    act(() => again("12345"));
    expect(spoken.announced).toHaveLength(1);

    act(() => again("1234"));
    act(() => again("12345"));
    expect(spoken.announced).toHaveLength(2);
  });

  test("mounting already at the ceiling does not announce: the notice belongs to the keystroke that hit it", () => {
    const spoken = AccessibilityInfo as unknown as {
      announced: readonly string[];
      clearAnnouncements: () => void;
    };
    spoken.clearAnnouncements();
    render(
      <PromptInput value="12345" onValueChange={() => {}} onSubmit={() => {}} maxLength={5} />,
    );
    expect(spoken.announced).toHaveLength(0);
  });

  test("one character is singular, in the counter without a ceiling and with a ceiling of one", () => {
    const hintOf = (props: { value: string; maxLength?: number }) =>
      byLabel(
        render(<PromptInput onValueChange={() => {}} onSubmit={() => {}} showCount {...props} />),
        "Mensagem",
      )[0]!.props.accessibilityHint as string;
    expect(hintOf({ value: "a" })).toEndWith(" 1 caractere");
    expect(hintOf({ value: "a", maxLength: 1 })).toEndWith(" 1 de 1 caractere");

    const spoken = AccessibilityInfo as unknown as {
      announced: readonly string[];
      clearAnnouncements: () => void;
    };
    spoken.clearAnnouncements();
    const field = (value: string) => (
      <PromptInput value={value} onValueChange={() => {}} onSubmit={() => {}} maxLength={1} />
    );
    const screen = render(field(""));
    act(() => screen.update(<RivoProvider>{field("a")}</RivoProvider>));
    expect(spoken.announced).toEqual(["Limite de 1 caractere atingido."]);
  });

  test("labels changes the language of the hint, the count and the limit", () => {
    const spoken = AccessibilityInfo as unknown as {
      announced: readonly string[];
      clearAnnouncements: () => void;
    };
    spoken.clearAnnouncements();
    const labels: Partial<PromptInputLabels> = {
      hint: "Return adds a line.",
      count: (count, max) => `${count} of ${max} characters`,
      limit: (max) => `Limit of ${max} reached.`,
    };
    const field = (value: string) => (
      <PromptInput
        value={value}
        onValueChange={() => {}}
        onSubmit={() => {}}
        showCount
        maxLength={3}
        labels={labels}
      />
    );
    const screen = render(field("ab"));
    const again = (value: string) => screen.update(<RivoProvider>{field(value)}</RivoProvider>);
    expect(byLabel(screen, "Mensagem")[0]!.props.accessibilityHint).toBe(
      "Return adds a line. 2 of 3 characters",
    );
    act(() => again("abc"));
    expect(spoken.announced).toEqual(["Limit of 3 reached."]);
  });
});

describe("Message", () => {
  test("the speaker's name and the alignment come from the role", () => {
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

  test("while streaming it announces busy and hides the actions", () => {
    const screen = render(
      <Message role="assistant" streaming onCopy={() => {}} onRetry={() => {}}>
        Consultando
      </Message>,
    );

    expect(byLabel(screen, "Assistente")[0]!.props.accessibilityState).toEqual({
      busy: true,
    });
    expect(textOf(screen)).not.toContain("Tentar de novo");
  });

  test("once finished, copy and retry call the requester", () => {
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

  test("the error comes out as text in the danger tone", () => {
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

  test("the list is inverted, and the newest comes first in the data", () => {
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

  test("scrolling up shows the button, and the button goes back to the end", () => {
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

  test("when empty, the suggestions deliver the text", () => {
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
  test("every state comes out with text, and the trigger says the name and the state", () => {
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

  test("running, it spins and announces busy", () => {
    const screen = render(<ToolCall name="buscar_notas" status="running" />);
    expect(byType(screen, "ActivityIndicator").length).toBeGreaterThan(0);
  });

  test("awaiting approval, both buttons call the requester", () => {
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

  test("closed, it hides the input, and a tap opens it", () => {
    const screen = render(<ToolCall name="buscar_notas" status="done" output="3 notas" />);
    const [trigger] = byLabel(screen, "buscar_notas, Concluída");

    expect(textOf(screen)).not.toContain("3 notas");
    act(() => trigger!.props.onPress());
    expect(textOf(screen)).toContain("3 notas");
  });

  test("the panel opens when the state changes to error or approval, if nobody controls it", () => {
    for (const [status, shown] of [
      ["error", "tempo esgotado"],
      ["approval", '"valor": 1200'],
    ] as const) {
      const call = (now: "running" | typeof status) => (
        <ToolCall
          name="emitir_nota"
          status={now}
          input={{ valor: 1200 }}
          error={now === "error" ? "tempo esgotado" : undefined}
        />
      );
      const screen = render(call("running"));
      expect(textOf(screen)).not.toContain(shown);
      act(() => screen.update(<RivoProvider>{call(status)}</RivoProvider>));
      expect(textOf(screen)).toContain(shown);
    }

    const held = (now: "running" | "error") => (
      <ToolCall name="emitir_nota" status={now} error="tempo esgotado" open={false} />
    );
    const controlled = render(held("running"));
    act(() => controlled.update(<RivoProvider>{held("error")}</RivoProvider>));
    expect(textOf(controlled)).not.toContain("tempo esgotado");
  });
});

describe("AILabel", () => {
  test("without an explanation, the screen reader hears it spelled out and there is no button", () => {
    const screen = render(<AILabel />);
    expect(byLabel(screen, "Conteúdo gerado por IA")).toHaveLength(1);
    expect(byRole(screen, "button")).toHaveLength(0);
  });

  test("with an explanation, a tap opens the sheet", () => {
    const screen = render(<AILabel explanation="Resumo feito a partir das notas de agosto." />);
    expect(textOf(screen)).not.toContain("Resumo feito");

    act(() => byLabel(screen, "Conteúdo gerado por IA")[0]!.props.onPress());
    expect(textOf(screen)).toContain("Resumo feito");
  });
});

test("the five come from @rivocode/ui-native/ai, not from the root index", () => {
  for (const name of ["AILabel", "Conversation", "Message", "PromptInput", "ToolCall"]) {
    expect(name in root).toBe(false);
  }
});
