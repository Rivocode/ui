/* Gerado de src/shared/notification.ts por bun run gen:compartilhado. Nao editar. */

export type NotificationTone = "neutral" | "info" | "success" | "warning" | "danger";

export type NotificationFilter = "all" | "unread";

export type NotificationCenterLabels = {
  title: string;
  trigger: string;
  unreadCount: (count: number) => string;
  unreadItem: string;
  markRead: string;
  markAllRead: string;
  filter: string;
  all: string;
  unread: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyUnreadTitle: string;
  emptyUnreadDescription: string;
  loadMore: string;
  loading: string;
  loaded: string;
};

export const NOTIFICATION_LABELS: NotificationCenterLabels = {
  title: "Notificações",
  trigger: "Notificações",
  unreadCount: (count) => {
    if (count === 0) return "Nenhuma notificação não lida";
    if (count === 1) return "1 notificação não lida";
    return `${count} notificações não lidas`;
  },
  unreadItem: "Não lida",
  markRead: "Marcar como lida",
  markAllRead: "Marcar todas como lidas",
  filter: "Mostrar",
  all: "Todas",
  unread: "Não lidas",
  emptyTitle: "Nenhuma notificação",
  emptyDescription: "Quando algo acontecer na sua conta, o aviso chega aqui.",
  emptyUnreadTitle: "Tudo lido",
  emptyUnreadDescription: "Você está em dia. As notificações lidas continuam em Todas.",
  loadMore: "Carregar mais",
  loading: "Carregando…",
  loaded: "Conteúdo carregado",
};

export function unreadOf(items: { read: boolean }[], declared?: number): number {
  if (declared !== undefined) return Math.max(0, declared);
  return items.filter((item) => !item.read).length;
}
