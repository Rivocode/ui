export type RatingLabels = {
  group: string;
  item: (value: number) => string;
  value: (value: number, max: number) => string;
};

const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export const RATING_LABELS: RatingLabels = {
  group: "Avaliação",
  item: (value) => {
    if (value === 0) return "Nenhuma estrela";
    if (value === 0.5) return "Meia estrela";
    return `${decimal.format(value)} ${value < 2 ? "estrela" : "estrelas"}`;
  },
  value: (value, max) => `${decimal.format(value)} de ${decimal.format(max)}`,
};

export function starFill(shown: number, index: number): number {
  return Math.round(Math.min(1, Math.max(0, shown - index)) * 1000) / 1000;
}
