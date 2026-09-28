"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { ChartTooltipContent, type ChartTooltipContentProps } from "./chart-tooltip";

import { EmptyState } from "../components/empty-state";
import { cn } from "../lib/cn";
import { PALETTE, type ChartConfig } from "./chart";
import { resolveFormat, type Format } from "../shared/format";
import { useTokenMotion } from "./use-chart-motion";

export type ChartDonutProps<Slice> = Omit<ComponentProps<"div">, "children"> & {
  data: Slice[];
  /** Where each slice's number comes from. */
  valueKey: keyof Slice & string;
  /** Where each slice's name comes from. It is what `config` looks up. */
  nameKey: keyof Slice & string;
  config?: ChartConfig;
  /**
   * The big number in the middle. Always stays visible: the slice tooltip opens outside the
   * hole and inside the drawing's frame, beside the donut when it fits and, when
   * it does not, at the top or bottom of the frame, over the ring.
   *
   * Without it, the center stays empty.
   */
  centerValue?: ReactNode;
  /** The small line below the number. Stays visible along with it. */
  centerLabel?: ReactNode;
  /**
   * Ring thickness, as a fraction of the radius. `1` closes it into a pie. A thinner
   * ring leaves a bigger hole, and that is where the total has to fit.
   */
  thickness?: number;
  /**
   * The list of slices below, with name and value. On by default: a donut
   * without it is a pretty drawing that does not say which slice is which, and the tooltip only
   * answers people with a pointer.
   */
  legend?: boolean;
  /** How to write the value, in the legend and the tooltip. */
  /**
   * How the number is written: the name of a house formatter (`currencyShort`,
   * `percent`, `integer`...) or your own function. The same vocabulary as the axis and
   * the Meter - before this only the function was accepted, and the name was a type error.
   */
  format?: Format;
  className?: string;
  /**
   * What the screen reader hears in place of the drawing.
   *
   * With the legend on - which is the default - it is not needed: each slice is already
   * there below in text, with name and value, and naming the ring again would
   * have the same list read twice. Without a legend, the name comes from the slice
   * names; write your own when the donut answers a question ("Faturamento
   * por natureza").
   */
  label?: string;
  /**
   * The piece's texts, to change the language: `name` builds the drawing's name
   * without `label` and without a legend, from the slice names. Pass only the ones that
   * change.
   */
  labels?: Partial<ChartDonutLabels>;
  /**
   * What appears in place of the donut when the list comes empty or sums to zero. The
   * same shape as `ChartContainer` and `DataTable`. Without it, the empty donut
   * is the background ring with the center.
   */
  empty?: { title: ReactNode; description: ReactNode; action?: ReactNode; icon?: ReactNode };
};

export type ChartDonutLabels = {
  name: (slices: string[]) => string;
};

const LABELS: ChartDonutLabels = {
  name: (slices) => `Rosca de ${slices.join(", ")}`,
};

const GAP = 8;

export function donutTipPlace(
  width: number,
  height: number,
  tipWidth: number,
  tipHeight: number,
  hole = 0.88 * (1 - 0.34),
): { left: number; top: number } {
  const half = Math.min(width, height) / 2;
  const radius = half * 0.88;
  const keepOff = Math.max(half * hole, half * 0.3);
  const middleX = width / 2;
  const middleY = height / 2;
  const clampLeft = (left: number) => Math.min(Math.max(left, 0), Math.max(width - tipWidth, 0));
  const clampTop = (top: number) => Math.min(Math.max(top, 0), Math.max(height - tipHeight, 0));
  const top = clampTop(middleY - tipHeight / 2);

  if (width - (middleX + radius + GAP) >= tipWidth) return { left: middleX + radius + GAP, top };
  if (middleX - radius - GAP >= tipWidth) return { left: middleX - radius - GAP - tipWidth, top };

  const distance = ({ left, top }: { left: number; top: number }) => {
    const dx = Math.max(left - middleX, 0, middleX - (left + tipWidth));
    const dy = Math.max(top - middleY, 0, middleY - (top + tipHeight));
    return Math.hypot(dx, dy);
  };
  const inside = [
    { left: clampLeft(middleX - tipWidth / 2), top: 0 },
    { left: clampLeft(middleX - tipWidth / 2), top: clampTop(height - tipHeight) },
    { left: 0, top: 0 },
    { left: clampLeft(width - tipWidth), top: 0 },
    { left: 0, top: clampTop(height - tipHeight) },
    { left: clampLeft(width - tipWidth), top: clampTop(height - tipHeight) },
  ];

  return (
    inside.find((place) => distance(place) >= keepOff) ??
    inside.reduce((best, place) => (distance(place) > distance(best) ? place : best))
  );
}

function amountOf(raw: unknown): number {
  const number = Number(raw);
  return Number.isFinite(number) ? number : 0;
}

export function ChartDonut<Slice extends Record<string, unknown>>({
  data,
  valueKey,
  nameKey,
  config,
  centerValue,
  centerLabel,
  thickness = 0.34,
  legend = true,
  format,
  className,
  label,
  labels: labelsProp,
  empty,
  ...rest
}: ChartDonutProps<Slice>) {
  const labels = { ...LABELS, ...labelsProp };
  const write = resolveFormat(format) as ((value: number) => string) | undefined;

  const [reading, setReading] = useState<number | null>(null);
  const [place, setPlace] = useState<{ left: number; top: number } | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const motion = useTokenMotion(null);

  const hole = Math.round(88 * (1 - thickness));
  const outer = "88%";
  const internal = `${hole}%`;

  const total = data.reduce((sum, slice) => sum + Math.max(0, amountOf(slice[valueKey])), 0);
  const blank = data.length === 0 || total === 0;

  const declared = Object.keys(config ?? {});
  const undeclared = data
    .map((slice) => String(slice[nameKey]))
    .filter((name, index, all) => !declared.includes(name) && all.indexOf(name) === index);

  const colorOf = (slice: Slice) => {
    const name = String(slice[nameKey]);
    const written = config?.[name]?.color;
    if (written) return written;
    const position = declared.includes(name)
      ? declared.indexOf(name)
      : declared.length + undeclared.indexOf(name);
    return PALETTE[position % PALETTE.length];
  };

  const sliceNames = () =>
    data.map((slice) => config?.[String(slice[nameKey])]?.label ?? String(slice[nameKey]));

  const name = label ?? (legend ? undefined : labels.name(sliceNames()));

  useLayoutEffect(() => {
    if (reading === null || !frame.current || !tip.current) {
      setPlace(null);
      return;
    }
    setPlace(
      donutTipPlace(
        frame.current.clientWidth,
        frame.current.clientHeight,
        tip.current.offsetWidth,
        tip.current.offsetHeight,
        hole / 100,
      ),
    );
  }, [reading, hole]);

  const readSlice = reading === null ? undefined : data[reading];
  const tipPayload = readSlice
    ? ([
        {
          name: String(readSlice[nameKey]),
          dataKey: String(readSlice[nameKey]),
          value: amountOf(readSlice[valueKey]),
          color: colorOf(readSlice),
        },
      ] as unknown as ChartTooltipContentProps["payload"])
    : undefined;

  if (blank && empty) {
    return (
      <div {...rest} className={cn("w-full", className)}>
        <EmptyState
          title={empty.title}
          description={empty.description}
          icon={empty.icon}
          action={empty.action}
        />
      </div>
    );
  }

  const middle: CSSProperties = {
    maxWidth: hole >= 40 ? `min(52%, ${hole * 0.8}cqmin)` : "52%",
  };

  return (
    <div {...rest} className={cn("w-full", className)}>
      <div ref={frame} className="relative h-48 w-full [container-type:size]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart
            tabIndex={-1}
            role={name ? "img" : undefined}
            aria-label={name}
            aria-hidden={name ? undefined : true}
          >
            <Pie
              data={[{ track: 1 }]}
              dataKey="track"
              innerRadius={internal}
              outerRadius={outer}
              fill="var(--rc-border)"
              stroke="none"
              {...motion}
              rootTabIndex={-1}
              tooltipType="none"
              legendType="none"
              className="pointer-events-none"
            />
            {!blank && (
              <Pie
                data={data}
                dataKey={valueKey}
                nameKey={nameKey}
                innerRadius={internal}
                outerRadius={outer}
                paddingAngle={2}
                cornerRadius={4}
                rootTabIndex={-1}
                {...motion}
                onMouseEnter={(_, index) => setReading(index)}
                onMouseLeave={() => setReading(null)}
                stroke="none"
              >
                {data.map((slice) => (
                  <Cell key={String(slice[nameKey])} fill={colorOf(slice)} />
                ))}
              </Pie>
            )}
          </PieChart>
        </ResponsiveContainer>

        {(centerValue || centerLabel) && (
          <div
            data-rc-donut-center=""
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
          >
            {centerValue && (
              <span
                style={middle}
                className="text-center font-display font-rc-display text-xl leading-tight text-balance text-fg"
              >
                {centerValue}
              </span>
            )}
            {centerLabel && (
              <span style={middle} className="mt-0.5 truncate text-xs text-fg-subtle">
                {centerLabel}
              </span>
            )}
          </div>
        )}

        {tipPayload && (
          <div
            ref={tip}
            data-rc-donut-tip=""
            style={place ?? { left: 0, top: 0, visibility: "hidden" }}
            className="pointer-events-none absolute z-[var(--rc-z-tooltip)] w-max max-w-full"
          >
            <ChartTooltipContent active payload={tipPayload} config={config} formatValue={write} />
          </div>
        )}
      </div>

      {legend && (
        <ul className="mt-3 space-y-1.5">
          {data.map((slice) => {
            const name = String(slice[nameKey]);
            const value = Number(slice[valueKey]);

            return (
              <li key={name} className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-sm"
                  style={{ background: colorOf(slice) }}
                />
                <span className="min-w-0 flex-1 truncate text-fg-muted">
                  {config?.[name]?.label ?? name}
                </span>
                <span className="shrink-0 font-mono text-fg">{write ? write(value) : value}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
