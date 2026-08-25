import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { Button } from "./button";
import { cn } from "./cn";
import { EmptyState } from "./empty-state";
import { Skeleton } from "./skeleton";

export type DataListProps<Row> = {
  data: Row[] | undefined;
  renderItem: (row: Row) => ReactNode;
  keyExtractor: (row: Row, index: number) => string;

  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  errorMessage?: string;
  empty?: { title: string; description: string; action?: ReactNode };

  onRowPress?: (row: Row) => void;
  skeletonRows?: number;
  className?: string;
};

/**
 * A traducao do DataTable: tabela nao existe no celular, mas os quatro
 * finais de uma consulta - carregando, erro, vazio, dados - sao os mesmos,
 * na mesma ordem: erro vence carregando, e vazio so vale depois que a
 * consulta voltou. Tres booleanos, nenhuma biblioteca de dados.
 */
export function DataList<Row>({
  data,
  renderItem,
  keyExtractor,
  isLoading,
  isError,
  onRetry,
  errorMessage = "Nao foi possivel carregar a lista.",
  empty,
  onRowPress,
  skeletonRows = 4,
  className,
}: DataListProps<Row>) {
  if (isError) {
    return (
      <View className="items-start gap-3 rounded-md border border-danger bg-danger-subtle p-4">
        <Text className="text-sm text-danger-text">{errorMessage}</Text>
        {onRetry && (
          <Button size="sm" variant="secondary" onPress={onRetry}>
            Tentar de novo
          </Button>
        )}
      </View>
    );
  }

  const loading = isLoading || data === undefined;

  if (loading) {
    return (
      <View className="gap-3">
        {Array.from({ length: skeletonRows }, (_, index) => (
          <View key={index} className="gap-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </View>
        ))}
      </View>
    );
  }

  if (data.length === 0 && empty) {
    return <EmptyState title={empty.title} description={empty.description} action={empty.action} />;
  }

  return (
    <View className={cn("gap-1", className)}>
      {data.map((row, index) =>
        onRowPress ? (
          <Pressable
            key={keyExtractor(row, index)}
            accessibilityRole="button"
            onPress={() => onRowPress(row)}
            className="-mx-2 rounded-md px-2 py-1.5 active:bg-selected"
          >
            {renderItem(row)}
          </Pressable>
        ) : (
          <View key={keyExtractor(row, index)} className="py-1.5">
            {renderItem(row)}
          </View>
        ),
      )}
    </View>
  );
}
