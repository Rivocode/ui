import { useRef, useState, type ReactNode } from "react";
import { View, type LayoutChangeEvent } from "react-native";

import type { RivoNativeColorRole } from "../../tokens";
import { Alert } from "../basics";
import { Button } from "../button";
import { cn } from "../cn";
import { EmptyState, type EmptyStateProps } from "../empty-state";
import { useRivo } from "../provider";
import { chartName } from "../shared/chart-layout";
import { SETTLED } from "../shared/settled";
import { useSilentMisuse } from "../silent-misuse";
import { Skeleton } from "../skeleton";

export type ChartConfig = Record<
  string,
  {
    /** The series' readable name. It goes to the legend and to the screen reader. */
    label: string;
    /**
     * The series color, as a **token role**: `chart-1` to `chart-8`, or any
     * other theme role. Without it, the next one in the palette, in the order
     * the series appears in `config`. The web accepts any CSS color here
     * because there it becomes `var(--color-<series>)` and the theme stays in
     * charge. Here there is no live variable: the color the component receives
     * is the final value that goes to the drawing, and a `#22c55e` written in
     * this prop would be the only thing on screen that does not change when the
     * client switches theme.
     */
    color?: RivoNativeColorRole;
  }
>;

export type ChartFrame = {
  /** The measured width, in px. Zero on the first frame, before layout. */
  width: number;
  /**
   * The measured height, in px. It comes from the class of whoever uses the
   * frame. Zero after the first layout is misuse, not a state: the drawing
   * comes out empty. The component complains in the console in `__DEV__` when
   * that happens.
   */
  height: number;
  /** Each series' color, by the same key as `config`, already resolved. */
  colors: Record<string, string>;
};

export type ChartContainerProps = {
  config: ChartConfig;
  /**
   * The drawing. As a function, it receives the measurement and the resolved
   * colors; as JSX, it goes in as it is: that is how `ChartDonut` and
   * `ChartRadial` get the four endings without needing anything from the frame.
   */
  children: ReactNode | ((frame: ChartFrame) => ReactNode);

  isLoading?: boolean;
  isError?: boolean;
  /** Without it, the error offers no retry. */
  onRetry?: () => void;
  /**
   * The title of the error notice. Without it, "Nao foi possivel carregar o
   * grafico". The same name and the same role as the web `errorTitle`: in a
   * dashboard with four charts, the usual title repeated four times does not
   * say which one failed, and a product that does not speak Portuguese gets
   * nothing from it. It is the top half of the notice, and `errorMessage` the
   * bottom half. `string` for the same reason as `errorMessage`: the native
   * `Alert` title is also a `Text`.
   */
  errorTitle?: string;
  /**
   * `string`, and not `ReactNode` as on the web: the native `Alert` body is a
   * `Text`, and a React node would have nowhere to fit there.
   */
  errorMessage?: string;
  /**
   * What appears when the query returns no point at all. The same shape as the
   * web, and `icon` also accepts the function that receives color and size, as
   * in the native `EmptyState`.
   */
  empty?: {
    title: string;
    description: string;
    action?: ReactNode;
    icon?: EmptyStateProps["icon"];
  };
  /**
   * The points, so the frame can count zero. **Here it is the only source**,
   * and that is the difference from the web. There the frame opens the Recharts
   * child and reads the `data` it already carries; here the child is any
   * drawing, and there is nothing to open. Without this prop the empty state
   * never appears, and the development warning exists because of that.
   */
  data?: readonly unknown[];

  /**
   * What the screen reader hears instead of the drawing, when the drawing is a
   * function. With a JSX child it is **ignored**, on purpose: the inner
   * component does the naming. `ChartDonut` and `ChartRadial` already name
   * themselves, and an `accessible` up here would swallow the donut legend: the
   * slices, which are the only way to read the value by touch, would become a
   * single sentence with none of them reachable. Without it, the name comes
   * from the series labels in `config`.
   */
  label?: string;
  className?: string;
  /**
   * The component's texts, to change the language: `retry` is the button that
   * runs `onRetry`, "Tentar de novo" without it - the same key as the web and
   * as the query components here. `name` builds the drawing's name without
   * `label`, from the series labels in `config`.
   */
  labels?: Partial<ChartContainerLabels>;
};

export const PALETTE = Array.from(
  { length: 8 },
  (_, index) => `chart-${index + 1}`,
) as RivoNativeColorRole[];

const WAITING = [0.45, 0.7, 0.35, 0.85, 0.6, 0.75];

export type ChartContainerLabels = {
  retry: string;
  name: (series: string[]) => string;
};

export function ChartContainer({
  config,
  children,
  isLoading,
  isError,
  onRetry,
  errorTitle = "Não foi possível carregar o gráfico",
  errorMessage,
  empty,
  data,
  label,
  labels,
  className,
}: ChartContainerProps) {
  const retryLabel = labels?.retry ?? "Tentar de novo";
  const { colors: theme } = useRivo();
  const [box, setBox] = useState({ width: 0, height: 0 });
  const warned = useRef<Set<string>>(new Set());

  const drawn = typeof children === "function";

  const resolved = Object.fromEntries(
    Object.entries(config).map(([key, series], index) => [
      key,
      theme[series.color ?? PALETTE[index % PALETTE.length]!],
    ]),
  );
  const colors = __DEV__ ? watched(resolved, warned.current) : resolved;

  useSilentMisuse(empty !== undefined && data === undefined, MISSING_DATA);
  useSilentMisuse(label !== undefined && !drawn, IGNORED_LABEL);
  useSilentMisuse(drawn && box.width > 0 && box.height === 0, FLAT_BOX, SETTLED);

  const spoken = drawn
    ? ({
        accessible: true,
        accessibilityRole: "image",
        accessibilityLabel: label ?? nameFromConfig(config, labels?.name ?? chartName),
      } as const)
    : null;

  return (
    <View className={cn("w-full", className)}>
      {isError ? (
        <StateFrame>
          <View className="w-full gap-3">
            <Alert tone="danger" title={errorTitle}>
              {errorMessage ?? "Tente de novo em alguns minutos."}
            </Alert>
            {onRetry && (
              <Button size="sm" variant="secondary" onPress={onRetry}>
                {retryLabel}
              </Button>
            )}
          </View>
        </StateFrame>
      ) : isLoading ? (
        <StateFrame>
          <View className="h-full w-full flex-row items-end gap-3 px-2 pb-6">
            {WAITING.map((height, index) => (
              <View key={index} className="min-w-0 flex-1" style={{ height: `${height * 100}%` }}>
                <Skeleton className="h-full w-full" />
              </View>
            ))}
          </View>
        </StateFrame>
      ) : empty && data && data.length === 0 ? (
        <StateFrame>
          <EmptyState
            title={empty.title}
            description={empty.description}
            action={empty.action}
            icon={empty.icon}
          />
        </StateFrame>
      ) : (
        <View
          {...spoken}
          className="h-full w-full"
          onLayout={(event: LayoutChangeEvent) => {
            const { width, height } = event.nativeEvent.layout;
            setBox((current) =>
              current.width === width && current.height === height ? current : { width, height },
            );
          }}
        >
          {drawn ? children({ ...box, colors }) : children}
        </View>
      )}
    </View>
  );
}

function StateFrame({ children }: { children: ReactNode }) {
  return <View className="h-full w-full items-center justify-center">{children}</View>;
}

function nameFromConfig(config: ChartConfig, name: (series: string[]) => string) {
  return name(
    Object.values(config)
      .map((entry) => entry.label)
      .filter(Boolean),
  );
}

const MISSING_DATA =
  "[rivocode/ui-native] <ChartContainer empty={...}> without `data`: the frame has no way to " +
  "count zero, and the empty state will never appear. On the web it reads the points from inside the " +
  "Recharts chart when the prop is missing; here the child is any drawing and there is " +
  "nothing to open. Pass `data={points}`.";

const IGNORED_LABEL =
  "[rivocode/ui-native] <ChartContainer label={...}> with a JSX child: the label was " +
  "ignored. The inner component names the drawing (`ChartDonut` and `ChartRadial` have their own " +
  "`label`), and naming it here would close the whole child into a single screen reader " +
  "stop. The frame's `label` applies when `children` is a function.";

const FLAT_BOX =
  "[rivocode/ui-native] <ChartContainer>: the frame measured a width and no height, and the " +
  "drawing function received `height: 0` - the card stays empty, with no error at all. The height " +
  'comes from whoever uses the frame: give it a height class (`className="h-56"`), or ' +
  "give height to the parent that holds it.";

export function unknownSeriesComplaint(key: string, known: readonly string[]): string {
  return (
    `[rivocode/ui-native] <ChartContainer>: the drawing asked for the color "${key}", and \`config\` ` +
    `does not know that series - \`colors["${key}"]\` returns \`undefined\`, the SVG paints the mark ` +
    "black, and there is no error at all. The series of this chart are: " +
    `${known.join(", ")}. Fix the key, or declare the series in \`config\`.`
  );
}

function watched(colors: Record<string, string>, warned: Set<string>) {
  return new Proxy(colors, {
    get(target, key) {
      if (typeof key === "string" && !(key in target) && !warned.has(key)) {
        warned.add(key);
        console.warn(unknownSeriesComplaint(key, Object.keys(target)));
      }
      return target[key as string];
    },
  });
}
