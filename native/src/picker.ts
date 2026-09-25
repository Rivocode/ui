export type PickerItem = { label: string; value: string };

export type PickerGroup<Item> = { label: string; items: Item[] };

export function isGrouped<Item>(items: Item[] | PickerGroup<Item>[]): items is PickerGroup<Item>[] {
  const first: unknown = items[0];
  return (
    typeof first === "object" &&
    first !== null &&
    Array.isArray((first as { items?: unknown }).items)
  );
}

export function flattenItems<Item>(items: Item[] | PickerGroup<Item>[]): Item[] {
  return isGrouped(items) ? items.flatMap((group) => group.items) : items;
}

export function toggleValue(chosen: string[], value: string): string[] {
  return chosen.includes(value) ? chosen.filter((other) => other !== value) : [...chosen, value];
}

export type PickerLabels = {
  selected: (count: number) => string;
  done: string;
};

export const PICKER_LABELS: PickerLabels = {
  selected: (count) => `${count} selecionados`,
  done: "Concluir",
};

export function summarize(
  chosen: string[],
  items: PickerItem[],
  selected: (count: number) => string,
): string | undefined {
  if (chosen.length === 0) return undefined;
  if (chosen.length === 1) return items.find((item) => item.value === chosen[0])?.label;
  return selected(chosen.length);
}

export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
