/* Gerado de src/shared/selection.ts por bun run gen:compartilhado. Nao editar. */

export function selectedLabel(count: number): string {
  if (count === 1) return "1 selecionado";
  return `${count.toLocaleString("pt-BR")} selecionados`;
}

export const SELECTION_CLEARED = "Seleção limpa";

export const CLEAR_SELECTION = "Limpar seleção";

export const BATCH_ACTIONS = "Ações em lote";
