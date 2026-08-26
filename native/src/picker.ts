export type PickerItem = { label: string; value: string };

export function toggleValue(chosen: string[], value: string): string[] {
  return chosen.includes(value) ? chosen.filter((other) => other !== value) : [...chosen, value];
}

export function summarize(chosen: string[], items: PickerItem[]): string | undefined {
  if (chosen.length === 0) return undefined;
  if (chosen.length === 1) return items.find((item) => item.value === chosen[0])?.label;
  return `${chosen.length} selecionados`;
}
