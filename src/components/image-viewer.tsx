"use client";

import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { ZOOM_REST, ZOOM_STEP, clampZoom, zoomAround, type ZoomView } from "../shared/zoom";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "./dialog";
import { IconButton } from "./icon-button";
import { Spinner } from "./spinner";

const SWIPE = 50;

const CONTROL = cn(
  "border border-media-border bg-media-control text-media-fg",
  "hover:border-media-fg hover:bg-media-control",
  "focus-visible:ring-media-fg focus-visible:ring-offset-media-stage",
  "not-data-loading:disabled:border-media-disabled not-data-loading:disabled:bg-media-control",
  "not-data-loading:disabled:text-media-disabled",
);
const PAN_STEP = 40;

export type ImageViewerImage = {
  src: string;
  alt: string;
  caption?: ReactNode;
  thumbnail?: string;
};

export type ImageViewerLabels = {
  title: string;
  counter: (position: number, total: number) => string;
  previous: string;
  next: string;
  close: string;
  zoomIn: string;
  zoomOut: string;
  loading: string;
  error: string;
};

const LABELS: ImageViewerLabels = {
  title: "Visualizador de imagens",
  counter: (position, total) => `${position} de ${total}`,
  previous: "Imagem anterior",
  next: "Próxima imagem",
  close: "Fechar",
  zoomIn: "Aumentar o zoom",
  zoomOut: "Diminuir o zoom",
  loading: "Carregando a imagem",
  error: "Não foi possível carregar a imagem.",
};

export type ImageViewerProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /**
   * As imagens, na ordem da navegacao. `alt` e obrigatorio em cada uma: e o
   * nome da miniatura e o que o leitor de tela ouve ao trocar de imagem.
   * `thumbnail` e a versao pequena da grade; sem ela, a grade usa o `src`.
   */
  images: ImageViewerImage[];
  /**
   * A imagem aberta, controlada: o indice, contando de zero, ou `null` com o
   * visualizador fechado. Use com `onIndexChange`.
   */
  index?: number | null;
  /** A imagem aberta ao montar, quando ninguem controla. Sem ela, nasce fechado. */
  defaultIndex?: number | null;
  /** Chamado ao abrir, ao navegar e com `null` ao fechar. */
  onIndexChange?: (index: number | null) => void;
  /**
   * Desenha a grade de miniaturas que abre o visualizador. Ligada por padrao;
   * desligada, quem abre e o `index` controlado, e o foco volta para onde
   * estava.
   */
  thumbnails?: boolean;
  /** Da ultima, a proxima volta a primeira, e vice-versa. */
  loop?: boolean;
  /** O zoom maximo, em vezes o tamanho que cabe na tela. Sem ele, 4. */
  maxZoom?: number;
  /** Os textos da peca, para trocar o idioma ou o termo. */
  labels?: Partial<ImageViewerLabels>;
  classNames?: Slots<
    "thumbnails" | "thumbnail" | "viewer" | "toolbar" | "counter" | "stage" | "image" | "caption"
  >;
};

export function ImageViewer({
  images,
  index,
  defaultIndex = null,
  onIndexChange,
  thumbnails = true,
  loop = false,
  maxZoom = 4,
  labels,
  className,
  classNames,
  ...props
}: ImageViewerProps) {
  const text = { ...LABELS, ...labels };
  const total = images.length;
  const [inner, setInner] = useState<number | null>(defaultIndex);
  const wanted = index === undefined ? inner : index;
  const current = wanted !== null && wanted >= 0 && wanted < total ? wanted : null;
  const image = current === null ? undefined : images[current];

  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const shownRef = useRef<number | null>(current);
  if (current !== null) shownRef.current = current;

  const [view, setView] = useState<ZoomView>(ZOOM_REST);
  const viewRef = useRef(view);
  viewRef.current = view;
  const [settled, setSettled] = useState<{ src: string; state: "ready" | "error" } | null>(null);
  const status = image && settled?.src === image.src ? settled.state : "loading";
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    start: { x: number; y: number };
    view: ZoomView;
    distance: number;
  } | null>(null);

  function change(next: number | null) {
    if (next === current) return;
    if (index === undefined) setInner(next);
    onIndexChange?.(next);
  }

  function step(delta: number) {
    if (current === null) return;
    let next = current + delta;
    if (next >= total) next = loop ? 0 : total - 1;
    if (next < 0) next = loop ? total - 1 : 0;
    change(next);
  }

  useEffect(() => {
    setView(ZOOM_REST);
  }, [current]);

  useEffect(() => {
    if (current === null || typeof window === "undefined") return;
    const neighbors = [current - 1, current + 1].map((position) =>
      loop ? (position + total) % total : position,
    );
    for (const position of neighbors) {
      const neighbor = images[position];
      if (!neighbor || position === current) continue;
      const preload = new window.Image();
      preload.src = neighbor.src;
    }
  }, [current, images, loop, total]);

  function stageSize() {
    const rect = stage?.getBoundingClientRect();
    return { width: rect?.width ?? 0, height: rect?.height ?? 0 };
  }

  function zoomAt(target: number, dx = 0, dy = 0) {
    const { width, height } = stageSize();
    setView(zoomAround(viewRef.current, target, dx, dy, maxZoom, width, height));
  }

  function clampView(next: ZoomView): ZoomView {
    const { width, height } = stageSize();
    return clampZoom(next, maxZoom, width, height);
  }

  function fromCenter(clientX: number, clientY: number) {
    const rect = stage?.getBoundingClientRect();
    if (!rect) return { dx: 0, dy: 0 };
    return { dx: clientX - rect.left - rect.width / 2, dy: clientY - rect.top - rect.height / 2 };
  }

  useEffect(() => {
    if (!stage) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const { dx, dy } = fromCenter(event.clientX, event.clientY);
      zoomAt(viewRef.current.zoom * Math.exp(-event.deltaY * 0.01), dx, dy);
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [stage, maxZoom]);

  function pan(dx: number, dy: number) {
    const from = viewRef.current;
    setView(clampView({ zoom: from.zoom, x: from.x + dx, y: from.y + dy }));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const zoomed = view.zoom > 1;
    const moves: Record<string, () => void> = {
      ArrowLeft: () => (zoomed ? pan(PAN_STEP, 0) : step(-1)),
      ArrowRight: () => (zoomed ? pan(-PAN_STEP, 0) : step(1)),
      ...(zoomed && {
        ArrowUp: () => pan(0, PAN_STEP),
        ArrowDown: () => pan(0, -PAN_STEP),
      }),
      PageUp: () => step(-1),
      PageDown: () => step(1),
      "+": () => zoomAt(view.zoom * ZOOM_STEP),
      "=": () => zoomAt(view.zoom * ZOOM_STEP),
      "-": () => zoomAt(view.zoom / ZOOM_STEP),
      "0": () => setView(ZOOM_REST),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    move();
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    const [a, b] = points;
    gesture.current = {
      start: { x: event.clientX, y: event.clientY },
      view: viewRef.current,
      distance: a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0,
    };
    setDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const [a, b] = [...pointers.current.values()];
    const start = gesture.current;

    if (a && b && start.distance > 0) {
      const { dx, dy } = fromCenter((a.x + b.x) / 2, (a.y + b.y) / 2);
      viewRef.current = start.view;
      zoomAt(start.view.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / start.distance), dx, dy);
      return;
    }

    if (start.view.zoom > 1) {
      setView(
        clampView({
          zoom: start.view.zoom,
          x: start.view.x + event.clientX - start.start.x,
          y: start.view.y + event.clientY - start.start.y,
        }),
      );
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    const start = gesture.current;
    if (pointers.current.size > 0) {
      gesture.current = { ...start!, view: viewRef.current, distance: 0 };
      return;
    }
    gesture.current = null;
    setDragging(false);
    if (!start || start.view.zoom > 1 || start.distance > 0) return;
    const dx = event.clientX - start.start.x;
    const dy = event.clientY - start.start.y;
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
  }

  function handleDoubleClick(event: { clientX: number; clientY: number }) {
    if (view.zoom > 1) {
      setView(ZOOM_REST);
      return;
    }
    const { dx, dy } = fromCenter(event.clientX, event.clientY);
    zoomAt(2, dx, dy);
  }

  const atStart = !loop && current === 0;
  const atEnd = !loop && current === total - 1;
  const zoomOutOff = view.zoom <= 1;
  const zoomInOff = view.zoom >= maxZoom || status !== "ready";

  const previousRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const zoomOutRef = useRef<HTMLButtonElement>(null);
  const zoomInRef = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const active = document.activeElement;
    const stranded = [previousRef, nextRef, zoomOutRef, zoomInRef].some(
      (ref) => ref.current !== null && ref.current === active && ref.current.disabled,
    );
    if (stranded) stage?.focus();
  }, [atStart, atEnd, zoomOutOff, zoomInOff, stage]);

  if (total === 0) return null;

  const counter = current === null ? "" : text.counter(current + 1, total);

  return (
    <div {...props} className={cn("font-sans", className)}>
      {thumbnails && (
        <ul
          className={cn(
            "grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-[var(--rc-gap-sm)]",
            classNames?.thumbnails,
          )}
        >
          {images.map((item, position) => (
            <li key={`${item.src}-${position}`}>
              <button
                ref={(node) => {
                  thumbRefs.current[position] = node;
                }}
                type="button"
                aria-haspopup="dialog"
                onClick={() => change(position)}
                className={cn(
                  "group/thumb block w-full cursor-zoom-in overflow-hidden rounded-md",
                  "border border-border bg-skeleton outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                  classNames?.thumbnail,
                )}
              >
                <img
                  src={item.thumbnail ?? item.src}
                  alt={item.alt}
                  loading="lazy"
                  className={cn(
                    "aspect-square w-full object-cover",
                    "transition-transform duration-[var(--rc-duration-base)] ease-[var(--rc-ease)]",
                    "motion-safe:group-hover/thumb:scale-105",
                  )}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={current !== null}
        onOpenChange={(open) => {
          if (!open) change(null);
        }}
      >
        <DialogContent
          onKeyDown={handleKeyDown}
          finalFocus={() => {
            const shown = shownRef.current;
            return (shown === null ? null : thumbRefs.current[shown]) ?? true;
          }}
          className={cn(
            "inset-0 top-0 left-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0",
            "max-h-none overflow-hidden rounded-none border-0 bg-media-stage p-0 text-media-fg shadow-none",
            "max-sm:top-0 max-sm:rounded-none max-sm:border-0",
            classNames?.viewer,
          )}
        >
          <DialogTitle className="sr-only">{text.title}</DialogTitle>
          <p aria-live="polite" className="sr-only">
            {image ? `${counter}: ${image.alt}` : ""}
          </p>

          <div
            className={cn(
              "flex items-center gap-2 px-[var(--rc-pad-panel)] py-3",
              classNames?.toolbar,
            )}
          >
            <p
              aria-hidden="true"
              className={cn("text-sm text-media-fg-muted tabular-nums", classNames?.counter)}
            >
              {counter}
            </p>
            <div className="ml-auto flex items-center gap-2">
              <IconButton
                size="sm"
                variant="secondary"
                ref={zoomOutRef}
                label={text.zoomOut}
                disabled={zoomOutOff}
                className={CONTROL}
                onClick={() => zoomAt(view.zoom / ZOOM_STEP)}
              >
                <ZoomOut />
              </IconButton>
              <IconButton
                size="sm"
                variant="secondary"
                ref={zoomInRef}
                label={text.zoomIn}
                disabled={zoomInOff}
                className={CONTROL}
                onClick={() => zoomAt(view.zoom * ZOOM_STEP)}
              >
                <ZoomIn />
              </IconButton>
              <DialogClose
                render={
                  <IconButton size="sm" variant="secondary" label={text.close} className={CONTROL}>
                    <X />
                  </IconButton>
                }
              />
            </div>
          </div>

          <div
            ref={setStage}
            tabIndex={-1}
            aria-busy={status === "loading" || undefined}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onDoubleClick={handleDoubleClick}
            className={cn(
              "relative min-h-0 flex-1 touch-none overflow-hidden outline-none select-none",
              "focus-visible:ring-2 focus-visible:ring-media-fg focus-visible:ring-inset",
              view.zoom > 1 ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in",
              classNames?.stage,
            )}
          >
            {image && (
              <div className="absolute inset-0 flex items-center justify-center p-2 sm:px-16">
                <img
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  draggable={false}
                  onLoad={() => setSettled({ src: image.src, state: "ready" })}
                  onError={() => setSettled({ src: image.src, state: "error" })}
                  style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
                  className={cn(
                    "max-h-full max-w-full object-contain",
                    !dragging &&
                      "transition-transform duration-[var(--rc-duration-base)] ease-[var(--rc-ease)]",
                    "motion-reduce:transition-none",
                    status === "error" && "hidden",
                    classNames?.image,
                  )}
                />
              </div>
            )}

            {status === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center text-media-fg-muted">
                <Spinner size="lg" label={text.loading} />
              </div>
            )}

            {status === "error" && (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <p role="alert" className="text-center text-sm text-media-fg-muted">
                  {text.error}
                </p>
              </div>
            )}

            {total > 1 && (
              <>
                <IconButton
                  ref={previousRef}
                  variant="secondary"
                  label={text.previous}
                  disabled={atStart}
                  onClick={() => step(-1)}
                  className={cn(CONTROL, "absolute top-1/2 left-3 -translate-y-1/2")}
                >
                  <ChevronLeft />
                </IconButton>
                <IconButton
                  ref={nextRef}
                  variant="secondary"
                  label={text.next}
                  disabled={atEnd}
                  onClick={() => step(1)}
                  className={cn(CONTROL, "absolute top-1/2 right-3 -translate-y-1/2")}
                >
                  <ChevronRight />
                </IconButton>
              </>
            )}
          </div>

          {image?.caption && (
            <div
              className={cn(
                "px-[var(--rc-pad-panel)] py-3 text-center text-sm text-media-fg",
                classNames?.caption,
              )}
            >
              {image.caption}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
