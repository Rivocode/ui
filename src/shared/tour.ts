export type TourLabels = {
  back: string;
  next: string;
  finish: string;
  skip: string;
  counter: (position: number, total: number) => string;
};

export const TOUR_LABELS: TourLabels = {
  back: "Voltar",
  next: "Próximo",
  finish: "Concluir",
  skip: "Pular tour",
  counter: (position, total) => `Passo ${position} de ${total}`,
};

export const TOUR_SPOTLIGHT_PADDING = 6;

export type TourDirection = 1 | -1;

export type TourMove =
  | { kind: "show" }
  | { kind: "go"; step: number }
  | { kind: "finish" }
  | { kind: "close" };

export function planTourMove(
  current: number,
  total: number,
  direction: TourDirection,
  hasShown: boolean,
  exists: (index: number) => boolean,
  onMissing: (index: number) => void,
): TourMove {
  if (total === 0) return { kind: "close" };
  if (exists(current)) return { kind: "show" };

  onMissing(current);

  const seek = (from: number, step: TourDirection) => {
    for (let index = from; index >= 0 && index < total; index += step) {
      if (exists(index)) return index;
      onMissing(index);
    }
    return null;
  };

  const ahead = seek(current + direction, direction);
  if (ahead !== null) return { kind: "go", step: ahead };
  if (direction === 1 && hasShown) return { kind: "finish" };

  const behind = seek(current - direction, direction === 1 ? -1 : 1);
  if (behind !== null) return { kind: "go", step: behind };

  return { kind: "close" };
}

export function missingTargetComplaint(index: number, target: string): string {
  return `Tour: o alvo do passo ${index + 1} (${target}) não foi encontrado, e o passo foi pulado.`;
}
