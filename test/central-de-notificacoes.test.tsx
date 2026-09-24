import { expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useState, type ReactNode } from "react";

import {
  NotificationCenter,
  type NotificationCenterProps,
  type NotificationItem,
} from "../src/components/notification-center";
import { RivoProvider } from "../src/provider/rivo-provider";

const NOW = new Date("2026-09-24T12:00:00-03:00");

const ITEMS: NotificationItem[] = [
  {
    id: "1",
    title: "Nota 1042 autorizada",
    description: "A prefeitura aceitou a nota da Padaria Aurora.",
    time: new Date("2026-09-24T11:55:00-03:00"),
    read: false,
    tone: "success",
  },
  {
    id: "2",
    title: "Certificado vence em 5 dias",
    time: new Date("2026-09-24T09:00:00-03:00"),
    read: false,
    tone: "warning",
    href: "/certificado",
  },
  {
    id: "3",
    title: "Relatório de agosto pronto",
    time: new Date("2026-09-20T10:00:00-03:00"),
    read: true,
  },
];

function center(props: Partial<NotificationCenterProps> = {}) {
  return render(
    <RivoProvider scope="local">
      <NotificationCenter items={ITEMS} now={NOW} {...props} />
    </RivoProvider>,
  );
}

function openPanel() {
  fireEvent.click(screen.getByRole("button", { name: /notificaç/i }));
}

test("o sininho diz quantas nao lidas no nome, e a pastilha mostra o numero", () => {
  const { container } = center();
  const trigger = screen.getByRole("button", { name: "2 notificações não lidas" });
  expect(trigger.textContent).toContain("2");
  expect(container.querySelector("[role='status']")!.textContent).toBe("2 notificações não lidas");
});

test("sem nao lidas, o sininho se chama Notificacoes e nao desenha pastilha", () => {
  center({ items: ITEMS.map((item) => ({ ...item, read: true })) });
  const trigger = screen.getByRole("button", { name: "Notificações" });
  expect(trigger.textContent).toBe("");
});

test("uma so, no singular", () => {
  center({ items: [ITEMS[0]!] });
  expect(screen.getByRole("button", { name: "1 notificação não lida" })).toBeDefined();
});

test("unreadCount vence a conta dos itens carregados, e max corta o numero", () => {
  center({ unreadCount: 140 });
  const trigger = screen.getByRole("button", { name: "140 notificações não lidas" });
  expect(trigger.textContent).toContain("99+");
});

test("a regiao viva repete a contagem quando ela muda", () => {
  function Live() {
    const [items, setItems] = useState(ITEMS);
    return (
      <RivoProvider scope="local">
        <NotificationCenter items={items} now={NOW} />
        <button type="button" onClick={() => setItems(items.map((i) => ({ ...i, read: true })))}>
          ler tudo
        </button>
      </RivoProvider>
    );
  }
  const { container } = render(<Live />);
  const region = container.querySelector("[role='status'][aria-live='polite']")!;
  expect(region.textContent).toBe("2 notificações não lidas");
  fireEvent.click(screen.getByText("ler tudo"));
  expect(region.textContent).toBe("Nenhuma notificação não lida");
});

test("abrir mostra o painel com o titulo e a lista", () => {
  center();
  openPanel();
  const dialog = screen.getByRole("dialog", { name: "Notificações" });
  const list = within(dialog).getByRole("list", { name: "Notificações" });
  expect(within(list).getAllByRole("listitem")).toHaveLength(3);
  expect(within(dialog).getByText("há 5 minutos")).toBeDefined();
});

test("a nao lida ganha o ponto, o negrito e o aviso para o leitor de tela", () => {
  center();
  openPanel();
  const items = screen.getAllByRole("listitem");
  const unread = items[0]!;
  const read = items[2]!;

  expect(unread.querySelector("[data-unread]")).not.toBeNull();
  expect(unread.textContent).toContain("Não lida: Nota 1042 autorizada");
  expect(read.querySelector("[data-unread]")).toBeNull();
  expect(read.textContent).not.toContain("Não lida");

  const unreadTitle = within(unread).getByText("Nota 1042 autorizada");
  expect(unreadTitle.className.split(" ")).toContain("font-medium");
  const readTitle = within(read).getByText("Relatório de agosto pronto");
  expect(readTitle.className.split(" ")).not.toContain("font-medium");
});

test("o tom pinta o simbolo com o texto de estado", () => {
  center();
  openPanel();
  const symbol = screen.getAllByRole("listitem")[1]!.querySelector("[aria-hidden='true']")!;
  expect(symbol.className.split(" ")).toContain("text-warning-text");
});

test("marcar como lida chama onMarkRead com o id, e so aparece nas nao lidas", () => {
  const onMarkRead = mock<(id: string) => void>(() => {});
  center({ onMarkRead });
  openPanel();
  const buttons = screen.getAllByRole("button", { name: "Marcar como lida" });
  expect(buttons).toHaveLength(2);
  fireEvent.click(buttons[1]!);
  expect(onMarkRead).toHaveBeenCalledWith("2");
});

test("marcar todas chama onMarkAllRead, e fica desabilitado sem nao lidas", () => {
  const onMarkAllRead = mock(() => {});
  const { unmount } = center({ onMarkAllRead });
  openPanel();
  fireEvent.click(screen.getByRole("button", { name: "Marcar todas como lidas" }));
  expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  unmount();

  center({ onMarkAllRead, items: ITEMS.map((item) => ({ ...item, read: true })) });
  openPanel();
  expect(
    (screen.getByRole("button", { name: "Marcar todas como lidas" }) as HTMLButtonElement).disabled,
  ).toBe(true);
});

test("escolher uma nao lida chama onItemClick, marca como lida e fecha o painel", () => {
  const onItemClick = mock<(item: NotificationItem) => void>(() => {});
  const onMarkRead = mock<(id: string) => void>(() => {});
  center({ onItemClick, onMarkRead });
  openPanel();
  fireEvent.click(screen.getByRole("button", { name: /Nota 1042 autorizada/ }));
  expect(onItemClick).toHaveBeenCalledWith(ITEMS[0]!);
  expect(onMarkRead).toHaveBeenCalledWith("1");
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("escolher uma ja lida nao chama onMarkRead", () => {
  const onMarkRead = mock<(id: string) => void>(() => {});
  center({ onItemClick: () => {}, onMarkRead });
  openPanel();
  fireEvent.click(screen.getByRole("button", { name: /Relatório de agosto/ }));
  expect(onMarkRead).not.toHaveBeenCalled();
});

test("href faz da linha um link", () => {
  center();
  openPanel();
  const link = screen.getByRole("link", { name: /Certificado vence/ });
  expect(link.getAttribute("href")).toBe("/certificado");
});

test("o filtro Nao lidas esconde as lidas e avisa quem controla", () => {
  const onFilterChange = mock<(filter: string) => void>(() => {});
  center({ onFilterChange });
  openPanel();
  const group = screen.getByRole("group", { name: "Mostrar" });
  fireEvent.click(within(group).getByRole("button", { name: /Não lidas/ }));
  expect(onFilterChange).toHaveBeenCalledWith("unread");
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.queryByText("Relatório de agosto pronto")).toBeNull();
});

test("vazio: sem nada, diz que nao ha notificacao", () => {
  center({ items: [] });
  openPanel();
  expect(screen.getByText("Nenhuma notificação")).toBeDefined();
  expect(screen.queryByRole("list")).toBeNull();
});

test("vazio no filtro: tudo lido diz que a pessoa esta em dia", () => {
  center({ items: ITEMS.map((item) => ({ ...item, read: true })), defaultFilter: "unread" });
  openPanel();
  expect(screen.getByText("Tudo lido")).toBeDefined();
});

test("carregando: marca de lugar, aria-busy e o anuncio, sem vazio mentindo", () => {
  center({ items: [], isLoading: true });
  openPanel();
  const dialog = screen.getByRole("dialog");
  expect(dialog.querySelector("[aria-busy='true']")).not.toBeNull();
  expect(within(dialog).getByText("Carregando…")).toBeDefined();
  expect(screen.queryByText("Nenhuma notificação")).toBeNull();
});

test("carregar mais aparece com hasMore, chama onLoadMore e gira enquanto chega", () => {
  const onLoadMore = mock(() => {});
  const { unmount } = center({ hasMore: true, onLoadMore });
  openPanel();
  fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
  expect(onLoadMore).toHaveBeenCalledTimes(1);
  unmount();

  center({ hasMore: true, onLoadMore, isLoadingMore: true });
  openPanel();
  const button = screen.getByRole("button", { name: "Carregar mais" }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  expect(button.getAttribute("aria-busy")).toBe("true");
});

test("sem hasMore, nao ha carregar mais", () => {
  center({ onLoadMore: () => {} });
  openPanel();
  expect(screen.queryByRole("button", { name: "Carregar mais" })).toBeNull();
});

test("controlado: open e onOpenChange", () => {
  const onOpenChange = mock<(open: boolean) => void>(() => {});
  center({ open: true, onOpenChange });
  expect(screen.getByRole("dialog")).toBeDefined();
  openPanel();
  expect(onOpenChange).toHaveBeenCalledWith(false);
  expect(screen.getByRole("dialog")).toBeDefined();
});

test("labels troca os textos", () => {
  center({
    labels: { title: "Avisos", unreadCount: (count) => `${count} avisos novos` },
  });
  expect(screen.getByRole("button", { name: "2 avisos novos" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "2 avisos novos" }));
  expect(screen.getByRole("dialog", { name: "Avisos" })).toBeDefined();
});

test("no celular a lista abre numa folha de baixo, com o mesmo conteudo", () => {
  const real = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("max-width: 639px"),
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
      onchange: null,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;

  try {
    center();
    openPanel();
    const dialog = screen.getByRole("dialog", { name: "Notificações" });
    const tokens = dialog.className.split(" ");
    expect(tokens).toContain("rounded-t-xl");
    expect(tokens).toContain("px-0");
    expect(tokens).not.toContain("p-0");
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(3);
  } finally {
    window.matchMedia = real;
  }
});

test("na mesa o painel e o popover ancorado, na largura fixa", () => {
  center();
  openPanel();
  const tokens = screen.getByRole("dialog").className.split(" ");
  expect(tokens).not.toContain("rounded-t-xl");
  expect(tokens).toContain("sm:w-[24rem]");
});

function Marking(props: Partial<NotificationCenterProps> & { initial?: NotificationItem[] }) {
  const { initial = ITEMS, ...rest } = props;
  const [items, setItems] = useState(initial);
  return (
    <RivoProvider scope="local">
      <NotificationCenter
        items={items}
        now={NOW}
        onMarkRead={(id) =>
          setItems((all) => all.map((item) => (item.id === id ? { ...item, read: true } : item)))
        }
        onMarkAllRead={() => setItems((all) => all.map((item) => ({ ...item, read: true })))}
        {...rest}
      />
    </RivoProvider>
  );
}

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

const focused = () => {
  const active = document.activeElement as HTMLElement | null;
  if (!active) return "nada";
  const name = active.getAttribute("aria-label") ?? active.textContent?.trim().slice(0, 40);
  return `${active.tagName.toLowerCase()}:${name}`;
};

async function show(node: ReactNode) {
  render(node);
  openPanel();
  await settle();
}

async function markWithKeyboard(button: HTMLElement) {
  button.focus();
  act(() => {
    fireEvent.click(button);
  });
  await settle();
}

test("marcar como lida uma linha sem link leva o foco ao proximo marcar como lida", async () => {
  await show(<Marking />);
  const [first] = screen.getAllByRole("button", { name: "Marcar como lida" });
  await markWithKeyboard(first!);

  const rest = screen.getAllByRole("button", { name: "Marcar como lida" });
  expect(rest).toHaveLength(1);
  expect(focused()).toBe("button:Marcar como lida");
  expect(document.activeElement === rest[0]).toBe(true);
});

test("marcar como lida uma linha com link leva o foco ao link da mesma linha", async () => {
  await show(<Marking />);
  const [, second] = screen.getAllByRole("button", { name: "Marcar como lida" });
  await markWithKeyboard(second!);

  expect(focused()).toStartWith("a:Certificado vence em 5 dias");
});

test("no filtro Nao lidas a linha marcada some, e o foco vai ao proximo marcar como lida", async () => {
  await show(<Marking defaultFilter="unread" onItemClick={() => {}} />);
  const [first] = screen.getAllByRole("button", { name: "Marcar como lida" });
  await markWithKeyboard(first!);

  expect(screen.getAllByRole("listitem")).toHaveLength(1);
  expect(focused()).toBe("button:Marcar como lida");
});

test("marcar a ultima nao lida sem link leva o foco ao filtro, e nao a moldura", async () => {
  await show(<Marking initial={[ITEMS[0]!, ITEMS[2]!]} />);
  await markWithKeyboard(screen.getByRole("button", { name: "Marcar como lida" }));

  expect(focused()).toBe("button:Todas");
});

test("marcar todas desabilita o botao focado e leva o foco ao filtro", async () => {
  await show(<Marking />);
  const all = screen.getByRole("button", { name: "Marcar todas como lidas" }) as HTMLButtonElement;
  await markWithKeyboard(all);

  expect(all.disabled).toBe(true);
  expect(focused()).toBe("button:Todas");
});

test("o marcar todas quebra a linha em vez de vazar do painel com texto longo", () => {
  center({ onMarkAllRead: () => {} });
  openPanel();
  const tokens = screen
    .getByRole("button", { name: "Marcar todas como lidas" })
    .className.split(" ");
  expect(tokens).toContain("whitespace-normal");
  expect(tokens).toContain("h-auto");
  expect(tokens).not.toContain("whitespace-nowrap");
});
