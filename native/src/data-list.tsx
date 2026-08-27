import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";

import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { cn } from "./cn";
import { EmptyState } from "./empty-state";
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
   * Uma linha de titulo acima da mensagem de erro. Sem ele, o aviso continua
   * de uma linha so.
   *
   * O nome e o do `DataTable`, mas o padrao NAO: la o titulo e quem diz "Nao
   * foi possivel carregar" e a mensagem detalha; aqui o aviso nasceu com uma
   * linha so, e essa linha e a `errorMessage`. Dar padrao ao titulo poria duas
   * frases quase iguais uma em cima da outra em toda tela que ja usa a peca.
   * Passe os dois quando a tela carregar mais de uma lista e precisar dizer
   * qual delas caiu.
   */
  errorTitle?: string;
  errorMessage?: string;
  /**
   * O nome do botao que executa o `onRetry`. Sem ele, "Tentar de novo".
   *
   * O mesmo nome e o mesmo padrao do `DataTable`, e existe pelo motivo do
   * `errorTitle`: uma tela em outra lingua saia com o aviso traduzido e o
   * botao logo abaixo em portugues.
   *
   * `string`, e nao `ReactNode` como no web: o rotulo do `Button` nativo mora
   * dentro de um `Text`.
   */
  retryLabel?: string;
  empty?: { title: string; description: string; action?: ReactNode };
  /**
   * A linha discreta de quando o `filter` zerou. Sem ela, "Nenhum resultado
   * para a busca."
   *
   * Nao se confunde com o `empty`: filtro que zerou nao e consulta vazia, e o
   * remedio de um - limpar a busca - nao serve ao outro. O mesmo nome e o
   * mesmo padrao do `DataTable`.
   */
  noResultsMessage?: string;

  onRowPress?: (row: Row) => void;
  skeletonRows?: number;
  className?: string;

  /**
   * Filtro controlado, o mesmo nome e o mesmo formato do `DataTable`: a tela
   * poe o `SearchInput` onde quiser e passa o texto; a lista estreita
   * ignorando caixa e acento.
   */
  filter?: string;

  /**
   * O que o `filter` le em cada linha. Sem ele, a busca ve TODO campo raso da
   * linha - inclusive o id, entao digitar "12" acha a linha de id 12. No web
   * quem delimita isso sao as colunas declaradas; aqui nao ha colunas, o
   * `renderItem` devolve JSX e ninguem consegue ler texto de dentro dele.
   * Passe este acessor quando o falso positivo incomodar.
   */
  filterValue?: (row: Row) => string;

  /** Caixa de marcar a esquerda de cada linha. As chaves vem do `keyExtractor`. */
  selectable?: boolean;
  /** Selecao controlada. Sem ela, a lista guarda a propria selecao. */
  selected?: string[];
  onSelectedChange?: (keys: string[]) => void;
};

const flatten = (text: unknown) =>
  String(text ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export function DataList<Row>({
  data,
  renderItem,
  keyExtractor,
  isLoading,
  isError,
  onRetry,
  errorTitle,
  errorMessage = "Não foi possível carregar a lista.",
  retryLabel = "Tentar de novo",
  empty,
  noResultsMessage = "Nenhum resultado para a busca.",
  onRowPress,
  skeletonRows = 4,
  className,
  filter,
  filterValue,
  selectable,
  selected,
  onSelectedChange,
}: DataListProps<Row>) {
  const [internalSelection, setInternalSelection] = useState<string[]>([]);
  const selection = selected ?? internalSelection;

  const toggle = (key: string, checked: boolean) => {
    const next = checked ? [...selection, key] : selection.filter((other) => other !== key);
    if (!selected) setInternalSelection(next);
    onSelectedChange?.(next);
  };

  if (isError) {
    return (
      <View className="items-start gap-3 rounded-md border border-danger bg-danger-subtle p-4">
        <View className="gap-1">
          {errorTitle && <Text className="text-sm font-medium text-danger-text">{errorTitle}</Text>}
          <Text className="text-sm text-danger-text">{errorMessage}</Text>
        </View>
        {onRetry && (
          <Button size="sm" variant="secondary" onPress={onRetry}>
            {retryLabel}
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
    return <EmptyState title={empty.title} description={empty.description} action={empty.action} />;
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
    <View className={cn("gap-1", className)}>
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
              accessibilityLabel="Selecionar linha"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              checked={selection.includes(key)}
              onCheckedChange={(checked) => toggle(key, checked)}
            />
            {content}
          </View>
        );
      })}
    </View>
  );
}
