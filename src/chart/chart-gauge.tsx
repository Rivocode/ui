"use client";

import {
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import { resolveFormat, type Format } from "../shared/format";
import type { Slots } from "../lib/slots";
import { GAUGE_GAP, GAUGE_REACH, GAUGE_RING, bandAt } from "../shared/chart-layout";

export type ChartGaugeBand = {
  /** Where the band ends, in the same unit as `value`. It starts where the previous one stopped. */
  until: number;
  /** The band's color, and the arc's when the value falls in it. */
  tone: "success" | "warning" | "danger";
  /** The band's name spelled out: goes below the number and to the screen reader. */
  label: string;
};

export type ChartGaugeProps = Omit<ComponentProps<"div">, "children"> & {
  /**
   * From 0 to `max`. Outside that, the written number and the accessible name state the
   * real value ("140 de 100"), and only the arc, the needle and the band stop at the end.
   * `NaN` or infinity becomes "—", with no band.
   */
  value: number;
  max?: number;
  /**
   * The bands, in order, each up to its `until`. The last one should end
   * at `max`. Without bands, the gauge is a neutral accent arc, and whether the reading is
   * good or bad is up to whoever reads it.
   */
  bands?: readonly ChartGaugeBand[];
  /**
   * The big number in the middle. Without it, the `value` written by `format`. Its
   * text goes into the accessible name in place of the value, and the font shrinks to
   * fit the hole of the arc.
   */
  centerValue?: ReactNode;
  /** The small line below the number. Without it, the name of the band the value fell in. */
  centerLabel?: ReactNode;
  /** How the number is written, in the middle and in the accessible name. */
  format?: Format;
  /**
   * How many degrees the arc covers, with the opening at the bottom. From 0 to 360; 360 closes the
   * ring.
   */
  sweep?: number;
  /**
   * What the screen reader hears. Without it, the value, the maximum and the band name:
   * "72 de 100, atencao".
   */
  label?: string;
  /**
   * The piece's texts, to change the language: `value` joins the written value to the
   * maximum in the accessible name, and `band` describes each band on the scale the
   * screen reader hears. Pass only the ones that change.
   */
  labels?: Partial<ChartGaugeLabels>;
  /** Class per part: `arc`, `value`, `label`. */
  classNames?: Slots<"arc" | "value" | "label">;
};

export type ChartGaugeLabels = {
  value: (value: string, max: string) => string;
  band: (name: string, from: string, to: string) => string;
};

const LABELS: ChartGaugeLabels = {
  value: (value, max) => `${value} de ${max}`,
  band: (name, from, to) => `${name}: de ${from} a ${to}`,
};

const TONE_COLOR: Record<ChartGaugeBand["tone"], string> = {
  success: "var(--rc-success-text)",
  warning: "var(--rc-warning-text)",
  danger: "var(--rc-danger-text)",
};

function pointAt(radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return `${(radius * Math.cos(radians)).toFixed(3)} ${(radius * Math.sin(radians)).toFixed(3)}`;
}

function arcPath(radius: number, from: number, to: number) {
  const middle = (from + to) / 2;
  const turn = `A ${radius} ${radius} 0 0 1`;
  return `M ${pointAt(radius, from)} ${turn} ${pointAt(radius, middle)} ${turn} ${pointAt(radius, to)}`;
}

function spokenOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(spokenOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return spokenOf(node.props.children);
  return "";
}

export function ChartGauge({
  value,
  max = 100,
  bands,
  centerValue,
  centerLabel,
  format,
  sweep: askedSweep = 240,
  label,
  labels: labelsProp,
  classNames,
  className,
  "aria-describedby": describedBy,
  ...props
}: ChartGaugeProps) {
  const labels = { ...LABELS, ...labelsProp };
  const write = resolveFormat(format) as ((value: number) => string) | undefined;
  const say = (number: number) => (write ? write(number) : number.toLocaleString("pt-BR"));

  const known = Number.isFinite(value);
  const sweep = Math.min(Math.max(askedSweep, 0), 360);
  const clamped = known ? Math.max(0, Math.min(value, max)) : 0;
  const share = known && max > 0 ? clamped / max : 0;
  const band = known && bands && bands.length > 0 ? bandAt(bands, clamped) : undefined;
  const paint = band ? TONE_COLOR[band.tone] : "var(--rc-accent-text)";

  const [shown, setShown] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(share));
    return () => cancelAnimationFrame(frame);
  }, [share]);

  const from = -sweep / 2;
  const to = sweep / 2;
  const angleOf = (number: number) =>
    from + sweep * (max > 0 ? Math.max(0, Math.min(number, max)) / max : 0);

  const bandsId = useId();
  const written = known ? say(value) : "—";
  const spoken = spokenOf(centerValue) || written;
  const name = label ?? `${labels.value(spoken, say(max))}${band ? `, ${band.label}` : ""}`;

  const hole = useRef<HTMLDivElement>(null);
  const number = useRef<HTMLSpanElement>(null);
  const [fit, setFit] = useState(1);

  useLayoutEffect(() => {
    const room = hole.current;
    const text = number.current;
    if (!room || !text) return;
    const measure = () => {
      const width = room.clientWidth;
      const need = text.offsetWidth;
      if (width <= 0 || need <= 0) return;
      setFit((current) => {
        const next = Math.min(1, (current * width) / need);
        return Math.abs(next - current) < 0.01 ? current : next;
      });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(room);
    observer.observe(text);
    return () => observer.disconnect();
  }, [spoken]);
  const described = [describedBy, bands?.length ? bandsId : undefined].filter(Boolean).join(" ");

  let start = 0;
  const ring = (bands ?? []).map((item) => {
    const begin = angleOf(start);
    const end = angleOf(item.until);
    start = item.until;
    return { item, begin, end };
  });

  return (
    <div
      {...props}
      role="img"
      aria-label={name}
      aria-describedby={described || undefined}
      data-rc-gauge-tone={band?.tone ?? "neutral"}
      className={cn("relative h-44 w-full", className)}
    >
      <svg
        viewBox="-50 -50 100 100"
        aria-hidden="true"
        className={cn("h-full w-full", classNames?.arc)}
      >
        {ring.map(({ item, begin, end }, index) =>
          end - begin > GAUGE_GAP ? (
            <path
              key={index}
              data-rc-gauge-band={item.tone}
              d={arcPath(
                GAUGE_RING,
                index === 0 ? begin : begin + GAUGE_GAP / 2,
                index === ring.length - 1 ? end : end - GAUGE_GAP / 2,
              )}
              fill="none"
              stroke={TONE_COLOR[item.tone]}
              strokeWidth={3}
            />
          ) : null,
        )}

        <path
          d={arcPath(GAUGE_REACH, from, to)}
          fill="none"
          stroke="var(--rc-skeleton)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        <path
          data-rc-gauge-value=""
          d={arcPath(GAUGE_REACH, from, to)}
          fill="none"
          stroke={paint}
          strokeWidth={10}
          strokeLinecap="round"
          pathLength={100}
          strokeOpacity={shown > 0 ? 1 : 0}
          style={{ strokeDasharray: `${shown * 100} 100` }}
          className="transition-[stroke-dasharray,stroke] duration-[var(--rc-duration-slow)] ease-rc"
        />

        {known && bands && bands.length > 0 && (
          <line
            data-rc-gauge-needle=""
            x1={0}
            y1={-(GAUGE_RING - 4)}
            x2={0}
            y2={-(GAUGE_RING + 3.5)}
            stroke="var(--rc-fg)"
            strokeWidth={2}
            strokeLinecap="round"
            style={{ transform: `rotate(${from + sweep * shown}deg)` }}
            className="transition-transform duration-[var(--rc-duration-slow)] ease-rc"
          />
        )}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center [container-type:size]">
        <div ref={hole} data-rc-gauge-hole="" className="flex w-[52cqmin] flex-col items-center">
          <span
            ref={number}
            data-rc-gauge-center=""
            style={{ fontSize: `calc(min(1.5rem, 14cqmin) * ${fit})` }}
            className={cn(
              "inline-block text-center font-display font-rc-display leading-tight whitespace-nowrap text-fg",
              classNames?.value,
            )}
          >
            {centerValue ?? written}
          </span>
          {(centerLabel ?? band?.label) && (
            <span
              className={cn(
                "mt-0.5 line-clamp-2 max-w-full text-center text-xs text-fg-subtle",
                classNames?.label,
              )}
            >
              {centerLabel ?? band?.label}
            </span>
          )}
        </div>
      </div>

      {bands && bands.length > 0 && (
        <p id={bandsId} className="sr-only">
          {bands
            .map((item, index) => {
              const begin = index === 0 ? 0 : bands[index - 1]!.until;
              return labels.band(item.label, say(begin), say(item.until));
            })
            .join("; ")}
        </p>
      )}
    </div>
  );
}
