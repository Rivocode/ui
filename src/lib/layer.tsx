"use client";

import { createContext, use, useMemo, type CSSProperties, type ReactNode } from "react";

export type LayerToken = "dropdown" | "overlay" | "dialog" | "popover" | "tooltip";

const LayerContext = createContext<readonly string[]>([]);

export function useParentLayer(): string | null {
  return use(LayerContext).at(-1) ?? null;
}

export function useLayerChain(): readonly string[] {
  return use(LayerContext);
}

export function layerLevel(token: LayerToken, parent: string | null, step = 1): string {
  const own = `var(--rc-z-${token})`;
  return parent === null ? own : `max(${own}, calc(${parent} + ${step}))`;
}

type StyleProp<State> = CSSProperties | ((state: State) => CSSProperties | undefined) | undefined;

export function layerStyle(
  token: LayerToken,
  parent: string | null,
  step?: number,
  style?: CSSProperties,
): CSSProperties | undefined;
export function layerStyle<State>(
  token: LayerToken,
  parent: string | null,
  step: number,
  style: StyleProp<State>,
): StyleProp<State>;
export function layerStyle<State>(
  token: LayerToken,
  parent: string | null,
  step = 1,
  style?: StyleProp<State>,
): StyleProp<State> {
  if (parent === null) return style;
  const zIndex = layerLevel(token, parent, step);
  if (typeof style === "function") return (state: State) => ({ zIndex, ...style(state) });
  return { zIndex, ...style };
}

export function LayerProvider({ level, children }: { level: string; children: ReactNode }) {
  const chain = use(LayerContext);
  const value = useMemo(() => [...chain, level], [chain, level]);
  return <LayerContext value={value}>{children}</LayerContext>;
}
