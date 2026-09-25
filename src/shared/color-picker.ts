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
