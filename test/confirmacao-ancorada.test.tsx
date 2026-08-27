import { expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { Button } from "../src/components/button";
import { Popconfirm } from "../src/components/popconfirm";
import { RivoProvider } from "../src/provider/rivo-provider";

function Example(props: Partial<React.ComponentProps<typeof Popconfirm>> = {}) {
  return (
    <RivoProvider scope="local">
      <Popconfirm
        defaultOpen
        trigger={<Button variant="ghost">Excluir linha</Button>}
        title="Excluir a nota 4813?"
        description="A linha sai da lista e o cliente deixa de ver o documento."
        confirmLabel="Excluir"
        onConfirm={() => {}}
        {...props}
      />
    </RivoProvider>
  );
}

function panel() {
  return screen.getByRole("alertdialog");
}

async function settle(ms = 40) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

test("a pergunta sai num h2, como o DialogTitle e o AlertDialogTitle da casa", () => {
  render(<Example />);

  expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Excluir a nota 4813?");
});

test("titleAs baixa o nivel da pergunta, para o painel dentro de um Card nao inverter o esboco", () => {
  render(<Example titleAs="h4" />);

  expect(screen.getByRole("heading", { level: 4 }).textContent).toBe("Excluir a nota 4813?");
  expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
});

test("a confirmacao abre ancorada, com a pergunta como nome do painel", () => {
  render(<Example />);

  const dialog = panel();
  expect(dialog.textContent).toContain("Excluir a nota 4813?");
  expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
  expect(dialog.getAttribute("aria-describedby")).toBeTruthy();

  const trigger = screen.getByRole("button", { name: "Excluir linha" });
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(trigger.getAttribute("aria-controls")).toBeTruthy();
});

test("o foco comeca no botao que nao faz nada", async () => {
  render(<Example />);
  const cancelButton = screen.getByRole("button", { name: "Cancelar" });
  await settle();
  expect(document.activeElement).toBe(cancelButton);
});

test("confirmar chama a acao uma vez e fecha o painel", () => {
  const onConfirm = mock(() => {});
  render(<Example onConfirm={onConfirm} />);

  fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("alertdialog")).toBeNull();
});

test("o botao de sair fecha sem executar, e avisa quem escuta o cancelamento", () => {
  const onConfirm = mock(() => {});
  const onCancel = mock(() => {});
  render(<Example onConfirm={onConfirm} onCancel={onCancel} />);

  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

  expect(onConfirm).not.toHaveBeenCalled();
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("alertdialog")).toBeNull();
});

test("Escape cancela, porque a saida segura e nao fazer nada", () => {
  const onConfirm = mock(() => {});
  const onCancel = mock(() => {});
  render(<Example onConfirm={onConfirm} onCancel={onCancel} />);

  fireEvent.keyDown(panel(), { key: "Escape" });

  expect(onConfirm).not.toHaveBeenCalled();
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("alertdialog")).toBeNull();
});

test("clicar fora cancela, e a acao destrutiva continua exigindo o botao", () => {
  const onConfirm = mock(() => {});
  const onCancel = mock(() => {});
  render(<Example onConfirm={onConfirm} onCancel={onCancel} />);

  fireEvent.pointerDown(document.body);
  fireEvent.mouseDown(document.body);
  fireEvent.click(document.body);

  expect(onConfirm).not.toHaveBeenCalled();
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("alertdialog")).toBeNull();
});

test("a promessa em curso segura o painel e o segundo clique nao apaga duas vezes", async () => {
  let release: () => void = () => {};
  const remove = mock(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  render(<Example onConfirm={remove} />);

  const confirmButton = screen.getByRole("button", { name: "Excluir" });
  fireEvent.click(confirmButton);

  await settle();
  expect(confirmButton.getAttribute("aria-busy")).toBe("true");
  expect(panel()).toBeDefined();

  fireEvent.click(confirmButton);
  expect(remove).toHaveBeenCalledTimes(1);

  await act(async () => {
    release();
  });
  await settle();

  expect(screen.queryByRole("alertdialog")).toBeNull();
});

test("enquanto a chamada corre, Esc nao fecha o painel por baixo dela", async () => {
  let release: () => void = () => {};
  const onCancel = mock(() => {});
  render(
    <Example
      onCancel={onCancel}
      onConfirm={() =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
      }
    />,
  );

  const confirmButton = screen.getByRole("button", { name: "Excluir" });
  fireEvent.click(confirmButton);
  await settle();
  expect(confirmButton.getAttribute("aria-busy")).toBe("true");

  fireEvent.keyDown(panel(), { key: "Escape" });
  expect(screen.queryByRole("alertdialog")).not.toBeNull();
  expect(onCancel).not.toHaveBeenCalled();

  // O Cancelar recusa o toque por `aria-disabled`, e NAO por `disabled`. A
  // diferenca e a que separa esta peca de uma armadilha de teclado: com o
  // atributo, os dois botoes saiam da ordem de tabulacao ao mesmo tempo, o
  // `alertdialog` ficava com ZERO focaveis, o foco caia no `<body>` e o Tab
  // vazava para o fundo que o Base UI marcou aria-hidden. Medido em Chrome
  // antes do conserto: "focaveis restantes: NENHUM". E falha WCAG 2.1.2.
  const cancel = screen.getByRole("button", { name: "Cancelar" });
  expect(cancel.getAttribute("aria-disabled")).toBe("true");
  expect(cancel.hasAttribute("disabled")).toBe(false);

  // A garantia que importa, escrita como o leitor de tela a sente: sobra pelo
  // menos um alvo de foco dentro do painel enquanto a chamada corre.
  const focusable = panel().querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  expect(focusable.length).toBeGreaterThan(0);

  // E a espera nao e silenciosa: ha regiao viva dizendo que ela corre.
  const notice = panel().querySelector('[role="status"]');
  expect(notice?.textContent).toBeTruthy();

  await act(async () => {
    release();
  });
});

test("promessa que rejeita devolve o painel, com o texto ainda na tela", async () => {
  let fail: (reason: Error) => void = () => {};
  render(
    <Example
      onConfirm={() =>
        new Promise<void>((_, reject) => {
          fail = reject;
        })
      }
    />,
  );

  const confirmButton = screen.getByRole("button", { name: "Excluir" });
  fireEvent.click(confirmButton);
  await settle();
  expect(confirmButton.getAttribute("aria-busy")).toBe("true");

  await act(async () => {
    fail(new Error("rede fora"));
  });
  await settle();

  expect(confirmButton.getAttribute("aria-busy")).toBeNull();
  expect(panel().textContent).toContain("Excluir a nota 4813?");
  expect(screen.getByRole("button", { name: "Cancelar" }).hasAttribute("disabled")).toBe(false);
});

test("a espera vinda de fora tambem trava o botao", () => {
  render(<Example loading />);
  const confirmButton = screen.getByRole("button", { name: "Excluir" });
  expect(confirmButton.getAttribute("aria-busy")).toBe("true");
  expect(confirmButton.hasAttribute("disabled")).toBe(true);
});

test("o tom de perigo veste o vermelho de preencher, e o neutro nao", () => {
  const { unmount } = render(<Example />);
  expect(screen.getByRole("button", { name: "Excluir" }).className).toContain("bg-danger");
  unmount();

  render(<Example tone="neutral" confirmLabel="Arquivar" />);
  const archive = screen.getByRole("button", { name: "Arquivar" });
  expect(archive.className).toContain("bg-accent");
  expect(archive.className).not.toContain("bg-danger");
});

test("cada parte do painel aceita classe, sem alcancar no interno pelo seletor", () => {
  render(
    <Example
      className="painel-x"
      classNames={{
        title: "titulo-x",
        description: "descricao-x",
        footer: "rodape-x",
        confirm: "executa-x",
        cancel: "sai-x",
      }}
    />,
  );

  for (const [marker, expected] of [
    ["titulo-x", "text-fg"],
    ["descricao-x", "text-fg-muted"],
    ["rodape-x", "flex"],
    ["executa-x", "bg-danger"],
    ["sai-x", "border-border-strong"],
  ] as const) {
    const target = document.querySelector(`.${marker}`);
    expect(target).not.toBeNull();
    expect(target!.className).toContain(expected);
  }
  expect(panel().className).toContain("painel-x");
});

test("sem descricao o painel nao promete um texto que nao existe", () => {
  render(<Example description={undefined} />);
  expect(panel().getAttribute("aria-describedby")).toBeNull();
});

test("na tela estreita a confirmacao vira folha de baixo, com os botoes na largura toda", () => {
  const realMatchMedia = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("max-width"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;

  try {
    render(<Example />);
    const sheet = panel();
    expect(sheet.className).toContain("rounded-t-xl");
    expect(sheet.textContent).toContain("Excluir a nota 4813?");
    expect(document.querySelector(".flex-col-reverse")).not.toBeNull();
  } finally {
    window.matchMedia = realMatchMedia;
  }
});

test("o foco vai PARA o cancelar quando o confirmar entra em espera", async () => {
  // A 0.8.0 consertou so metade: o cancelar passou a recusar por `aria-disabled`
  // e continuou focavel, mas nada MOVIA o foco ate ele. Quem aperta o confirmar
  // segura o foco nele, o `loading` o marca `disabled` de verdade, e o navegador
  // larga o foco no `<body>` - o Tab seguinte sai do painel.
  //
  // O defeito so aparece em Chromium e Firefox: o WebKit segura o foco dentro
  // sozinho, entao uma suite rodada so no Safari passa com ele de pe.
  let release = () => {};
  render(
    <Example
      onConfirm={() =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
      }
    />,
  );

  const confirmButton = screen.getByRole("button", { name: "Excluir" });
  confirmButton.focus();
  expect(document.activeElement).toBe(confirmButton);

  fireEvent.click(confirmButton);
  await settle();

  const cancel = screen.getByRole("button", { name: "Cancelar" });
  expect(document.activeElement).toBe(cancel);
  expect(panel().contains(document.activeElement)).toBe(true);

  await act(async () => {
    release();
  });
});
