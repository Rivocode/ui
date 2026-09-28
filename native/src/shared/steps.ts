/* Generated from src/shared/steps.ts by bun run gen:shared. Do not edit. */

export type StepsLabels = {
  position: (step: number, total: number) => string;
};

export const STEPS_LABELS: StepsLabels = {
  position: (step, total) => `Passo ${step} de ${total}`,
};
