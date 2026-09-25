/* Gerado de src/shared/color-picker.ts por bun run gen:compartilhado. Nao editar. */

export type ColorPickerLabels = {
  swatches: string;
  hex: string;
  swatch: (value: string) => string;
};

export const COLOR_PICKER_LABELS: ColorPickerLabels = {
  swatches: "Amostras de cor",
  hex: "Código hexadecimal da cor",
  swatch: (value) => `Cor ${value}`,
};
