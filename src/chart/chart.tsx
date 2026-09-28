"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { ResponsiveContainer } from "recharts";

import { Alert, AlertDescription, AlertTitle } from "../components/alert";
import { Button } from "../components/button";
import { EmptyState } from "../components/empty-state";
import { Skeleton } from "../components/skeleton";
import { cn } from "../lib/cn";
import { LoadingAnnouncement } from "../lib/loading-announcement";
import { chartName } from "../shared/chart-layout";
import { SETTLED } from "../shared/settled";
import { seriesVar } from "./series-var";
import { useTokenMotion, withMotion, type ChartMotion } from "./use-chart-motion";

export type ChartConfig = Record<
  string,
  {
    /** The series' readable name. Goes to the tooltip and the legend. */
    label: string;
    /**
     * The series' color. Without it, the next one in the palette is used, in the order in which the
     * series appears in `config`.
     */
    color?: string;
  }
>;

export type ChartContainerProps = Omit<ComponentProps<"div">, "children"> & {
  config: ChartConfig;
  /** A single Recharts chart: `LineChart`, `BarChart`, `AreaChart`. */
  children: ReactElement;

  isLoading?: boolean;
  isError?: boolean;
  /** Without this, the error offers no retry. */
  onRetry?: () => void;
  /**
   * The title of the error notice. Without it, "Nao foi possivel carregar o grafico".
   *
   * The same name and the same role as `errorTitle` on `DataTable`: a dashboard with
   * four charts has to say which one failed, and a product that does not speak
   * Portuguese has to say it in another language.
   */
  errorTitle?: ReactNode;
  errorMessage?: ReactNode;
  /**
   * What appears when the query comes back with no point at all. The same shape as
   * `DataTable`, `action` included - it is the way out that `EmptyState`
   * considers strongly recommended, and it was only missing here. Without it, the empty list
   * shows the short notice from `labels.noData`, and not axes over nothing.
   */
  empty?: { title: ReactNode; description: ReactNode; action?: ReactNode; icon?: ReactNode };
  /**
   * The points, so the frame knows how to count zero.
   *
   * Almost always unnecessary: without it, the count comes from the `data` of the
   * Recharts chart passed as a child. Pass your own when the points do not
   * live in the direct child - `<ScatterChart>` with the `data` on `<Scatter>`, for
   * example - or when the drawn series is not the one that decides emptiness.
   */
  data?: readonly unknown[];

  /**
   * What the screen reader hears in place of the drawing.
   *
   * Without it, the name comes from the series labels in `config` - which is already a
   * sentence, and not the pile of ticks the SVG would give on its own. Write your own
   * when the chart answers a question ("Faturamento por mes, em reais"):
   * the series says what was measured, not what the screen asks.
   */
  label?: string;
  /**
   * The piece's texts, to change the language: `retry` is the button that runs
   * `onRetry`, "Tentar de novo" without it - the same key in every piece that
   * handles the four endings.
   * `loading` and `loaded` are what the screen reader hears when the query
   * goes out and when it comes back. `name` builds the chart's name without `label`, from
   * the series labels in `config`. `noData` is the notice for when the
   * list comes back empty and there is no `empty`, "Sem dados no periodo" without it.
   */
  labels?: Partial<ChartContainerLabels>;
};

export const PALETTE = Array.from({ length: 8 }, (_, index) => `var(--rc-chart-${index + 1})`);

const PAINTED: Record<string, readonly ("fill" | "stroke")[]> = {
  Area: ["fill", "stroke"],
  Bar: ["fill"],
  Line: ["stroke"],
  Radar: ["fill", "stroke"],
};

const MOVING = new Set(["Area", "Bar", "Funnel", "Line", "Pie", "Radar", "RadialBar", "Scatter"]);

type MarkProps = {
  isAnimationActive?: unknown;
  animationDuration?: unknown;
  animationEasing?: unknown;
  dataKey?: unknown;
  fill?: unknown;
  stroke?: unknown;
  children?: ReactNode;
};

function markName(type: ReactElement["type"]): string {
  if (typeof type === "string") return type;
  return (type as { displayName?: string }).displayName ?? "";
}

function repaint(
  node: ReactNode,
  config: ChartConfig,
  unknown: Set<string>,
  motion: ChartMotion | undefined,
): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement(child)) return child;

    const written = child.props as MarkProps;
    const name = markName(child.type);
    const roles = PAINTED[name];
    const patch: Record<string, unknown> =
      motion && MOVING.has(name) ? withMotion(written, motion) : {};

    if (roles && typeof written.dataKey === "string") {
      const vacant = roles.filter((role) => written[role] === undefined);

      if (vacant.length > 0) {
        if (written.dataKey in config) {
          for (const role of vacant) patch[role] = `var(${seriesVar(written.dataKey)})`;
        } else {
          unknown.add(written.dataKey);
        }
      }
    }

    if (written.children !== undefined && typeof written.children !== "function") {
      patch.children = repaint(written.children, config, unknown, motion);
    }

    return Object.keys(patch).length > 0 ? cloneElement(child, patch) : child;
  });
}

export function seriesColors(
  chart: ReactElement,
  config: ChartConfig,
  motion?: ChartMotion,
): { chart: ReactElement; unknown: string[] } {
  const written = chart.props as MarkProps;
  if (written.children === undefined || typeof written.children === "function") {
    return { chart, unknown: [] };
  }

  const missing = new Set<string>();
  const painted = cloneElement(chart, {
    children: repaint(written.children, config, missing, motion),
  } as Partial<MarkProps>);

  return { chart: painted, unknown: [...missing] };
}

export function unknownSeriesComplaint(key: string, known: readonly string[]): string {
  return (
    `[rivocode/ui] <ChartContainer>: the mark with \`dataKey\` "${key}" got no color, and ` +
    `\`config\` does not know that series - Recharts paints the mark black, and there is no ` +
    "error at all. The series of this chart are: " +
    `${known.join(", ")}. Fix the key, or declare the series in \`config\` - the frame ` +
    "paints by itself every ink role the mark leaves empty, role by role: the bar's `fill`, " +
    "the line's `stroke`, both on the area."
  );
}

function useUnknownSeriesWarning(keys: string, known: string) {
  useEffect(() => {
    if (keys === "" || process.env.NODE_ENV === "production") return;

    for (const key of keys.split(",")) console.warn(unknownSeriesComplaint(key, known.split(",")));
  }, [keys, known]);
}

export type ChartContainerLabels = {
  retry: string;
  loading: string;
  loaded: string;
  name: (series: string[]) => string;
  noData: string;
};

export function ChartContainer({
  config,
  labels,
  className,
  children,
  isLoading,
  isError,
  onRetry,
  errorTitle = "Não foi possível carregar o gráfico",
  errorMessage,
  empty,
  data,
  label,
  ...props
}: ChartContainerProps) {
  const retryLabel = labels?.retry ?? "Tentar de novo";
  const id = useId().replace(/:/g, "");

  const colors = Object.entries(config)
    .map(([key, series], index) => {
      const color = series.color ?? PALETTE[index % PALETTE.length];
      return `${seriesVar(key)}: ${color};`;
    })
    .join("\n  ");

  const points = data ?? dataOfChild(children);
  const nothing = points !== undefined && points.length === 0;
  const showsEmpty = empty !== undefined && nothing;
  const motion = useTokenMotion(`[data-rc-chart="${id}"]`);
  const painted = seriesColors(children, config, motion);

  useMissingDataWarning(empty !== undefined && points === undefined);
  useFlatBoxWarning(id);
  useUnknownSeriesWarning(painted.unknown.join(","), Object.keys(config).join(","));

  const announcement = useActivePointAnnouncement(id);

  return (
    <div
      {...props}
      data-rc-chart={id}
      className={cn(
        "w-full font-sans",
        "[&_.recharts-cartesian-axis-tick_text]:fill-fg-subtle",
        "[&_.recharts-cartesian-axis-tick_text]:text-xs",
        "[&_.recharts-cartesian-grid_line]:stroke-chart-grid",
        "[&_.recharts-cartesian-axis-line]:stroke-border",
        "[&_.recharts-cartesian-axis-tick-line]:stroke-border",
        "[&_.recharts-legend-item-text]:text-sm",
        "[&_.recharts-legend-item-text]:!text-fg-muted",
        "[&_.recharts-tooltip-cursor]:fill-accent-subtle",
        "[&_.recharts-tooltip-cursor]:stroke-border",
        "[&_.recharts-reference-line_line]:stroke-border-strong",
        "[&_.recharts-surface]:outline-none",
        "[&_.recharts-surface:focus-visible]:outline-solid",
        "[&_.recharts-surface:focus-visible]:outline-2",
        "[&_.recharts-surface:focus-visible]:-outline-offset-2",
        "[&_.recharts-surface:focus-visible]:outline-ring",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: `[data-rc-chart="${id}"] {\n  ${colors}\n}` }} />

      <div role="status" aria-live="polite" data-rc-active-point="" className="sr-only">
        {announcement}
      </div>

      {!isError && <LoadingAnnouncement loading={isLoading === true} labels={labels} />}

      {isError ? (
        <StateFrame>
          <Alert tone="danger" className="w-full">
            <AlertTitle>{errorTitle}</AlertTitle>
            <AlertDescription>
              {errorMessage ?? "Tente de novo em alguns minutos."}
            </AlertDescription>
            {onRetry && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onRetry}
                className="mt-3"
              >
                {retryLabel}
              </Button>
            )}
          </Alert>
        </StateFrame>
      ) : isLoading ? (
        <StateFrame>
          <div className="flex h-full w-full items-end gap-3 px-2 pb-6">
            {[0.45, 0.7, 0.35, 0.85, 0.6, 0.75].map((height, index) => (
              <Skeleton key={index} className="w-full" style={{ height: `${height * 100}%` }} />
            ))}
          </div>
        </StateFrame>
      ) : showsEmpty ? (
        <StateFrame>
          <EmptyState
            title={empty.title}
            description={empty.description}
            icon={empty.icon}
            action={empty.action}
          />
        </StateFrame>
      ) : nothing ? (
        <StateFrame>
          <p data-rc-chart-no-data="" className="text-sm text-fg-muted">
            {labels?.noData ?? "Sem dados no período"}
          </p>
        </StateFrame>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          {describe(painted.chart, label ?? nameFromConfig(config, labels?.name ?? chartName))}
        </ResponsiveContainer>
      )}
    </div>
  );
}

function dataOfChild(child: ReactElement): readonly unknown[] | undefined {
  const written = child.props as { data?: unknown };
  return Array.isArray(written.data) ? written.data : undefined;
}

function useMissingDataWarning(missing: boolean) {
  useEffect(() => {
    if (!missing || process.env.NODE_ENV === "production") return;

    console.warn(
      "[rivocode/ui] <ChartContainer empty={...}> with no points to count: neither was the " +
        "`data` prop passed, nor does the child chart carry a `data`. The empty state will never " +
        "appear, and the chart draws axes over nothing. Pass `data={points}` to " +
        "ChartContainer - the same array you already hand to the chart.",
    );
  }, [missing]);
}

export function flatBoxComplaint(width: number, height: number): string | undefined {
  if (!(width > 0 && height === 0)) return undefined;

  return (
    "[rivocode/ui] <ChartContainer>: the frame measured a width and no height, and Recharts " +
    "drew in a 0px rectangle - the card stays empty, with no error at all. The height comes " +
    'from whoever uses the frame: give it a height class (className="h-64"), or give height ' +
    "to the parent that holds it."
  );
}

function useFlatBoxWarning(chartId: string) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const root = document.querySelector<HTMLElement>(`[data-rc-chart="${chartId}"]`);
    if (!root) return;

    const waiting = setTimeout(() => {
      const complaint = flatBoxComplaint(root.clientWidth, root.clientHeight);
      if (complaint) console.warn(complaint);
    }, SETTLED);

    return () => clearTimeout(waiting);
  }, [chartId]);
}

const NAVIGATION_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]);

function readableTip(tip: Node): string {
  const walker = document.createTreeWalker(tip, NodeFilter.SHOW_TEXT);
  const parts: string[] = [];

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const piece = node.textContent?.trim();
    if (piece) parts.push(piece);
  }

  return parts.join(", ");
}

function useActivePointAnnouncement(chartId: string): string {
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(`[data-rc-chart="${chartId}"]`);
    if (!root) return;

    let byKeyboard = false;
    const clear = () => setAnnouncement((current) => (current === "" ? current : ""));

    const onKeyDown = (event: KeyboardEvent) => {
      if (NAVIGATION_KEYS.has(event.key)) byKeyboard = true;
    };
    const onPointer = () => {
      byKeyboard = false;
    };
    const onFocusOut = () => {
      byKeyboard = false;
      clear();
    };

    const observer = new MutationObserver(() => {
      if (!byKeyboard) return;

      const tip = root.querySelector(".recharts-tooltip-wrapper");
      const text = tip ? readableTip(tip) : "";
      setAnnouncement((current) => (current === text ? current : text));
    });

    observer.observe(root, { subtree: true, childList: true, characterData: true });
    root.addEventListener("keydown", onKeyDown);
    root.addEventListener("pointermove", onPointer);
    root.addEventListener("pointerdown", onPointer);
    root.addEventListener("focusout", onFocusOut);

    return () => {
      observer.disconnect();
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("pointermove", onPointer);
      root.removeEventListener("pointerdown", onPointer);
      root.removeEventListener("focusout", onFocusOut);
    };
  }, [chartId]);

  return announcement;
}

function nameFromConfig(config: ChartConfig, name: (series: string[]) => string) {
  return name(
    Object.values(config)
      .map((entry) => entry.label)
      .filter(Boolean),
  );
}

function describe(chart: ReactElement, name: string) {
  type A11y = { role?: string; "aria-label"?: string };
  const written = chart.props as A11y;

  return cloneElement(chart as ReactElement<A11y>, {
    role: written.role ?? "img",
    "aria-label": written["aria-label"] ?? name,
  });
}

function StateFrame({ children }: { children: ReactNode }) {
  return <div className="flex h-full w-full items-center justify-center">{children}</div>;
}
