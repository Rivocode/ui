import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { Button } from "./button";
import { Checkbox } from "./checkbox";
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

/** Caixa e acento fora: "otica" acha "Ótica" e vice-versa, como no DataTable. */
const flatten = (text: unknown) =>
  String(text ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * A traducao do DataTable: tabela nao existe no celular, mas os quatro
 * finais de uma consulta - carregando, erro, vazio, dados - sao os mesmos,
 * na mesma ordem: erro vence carregando, e vazio so vale depois que a
 * consulta voltou. Tres booleanos, nenhuma biblioteca de dados.
 *
 * Dos quatro opt-in do `DataTable`, dois porta e dois nao.
 *
 * Portam `filter` e `selectable`, com o mesmo nome de prop: buscar dentro de
 * uma lista de notas e MAIS necessario no celular que no desktop, onde cabe
 * mais linha na tela de uma vez, e marcar varias para agir em lote e gesto de
 * celular antes de ser de mouse.
 *
 * NAO portam `pageSize` nem ordenacao, e isso e decisao, nao pendencia. No
 * celular ordenar e um `Menu` de "ordenar por", que a tela monta em cima da
 * lista, e paginar e rolagem que carrega mais no fim - dois desenhos
 * diferentes, com estado que nao mora aqui. Reusar os nomes do web para
 * entregar esses dois seria paridade de fachada: a prop combinaria e o gesto,
 * nao.
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
  filter,
  filterValue,
  selectable,
  selected,
  onSelectedChange,
}: DataListProps<Row>) {
  const [internalSelection, setInternalSelection] = useState<string[]>([]);
  // Controlada quando `selected` veio, interna quando nao - a mesma divisao do
  // web, e nos dois casos `onSelectedChange` ouve a mudanca.
  const selection = selected ?? internalSelection;

  const toggle = (key: string, checked: boolean) => {
    const next = checked ? [...selection, key] : selection.filter((other) => other !== key);
    if (!selected) setInternalSelection(next);
    onSelectedChange?.(next);
  };

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
          <View key={index} className="flex-row items-center gap-3">
            {/* A caixa falsa reserva o lugar da de verdade: sem ela a lista
                inteira desliza para a direita quando os dados chegam. */}
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

  /*
   * A chave sai do indice ORIGINAL, antes do filtro. Com `keyExtractor` por
   * indice - que o web ja avisa ser fragil, e que continua sendo o que se
   * escreve com pressa - filtrar renumerava as linhas: a terceira nota, a
   * marcada, virava a primeira no instante em que alguem digitasse na busca, e
   * a selecao passava para outra linha sem ninguem tocar nela.
   */
  const rows = data.map((row, index) => ({ row, key: keyExtractor(row, index) }));
  const needle = flatten(filter);
  const visible = needle
    ? rows.filter(({ row }) =>
        flatten(filterValue ? filterValue(row) : Object.values(row as object).join(" ")).includes(
          needle,
        ),
      )
    : rows;

  /*
   * Filtro que zerou nao e consulta vazia: o `empty` continua reservado para
   * quando nao ha o que buscar. Trocar um pelo outro faz a tela dizer "emita a
   * primeira nota" para quem tem trinta e errou uma letra na busca.
   *
   * A frase depende do `needle`, e nao so da lista vazia: quem nao passa
   * `empty` sempre viu a lista sumir em silencio quando nao havia dados, e sem
   * essa condicao passaria a ler "nenhum resultado para a busca" sem nunca ter
   * buscado nada.
   */
  if (needle && visible.length === 0) {
    return <Text className="py-8 text-center text-sm text-fg-muted">Nenhum resultado para a busca.</Text>;
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
              /* A caixa sozinha desenha 20px. Doze de cada lado a levam aos 44
                 da Apple, que e a mesma conta que o `sm` do Button faz - e aqui
                 ela pesa mais, porque numa selecao em lote a pessoa acerta a
                 caixa varias vezes seguidas, com o polegar, rolando a lista. */
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              checked={selection.includes(key)}
              onCheckedChange={(checked) => toggle(key, checked)}
            />
            {/* A caixa e um Pressable DENTRO do Pressable da linha, e no React
                Native isso basta: o responder e de quem esta mais fundo e o
                toque nao sobe. O web precisa do `closest` para o clique na
                caixa nao abrir a linha junto; aqui nao ha o que interceptar. */}
            {content}
          </View>
        );
      })}
    </View>
  );
}
