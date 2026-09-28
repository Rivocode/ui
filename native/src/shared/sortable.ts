/* Gerado de src/shared/sortable.ts por bun run gen:compartilhado. Nao editar. */

export type SortableListLabels = {
  instructions: string;
  roleDescription: string;
  handle: (label: string) => string;
  picked: (label: string, position: number, total: number) => string;
  moved: (label: string, position: number, total: number) => string;
  dropped: (label: string, position: number, total: number) => string;
  canceled: (label: string, position: number, total: number) => string;
};

export const SORTABLE_LIST_LABELS: SortableListLabels = {
  instructions:
    "Para reordenar, pressione Espaço para pegar o item. Use as setas para mover, Espaço para soltar e Esc para cancelar.",
  roleDescription: "item reordenável",
  handle: (label) => `Reordenar ${label}`,
  picked: (label, position, total) => `Item ${label} pego. Posição ${position} de ${total}.`,
  moved: (label, position, total) =>
    `Item ${label} movido para a posição ${position} de ${total}.`,
  dropped: (label, position, total) =>
    `Item ${label} solto na posição ${position} de ${total}.`,
  canceled: (label, position, total) =>
    `Movimento cancelado. Item ${label} voltou para a posição ${position} de ${total}.`,
};

export function moveItem<Item>(items: readonly Item[], from: number, to: number): Item[] {
  const next = items.slice();
  if (from < 0 || from >= next.length || to < 0 || to >= next.length || from === to) return next;
  const [moving] = next.splice(from, 1);
  next.splice(to, 0, moving as Item);
  return next;
}
