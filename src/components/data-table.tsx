"use client";

import {
  columnFilteringFeature,
  constructFilterFn,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowSelectionState,
  type Updater,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useMemo, useState, type MouseEvent, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { EmptyState } from "./empty-state";
import { Pagination } from "./pagination";
import { Skeleton } from "./skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export type Column<Row> = {
  /** Chave da coluna. Precisa ser unica na tabela. */
  key: string;
  header: ReactNode;
  /** O que a celula mostra. Sem isto, o valor cru da chave. */
  cell?: (row: Row) => ReactNode;
  align?: "left" | "right";
  /** Some no celular. Use para o que da para descobrir de outro jeito. */
  hideOnMobile?: boolean;
  /** O cabecalho vira botao que alterna crescente, decrescente, sem ordem. */
  sortable?: boolean;
  /**
   * Valor cru para ordenar e filtrar, quando `cell` devolve JSX ou a chave
   * nao e campo direto da linha. Sem ele, vale `row[key]`.
   */
  value?: (row: Row) => string | number | Date | null | undefined;
};

export type DataTableProps<Row> = {
  data: Row[] | undefined;
  columns: Column<Row>[];
  /** Identidade da linha. Indice serve, mas quebra quando a lista reordena. */
  rowKey: (row: Row, index: number) => string;

  isLoading?: boolean;
  isError?: boolean;
  /** Sem isto, o erro nao oferece nova tentativa. */
  onRetry?: () => void;
  errorMessage?: ReactNode;

  /**
   * O que aparece quando a consulta volta vazia. A descricao e obrigatoria
   * porque "nenhum resultado" transfere para a pessoa o trabalho de descobrir
   * por que, e ela quase nunca descobre.
   */
  empty?: { title: string; description: string; action?: ReactNode; icon?: ReactNode };

  onRowClick?: (row: Row) => void;
  /** Quantas linhas falsas o carregando mostra. */
  skeletonRows?: number;
  className?: string;
  caption?: string;

  /**
   * Liga a paginacao client-side, com rodape: contagem a esquerda, paginas a
   * direita. Quem pagina no servidor nao usa isto: mostra a pagina que veio e
   * poe o `Pagination` da casa do lado de fora.
   */
  pageSize?: number;

  /**
   * Filtro global controlado: o app poe o campo de busca onde quiser e passa
   * o texto; a tabela filtra todas as colunas, ignorando caixa e acento.
   */
  filter?: string;

  /** Coluna de checkbox a esquerda. As chaves vem do `rowKey`. */
  selectable?: boolean;
  /** Selecao controlada. Sem ela, a tabela guarda a propria selecao. */
  selected?: string[];
  onSelectedChange?: (keys: string[]) => void;
};

/*
 * O motor e o TanStack Table, e isso e detalhe de implementacao: nenhum tipo
 * dele vaza para a API publica. Os recursos sao registrados uma vez, aqui,
 * e nao por render.
 */
const FEATURES = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns,
});

/** Caixa e acento fora: "ótica" acha "Otica" e vice-versa. */
const flatten = (text: unknown) =>
  String(text ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const filtroSemAcento = constructFilterFn({
  filter: (dataValue, filterValue: string) => flatten(dataValue).includes(filterValue),
  resolveFilterValue: (value: unknown) => flatten(value),
  autoRemove: (value: unknown) => !value,
});

/** Sem paginacao pedida, uma "pagina" que cabe qualquer lista. */
const SEM_PAGINACAO = Number.MAX_SAFE_INTEGER;

const chavesDe = (selecao: RowSelectionState) =>
  Object.keys(selecao).filter((key) => selecao[key]);

/**
 * Tabela com os tres estados que toda listagem tem e quase nenhuma trata:
 * carregando, erro e vazio.
 *
 * Ela nao conhece React Query, e isso e de proposito. Um design system que
 * depende de uma biblioteca de dados obriga todo projeto a usar a mesma, e
 * amarra a biblioteca a decisoes que nao sao dela. Aqui entram tres booleanos,
 * e funciona igual com fetch na mao, com SWR ou com server component:
 *
 *     <DataTable
 *       data={query.data}
 *       isLoading={query.isLoading}
 *       isError={query.isError}
 *       onRetry={query.refetch}
 *       columns={colunas}
 *       rowKey={(nota) => nota.id}
 *     />
 *
 * A ordem dos estados importa: erro vence carregando, e vazio so vale depois
 * que a consulta voltou. Sem essa ordem, uma nova busca sobre um erro pisca
 * "nenhum resultado" antes de mostrar o problema.
 *
 * Ordenar, filtrar, paginar e selecionar sao opt-in por prop, todos
 * client-side. Quem faz qualquer um deles no servidor ja tem os dados na ordem
 * certa: e so nao pedir o recurso.
 */
export function DataTable<Row>({
  data,
  columns,
  rowKey,
  isLoading,
  isError,
  onRetry,
  errorMessage = "Nao foi possivel carregar a lista.",
  empty,
  onRowClick,
  skeletonRows = 5,
  className,
  caption,
  pageSize,
  filter,
  selectable,
  selected,
  onSelectedChange,
}: DataTableProps<Row>) {
  const [pageIndex, setPageIndex] = useState(0);
  const [selecaoInterna, setSelecaoInterna] = useState<RowSelectionState>({});

  // Controlada quando `selected` veio; interna quando nao. Nos dois casos o
  // motor enxerga o mesmo formato, e `onSelectedChange` ouve as mudancas.
  const selecao: RowSelectionState = useMemo(
    () => (selected ? Object.fromEntries(selected.map((key) => [key, true])) : selecaoInterna),
    [selected, selecaoInterna],
  );

  // O motor exige `Record`, e a API publica nunca exigiu: o cast fica aqui na
  // fronteira, e o resto do arquivo segue no `Row` de quem chamou.
  type Linha = Record<string, unknown>;

  const defs = useMemo<ColumnDef<typeof FEATURES, Linha>[]>(
    () =>
      columns.map((column) => ({
        id: column.key,
        accessorFn: (row: Linha) => (column.value ? column.value(row as Row) : row[column.key]),
        enableSorting: column.sortable ?? false,
        enableGlobalFilter: true,
      })),
    [columns],
  );

  const table = useTable<typeof FEATURES, Linha>({
    features: FEATURES,
    columns: defs,
    data: (data ?? []) as unknown as Linha[],
    getRowId: (row, index) => rowKey(row as unknown as Row, index),
    enableRowSelection: selectable ?? false,
    // Numero ordena crescente no primeiro clique, como texto: a surpresa de
    // "cliquei e desceu" nao vale a esperteza da inferencia.
    sortDescFirst: false,
    globalFilterFn: filtroSemAcento,
    getColumnCanGlobalFilter: () => true,
    onPaginationChange: (updater: Updater<{ pageIndex: number; pageSize: number }>) => {
      setPageIndex((atual) => {
        const proximo =
          typeof updater === "function"
            ? updater({ pageIndex: atual, pageSize: pageSize ?? SEM_PAGINACAO })
            : updater;
        return proximo.pageIndex;
      });
    },
    onRowSelectionChange: (updater: Updater<RowSelectionState>) => {
      const proxima = typeof updater === "function" ? updater(selecao) : updater;
      if (!selected) setSelecaoInterna(proxima);
      onSelectedChange?.(chavesDe(proxima));
    },
    state: {
      globalFilter: filter || undefined,
      pagination: { pageIndex, pageSize: pageSize ?? SEM_PAGINACAO },
      rowSelection: selecao,
    },
  });

  /**
   * Abre a linha, a nao ser que o clique tenha sido em algo dentro dela.
   *
   * Uma coluna de acoes e o caso normal de uma listagem: menu, botao de baixar,
   * caixa de selecao. Sem esta guarda o clique acerta o botao e sobe ate a
   * linha, e a pessoa que abriu o menu ganha junto a folha de detalhes por
   * cima dele. Vale para o que o `closest` alcanca, entao o gatilho de menu
   * do Base UI, que e um `button`, ja entra.
   */
  function openRow(event: MouseEvent<HTMLTableRowElement>, row: Row) {
    const target = event.target as HTMLElement;
    if (target.closest("a,button,input,select,textarea,label,[role='menuitem'],[role='checkbox'],[data-rc-keep-row]")) {
      return;
    }
    onRowClick?.(row);
  }

  if (isError) {
    return (
      <Alert tone="danger" className={className}>
        <AlertTitle>Nao foi possivel carregar</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
        {onRetry && (
          <Button variant="secondary" size="sm" className="mt-3 w-fit" onClick={onRetry}>
            Tentar de novo
          </Button>
        )}
      </Alert>
    );
  }

  const loading = isLoading || data === undefined;

  if (!loading && data.length === 0 && empty) {
    return (
      <EmptyState
        className={className}
        icon={empty.icon}
        title={empty.title}
        description={empty.description}
        action={empty.action}
      />
    );
  }

  const linhas = table.getRowModel().rows;
  const totalFiltrado = table.getFilteredRowModel().rows.length;
  const totalColunas = columns.length + (selectable ? 1 : 0);

  // O rodape so existe com paginacao, e conta o que sobrou do filtro: "1-2 de
  // 5" e a lista, nao o banco.
  const inicio = pageIndex * (pageSize ?? SEM_PAGINACAO) + 1;
  const fim = Math.min(inicio + (pageSize ?? SEM_PAGINACAO) - 1, totalFiltrado);

  return (
    <div className={className}>
      <Table>
        {caption && <caption className="sr-only">{caption}</caption>}

        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Selecionar todas as linhas da pagina"
                  checked={table.getIsAllPageRowsSelected()}
                  indeterminate={table.getIsSomePageRowsSelected()}
                  onCheckedChange={() =>
                    table.toggleAllPageRowsSelected(!table.getIsAllPageRowsSelected())
                  }
                />
              </TableHead>
            )}
            {columns.map((column) => {
              const engineColumn = table.getColumn(column.key);
              const direcao = engineColumn?.getIsSorted();
              return (
                <TableHead
                  key={column.key}
                  aria-sort={
                    direcao === "asc" ? "ascending" : direcao === "desc" ? "descending" : undefined
                  }
                  className={cn(
                    column.align === "right" && "text-right",
                    column.hideOnMobile && "max-sm:hidden",
                  )}
                >
                  {column.sortable && engineColumn ? (
                    <button
                      type="button"
                      onClick={() => engineColumn.toggleSorting()}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-sm",
                        // O th ja pede uppercase, e a folha do navegador zera
                        // text-transform em controle de formulario: sem repetir
                        // aqui, a linha de cabecalho sai com caixa misturada.
                        "uppercase",
                        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "transition-colors duration-[var(--rc-duration-fast)] hover:text-fg",
                        direcao && "text-fg",
                      )}
                    >
                      {column.header}
                      {direcao === "asc" ? (
                        <ArrowUp className="size-3.5 text-accent-text" aria-hidden="true" />
                      ) : direcao === "desc" ? (
                        <ArrowDown className="size-3.5 text-accent-text" aria-hidden="true" />
                      ) : (
                        <ChevronsUpDown className="size-3.5 text-fg-subtle" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            Array.from({ length: skeletonRows }, (_, row) => (
              <TableRow key={`carregando-${row}`}>
                {selectable && (
                  <TableCell className="w-10">
                    <Skeleton className="size-4" />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={column.key} className={cn(column.hideOnMobile && "max-sm:hidden")}>
                    {/* A falsa linha tem a largura da coluna, e nao a do texto
                        que vier: assim a tabela nao pula quando os dados
                        chegam. */}
                    <Skeleton className="h-4 w-full max-w-[12ch]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : linhas.length === 0 && filter ? (
            // Filtro que zerou nao e consulta vazia: o EmptyState de `empty`
            // continua reservado para quando o banco nao tem nada.
            <TableRow>
              <TableCell colSpan={totalColunas} className="py-8 text-center text-fg-muted">
                Nenhum resultado para a busca.
              </TableCell>
            </TableRow>
          ) : (
            linhas.map((linha) => (
              <TableRow
                key={linha.id}
                onClick={
                  onRowClick
                    ? (event) => openRow(event, linha.original as unknown as Row)
                    : undefined
                }
                className={cn(onRowClick && "cursor-pointer")}
                data-selected={linha.getIsSelected() || undefined}
              >
                {selectable && (
                  <TableCell className="w-10">
                    <Checkbox
                      aria-label="Selecionar linha"
                      checked={linha.getIsSelected()}
                      onCheckedChange={(checked) => linha.toggleSelected(checked === true)}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(
                      column.align === "right" && "text-right",
                      column.hideOnMobile && "max-sm:hidden",
                    )}
                  >
                    {column.cell
                      ? column.cell(linha.original as unknown as Row)
                      : String(linha.original[column.key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pageSize !== undefined && !loading && totalFiltrado > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
          <p className="text-sm text-fg-muted">
            {inicio}–{fim} de {totalFiltrado}
          </p>
          <Pagination
            page={pageIndex + 1}
            pageCount={Math.max(1, table.getPageCount())}
            onPageChange={(page) => setPageIndex(page - 1)}
          />
        </div>
      )}
    </div>
  );
}
