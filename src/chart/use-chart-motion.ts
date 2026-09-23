"use client";

import { useLayoutEffect, useState } from "react";

import { useMediaQuery } from "../lib/screen";

export type ChartEasing = `cubic-bezier(${number},${number},${number},${number})` | "linear";

export type ChartMotion = {
  /**
   * Espalhe em `Line`, `Bar`, `Area` e `Pie`. Liga antes de a marca montar, entao
   * o grafico se desenha na primeira vez que aparece e anda quando o dado muda.
   * Fica desligado enquanto o sistema pede menos movimento.
   */
  isAnimationActive: boolean;
  /** Em ms, lido de `--rc-duration-slow`. Zero com "reduzir movimento". */
  animationDuration: number;
  /** A curva de `--rc-ease`, no formato que a Recharts interpreta. */
  animationEasing: ChartEasing;
};

const DURATION = "--rc-duration-slow";
const CURVE = "--rc-ease";
const REDUCED = "(prefers-reduced-motion: reduce)";

export const STILL: ChartMotion = {
  isAnimationActive: false,
  animationDuration: 0,
  animationEasing: "linear",
};

function milliseconds(raw: string): number {
  const text = raw.trim();
  const value = Number.parseFloat(text);
  if (!Number.isFinite(value)) return 0;
  if (text.endsWith("ms")) return value;
  return text.endsWith("s") ? value * 1000 : value;
}

function bezier(raw: string): ChartEasing | undefined {
  const hit = /^cubic-bezier\(([^)]*)\)$/.exec(raw.trim());
  const points = hit?.[1]?.split(",").map((point) => Number(point.trim()));
  if (!points || points.length !== 4 || points.some((point) => !Number.isFinite(point))) {
    return undefined;
  }
  return `cubic-bezier(${points.join(",")})` as ChartEasing;
}

export function readChartMotion(element: Element): ChartMotion {
  const style = getComputedStyle(element);
  const duration = milliseconds(style.getPropertyValue(DURATION));
  const easing = bezier(style.getPropertyValue(CURVE));
  if (duration <= 0 || !easing) return STILL;
  return { isAnimationActive: true, animationDuration: duration, animationEasing: easing };
}

export function useTokenMotion(scope: string | null): ChartMotion {
  const reduced = useMediaQuery(REDUCED);
  const [motion, setMotion] = useState<ChartMotion>(STILL);

  useLayoutEffect(() => {
    if (reduced) {
      setMotion(STILL);
      return;
    }
    const element = scope ? document.querySelector(scope) : null;
    setMotion(readChartMotion(element ?? document.documentElement));
  }, [reduced, scope]);

  return reduced ? STILL : motion;
}

export function useChartMotion(): ChartMotion {
  return useTokenMotion(null);
}

export function withMotion<Mark extends { isAnimationActive?: unknown }>(
  written: Mark & { animationDuration?: unknown; animationEasing?: unknown },
  motion: ChartMotion,
): Partial<ChartMotion> {
  const patch: Partial<ChartMotion> = {};
  const active = written.isAnimationActive !== false && motion.isAnimationActive;
  if (written.isAnimationActive !== active) patch.isAnimationActive = active;
  if (written.animationDuration === undefined) patch.animationDuration = motion.animationDuration;
  if (written.animationEasing === undefined) patch.animationEasing = motion.animationEasing;
  return patch;
}
