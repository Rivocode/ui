import type { ReactNode } from "react";
import { View } from "react-native";

import { Alert } from "./basics";
import { Button } from "./button";
import { cn, type Slots } from "./cn";
import { EmptyState, type EmptyStateProps } from "./empty-state";
import { Skeleton } from "./skeleton";
import { useSilentMisuse } from "./silent-misuse";

export type QueryBoundaryProps<Data> = {
  /**
   * The query response. `undefined` means "not here yet": without `isLoading`,
   * it is what turns loading on - and, with a function child, it turns it on
   * even with `isLoading={false}`, because there is nothing to hand to the
   * function. An empty array and `null` count as empty, and that is how the
   * component decides on its own. For any other shape - `{ items: [], total: 0
   * }` - `isEmpty` answers.
   */
  data?: Data;

  isLoading?: boolean;
  isError?: boolean;
  /** Without it, the error offers no retry. */
  onRetry?: () => void;
  /**
   * The title of the error notice. Without it, "Nao foi possivel carregar". The
   * same name and the same role as the `errorTitle` of `DataList` and
   * `ChartContainer`: a screen that loads three blocks needs to say which one
   * failed, and a product that does not speak Portuguese needs to say it in
   * another language. Here it HAS a default, unlike `DataList`, because the
   * notice is born with two lines, as on the web. `string`, and not `ReactNode`
   * as on the web: the native `Alert` title is a `Text`, and a React node would
   * have nowhere to fit there.
   */
  errorTitle?: string;
  /**
   * The bottom line of the notice. Without it, "Tente de novo em alguns
   * minutos". `string` for the same reason as `errorTitle`: the native `Alert`
   * body is also a `Text`.
   */
  errorMessage?: string;

  /**
   * What appears when the query comes back empty. The same shape as the web,
   * with the title and description as `string`, which is what fits inside a
   * `Text`, and `icon` also accepting the function that receives color and
   * size, as in the native `EmptyState`. The description is required because
   * "nenhum resultado" shifts to the person the work of finding out why, and
   * they almost never do. Without it there is no empty state: the children draw
   * the empty response their own way.
   */
  empty?: {
    title: string;
    description: string;
    action?: ReactNode;
    icon?: EmptyStateProps["icon"];
  };

  /**
   * States emptiness instead of `data`, for a response that is not a list:
   * `isEmpty={page.total === 0}`. When present, it wins over the `data` count.
   */
  isEmpty?: boolean;

  /**
   * The waiting drawing, in the shape of what comes next - the three-row list,
   * the card, the sheet of fields. Without it, generic rows go in, which hold
   * height but promise no shape. With a custom mold the frame stops announcing
   * itself as a single screen reader stop: the text you put inside the mold
   * does the talking, and a label up here would swallow it.
   */
  skeleton?: ReactNode;
  /** How many fake rows the generic wait shows. Ignored with `skeleton`. */
  skeletonRows?: number;

  /**
   * The response on screen. As a function, it is called only after the data has
   * arrived, and receives `data` without `undefined` - which is the `!` every
   * screen used to write here. The children render with no wrapper at all: an
   * invisible `View` around them would break the `flex-1` or `gap` of whoever
   * is outside, and the defect would only show up on the device.
   */
  children: ReactNode | ((data: NonNullable<Data>) => ReactNode);

  /**
   * Styles the three endings, not the children: the frame that reserves the
   * height applies equally to the skeleton, the error notice and the empty
   * state.
   */
  className?: string;
  /**
   * The component's texts, to change the language: `retry` is the button that
   * runs `onRetry`, "Tentar de novo" without it - the same key as the web and
   * as the query components here -, and `loading` what the screen reader hears
   * during the generic wait, "Carregando" without it.
   */
  labels?: Partial<QueryBoundaryLabels>;
  /**
   * Class per part: `loading` (the skeleton frame), `error` (the notice with
   * the button) and `empty` (the empty state). Each one styles only its own
   * ending, on the same node as `className`.
   */
  classNames?: Slots<"loading" | "error" | "empty">;
};

export type QueryBoundaryLabels = {
  retry: string;
  loading: string;
};

export function QueryBoundary<Data>({
  data,
  isLoading,
  isError,
  onRetry,
  errorTitle = "Não foi possível carregar",
  errorMessage = "Tente de novo em alguns minutos.",
  empty,
  isEmpty,
  skeleton,
  skeletonRows = 3,
  children,
  labels,
  className,
  classNames,
}: QueryBoundaryProps<Data>) {
  const retryLabel = labels?.retry ?? "Tentar de novo";
  const needsData = typeof children === "function";
  const loading = needsData ? isLoading || data === undefined : (isLoading ?? data === undefined);
  const blank = isEmpty ?? blankOf(data);

  useSilentMisuse(
    !isError && !loading && empty !== undefined && blank === undefined,
    UNDECIDABLE_EMPTY,
  );

  if (isError) {
    return (
      <View className={cn("items-start gap-3", className, classNames?.error)}>
        <Alert tone="danger" title={errorTitle} className="w-full">
          {errorMessage}
        </Alert>
        {onRetry && (
          <Button size="sm" variant="secondary" onPress={onRetry}>
            {retryLabel}
          </Button>
        )}
      </View>
    );
  }

  if (loading) {
    const generic = skeleton === undefined;

    return (
      <View
        accessible={generic}
        accessibilityLabel={generic ? (labels?.loading ?? "Carregando") : undefined}
        accessibilityState={{ busy: true }}
        className={cn("gap-3", className, classNames?.loading)}
      >
        {skeleton ??
          Array.from({ length: skeletonRows }, (_, line) => (
            <Skeleton
              key={line}
              className={cn("h-4 w-full", line === skeletonRows - 1 && "w-2/3")}
            />
          ))}
      </View>
    );
  }

  if (empty && blank) {
    return (
      <EmptyState
        className={cn(className, classNames?.empty)}
        title={empty.title}
        description={empty.description}
        action={empty.action}
        icon={empty.icon}
      />
    );
  }

  if (needsData) {
    if (data === undefined || data === null) return null;
    return <>{(children as (data: NonNullable<Data>) => ReactNode)(data as NonNullable<Data>)}</>;
  }

  return <>{children}</>;
}

function blankOf(data: unknown): boolean | undefined {
  if (data === null) return true;
  if (Array.isArray(data)) return data.length === 0;
  return undefined;
}

const UNDECIDABLE_EMPTY =
  "[rivocode/ui-native] <QueryBoundary empty={...}> with no list to count: the `data` that " +
  "arrived is neither an array nor `null`, so the empty state will never appear and the children " +
  "draw over nothing. State emptiness with `isEmpty={response.total === 0}`, or pass in " +
  "`data` the list inside the response.";
