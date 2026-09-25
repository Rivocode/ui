/* Gerado de src/shared/transfer.ts por bun run gen:compartilhado. Nao editar. */

export type TransferListItem = {
  /** O identificador que entra e sai do `value`. Unico na lista inteira. */
  value: string;
  /** O texto da linha, que e tambem onde a busca procura, sem acento importar. */
  label: string;
  /** Fica onde esta: nao se marca e nao se move, nem pelo "mover todos". */
  disabled?: boolean;
};

export type TransferSide = "available" | "chosen";

export const OTHER_SIDE: Record<TransferSide, TransferSide> = {
  available: "chosen",
  chosen: "available",
};

export const TRANSFER_TITLES: Record<TransferSide, string> = {
  available: "Disponíveis",
  chosen: "Escolhidos",
};

export const TRANSFER_EMPTY = "Nenhum item";

export const TRANSFER_NO_RESULTS = "Nada encontrado";

export const TRANSFER_SEARCH = "Buscar";

const plain = (count: number) => count.toLocaleString("pt-BR");

export function transferCount(selected: number, total: number): string {
  if (selected > 0) return `${plain(selected)} de ${plain(total)} selecionados`;
  return total === 1 ? "1 item" : `${plain(total)} itens`;
}

export function transferMoved(count: number, to: string): string {
  if (count === 1) return `1 item movido para ${to}`;
  return `${plain(count)} itens movidos para ${to}`;
}

export function moveSelectedLabel(to: string): string {
  return `Mover selecionados para ${to}`;
}

export function moveAllLabel(to: string): string {
  return `Mover todos para ${to}`;
}

export function searchInLabel(list: string): string {
  return `Buscar em ${list}`;
}

export function transferSides(
  items: readonly TransferListItem[],
  value: readonly string[],
): Record<TransferSide, TransferListItem[]> {
  const byValue = new Map(items.map((item) => [item.value, item]));
  const chosen = new Set(value);
  return {
    available: items.filter((item) => !chosen.has(item.value)),
    chosen: value.flatMap((key) => {
      const item = byValue.get(key);
      return item ? [item] : [];
    }),
  };
}

export function transferMove(
  items: readonly TransferListItem[],
  value: readonly string[],
  moving: readonly string[],
  to: TransferSide,
): string[] {
  const movable = new Set(
    items.filter((item) => !item.disabled && moving.includes(item.value)).map((item) => item.value),
  );
  if (to === "available") return value.filter((key) => !movable.has(key));
  const current = new Set(value);
  const added = items
    .filter((item) => movable.has(item.value) && !current.has(item.value))
    .map((item) => item.value);
  return [...value, ...added];
}
