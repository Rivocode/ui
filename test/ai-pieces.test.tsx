import { describe, expect, mock, test } from "bun:test";
import { readdirSync } from "node:fs";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState, type ReactNode } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { AILabel, Conversation, Message, PromptInput, ToolCall } from "../src/ai/index";
import * as ai from "../src/ai/index";
import * as dnd from "../src/dnd/index";
import * as chart from "../src/chart/index";
import * as form from "../src/form/index";
import * as root from "../src/index";
import { importPathOf } from "../apps/docs/src/parts";

function withTheme(node: ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

const tokens = (element: Element) => (element.getAttribute("class") ?? "").split(/\s+/);

describe("PromptInput", () => {
  test("Enter sends, Shift+Enter does not, and the uncontrolled field clears itself", () => {
    const onSubmit = mock<(value: string) => void>(() => {});
    withTheme(<PromptInput onSubmit={onSubmit} />);
    const field = screen.getByRole("textbox", { name: "Mensagem" });

    fireEvent.change(field, { target: { value: "Quanto faturei em agosto?" } });
    fireEvent.keyDown(field, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.keyDown(field, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("Quanto faturei em agosto?");
    expect((field as HTMLTextAreaElement).value).toBe("");
  });

  test("an empty or whitespace-only field does not send, and the button is disabled", () => {
    const onSubmit = mock<(value: string) => void>(() => {});
    withTheme(<PromptInput onSubmit={onSubmit} defaultValue="   " />);
    const send = screen.getByRole("button", { name: "Enviar mensagem" }) as HTMLButtonElement;

    expect(send.disabled).toBe(true);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("while streaming the send button becomes stop, and Enter does not send", () => {
    const onSubmit = mock<(value: string) => void>(() => {});
    const onStop = mock(() => {});
    withTheme(<PromptInput streaming onSubmit={onSubmit} onStop={onStop} defaultValue="proxima" />);

    expect(screen.queryByRole("button", { name: "Enviar mensagem" })).toBeNull();
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Parar resposta" }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  test("Enter in the middle of keyboard composition does not send", () => {
    const onSubmit = mock<(value: string) => void>(() => {});
    withTheme(<PromptInput onSubmit={onSubmit} defaultValue="acentuaç" />);

    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", isComposing: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("controlled, the caller is the one who clears", () => {
    const seen: string[] = [];
    function Controlled() {
      const [text, setText] = useState("rascunho");
      return (
        <PromptInput value={text} onValueChange={setText} onSubmit={(value) => seen.push(value)} />
      );
    }
    withTheme(<Controlled />);
    const field = screen.getByRole("textbox") as HTMLTextAreaElement;

    fireEvent.keyDown(field, { key: "Enter" });
    expect(seen).toEqual(["rascunho"]);
    expect(field.value).toBe("rascunho");
  });

  test("disabled locks the field and the sending", () => {
    withTheme(<PromptInput disabled defaultValue="texto" />);

    expect((screen.getByRole("textbox") as HTMLTextAreaElement).disabled).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Enviar mensagem" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  test("the field focus ring is drawn by the frame, and does not disappear", () => {
    withTheme(<PromptInput />);
    const form = screen.getByRole("textbox").closest("form")!;

    expect(tokens(form)).toContain("has-[textarea:focus-visible]:ring-2");
    expect(tokens(form)).not.toContain("focus-within:ring-2");
  });

  test("the keyboard hint is linked to the field", () => {
    withTheme(<PromptInput />);
    const field = screen.getByRole("textbox");
    const hint = document.getElementById(field.getAttribute("aria-describedby") ?? "");

    expect(hint?.textContent).toContain("Shift+Enter");
  });

  test("the counter shows the cap and turns to the danger tone when it hits it", () => {
    withTheme(<PromptInput showCount maxLength={5} defaultValue="12345" />);
    const count = screen.getByText("5/5");

    expect(tokens(count)).toContain("text-danger-text");
    expect(tokens(count)).not.toContain("text-fg-subtle");
  });

  test("attachments come in through the slot", () => {
    withTheme(<PromptInput attachments={<span>nota-agosto.pdf</span>} />);
    expect(screen.getByText("nota-agosto.pdf")).toBeDefined();
  });

  function Turn({ initial = false }: { initial?: boolean }) {
    const [streaming, setStreaming] = useState(initial);
    return (
      <PromptInput
        streaming={streaming}
        onSubmit={() => setStreaming(true)}
        onStop={() => setStreaming(false)}
      />
    );
  }

  test("Enter on Stop returns focus to the field, and does not drop it on the disabled button", () => {
    withTheme(<Turn initial />);
    const stop = screen.getByRole("button", { name: "Parar resposta" });
    stop.focus();
    act(() => {
      fireEvent.click(stop);
    });

    const send = screen.getByRole("button", { name: "Enviar mensagem" }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole("textbox"));
  });

  test("a response that ends with focus on Stop returns focus to the field", () => {
    const view = withTheme(<PromptInput streaming onStop={() => {}} />);
    screen.getByRole("button", { name: "Parar resposta" }).focus();
    view.rerender(
      <RivoProvider scope="local">
        <PromptInput streaming={false} onStop={() => {}} />
      </RivoProvider>,
    );

    expect(document.activeElement).toBe(screen.getByRole("textbox"));
  });

  test("sending by the button, with no response arriving, returns focus to the cleared field", () => {
    withTheme(<PromptInput defaultValue="Quanto faturei?" />);
    const send = screen.getByRole("button", { name: "Enviar mensagem" });
    send.focus();
    act(() => {
      fireEvent.click(send);
    });

    expect((send as HTMLButtonElement).disabled).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole("textbox"));
  });

  test("the height is recomputed when the width changes and when the font arrives, and not only with the text", async () => {
    const OriginalObserver = globalThis.ResizeObserver;
    const fonts = Object.getOwnPropertyDescriptor(document, "fonts");
    const observed: Array<(entries: Array<{ contentRect: { width: number } }>) => void> = [];
    globalThis.ResizeObserver = class {
      constructor(callback: (entries: Array<{ contentRect: { width: number } }>) => void) {
        observed.push(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    let loaded!: () => void;
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { ready: new Promise<void>((resolve) => (loaded = resolve)) },
    });

    try {
      let scroll = 40;
      withTheme(<PromptInput defaultValue="Quanto faturei em agosto com as notas da filial?" />);
      const field = screen.getByRole("textbox") as HTMLTextAreaElement;
      Object.defineProperty(field, "scrollHeight", { configurable: true, get: () => scroll });
      expect(observed.length).toBeGreaterThan(0);

      scroll = 64;
      await act(async () => {
        loaded();
        await Promise.resolve();
      });
      expect(field.style.height).toBe("64px");

      scroll = 88;
      act(() => {
        for (const callback of observed) callback([{ contentRect: { width: 300 } }]);
      });
      expect(field.style.height).toBe("88px");
    } finally {
      globalThis.ResizeObserver = OriginalObserver;
      if (fonts) Object.defineProperty(document, "fonts", fonts);
      else delete (document as { fonts?: unknown }).fonts;
    }
  });

  const described = (field: HTMLElement) =>
    (field.getAttribute("aria-describedby") ?? "")
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent ?? "");

  test("the keyboard hint comes from labels, to change the language", () => {
    withTheme(<PromptInput labels={{ hint: "Enter sends, Shift+Enter breaks the line." }} />);
    expect(described(screen.getByRole("textbox"))).toContain(
      "Enter sends, Shift+Enter breaks the line.",
    );
  });

  test("the counter is linked to the field, and the cap is announced", () => {
    const view = withTheme(<PromptInput showCount maxLength={5} defaultValue="123" />);
    expect(described(screen.getByRole("textbox"))).toContain("3 de 5 caracteres");
    expect(screen.getByRole("status").textContent).toBe("");
    view.unmount();

    withTheme(<PromptInput showCount maxLength={5} defaultValue="12345" />);
    expect(described(screen.getByRole("textbox"))).toContain("5 de 5 caracteres");
    expect(screen.getByRole("status").textContent).toBe("Limite de 5 caracteres atingido.");
    expect(screen.getByText("5/5").getAttribute("aria-hidden")).toBe("true");
  });

  test("one character is singular, in the counter without a cap and in a cap of one", () => {
    const view = withTheme(<PromptInput showCount defaultValue="a" />);
    expect(described(screen.getByRole("textbox"))).toContain("1 caractere");
    expect(described(screen.getByRole("textbox"))).not.toContain("1 caracteres");
    view.unmount();

    withTheme(<PromptInput showCount maxLength={1} defaultValue="a" />);
    expect(described(screen.getByRole("textbox"))).toContain("1 de 1 caractere");
    expect(screen.getByRole("status").textContent).toBe("Limite de 1 caractere atingido.");
  });
});

describe("Message", () => {
  test("each message is an article named after the speaker", () => {
    withTheme(
      <>
        <Message role="user">Quanto faturei?</Message>
        <Message role="assistant">R$ 48.200,00.</Message>
        <Message role="system">Conversa iniciada.</Message>
      </>,
    );

    expect(screen.getByRole("article", { name: "Você" }).textContent).toContain("Quanto");
    expect(screen.getByRole("article", { name: "Assistente" })).toBeDefined();
    expect(screen.getByRole("article", { name: "Sistema" })).toBeDefined();
  });

  test("the alignment comes from the role", () => {
    withTheme(
      <>
        <Message role="user">a</Message>
        <Message role="assistant">b</Message>
      </>,
    );

    expect(tokens(screen.getByRole("article", { name: "Você" }))).toContain("flex-row-reverse");
    expect(tokens(screen.getByRole("article", { name: "Assistente" }))).not.toContain(
      "flex-row-reverse",
    );
  });

  test("while streaming it announces busy and hides the actions", () => {
    const onRetry = mock(() => {});
    withTheme(
      <Message role="assistant" streaming copyValue="texto" onRetry={onRetry}>
        Consultando
      </Message>,
    );
    const article = screen.getByRole("article");

    expect(article.getAttribute("aria-busy")).toBe("true");
    expect(screen.queryByRole("button", { name: "Tentar de novo" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Copiar" })).toBeNull();
  });

  test("once finished, it shows copy and retry, and retry calls the requester", () => {
    const onRetry = mock(() => {});
    withTheme(
      <Message role="assistant" copyValue="**R$ 48.200,00**" onRetry={onRetry}>
        R$ 48.200,00
      </Message>,
    );

    expect(screen.getByRole("article").getAttribute("aria-busy")).toBeNull();
    expect(screen.getByRole("button", { name: "Copiar" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("the error comes out as text, and not only as color", () => {
    withTheme(<Message role="assistant" error="A resposta foi interrompida." onRetry={() => {}} />);

    const error = screen.getByText("A resposta foi interrompida.");
    expect(tokens(error.parentElement!)).toContain("text-danger-text");
  });

  test("streaming without content still shows the indicator", () => {
    const { container } = withTheme(<Message role="assistant" streaming />);
    expect(container.querySelectorAll(".animate-pulse").length).toBe(3);
  });
});

describe("Conversation", () => {
  test("it is a polite log region, with a name", () => {
    withTheme(
      <Conversation className="h-96">
        <Message role="user">Oi</Message>
      </Conversation>,
    );
    const log = screen.getByRole("log", { name: "Conversa" });

    expect(log.getAttribute("aria-live")).toBe("polite");
    expect(log.getAttribute("tabindex")).toBe("0");
  });

  test("when empty, it shows the empty state and the suggestions hand over the text", () => {
    const onSuggestion = mock<(value: string) => void>(() => {});
    withTheme(
      <Conversation
        empty={{
          title: "Pergunte sobre as suas notas",
          description: "O assistente lê as notas emitidas nesta conta.",
          suggestions: ["Quanto faturei em agosto?", "Quais notas vencem esta semana?"],
        }}
        onSuggestion={onSuggestion}
      />,
    );

    expect(screen.getByText("Pergunte sobre as suas notas")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Quanto faturei em agosto?" }));
    expect(onSuggestion).toHaveBeenCalledWith("Quanto faturei em agosto?");
  });

  test("without onSuggestion the suggestions do not appear", () => {
    withTheme(
      <Conversation empty={{ title: "Vazio", description: "Nada ainda.", suggestions: ["a"] }} />,
    );
    expect(screen.queryByRole("button", { name: "a" })).toBeNull();
  });

  test("scrolling up releases the bottom and shows the button; the button goes back and disappears", () => {
    withTheme(
      <Conversation>
        <Message role="user">Oi</Message>
        <Message role="assistant">Olá</Message>
      </Conversation>,
    );
    const log = screen.getByRole("log");
    const scrolls: ScrollToOptions[] = [];
    log.scrollTo = ((options: ScrollToOptions) => scrolls.push(options)) as typeof log.scrollTo;
    Object.defineProperty(log, "scrollHeight", { configurable: true, value: 2000 });
    Object.defineProperty(log, "clientHeight", { configurable: true, value: 400 });

    expect(screen.queryByRole("button", { name: "Ir para o fim" })).toBeNull();

    log.scrollTop = 200;
    fireEvent.scroll(log);
    const jump = screen.getByRole("button", { name: "Ir para o fim" });

    fireEvent.click(jump);
    expect(scrolls.at(-1)?.top).toBe(2000);
    expect(screen.queryByRole("button", { name: "Ir para o fim" })).toBeNull();
  });

  test("stuck to the bottom, a new message scrolls to the bottom; released, it does not", () => {
    function Chat({ count }: { count: number }) {
      return (
        <Conversation>
          {Array.from({ length: count }, (_, index) => (
            <Message key={index} role="assistant">
              {`resposta ${index}`}
            </Message>
          ))}
        </Conversation>
      );
    }
    const view = withTheme(<Chat count={1} />);
    const log = screen.getByRole("log");
    const scrolls: ScrollToOptions[] = [];
    log.scrollTo = ((options: ScrollToOptions) => scrolls.push(options)) as typeof log.scrollTo;
    Object.defineProperty(log, "scrollHeight", { configurable: true, value: 2000 });
    Object.defineProperty(log, "clientHeight", { configurable: true, value: 400 });

    view.rerender(
      <RivoProvider scope="local">
        <Chat count={2} />
      </RivoProvider>,
    );
    expect(scrolls.length).toBeGreaterThan(0);

    log.scrollTop = 100;
    fireEvent.scroll(log);
    const before = scrolls.length;
    view.rerender(
      <RivoProvider scope="local">
        <Chat count={3} />
      </RivoProvider>,
    );
    expect(scrolls.length).toBe(before);
  });
});

describe("ToolCall", () => {
  const STATES = [
    ["pending", "Pendente"],
    ["running", "Rodando"],
    ["done", "Concluída"],
    ["error", "Erro"],
    ["approval", "Aguardando aprovação"],
  ] as const;

  test("every status comes with icon and text, and color is never the only signal", () => {
    for (const [status, text] of STATES) {
      const view = withTheme(<ToolCall name="buscar_notas" status={status} />);
      const label = screen.getByText(text);

      expect(label.closest("span")?.querySelector("svg")).not.toBeNull();
      view.unmount();
    }
  });

  test("running announces busy", () => {
    const { container } = withTheme(<ToolCall name="buscar_notas" status="running" />);
    expect(container.querySelector("[data-status=running]")?.getAttribute("aria-busy")).toBe(
      "true",
    );
  });

  test("approve and reject only appear while awaiting approval, outside the panel", () => {
    const onApprove = mock(() => {});
    const onReject = mock(() => {});
    const view = withTheme(
      <ToolCall
        name="emitir_nota"
        status="approval"
        input={{ cliente: "Clínica São Lucas", valor: 1200 }}
        onApprove={onApprove}
        onReject={onReject}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Aprovar" }));
    fireEvent.click(screen.getByRole("button", { name: "Recusar" }));
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Clínica São Lucas/)).toBeDefined();

    view.unmount();
    withTheme(
      <ToolCall name="emitir_nota" status="done" onApprove={onApprove} onReject={onReject} />,
    );
    expect(screen.queryByRole("button", { name: "Aprovar" })).toBeNull();
  });

  test("an object input comes out as indented JSON, and the trigger opens and closes", () => {
    withTheme(<ToolCall name="buscar_notas" status="done" input={{ mes: 8 }} output="3 notas" />);
    const trigger = screen.getByRole("button", { name: /buscar_notas/ });

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    act(() => {
      fireEvent.click(trigger);
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(/"mes": 8/)).toBeDefined();
    expect(screen.getByText("3 notas")).toBeDefined();
    expect(screen.getByRole("region", { name: "Entrada: buscar_notas" })).toBeDefined();
    expect(screen.getByRole("region", { name: "Saída: buscar_notas" })).toBeDefined();
  });

  test("an error opens by itself and shows the sentence", () => {
    withTheme(<ToolCall name="buscar_notas" status="error" error="A prefeitura não respondeu." />);
    expect(screen.getByRole("button", { name: /buscar_notas/ }).getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(screen.getByText("A prefeitura não respondeu.")).toBeDefined();
  });

  test("without input, output or error, the header is not a button, and nothing points to a missing panel", () => {
    for (const status of ["pending", "error", "approval"] as const) {
      const view = withTheme(
        <ToolCall name="buscar_notas" status={status} onApprove={() => {}} onReject={() => {}} />,
      );
      const root = view.container.querySelector("[data-status]")!;

      expect(screen.queryByRole("button", { name: /buscar_notas/ })).toBeNull();
      expect(root.querySelector("[aria-controls]")).toBeNull();
      expect(root.querySelector("[aria-expanded]")).toBeNull();
      expect(screen.getByText("buscar_notas")).toBeDefined();
      view.unmount();
    }
  });

  test("with a body, the trigger aria-controls points to the panel that exists", () => {
    withTheme(<ToolCall name="buscar_notas" status="error" error="Falhou." />);
    const trigger = screen.getByRole("button", { name: /buscar_notas/ });
    const id = trigger.getAttribute("aria-controls") ?? "";

    expect(document.getElementById(id)).not.toBeNull();
  });

  test("long name and title wrap to at most two lines, and the full name stays in the title", () => {
    const name = "consultar_notas_fiscais_da_filial_de_joao_pessoa_com_protocolo_da_sefaz";
    withTheme(<ToolCall name={name} title="Consultando as notas" status="pending" />);
    const shown = screen.getByText(name);
    const title = screen.getByText("Consultando as notas");

    for (const node of [shown, title]) {
      expect(tokens(node)).toContain("line-clamp-2");
      expect(tokens(node)).toContain("wrap-anywhere");
      expect(tokens(node)).not.toContain("truncate");
    }
    expect(shown.getAttribute("title")).toBe(name);
  });

  test("approve and reject with long text wrap instead of overflowing", () => {
    withTheme(
      <ToolCall
        name="emitir_nota"
        status="approval"
        onApprove={() => {}}
        onReject={() => {}}
        labels={{ approve: "Aprovar a emissao da nota para a filial de Joao Pessoa" }}
      />,
    );
    for (const name of [/Aprovar a emissao/, "Recusar"]) {
      const button = screen.getByRole("button", { name });
      expect(tokens(button)).toContain("whitespace-normal");
      expect(tokens(button)).toContain("h-auto");
      expect(tokens(button)).not.toContain("whitespace-nowrap");
    }
  });
});

describe("AILabel", () => {
  test("without an explanation, it is a badge the screen reader hears in full", () => {
    withTheme(<AILabel />);

    expect(screen.getByText("Conteúdo gerado por IA")).toBeDefined();
    expect(screen.getByText("IA").getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("button")).toBeNull();
  });

  test("with an explanation, it becomes a named button and opens the panel", async () => {
    withTheme(<AILabel explanation="Resumo feito pelo modelo a partir das notas de agosto." />);
    const button = screen.getByRole("button", { name: "Conteúdo gerado por IA" });

    await act(async () => {
      fireEvent.click(button);
    });
    expect(await screen.findByText(/Resumo feito pelo modelo/)).toBeDefined();
    expect(screen.getByText("Gerado por IA")).toBeDefined();
  });

  test("with an explanation, the touch area grows outside the drawing, and the silent badge does not", () => {
    const view = withTheme(<AILabel explanation="Resumo feito pelo modelo." />);
    const button = screen.getByRole("button", { name: "Conteúdo gerado por IA" });

    expect(tokens(button)).toContain("relative");
    expect(tokens(button)).toContain("after:absolute");
    expect(tokens(button)).toContain("after:-inset-2");
    expect(tokens(button)).toContain("h-5");
    view.unmount();

    withTheme(<AILabel />);
    expect(tokens(screen.getByText("IA").parentElement!)).not.toContain("after:-inset-2");
  });

  test("the tone comes from a house role", () => {
    withTheme(<AILabel tone="neutral" />);
    const badge = screen.getByText("IA").parentElement!;

    expect(tokens(badge)).toContain("bg-surface-raised");
    expect(tokens(badge)).not.toContain("bg-accent-subtle");
  });
});

describe("the subpath", () => {
  test("the five pieces come from @rivocode/ui/ai, and from no other entry", () => {
    const names = ["AILabel", "Conversation", "Message", "PromptInput", "ToolCall"];

    for (const name of names) {
      expect(name in ai).toBe(true);
      expect(name in root).toBe(false);
    }
  });

  test("the page's import line points to the entry that exports the piece", () => {
    const documented = new Set(
      readdirSync(".design-sync/docs")
        .filter((file) => file.endsWith(".md"))
        .map((file) => file.replace(/\.md$/, "")),
    );
    expect(documented.size).toBeGreaterThan(150);

    const entries: [string, Record<string, unknown>][] = [
      ["@rivocode/ui/ai", ai],
      ["@rivocode/ui/dnd", dnd],
      ["@rivocode/ui/chart", chart],
      ["@rivocode/ui/form", form],
      ["@rivocode/ui", root],
    ];
    const pieces = entries.flatMap(([path, entry]) =>
      Object.keys(entry)
        .filter((name) => documented.has(name))
        .map((name) => [path, name] as const),
    );
    expect(pieces.length).toBeGreaterThan(150);

    for (const [path, name] of pieces) {
      expect(`${name} -> ${importPathOf(name)}`).toBe(`${name} -> ${path}`);
    }
  });
});
