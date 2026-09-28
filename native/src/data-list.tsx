import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";

import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { cn } from "./cn";
import { Entrance } from "./motion";
import { EmptyState, type EmptyStateProps } from "./empty-state";
import { Skeleton } from "./skeleton";
import { Text } from "./text";

export type DataListProps<Row> = {
  data: Row[] | undefined;
  renderItem: (row: Row) => ReactNode;
  keyExtractor: (row: Row, index: number) => string;

  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /**
   * A title line above the error message. Without it, the notice stays a single
   * line. The name is the one from `DataTable`, but the default is NOT: there
   * the title says "Nao foi possivel carregar" and the message details it; here
   * the notice was born with a single line, and that line is `errorMessage`.
   * Giving the title a default would stack two nearly identical sentences on
   * every screen that already uses the component. Pass both when the screen
   * loads more than one list and needs to say which one failed.
   */
  errorTitle?: string;
  errorMessage?: string;
  empty?: {
    title: string;
    description: string;
    action?: ReactNode;
    icon?: EmptyStateProps["icon"];
  };
  /**
   * The discreet line for when `filter` narrowed to zero. Without it, "Nenhum
   * resultado para a busca." Not to be confused with `empty`: a filter that
   * narrowed to zero is not an empty query, and the remedy for one - clearing
   * the search - does not serve the other. The same name and the same default
   * as `DataTable`.
   */
  noResultsMessage?: string;

  onRowPress?: (row: Row) => void;
  skeletonRows?: number;
  className?: string;

  /**
   * Controlled filter, the same name and the same shape as `DataTable`: the
   * screen places the `SearchInput` wherever it wants and passes the text; the
   * list narrows ignoring case and accents.
   */
  filter?: string;

  /**
   * What `filter` reads in each row. Without it, the search sees EVERY shallow
   * field of the row - including the id, so typing "12" finds the row with id
   * 12. On the web the declared columns delimit this; here there are no
   * columns, `renderItem` returns JSX and nobody can read text from inside it.
   * Pass this accessor when false positives get in the way.
   */
  filterValue?: (row: Row) => string;

  /** Checkbox to the left of each row. The keys come from `keyExtractor`. */
  selectable?: boolean;
  /**
   * The checked keys, when the consumer controls the selection, as in the web
   * `DataTable`. Without it, the list keeps its own selection.
   */
  value?: string[];
  onValueChange?: (keys: string[]) => void;
  /**
   * The component's texts, to change the language: `retry` is the button that
   * runs `onRetry` - the same key as the web `DataTable` -, and `selectRow` the
   * name of each row's checkbox. Pass only the ones that change.
   */
  labels?: Partial<DataListLabels>;
};

const flatten = (text: unknown) =>
  String(text ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export type DataListLabels = {
  retry: string;
  selectRow: string;
};

export function DataList<Row>({
  data,
  renderItem,
  keyExtractor,
  isLoading,
  isError,
  onRetry,
  errorTitle,
  errorMessage = "Não foi possível carregar a lista.",
  empty,
  noResultsMessage = "Nenhum resultado para a busca.",
  onRowPress,
  skeletonRows = 4,
  labels,
  className,
  filter,
  filterValue,
  selectable,
  value,
  onValueChange,
}: DataListProps<Row>) {
  const retryLabel = labels?.retry ?? "Tentar de novo";
  const [internalSelection, setInternalSelection] = useState<string[]>([]);
  const controlled = value;
  const selection = controlled ?? internalSelection;

  const toggle = (key: string, checked: boolean) => {
    const next = checked ? [...selection, key] : selection.filter((other) => other !== key);
    if (!controlled) setInternalSelection(next);
    onValueChange?.(next);
  };

  if (isError) {
    return (
      <Entrance className="items-start gap-3 rounded-md border border-danger bg-danger-subtle p-4">
        <View className="gap-1">
          {errorTitle && (
            <Text className="text-sm font-rc-medium text-danger-text">{errorTitle}</Text>
          )}
          <Text className="text-sm text-danger-text">{errorMessage}</Text>
        </View>
        {onRetry && (
          <Button size="sm" variant="secondary" onPress={onRetry}>
            {retryLabel}
          </Button>
        )}
      </Entrance>
    );
  }

  const loading = isLoading || data === undefined;

  if (loading) {
    return (
      <View className="gap-3">
        {Array.from({ length: skeletonRows }, (_, index) => (
          <View key={index} className="flex-row items-center gap-3">
            {selectable && <Skeleton className="size-5 rounded-sm" />}
            <View className="flex-1 gap-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (data.length === 0 && empty) {
    return (
      <EmptyState
        title={empty.title}
        description={empty.description}
        action={empty.action}
        icon={empty.icon}
      />
    );
  }

  const rows = data.map((row, index) => ({ row, key: keyExtractor(row, index) }));
  const needle = flatten(filter);
  const visible = needle
    ? rows.filter(({ row }) =>
        flatten(filterValue ? filterValue(row) : Object.values(row as object).join(" ")).includes(
          needle,
        ),
      )
    : rows;

  if (needle && visible.length === 0) {
    return <Text className="py-8 text-center text-sm text-fg-muted">{noResultsMessage}</Text>;
  }

  return (
    <Entrance effect="fadeIn" className={cn("gap-1", className)}>
      {visible.map(({ row, key }) => {
        const content = onRowPress ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onRowPress(row)}
            className="-mx-2 flex-1 rounded-md px-2 py-1.5 active:bg-selected"
          >
            {renderItem(row)}
          </Pressable>
        ) : (
          <View className="flex-1 py-1.5">{renderItem(row)}</View>
        );

        if (!selectable) return <View key={key}>{content}</View>;

        return (
          <View key={key} className="flex-row items-center gap-3">
            <Checkbox
                label={labels?.selectRow ?? "Selecionar linha"}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              checked={selection.includes(key)}
              onCheckedChange={(checked) => toggle(key, checked)}
            />
            {content}
          </View>
        );
      })}
    </Entrance>
  );
}
