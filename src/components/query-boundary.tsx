import { CircleX } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { LoadingAnnouncement } from "../lib/loading-announcement";
import type { Slots } from "../lib/slots";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { Skeleton } from "./skeleton";

export type QueryBoundaryProps<Data> = {
  /**
   * The query's response. `undefined` is "not here yet": without `isLoading`,
   * it is what turns on loading - and, with a function child, it turns it on even with
   * `isLoading={false}`, because there is nothing to hand to the function.
   *
   * An empty array and `null` count as empty, and that is how the piece decides
   * on its own. For any other shape - `{ items: [], total: 0 }` - the one that
   * answers is `isEmpty`.
   */
  data?: Data;

  isLoading?: boolean;
  isError?: boolean;
  /** Without this, the error offers no retry. */
  onRetry?: () => void;
  /**
   * The title of the error notice. Without it, "Nao foi possivel carregar".
   *
   * The same name and the same role as `errorTitle` on `DataTable` and
   * `ChartContainer`: a screen that loads three blocks has to say which
   * of them failed, and a product that does not speak Portuguese has to say it in
   * another language.
   */
  errorTitle?: ReactNode;
  errorMessage?: ReactNode;

  /**
   * What appears when the query comes back empty. The description is required
   * because "nenhum resultado" hands the person the work of finding out
   * why, and they almost never do.
   *
   * Without it there is no empty state: the children draw the empty response their
   * own way.
   */
  empty?: { title: ReactNode; description: ReactNode; action?: ReactNode; icon?: ReactNode };

  /**
   * States emptiness in place of `data`, for a response that is not a list:
   * `isEmpty={page.total === 0}`. When given, it wins over the count from `data`.
   */
  isEmpty?: boolean;

  /**
   * The drawing of the wait, in the shape of what comes next - the three-row
   * list, the card, the sheet of fields. Without it generic rows come in, which
   * hold the height but promise no shape at all.
   */
  skeleton?: ReactNode;
  /** How many placeholder rows the generic wait shows. Ignored with `skeleton`. */
  skeletonRows?: number;

  /**
   * The response on screen. As a function, it is only called after the data
   * has arrived, and receives `data` without `undefined` - which is the `!` every screen
   * used to write here.
   */
  children: ReactNode | ((data: NonNullable<Data>) => ReactNode);

  /**
   * Dresses the three endings, and not the children: the frame that reserves the height applies
   * equally to the skeleton, the error notice and the empty state.
   */
  className?: string;
  /**
   * The piece's texts, to change the language: `retry` is the button that runs
   * `onRetry`, "Tentar de novo" without it - the same key in every piece that
   * handles the four endings.
   * `loading` and `loaded` are what the screen reader hears when the query
   * goes out and when it comes back.
   */
  labels?: Partial<QueryBoundaryLabels>;
  /**
   * Class per part: `loading`, `error`, `empty`. Avoids `[&_div]`, which
   * couples the consumer's screen to the piece's internal tree.
   */
  classNames?: Slots<"loading" | "error" | "empty">;
};

export type QueryBoundaryLabels = {
  retry: string;
  loading: string;
  loaded: string;
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
  if (isError) {
    return (
      <Alert tone="danger" icon={<CircleX />} className={cn(className, classNames?.error)}>
        <AlertTitle>{errorTitle}</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
        {onRetry && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3 w-fit"
            onClick={onRetry}
          >
            {retryLabel}
          </Button>
        )}
      </Alert>
    );
  }

  const needsData = typeof children === "function";
  const loading = needsData ? isLoading || data === undefined : (isLoading ?? data === undefined);

  const blank = isEmpty ?? blankOf(data);

  if (!loading && empty && blank === undefined) warnAboutUndecidableEmpty();

  return (
    <>
      <LoadingAnnouncement loading={loading} labels={labels} />

      {loading ? (
        <div aria-busy="true" className={cn("flex flex-col gap-3", className, classNames?.loading)}>
          {skeleton ??
            Array.from({ length: skeletonRows }, (_, line) => (
              <Skeleton
                key={`carregando-${line}`}
                className={cn("h-4 w-full", line === skeletonRows - 1 && "w-2/3")}
              />
            ))}
        </div>
      ) : empty && blank ? (
        <EmptyState
          className={cn(className, classNames?.empty)}
          icon={empty.icon}
          title={empty.title}
          description={empty.description}
          action={empty.action}
        />
      ) : needsData ? (
        data === undefined || data === null ? null : (
          (children as (data: NonNullable<Data>) => ReactNode)(data as NonNullable<Data>)
        )
      ) : (
        children
      )}
    </>
  );
}

function blankOf(data: unknown): boolean | undefined {
  if (data === null) return true;
  if (Array.isArray(data)) return data.length === 0;
  return undefined;
}

const warned = new Set<string>();

function warnAboutUndecidableEmpty() {
  const message =
    "[rivocode/ui] <QueryBoundary empty={...}> with no list to count: the `data` that " +
    "arrived is neither an array nor `null`, so the empty state will never appear and the children " +
    "draw over nothing. State emptiness with `isEmpty={response.total === 0}`, or pass in " +
    "`data` the list inside the response.";

  if (process.env.NODE_ENV === "production" || warned.has(message)) return;

  warned.add(message);
  console.warn(message);
}
