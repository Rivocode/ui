"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { useReducedMotion } from "../hooks/environment";
import { cn } from "../lib/cn";
import { focusIsLost } from "../lib/focus";
import { isTypingTarget } from "../lib/hotkey";
import { layerLevel, layerStyle, LayerProvider, useParentLayer } from "../lib/layer";
import { FLOATING_SIDE_OFFSET } from "../lib/positioning";
import { useMobile } from "../lib/screen";
import type { Slots } from "../lib/slots";
import { useRivoContext } from "../provider/rivo-provider";
import { Button } from "./button";
import {
  missingTargetComplaint,
  planTourMove,
  TOUR_LABELS,
  TOUR_SPOTLIGHT_PADDING,
  type TourDirection,
  type TourLabels,
} from "../shared/tour";
import { floatingPanel } from "./menu";

export type { TourLabels };

export type TourPlacement = "top" | "bottom" | "left" | "right";

export type TourStep = {
  /**
   * O elemento destacado: um seletor CSS (`"#novo-cliente"`) ou um ref. E
   * lido quando o passo abre, entao o alvo pode nascer depois do tour. Alvo
   * que nao existe pula o passo, com aviso em desenvolvimento.
   */
  target: string | RefObject<Element | null>;
  /** O titulo do balao. Vira o nome do dialogo para o leitor de tela. */
  title: string;
  /** O texto do passo. Vira a descricao do dialogo. */
  description?: ReactNode;
  /**
   * O lado do alvo onde o balao prefere nascer. Padrao `bottom`; vira sozinho
   * quando nao cabe. No celular nao vale: o balao e folha de baixo.
   */
  placement?: TourPlacement;
  /** Conteudo extra no balao, acima dos botoes: um link para a doc, um atalho. */
  action?: ReactNode;
};

type Box = { top: number; left: number; width: number; height: number };

function joinLayers(...levels: (string | null)[]): string | null {
  const present = levels.filter((level): level is string => level !== null);
  if (present.length === 0) return null;
  if (present.length === 1) return present[0]!;
  return `max(${present.join(", ")})`;
}

function layerOf(element: Element | null): string | null {
  return element?.closest("[data-rc-layer]")?.getAttribute("data-rc-layer") ?? null;
}

export type TourProps = {
  /** Os passos, na ordem. Cada um destaca um alvo e explica o que ele faz. */
  steps: TourStep[];
  /** Aberto, controlado. Use com `onOpenChange`. */
  open?: boolean;
  /** Aberto ao montar, quando ninguem controla. */
  defaultOpen?: boolean;
  /** Avisa toda abertura e todo fechamento: concluir, pular e `Esc`. */
  onOpenChange?: (open: boolean) => void;
  /** O passo atual, controlado. Conta de zero. Use com `onStepChange`. */
  step?: number;
  /** O passo de partida, quando ninguem controla. Cada abertura recomeca dele. */
  defaultStep?: number;
  /** Chamado a cada troca de passo: Voltar, Proximo, setas e passo pulado por falta de alvo. */
  onStepChange?: (step: number) => void;
  /** Chamado no Concluir do ultimo passo. Nao e chamado ao pular. */
  onFinish?: () => void;
  /** Chamado no "Pular tour" e no `Esc`, com o passo em que a pessoa desistiu. */
  onSkip?: (step: number) => void;
  /**
   * Deixa o alvo clicavel atraves do recorte da mascara. Desligado por
   * padrao: o resto da tela nunca recebe clique enquanto o tour esta aberto.
   */
  interactive?: boolean;
  /** Os textos dos botoes e do contador, para trocar o idioma ou o termo. */
  labels?: Partial<TourLabels>;
  /** Veste o balao, seja o flutuante da mesa ou a folha do celular. */
  className?: string;
  /**
   * Classe por parte: `mask`, `spotlight`, `counter`, `title`, `description`,
   * `footer`. A mascara e irma do balao no portal, e so se alcanca por aqui.
   */
  classNames?: Slots<"mask" | "spotlight" | "counter" | "title" | "description" | "footer">;
};

function resolveTarget(target: TourStep["target"] | undefined): Element | null {
  if (!target || typeof document === "undefined") return null;
  if (typeof target === "string") {
    try {
      return document.querySelector(target);
    } catch {
      return null;
    }
  }
  const element = target.current;
  return element && element.isConnected ? element : null;
}

function complain(index: number, target: TourStep["target"]) {
  if (process.env.NODE_ENV === "production") return;
  console.warn(missingTargetComplaint(index, typeof target === "string" ? `"${target}"` : "ref"));
}

function usesArrows(target: EventTarget | null) {
  if (isTypingTarget(target) || target instanceof HTMLInputElement) return true;
  if (!(target instanceof HTMLElement)) return false;
  const role = target.getAttribute("role");
  return role === "slider" || role === "spinbutton" || role === "combobox";
}

function sameBox(a: Box | null, b: Box) {
  return (
    a !== null &&
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.height === b.height
  );
}

function useTrackedBox(element: Element | null): Box | null {
  const [box, setBox] = useState<Box | null>(null);

  useLayoutEffect(() => {
    if (!element) {
      setBox(null);
      return;
    }

    let frame = 0;
    const read = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const next = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
      setBox((current) => (sameBox(current, next) ? current : next));
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(element);

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, [element]);

  return box;
}

function needsScroll(element: Element, isMobile: boolean) {
  const rect = element.getBoundingClientRect();
  const height = window.innerHeight;
  const bottomLimit = isMobile ? height * 0.5 : height;
  return rect.top < 0 || rect.bottom > bottomLimit || rect.left < 0 || rect.right > window.innerWidth;
}

function TourMask({
  box,
  interactive,
  container,
  layer,
  className,
  spotlightClassName,
}: {
  box: Box | null;
  interactive: boolean;
  container: HTMLElement | null;
  layer: string | null;
  className?: string;
  spotlightClassName?: string;
}) {
  if (typeof document === "undefined") return null;

  const hole = box && {
    top: box.top - TOUR_SPOTLIGHT_PADDING,
    left: box.left - TOUR_SPOTLIGHT_PADDING,
    width: box.width + TOUR_SPOTLIGHT_PADDING * 2,
    height: box.height + TOUR_SPOTLIGHT_PADDING * 2,
  };

  const blockers: CSSProperties[] =
    hole && interactive
      ? [
          { top: 0, left: 0, right: 0, height: Math.max(0, hole.top) },
          { top: hole.top + hole.height, left: 0, right: 0, bottom: 0 },
          { top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height },
          { top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height },
        ]
      : [{ inset: 0 }];

  return createPortal(
    <div
      aria-hidden="true"
      data-tour-mask=""
      style={layerStyle("overlay", layer)}
      className={cn(
        "pointer-events-none fixed inset-0 z-[var(--rc-z-overlay)] overflow-hidden",
        !hole && "bg-overlay",
        className,
      )}
    >
      {hole && (
        <div
          data-tour-spotlight=""
          className={cn(
            "absolute rounded-[var(--rc-radius-md)]",
            "shadow-[0_0_0_200vmax_var(--rc-overlay)]",
            spotlightClassName,
          )}
          style={hole}
        />
      )}
      {blockers.map((style, index) => (
        <div key={index} className="pointer-events-auto absolute" style={style} />
      ))}
    </div>,
    container ?? document.body,
  );
}

export function Tour({
  steps,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  step: stepProp,
  defaultStep = 0,
  onStepChange,
  onFinish,
  onSkip,
  interactive = false,
  labels,
  className,
  classNames,
}: TourProps) {
  const text = { ...TOUR_LABELS, ...labels };
  const { portalContainer } = useRivoContext();
  const isMobile = useMobile();
  const reduced = useReducedMotion();

  const [selfOpen, setSelfOpen] = useState(defaultOpen);
  const [selfStep, setSelfStep] = useState(defaultStep);
  const [element, setElement] = useState<Element | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [lost, setLost] = useState(0);
  const directionRef = useRef<TourDirection>(1);
  const returnRef = useRef<Element | null>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const warnedRef = useRef(new Set<number>());
  const shownRef = useRef<number | null>(null);
  const wasOpenRef = useRef(false);
  const labelId = useId();
  const descriptionId = useId();

  const open = openProp ?? selfOpen;
  const total = steps.length;
  const current = Math.min(Math.max(stepProp ?? selfStep, 0), Math.max(total - 1, 0));
  const active = steps[current];
  const isLast = current === total - 1;
  const box = useTrackedBox(open ? element : null);
  const outer = useParentLayer();
  const layer = joinLayers(outer, layerOf(element));
  const level = layerLevel("popover", layer, 2);

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setSelfOpen(next);
      if (!next && stepProp === undefined) setSelfStep(defaultStep);
      onOpenChange?.(next);
    },
    [defaultStep, onOpenChange, openProp, stepProp],
  );

  const goTo = useCallback(
    (next: number) => {
      if (next === current) return;
      directionRef.current = next > current ? 1 : -1;
      if (stepProp === undefined) setSelfStep(next);
      onStepChange?.(next);
    },
    [current, onStepChange, stepProp],
  );

  const finish = useCallback(() => {
    setOpen(false);
    onFinish?.();
  }, [onFinish, setOpen]);

  const skip = useCallback(() => {
    setOpen(false);
    onSkip?.(current);
  }, [current, onSkip, setOpen]);

  useLayoutEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      setElement(null);
      warnedRef.current.clear();
      shownRef.current = null;
      directionRef.current = 1;
      return;
    }

    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      returnRef.current = document.activeElement;
    }

    const move = planTourMove(
      current,
      total,
      directionRef.current,
      shownRef.current !== null,
      (index) => resolveTarget(steps[index]?.target) !== null,
      (index) => {
        if (warnedRef.current.has(index)) return;
        warnedRef.current.add(index);
        complain(index, steps[index]!.target);
      },
    );

    if (move.kind === "show") {
      setElement(resolveTarget(active?.target));
    } else if (move.kind === "go") {
      goTo(move.step);
    } else if (move.kind === "finish") {
      finish();
    } else {
      setElement(null);
      setOpen(false);
    }
  }, [open, current, total, active, steps, goTo, finish, setOpen, lost]);

  useEffect(() => {
    if (!open || !element || typeof MutationObserver === "undefined") return;
    const root = element.ownerDocument.body;
    const observer = new MutationObserver(() => {
      if (!element.isConnected) setLost((count) => count + 1);
    });
    observer.observe(root, { childList: true, subtree: true });
    if (!element.isConnected) setLost((count) => count + 1);
    return () => observer.disconnect();
  }, [open, element]);

  useEffect(() => {
    if (!open || !element) return;

    if (shownRef.current !== null && shownRef.current !== current && active) {
      setAnnouncement(`${text.counter(current + 1, total)}. ${active.title}`);
    }
    shownRef.current = current;

    if (typeof element.scrollIntoView === "function" && needsScroll(element, isMobile)) {
      element.scrollIntoView({
        block: isMobile ? "start" : "center",
        inline: "nearest",
        behavior: reduced ? "auto" : "smooth",
      });
    }

    if (focusIsLost(document.activeElement)) primaryRef.current?.focus();
  }, [element, current]);

  useEffect(() => {
    if (open) return;
    setAnnouncement("");
    const back = returnRef.current;
    if (!(back instanceof HTMLElement)) return;
    const frame = requestAnimationFrame(() => {
      if (back.isConnected && focusIsLost(document.activeElement)) back.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const bottomEdge = useMemo(
    () => ({
      getBoundingClientRect: () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        return {
          x: 0,
          y: height,
          top: height,
          left: 0,
          right: width,
          bottom: height,
          width,
          height: 0,
          toJSON: () => ({}),
        } as DOMRect;
      },
    }),
    [],
  );

  function handleOpenChange(next: boolean, details: { reason: string }) {
    if (next) return;
    if (details.reason === "escape-key" || details.reason === "close-press") skip();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.defaultPrevented || usesArrows(event.target)) return;
    if (event.key === "ArrowRight" && !isLast) {
      event.preventDefault();
      goTo(current + 1);
    } else if (event.key === "ArrowLeft" && current > 0) {
      event.preventDefault();
      goTo(current - 1);
    }
  }

  const visible = open && element !== null && active !== undefined;
  const size = isMobile ? "md" : "sm";

  return (
    <>
      {visible && (
        <TourMask
          box={box}
          interactive={interactive}
          container={portalContainer}
          layer={layer}
          className={classNames?.mask}
          spotlightClassName={classNames?.spotlight}
        />
      )}
      <BasePopover.Root open={visible} onOpenChange={handleOpenChange} modal="trap-focus">
        <BasePopover.Portal container={portalContainer ?? undefined}>
          <BasePopover.Positioner
            anchor={isMobile ? bottomEdge : element}
            side={isMobile ? "top" : (active?.placement ?? "bottom")}
            align="center"
            sideOffset={isMobile ? 0 : FLOATING_SIDE_OFFSET + TOUR_SPOTLIGHT_PADDING}
            collisionPadding={isMobile ? 0 : 8}
            positionMethod={isMobile ? "fixed" : "absolute"}
            data-rc-layer={level}
            style={layerStyle("popover", layer, 2)}
            className="z-[var(--rc-z-popover)] outline-none"
          >
            <BasePopover.Popup
              aria-labelledby={labelId}
              aria-describedby={active?.description ? descriptionId : undefined}
              initialFocus={primaryRef}
              finalFocus={() => {
                const back = returnRef.current;
                return back instanceof HTMLElement && back.isConnected ? back : true;
              }}
              onKeyDown={handleKeyDown}
              data-tour-popup=""
              className={cn(
                floatingPanel,
                "wrap-anywhere",
                isMobile
                  ? cn(
                      "w-screen max-w-none rounded-t-xl rounded-b-none border-x-0 border-b-0",
                      "p-[var(--rc-pad-panel)] pb-[max(1.5rem,env(safe-area-inset-bottom))]",
                    )
                  : "w-[min(22rem,calc(100vw-2rem))] p-[var(--rc-pad-panel-sm)]",
                className,
              )}
            >
              {isMobile && (
                <div
                  aria-hidden="true"
                  className="mx-auto mb-4 h-1 w-10 rounded-pill bg-border-strong"
                />
              )}
              <p className={cn("text-xs font-rc-medium text-fg-muted", classNames?.counter)}>
                {text.counter(current + 1, total)}
              </p>
              <h2
                id={labelId}
                className={cn(
                  "mt-1 font-display font-rc-display text-base leading-[var(--rc-leading-tight)] tracking-tight text-fg",
                  classNames?.title,
                )}
              >
                {active?.title}
              </h2>
              {active?.description && (
                <div
                  id={descriptionId}
                  className={cn("mt-1 text-sm text-fg-muted", classNames?.description)}
                >
                  {active.description}
                </div>
              )}
              {active?.action && (
                <div className="mt-3">
                  <LayerProvider level={level}>{active.action}</LayerProvider>
                </div>
              )}
              <div role="status" aria-live="polite" className="sr-only">
                {announcement}
              </div>
              <div
                className={cn(
                  "mt-4 flex flex-wrap items-center justify-end gap-2",
                  classNames?.footer,
                )}
              >
                <BasePopover.Close
                  render={<Button type="button" variant="ghost" size={size} />}
                  className="mr-auto"
                >
                  {text.skip}
                </BasePopover.Close>
                {current > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size={size}
                    onClick={() => goTo(current - 1)}
                  >
                    {text.back}
                  </Button>
                )}
                <Button
                  ref={primaryRef}
                  type="button"
                  size={size}
                  onClick={isLast ? finish : () => goTo(current + 1)}
                >
                  {isLast ? text.finish : text.next}
                </Button>
              </div>
            </BasePopover.Popup>
          </BasePopover.Positioner>
        </BasePopover.Portal>
      </BasePopover.Root>
    </>
  );
}
