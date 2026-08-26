"use client";

import { useMediaQuery } from "../lib/screen";

export type ChartMotion = {
  /** Espalhe em `Line`, `Bar`, `Area` e `Pie`. */
  isAnimationActive: boolean;
};

export function useChartMotion(): ChartMotion {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  return { isAnimationActive: !reducedMotion };
}
