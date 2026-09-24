import { describe, expect, mock, test } from "bun:test";
import { readdirSync } from "node:fs";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState, type ReactNode } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { AILabel, Conversation, Message, PromptInput, ToolCall } from "../src/ai/index";
import * as ai from "../src/ai/index";
import * as chart from "../src/chart/index";
import * as form from "../src/form/index";
import * as root from "../src/index";
import { importPathOf } from "../apps/docs/src/parts";

function withTheme(node: ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

const tokens = (element: Element) => (element.getAttribute("class") ?? "").split(/\s+/);

describe("PromptInput", () => {
  test("Enter envia, Shift+Enter nao, e o campo nao controlado se limpa", () => {
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

  test("campo vazio ou so de espaco nao envia, e o botao fica desabilitado", () => {
    const onSubmit = mock<(value: string) => void>(() => {});
    withTheme(<PromptInput onSubmit={onSubmit} defaultValue="   " />);
    const send = screen.getByRole("button", { name: "Enviar mensagem" }) as HTMLButtonElement;

    expect(send.disabled).toBe(true);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("em streaming o enviar vira parar, e Enter nao envia", () => {
    const onSubmit = mock<(value: string) => void>(() => {});
    const onStop = mock(() => {});
    withTheme(<PromptInput streaming onSubmit={onSubmit} onStop={onStop} defaultValue="proxima" />);

    expect(screen.queryByRole("button", { name: "Enviar mensagem" })).toBeNull();
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Parar resposta" }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  test("Enter no meio da composicao do teclado nao envia", () => {
    const onSubmit = mock<(value: string) => void>(() => {});
    withTheme(<PromptInput onSubmit={onSubmit} defaultValue="acentuaç" />);

    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", isComposing: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("controlado, quem limpa e quem chamou", () => {
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

  test("desabilitado trava o campo e o envio", () => {
    withTheme(<PromptInput disabled defaultValue="texto" />);

    expect((screen.getByRole("textbox") as HTMLTextAreaElement).disabled).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Enviar mensagem" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  test("o anel de foco do campo e desenhado pela moldura, e nao some", () => {
    withTheme(<PromptInput />);
    const form = screen.getByRole("textbox").closest("form")!;

    expect(tokens(form)).toContain("has-[textarea:focus-visible]:ring-2");
    expect(tokens(form)).not.toContain("focus-within:ring-2");
  });

  test("a dica do teclado esta ligada ao campo", () => {
    withTheme(<PromptInput />);
    const field = screen.getByRole("textbox");
    const hint = document.getElementById(field.getAttribute("aria-describedby") ?? "");

    expect(hint?.textContent).toContain("Shift+Enter");
  });

  test("o contador mostra o teto e fica no tom de perigo ao bater nele", () => {
    withTheme(<PromptInput showCount maxLength={5} defaultValue="12345" />);
    const count = screen.getByText("5/5");

    expect(tokens(count)).toContain("text-danger-text");
    expect(tokens(count)).not.toContain("text-fg-subtle");
  });

  test("os anexos entram pelo slot", () => {
    withTheme(<PromptInput attachments={<span>nota-agosto.pdf</span>} />);
    expect(screen.getByText("nota-agosto.pdf")).toBeDefined();
  });
});

describe("Message", () => {
  test("cada mensagem e um artigo com o nome de quem fala", () => {
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

  test("o alinhamento sai do papel", () => {
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

  test("em streaming anuncia ocupado e esconde as acoes", () => {
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

  test("terminada, mostra copiar e tentar de novo, e o tentar chama quem pediu", () => {
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

  test("o erro sai em texto, e nao so em cor", () => {
    withTheme(<Message role="assistant" error="A resposta foi interrompida." onRetry={() => {}} />);

    const error = screen.getByText("A resposta foi interrompida.");
    expect(tokens(error.parentElement!)).toContain("text-danger-text");
  });

  test("streaming sem conteudo ainda mostra o indicador", () => {
    const { container } = withTheme(<Message role="assistant" streaming />);
    expect(container.querySelectorAll(".animate-pulse").length).toBe(3);
  });
});

describe("Conversation", () => {
  test("e uma regiao de log educada, com nome", () => {
    withTheme(
      <Conversation className="h-96">
        <Message role="user">Oi</Message>
      </Conversation>,
    );
    const log = screen.getByRole("log", { name: "Conversa" });

    expect(log.getAttribute("aria-live")).toBe("polite");
    expect(log.getAttribute("tabindex")).toBe("0");
  });

  test("vazia, mostra o estado vazio e as sugestoes entregam o texto", () => {
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

  test("sem onSuggestion as sugestoes nao aparecem", () => {
    withTheme(
      <Conversation empty={{ title: "Vazio", description: "Nada ainda.", suggestions: ["a"] }} />,
    );
    expect(screen.queryByRole("button", { name: "a" })).toBeNull();
  });

  test("rolar para cima solta o fim e mostra o botao; o botao volta e some", () => {
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

  test("grudado no fim, mensagem nova rola ate o fim; solto, nao rola", () => {
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

  test("todo estado sai com icone e texto, e cor nunca e o unico sinal", () => {
    for (const [status, text] of STATES) {
      const view = withTheme(<ToolCall name="buscar_notas" status={status} />);
      const label = screen.getByText(text);

      expect(label.closest("span")?.querySelector("svg")).not.toBeNull();
      view.unmount();
    }
  });

  test("rodando anuncia ocupado", () => {
    const { container } = withTheme(<ToolCall name="buscar_notas" status="running" />);
    expect(container.querySelector("[data-status=running]")?.getAttribute("aria-busy")).toBe(
      "true",
    );
  });

  test("aprovar e recusar so aparecem aguardando aprovacao, fora do painel", () => {
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

  test("a entrada objeto sai como JSON indentado, e o gatilho abre e fecha", () => {
    withTheme(<ToolCall name="buscar_notas" status="done" input={{ mes: 8 }} output="3 notas" />);
    const trigger = screen.getByRole("button", { name: /buscar_notas/ });

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    act(() => {
      fireEvent.click(trigger);
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(/"mes": 8/)).toBeDefined();
    expect(screen.getByText("3 notas")).toBeDefined();
  });

  test("erro abre sozinho e mostra a frase", () => {
    withTheme(<ToolCall name="buscar_notas" status="error" error="A prefeitura não respondeu." />);
    expect(screen.getByRole("button", { name: /buscar_notas/ }).getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(screen.getByText("A prefeitura não respondeu.")).toBeDefined();
  });

  test("sem entrada, saida nem erro, o gatilho nao abre nada", () => {
    withTheme(<ToolCall name="buscar_notas" status="pending" />);
    const trigger = screen.getByRole("button", { name: /buscar_notas/ }) as HTMLButtonElement;
    expect(trigger.disabled || trigger.getAttribute("aria-disabled") === "true").toBe(true);
  });
});

describe("AILabel", () => {
  test("sem explicacao, e um selo que o leitor de tela ouve por extenso", () => {
    withTheme(<AILabel />);

    expect(screen.getByText("Conteúdo gerado por IA")).toBeDefined();
    expect(screen.getByText("IA").getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("button")).toBeNull();
  });

  test("com explicacao, vira botao com nome e abre o painel", async () => {
    withTheme(<AILabel explanation="Resumo feito pelo modelo a partir das notas de agosto." />);
    const button = screen.getByRole("button", { name: "Conteúdo gerado por IA" });

    await act(async () => {
      fireEvent.click(button);
    });
    expect(await screen.findByText(/Resumo feito pelo modelo/)).toBeDefined();
    expect(screen.getByText("Gerado por IA")).toBeDefined();
  });

  test("o tom sai de papel da casa", () => {
    withTheme(<AILabel tone="neutral" />);
    const badge = screen.getByText("IA").parentElement!;

    expect(tokens(badge)).toContain("bg-surface-raised");
    expect(tokens(badge)).not.toContain("bg-accent-subtle");
  });
});

describe("o subcaminho", () => {
  test("as cinco pecas saem de @rivocode/ui/ai, e de nenhuma outra entrada", () => {
    const names = ["AILabel", "Conversation", "Message", "PromptInput", "ToolCall"];

    for (const name of names) {
      expect(name in ai).toBe(true);
      expect(name in root).toBe(false);
    }
  });

  test("a linha de import da pagina aponta para a entrada que exporta a peca", () => {
    const documented = new Set(
      readdirSync(".design-sync/docs")
        .filter((file) => file.endsWith(".md"))
        .map((file) => file.replace(/\.md$/, "")),
    );
    expect(documented.size).toBeGreaterThan(150);

    const entries: [string, Record<string, unknown>][] = [
      ["@rivocode/ui/ai", ai],
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
