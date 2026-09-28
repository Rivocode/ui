import { afterEach, expect, mock, test } from "bun:test";
import { AccessibilityInfo, View } from "react-native";

import {
  NotificationCenter,
  RivoProvider,
  type NotificationCenterProps,
  type NotificationItem,
} from "../src";
import { act, byLabel, byType, render, textOf } from "./helpers";

const NOW = new Date("2026-09-24T12:00:00-03:00");

const ITEMS: NotificationItem[] = [
  {
    id: "1",
    title: "Nota 1042 autorizada",
    description: "A prefeitura aceitou a nota.",
    time: new Date("2026-09-24T11:55:00-03:00"),
    read: false,
    tone: "success",
  },
  {
    id: "2",
    title: "Certificado vence em 5 dias",
    time: new Date("2026-09-24T09:00:00-03:00"),
    read: false,
  },
  {
    id: "3",
    title: "Relatório de agosto pronto",
    time: new Date("2026-09-20T10:00:00-03:00"),
    read: true,
  },
];

const info = AccessibilityInfo as unknown as {
  announced: readonly string[];
  clearAnnouncements: () => void;
};

afterEach(() => info.clearAnnouncements());

function center(props: Partial<NotificationCenterProps> = {}) {
  const onOpenChange = mock<(open: boolean) => void>(() => {});
  const screen = render(
    <NotificationCenter
      items={ITEMS}
      open
      onOpenChange={onOpenChange}
      icon={<View testID="sino" />}
      now={NOW}
      {...props}
    />,
  );
  return { screen, onOpenChange };
}

test("o sino diz a contagem por extenso no nome, e o numero na pastilha", () => {
  const { screen, onOpenChange } = center({ open: false });
  const [trigger] = byLabel(screen, "2 notificações não lidas");
  expect(trigger!.props.accessibilityRole).toBe("button");
  expect(textOf(screen)).toContain("2");
  act(() => trigger!.props.onPress());
  expect(onOpenChange).toHaveBeenCalledWith(true);
});

test("sem nao lidas, o sino se chama Notificacoes e a pastilha some", () => {
  const { screen } = center({ open: false, items: ITEMS.map((item) => ({ ...item, read: true })) });
  expect(byLabel(screen, "Notificações")).toHaveLength(1);
  expect(byLabel(screen, "Nenhuma notificação não lida")).toHaveLength(0);
});

test("a funcao do icone recebe a cor da variante", () => {
  const seen: string[] = [];
  center({
    open: false,
    icon: ({ color }) => {
      seen.push(color);
      return null;
    },
  });
  expect(seen.length).toBeGreaterThan(0);
  expect(seen[0]).toMatch(/^(#|rgb|oklch)/);
});

test("a contagem que muda e anunciada, e a primeira nao", () => {
  const { screen } = center({ open: false });
  expect(info.announced).toHaveLength(0);
  act(() =>
    screen.update(
      <RivoProvider>
        <NotificationCenter
          items={[{ ...ITEMS[2]!, id: "9", read: false }, ...ITEMS]}
          open={false}
          onOpenChange={() => {}}
          icon={null}
          now={NOW}
        />
      </RivoProvider>,
    ),
  );
  expect(info.announced).toContain("3 notificações não lidas");
});

test("a folha mostra o titulo e uma linha por notificacao, com a nao lida dita", () => {
  const { screen } = center();
  expect(textOf(screen)).toContain("Notificações");
  expect(byType(screen, "FlatList")[0]!.props.data).toHaveLength(3);
  expect(
    byLabel(screen, "Não lida, Nota 1042 autorizada, A prefeitura aceitou a nota."),
  ).toHaveLength(1);
  expect(byLabel(screen, "Relatório de agosto pronto")).toHaveLength(1);
  const dots = screen.root.findAll(
    (node) => typeof node.type === "string" && node.props.testID === "notification-unread",
  );
  expect(dots).toHaveLength(2);
});

test("tocar numa nao lida chama onItemPress, marca como lida e fecha", () => {
  const onItemPress = mock<(item: NotificationItem) => void>(() => {});
  const onMarkRead = mock<(id: string) => void>(() => {});
  const { screen, onOpenChange } = center({ onItemPress, onMarkRead });
  const [row] = byLabel(screen, "Não lida, Nota 1042 autorizada, A prefeitura aceitou a nota.");
  act(() => row!.props.onPress());
  expect(onItemPress).toHaveBeenCalledWith(ITEMS[0]!);
  expect(onMarkRead).toHaveBeenCalledWith("1");
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test("marcar como lida so nas nao lidas, e marcar todas desabilita sem o que marcar", () => {
  const onMarkRead = mock<(id: string) => void>(() => {});
  const onMarkAllRead = mock(() => {});
  const { screen } = center({ onMarkRead, onMarkAllRead });
  const buttons = byLabel(screen, "Marcar como lida");
  expect(buttons).toHaveLength(2);
  act(() => buttons[1]!.props.onPress());
  expect(onMarkRead).toHaveBeenCalledWith("2");

  const all = screen.root.findAll(
    (node) => node.type === "Pressable" && textOfNode(node).includes("Marcar todas como lidas"),
  );
  expect(all[0]!.props.disabled).toBeFalsy();

  const done = center({ onMarkAllRead, items: ITEMS.map((item) => ({ ...item, read: true })) });
  const disabled = done.screen.root.findAll(
    (node) => node.type === "Pressable" && textOfNode(node).includes("Marcar todas como lidas"),
  );
  expect(disabled[0]!.props.disabled).toBe(true);
});

test("o filtro de nao lidas esconde as lidas e avisa", () => {
  const onFilterChange = mock<(filter: string) => void>(() => {});
  const { screen } = center({ onFilterChange });
  const toggle = screen.root.findAll(
    (node) => node.type === "Pressable" && textOfNode(node).includes("Não lidas"),
  )[0]!;
  act(() => toggle.props.onPress());
  expect(onFilterChange).toHaveBeenCalledWith("unread");
  expect(byType(screen, "FlatList")[0]!.props.data).toHaveLength(2);
});

test("vazio e carregando nao se confundem", () => {
  const empty = center({ items: [] });
  expect(textOf(empty.screen)).toContain("Nenhuma notificação");
  expect(byType(empty.screen, "FlatList")).toHaveLength(0);

  const loading = center({ items: [], isLoading: true });
  expect(textOf(loading.screen)).not.toContain("Nenhuma notificação");
  const [busy] = byLabel(loading.screen, "Carregando…");
  expect(busy!.props.accessibilityState).toEqual({ busy: true });
});

test("carregar mais com hasMore, girando enquanto chega", () => {
  const onLoadMore = mock(() => {});
  const { screen } = center({ hasMore: true, onLoadMore });
  const more = screen.root.findAll(
    (node) => node.type === "Pressable" && textOfNode(node).includes("Carregar mais"),
  )[0]!;
  act(() => more.props.onPress());
  expect(onLoadMore).toHaveBeenCalledTimes(1);

  const busy = center({ hasMore: true, onLoadMore, isLoadingMore: true });
  const spinning = busy.screen.root.findAll(
    (node) => node.type === "Pressable" && node.props.accessibilityState?.busy === true,
  );
  expect(spinning.length).toBeGreaterThan(0);
});

function textOfNode(node: { children: unknown[] }): string {
  return node.children
    .map((child) =>
      typeof child === "string" ? child : textOfNode(child as { children: unknown[] }),
    )
    .join(" ");
}
