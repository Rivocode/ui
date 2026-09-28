"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import { useElementSize } from "../hooks/element-size";
import { cn } from "../lib/cn";
import { useRivoContext } from "../provider/rivo-provider";

export type AffixOffset = number | string;

export type AffixPosition = {
  top?: AffixOffset;
  right?: AffixOffset;
  bottom?: AffixOffset;
  left?: AffixOffset;
};

export type AffixLayer = "sticky" | "dropdown" | "overlay";

const LAYER: Record<AffixLayer, string> = {
  sticky: "z-[var(--rc-z-sticky)]",
  dropdown: "z-[var(--rc-z-dropdown)]",
  overlay: "z-[var(--rc-z-overlay)]",
};

const GAP = 8;

type Side = "top" | "bottom";

const reservations = new Map<object, { side: Side; size: number }>();
let saved: { top: string; bottom: string } | null = null;

function applyReservations(root: HTMLElement) {
  if (reservations.size === 0) {
    if (saved) {
      root.style.scrollPaddingTop = saved.top;
      root.style.scrollPaddingBottom = saved.bottom;
      saved = null;
    }
    return;
  }
  if (!saved) saved = { top: root.style.scrollPaddingTop, bottom: root.style.scrollPaddingBottom };
  let top = 0;
  let bottom = 0;
  for (const { side, size } of reservations.values()) {
    if (side === "top") top = Math.max(top, size);
    else bottom = Math.max(bottom, size);
  }
  root.style.scrollPaddingTop = top ? `${Math.ceil(top)}px` : saved.top;
  root.style.scrollPaddingBottom = bottom ? `${Math.ceil(bottom)}px` : saved.bottom;
}

const toLength = (value: AffixOffset | undefined) =>
  typeof value === "number" ? `${value}px` : value;

export type AffixProps = ComponentPropsWithoutRef<"div"> & {
  /**
   * Onde a peca gruda, em cada lado: numero e pixel, texto e qualquer medida
   * do CSS (`"var(--rc-pad-panel)"`, `"2rem"`). Lado sem valor fica solto.
   */
  position?: AffixPosition;
  /**
   * Em relacao a que a peca gruda. `fixed` e a janela, e e o padrao;
   * `absolute` e o ancestral posicionado mais proximo, para grudar numa caixa
   * que rola por dentro, e nesse caso nao ha portal.
   */
  strategy?: "fixed" | "absolute";
  /**
   * Renderiza no container de portal do `RivoProvider`, fora da arvore. Livra
   * a peca de ancestral com `transform` ou `overflow`, que prenderiam o
   * `fixed`. So vale com `strategy="fixed"`.
   */
  withinPortal?: boolean;
  /** A camada de empilhamento, lida de `--rc-z-*`. `sticky` fica abaixo de menu, folha e dialogo. */
  layer?: AffixLayer;
  /**
   * Reserva a altura da peca no `scroll-padding` da pagina, do lado em que ela
   * gruda, para o foco do teclado nunca parar escondido atras dela. Ligado por
   * padrao; so vale com `strategy="fixed"`.
   */
  reserveSpace?: boolean;
};

export function Affix({
  position = { bottom: "var(--rc-pad-panel)", right: "var(--rc-pad-panel)" },
  strategy = "fixed",
  withinPortal = true,
  layer = "sticky",
  reserveSpace = true,
  className,
  style,
  children,
  ...props
}: AffixProps) {
  const { portalContainer } = useRivoContext();
  const { ref: measure, height } = useElementSize<HTMLDivElement>();
  const node = useRef<HTMLDivElement | null>(null);
  const owner = useRef({});
  const side: Side | null =
    position.top !== undefined ? "top" : position.bottom !== undefined ? "bottom" : null;
  const reserving = reserveSpace && strategy === "fixed" && side !== null;

  useEffect(() => {
    const element = node.current;
    if (!reserving || !element || !side) return;
    const root = element.ownerDocument.documentElement;
    const key = owner.current;
    const rect = element.getBoundingClientRect();
    const viewport = element.ownerDocument.defaultView?.innerHeight ?? 0;
    const size = side === "top" ? rect.bottom : viewport - rect.top;
    reservations.set(key, { side, size: Math.max(0, size) + GAP });
    applyReservations(root);
    return () => {
      reservations.delete(key);
      applyReservations(root);
    };
  }, [reserving, side, height, portalContainer, position.top, position.bottom]);

  const portaled = strategy === "fixed" && withinPortal;
  if (portaled && !portalContainer) return null;

  const content = (
    <div
      {...props}
      ref={(element) => {
        node.current = element;
        measure(element);
      }}
      data-slot="affix"
      className={cn(strategy === "fixed" ? "fixed" : "absolute", LAYER[layer], className)}
      style={
        {
          top: toLength(position.top),
          right: toLength(position.right),
          bottom: toLength(position.bottom),
          left: toLength(position.left),
          ...style,
        } satisfies CSSProperties
      }
    >
      {children}
    </div>
  );

  return portaled && portalContainer ? createPortal(content, portalContainer) : content;
}
