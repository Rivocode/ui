/* Gerado de src/shared/steps.ts por bun run gen:compartilhado. Nao editar. */

export type StepsLabels = {
  position: (step: number, total: number) => string;
};

export const STEPS_LABELS: StepsLabels = {
  position: (step, total) => `Passo ${step} de ${total}`,
};
