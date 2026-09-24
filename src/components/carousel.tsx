"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import { useReducedMotion } from "../hooks/environment";
import type { Slots } from "../lib/slots";
import { IconButton } from "./icon-button";

const DEFAULT_INTERVAL = 5000;

type Breakpoint = "base" | "sm" | "md" | "lg" | "xl";
const BREAKPOINTS: Breakpoint[] = ["base", "sm", "md", "lg", "xl"];

const GAP = {
  none: "0px",
  sm: "var(--rc-gap-sm)",
  md: "var(--rc-gap-md)",
  lg: "var(--rc-gap-lg)",
} as const;

export type CarouselLabels = {
  slide: (position: number, total: number) => string;
  indicator: (position: number, total: number) => string;
  previous: string;
  next: string;
  pause: string;
  play: string;
};

const LABELS: CarouselLabels = {
  slide: (position, total) => `Slide ${position} de ${total}`,
  indicator: (position, total) => `Ir para o slide ${position} de ${total}`,
  previous: "Slide anterior",
  next: "Próximo slide",
  pause: "Pausar a rotação",
  play: "Retomar a rotação",
};

export type CarouselProps = Omit<ComponentPropsWithoutRef<"section">, "children"> & {
  /**
   * O nome do carrossel, obrigatorio: vira o `aria-label` da regiao, que o
   * leitor de tela anuncia junto com "carrossel". Diga o assunto ("Planos"),
   * e nao o formato.
   */
  label: string;
  /** Os slides, um filho por slide. Cada filho ganha o papel e o rotulo "Slide 2 de 5". */
  children?: ReactNode;
  /**
   * Quantos slides cabem lado a lado. Numero fixo, objeto por largura de tela
   * (`{ base: 1, sm: 2, lg: 3 }`, com os pontos do Tailwind, e o que falta
   * herda do menor), ou `"auto"`, em que a largura de cada slide sai da
   * classe dele (`classNames.slide` ou o proprio filho). Sem ele, um por vez.
   */
  slidesPerView?: number | Partial<Record<"base" | "sm" | "md" | "lg" | "xl", number>> | "auto";
  /** O vao entre os slides, lido de `--rc-gap-*`: encolhe com a densidade. */
  gap?: "none" | "sm" | "md" | "lg";
  /** O slide da frente, controlado. Conta de zero. Use com `onIndexChange`. */
  index?: number;
  /** O slide da frente ao montar, quando ninguem controla. */
  defaultIndex?: number;
  /**
   * Chamado quando o slide da frente muda: pelos botoes, pelo teclado, pelos
   * indicadores ou pelo arrasto, quando a rolagem assenta.
   */
  onIndexChange?: (index: number) => void;
  /** Mostra os botoes anterior e proximo. Ligado por padrao. */
  controls?: boolean;
  /** Mostra um indicador por posicao, que tambem leva ate ela. Desligado por padrao. */
  indicators?: boolean;
  /** Do ultimo, o proximo volta ao primeiro, e vice-versa. Desligado por padrao. */
  loop?: boolean;
  /**
   * Avanca sozinho: `true` a cada 5 segundos, ou o intervalo em milissegundos.
   * Desligado por padrao. Ligado, aparece o botao de pausa, e a rotacao para
   * com o ponteiro em cima, com o foco dentro e quando o sistema pede para
   * reduzir movimento. Sempre volta ao primeiro depois do ultimo.
   */
  autoplay?: boolean | number;
  /** Os textos que o leitor de tela ouve, para trocar o idioma ou o termo. */
  labels?: Partial<CarouselLabels>;
  classNames?: Slots<
    "viewport" | "slide" | "footer" | "previous" | "next" | "indicators" | "indicator" | "pause"
  >;
};

function perViewVariables(perView: CarouselProps["slidesPerView"]): Record<string, string> {
  if (perView === "auto" || perView === undefined) return {};
  const spec = typeof perView === "number" ? { base: perView } : perView;
  const vars: Record<string, string> = {};
  let last = 1;
  for (const point of BREAKPOINTS) {
    const value = spec[point];
    if (value !== undefined && value >= 1) last = value;
    vars[`--carousel-per-${point}`] = String(last);
  }
  return vars;
}

function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function Carousel({
  label,
  children,
  slidesPerView = 1,
  gap = "md",
  index,
  defaultIndex = 0,
  onIndexChange,
  controls = true,
  indicators = false,
  loop = false,
  autoplay = false,
  labels,
  className,
  classNames,
  style,
  onKeyDown,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: CarouselProps) {
  const text = { ...LABELS, ...labels };
  const slides = Children.toArray(children);
  const total = slides.length;

  const viewportRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<number | null>(null);
  const [inner, setInner] = useState(defaultIndex);
  const [measuredLast, setMeasuredLast] = useState<number | null>(null);
  const lastStart = Math.min(measuredLast ?? total - 1, Math.max(0, total - 1));
  const current = Math.min(Math.max(index ?? inner, 0), lastStart);

  const reduced = useReducedMotion();
  const interval = typeof autoplay === "number" ? autoplay : autoplay ? DEFAULT_INTERVAL : 0;
  const [playing, setPlaying] = useState(interval > 0 && !reduced);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const rotating = interval > 0 && playing && !reduced && !hovered && !focused && total > 1;

  const commit = useCallback(
    (next: number) => {
      if (next === current) return;
      if (index === undefined) setInner(next);
      onIndexChange?.(next);
    },
    [current, index, onIndexChange],
  );

  const go = useCallback(
    (target: number, wrap = loop) => {
      let next = target;
      if (next > lastStart) next = wrap ? 0 : lastStart;
      if (next < 0) next = wrap ? lastStart : 0;
      commit(next);
    },
    [commit, lastStart, loop],
  );

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || viewport.clientWidth === 0) return;
    const nodes = Array.from(viewport.children) as HTMLElement[];
    const end = viewport.scrollWidth - viewport.clientWidth;
    const reachable = nodes.filter((node) => node.offsetLeft <= end + 1).length;
    setMeasuredLast(Math.max(0, reachable - 1));
  }, [total]);

  useEffect(() => {
    measure();
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [measure]);

  const nearest = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return current;
    const nodes = Array.from(viewport.children) as HTMLElement[];
    let best = 0;
    let distance = Number.POSITIVE_INFINITY;
    nodes.forEach((node, position) => {
      const gapToStart = Math.abs(node.offsetLeft - viewport.scrollLeft);
      if (gapToStart < distance) {
        distance = gapToStart;
        best = position;
      }
    });
    const end = viewport.scrollWidth - viewport.clientWidth;
    if (end > 0 && viewport.scrollLeft >= end - 1) return lastStart;
    return best;
  }, [current, lastStart]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const slide = viewport?.children[current] as HTMLElement | undefined;
    if (!viewport || !slide || viewport.clientWidth === 0) return;
    if (nearest() === current) return;
    pendingRef.current = current;
    viewport.scrollTo({ left: slide.offsetLeft, behavior: reduced ? "auto" : "smooth" });
  }, [current, nearest, reduced]);

  function handleScroll() {
    const settled = nearest();
    if (pendingRef.current !== null) {
      if (settled !== pendingRef.current) return;
      pendingRef.current = null;
    }
    commit(settled);
  }

  useEffect(() => {
    if (reduced) setPlaying(false);
  }, [reduced]);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => go(current + 1, true), interval);
    return () => window.clearInterval(timer);
  }, [rotating, interval, go, current]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || isEditable(event.target) || total < 2) return;
    const moves: Record<string, () => void> = {
      ArrowLeft: () => go(current - 1),
      ArrowRight: () => go(current + 1),
      Home: () => go(0, false),
      End: () => go(total - 1, false),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    move();
  }

  const last = lastStart;
  const atStart = !loop && current <= 0;
  const atEnd = !loop && current >= last;
  const perView = perViewVariables(slidesPerView);
  const fixed = slidesPerView !== "auto";
  const positions = Array.from({ length: last + 1 }, (_, position) => position);

  const previousRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const active = document.activeElement;
    if ((atStart && active === previousRef.current) || (atEnd && active === nextRef.current)) {
      viewportRef.current?.focus();
    }
  }, [atStart, atEnd]);

  const navigable = total > 1 && last > 0;

  return (
    <section
      aria-roledescription="carrossel"
      aria-label={label}
      {...props}
      data-index={current}
      style={{ ...perView, "--carousel-gap": GAP[gap], ...style } as CSSProperties}
      onKeyDown={handleKeyDown}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        setHovered(false);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        setFocused(true);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      className={cn("flex min-w-0 flex-col gap-3 font-sans", className)}
    >
      <div
        ref={viewportRef}
        tabIndex={navigable ? 0 : undefined}
        onScroll={handleScroll}
        onPointerDown={() => {
          pendingRef.current = null;
        }}
        onWheel={() => {
          pendingRef.current = null;
        }}
        className={cn(
          "relative flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain",
          "gap-[var(--carousel-gap)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          fixed && "[--carousel-per:var(--carousel-per-base)]",
          fixed && "sm:[--carousel-per:var(--carousel-per-sm)]",
          fixed && "md:[--carousel-per:var(--carousel-per-md)]",
          fixed && "lg:[--carousel-per:var(--carousel-per-lg)]",
          fixed && "xl:[--carousel-per:var(--carousel-per-xl)]",
          classNames?.viewport,
        )}
      >
        {slides.map((slide, position) => (
          <div
            key={position}
            role="group"
            aria-roledescription="slide"
            aria-label={text.slide(position + 1, total)}
            data-active={position === current || undefined}
            className={cn(
              "min-w-0 shrink-0 snap-start",
              fixed &&
                "basis-[calc((100%_-_(var(--carousel-per)_-_1)_*_var(--carousel-gap))_/_var(--carousel-per))]",
              classNames?.slide,
            )}
          >
            {slide}
          </div>
        ))}
      </div>

      {navigable && (
        <p aria-live={rotating ? "off" : "polite"} className="sr-only">
          {text.slide(current + 1, total)}
        </p>
      )}

      {navigable && (controls || indicators || interval > 0) && (
        <div className={cn("flex items-center justify-center gap-2", classNames?.footer)}>
          {interval > 0 && (
            <IconButton
              size="sm"
              variant="ghost"
              label={playing ? text.pause : text.play}
              onClick={() => setPlaying((value) => !value)}
              className={classNames?.pause}
            >
              {playing ? <Pause /> : <Play />}
            </IconButton>
          )}

          {controls && (
            <IconButton
              ref={previousRef}
              size="sm"
              variant="secondary"
              label={text.previous}
              disabled={atStart}
              onClick={() => go(current - 1)}
              className={classNames?.previous}
            >
              <ChevronLeft />
            </IconButton>
          )}

          {indicators && (
            <div
              className={cn("flex flex-wrap items-center justify-center", classNames?.indicators)}
            >
              {positions.map((position) => {
                const active = position === current;
                return (
                  <button
                    key={position}
                    type="button"
                    aria-label={text.indicator(position + 1, total)}
                    aria-current={active || undefined}
                    onClick={() => go(position, false)}
                    className={cn(
                      "group/dot flex size-6 items-center justify-center rounded-pill",
                      "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      classNames?.indicator,
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-2 rounded-pill transition-[width,background-color]",
                        "duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
                        active
                          ? "w-4 bg-accent-text"
                          : "w-2 bg-border-strong group-hover/dot:bg-fg-muted",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {controls && (
            <IconButton
              ref={nextRef}
              size="sm"
              variant="secondary"
              label={text.next}
              disabled={atEnd}
              onClick={() => go(current + 1)}
              className={classNames?.next}
            >
              <ChevronRight />
            </IconButton>
          )}
        </div>
      )}
    </section>
  );
}
