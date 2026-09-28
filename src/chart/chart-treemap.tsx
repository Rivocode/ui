"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

import { EmptyState } from "../components/empty-state";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";
import { cn } from "../lib/cn";
import { percent, resolveFormat, type Format } from "../shared/format";
import type { Slots } from "../lib/slots";
import { labelFit, squarify, type TreemapBox } from "../shared/chart-layout";
import { PALETTE, type ChartConfig } from "./chart";

export type ChartTreemapProps<Item> = Omit<ComponentProps<"div">, "children"> & {
  /** As categorias. Valor zero ou negativo nao ganha area, mas continua na lista do leitor de tela. */
  data: Item[];
  /** De onde sai o numero, que vira area. */
  valueKey: keyof Item & string;
  /** De onde sai o nome de cada categoria. E ele que o `config` procura. */
  nameKey: keyof Item & string;
  /**
   * Nome legivel e cor por categoria, o mesmo formato da rosca. Sem cor, cada
   * categoria pega a proxima da paleta, na ordem de `data`.
   */
  config?: ChartConfig;
  /** Como o numero e escrito, no rotulo, na dica e na lista do leitor de tela. */
  format?: Format;
  /** O que o mapa mede, por extenso: vira o nome do grupo e da lista escondida. */
  label: string;
  /** Classe por parte: `cell`, `label`. */
  classNames?: Slots<"cell" | "label">;
  /**
   * O que aparece no lugar do desenho quando a lista vem vazia ou a soma e zero. O mesmo formato do
   * `ChartContainer` e do `DataTable`.
   */
  empty?: { title: ReactNode; description: ReactNode; action?: ReactNode; icon?: ReactNode };
};

const TINT = "bg-[color-mix(in_srgb,var(--rc-tile)_30%,transparent)]";

function valueOf(raw: unknown): number {
  const number = Number(raw);
  return Number.isFinite(number) ? number : 0;
}

export function ChartTreemap<Item extends Record<string, unknown>>({
  data,
  valueKey,
  nameKey,
  config,
  format,
  label,
  classNames,
  className,
  empty,
  ...props
}: ChartTreemapProps<Item>) {
  const write = resolveFormat(format) as ((value: number) => string) | undefined;
  const say = (value: number) => (write ? write(value) : value.toLocaleString("pt-BR"));

  const frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () =>
      setSize((current) =>
        current.width === element.clientWidth && current.height === element.clientHeight
          ? current
          : { width: element.clientWidth, height: element.clientHeight },
      );
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const values = data.map((item) => valueOf(item[valueKey]));
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  const measured = size.width > 0 && size.height > 0;
  const width = measured ? size.width : 100;
  const height = measured ? size.height : 100;
  const boxes = squarify(values, width, height);

  const nameOf = (item: Item) => String(item[nameKey]);
  const textOf = (item: Item) => config?.[nameOf(item)]?.label ?? nameOf(item);
  const colorOf = (item: Item, index: number) =>
    config?.[nameOf(item)]?.color ?? PALETTE[index % PALETTE.length]!;
  const shareOf = (value: number) =>
    total > 0 ? percent((Math.max(0, value) / total) * 100, 1) : "—";
  const describe = (index: number) =>
    `${textOf(data[index]!)}: ${say(values[index]!)} (${shareOf(values[index]!)})`;

  const order = boxes
    .map((box, index) => ({ box, index }))
    .filter(({ box }) => box.width > 0 && box.height > 0)
    .sort((one, other) => one.box.y - other.box.y || one.box.x - other.box.x)
    .map(({ index }) => index);

  const rtl = useDirection() === "rtl";
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const reading = hovered ?? focused;
  const open = reading !== null && !dismissed;

  const placeOf = (box: TreemapBox) => ({
    left: `${((rtl ? width - box.x - box.width : box.x) / width) * 100}%`,
    top: `${(box.y / height) * 100}%`,
    width: `${(box.width / width) * 100}%`,
    height: `${(box.height / height) * 100}%`,
  });

  function read(event: PointerEvent<HTMLDivElement>) {
    const cell = (event.target as HTMLElement).closest<HTMLElement>("[data-rc-tile]");
    if (!cell) return;
    setHovered(Number(cell.dataset.rcTile));
    setDismissed(false);
  }

  function walk(event: KeyboardEvent<HTMLDivElement>) {
    if (order.length === 0) return;

    if (event.key === "Escape") {
      setDismissed(true);
      return;
    }

    const at = focused === null ? 0 : Math.max(0, order.indexOf(focused));
    const ahead = new Set([rtl ? "ArrowLeft" : "ArrowRight", "ArrowDown"]);
    const back = new Set([rtl ? "ArrowRight" : "ArrowLeft", "ArrowUp"]);
    const next = ahead.has(event.key)
      ? Math.min(at + 1, order.length - 1)
      : back.has(event.key)
        ? Math.max(at - 1, 0)
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? order.length - 1
            : null;

    if (next === null) return;

    event.preventDefault();
    setHovered(null);
    setFocused(order[next]!);
    setDismissed(false);
  }

  if (total === 0 && empty) {
    return (
      <div {...props} className={cn("w-full", className)}>
        <EmptyState
          title={empty.title}
          description={empty.description}
          icon={empty.icon}
          action={empty.action}
        />
      </div>
    );
  }

  return (
    <div {...props} className={cn("relative h-64 w-full", className)}>
      <div
        ref={frame}
        role="group"
        aria-label={label}
        tabIndex={0}
        onPointerMove={read}
        onPointerDown={read}
        onPointerLeave={() => setHovered(null)}
        onPointerCancel={() => setHovered(null)}
        onKeyDown={walk}
        onFocus={() => setFocused((current) => current ?? order[0] ?? null)}
        onBlur={() => {
          setFocused(null);
          setDismissed(false);
        }}
        className={cn(
          "relative h-full w-full animate-appear rounded-sm",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "focus-visible:ring-offset-surface",
        )}
      >
        {data.map((item, index) => {
          const box = boxes[index]!;
          if (box.width <= 0 || box.height <= 0) return null;

          const color = colorOf(item, index);
          const name = textOf(item);
          const value = say(values[index]!);
          const fit = measured ? labelFit(name, value, box.width, box.height) : "none";

          return (
            <div
              key={`${index}-${nameOf(item)}`}
              data-rc-tile={index}
              data-rc-fit={fit}
              aria-hidden="true"
              style={{ ...placeOf(box), "--rc-tile": color } as CSSProperties}
              className={cn(
                "absolute p-0.5",
                "transition-[left,top,width,height] duration-[var(--rc-duration-slow)] ease-rc",
              )}
            >
              <div
                className={cn(
                  "flex h-full w-full flex-col items-start overflow-hidden rounded-sm p-2",
                  TINT,
                  "shadow-[inset_0_0_0_1px_var(--rc-tile)]",
                  classNames?.cell,
                )}
              >
                {fit !== "none" && (
                  <span
                    className={cn(
                      "flex max-w-full flex-col text-xs leading-tight text-fg",
                      classNames?.label,
                    )}
                  >
                    <span className="truncate font-rc-medium">{name}</span>
                    {fit === "both" && <span className="truncate font-mono">{value}</span>}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        <Tooltip
          open={open}
          onOpenChange={(next) => {
            if (!next) setDismissed(true);
          }}
        >
          <TooltipTrigger
            render={
              <div
                aria-hidden="true"
                data-rc-tile-cursor=""
                style={reading !== null && boxes[reading] ? placeOf(boxes[reading]!) : undefined}
                className={cn(
                  "pointer-events-none absolute rounded-sm outline-2 -outline-offset-1 outline-fg",
                  "transition-opacity duration-[var(--rc-duration-fast)] ease-rc",
                  open ? "opacity-100 outline-solid" : "opacity-0",
                )}
              />
            }
          />
          <TooltipContent>{reading !== null ? describe(reading) : null}</TooltipContent>
        </Tooltip>
      </div>

      <ul aria-label={label} className="sr-only">
        {data.map((item, index) => (
          <li key={`${index}-${nameOf(item)}`}>{describe(index)}</li>
        ))}
      </ul>

      <div role="status" aria-live="polite" className="sr-only">
        {hovered === null && focused !== null ? describe(focused) : null}
      </div>
    </div>
  );
}
