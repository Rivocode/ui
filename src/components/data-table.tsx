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
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { EmptyState } from "./empty-state";
import { Pagination } from "./pagination";
import { Skeleton } from "./skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

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
  /**
   * O que esta coluna mostra no rodape: o irmao do `cell`, uma coluna acima.
   * Onde o `cell` resume uma linha, este resume a coluna inteira.
   *
   * As linhas que chegam sao **as que sobraram do filtro, de todas as
   * paginas** - o total de uma busca e o total da busca, e virar de pagina nao
   * muda quanto se deve. Basta uma coluna declarar `total` para o `<tfoot>`
   * existir; as outras saem em branco, alinhadas com quem esta em cima.
   *
   * Dinheiro sai abreviado, como no resto da casa:
   * `total: (rows) => currencyShort(rows.reduce((sum, row) => sum + row.amount, 0))`.
   */
  total?: (rows: Row[]) => ReactNode;
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
  /**
   * O titulo do aviso de erro. Sem ele, "Nao foi possivel carregar".
   *
   * Ele existe pelo mesmo motivo do `errorMessage`: uma tela que carrega tres
   * listagens diferentes precisa dizer qual delas falhou, e um produto que nao
   * fala portugues precisa dizer isso em outra lingua.
   */
  errorTitle?: ReactNode;
  errorMessage?: ReactNode;
  /**
   * A linha discreta de quando a busca nao acha nada. Sem ela, "Nenhum
   * resultado para a busca."
   *
   * Nao se confunde com o `empty`: filtro que zerou nao e consulta vazia, e o
   * remedio de um - limpar a busca - nao serve ao outro.
   */
  noResultsMessage?: ReactNode;

  /**
   * O que aparece quando a consulta volta vazia. A descricao e obrigatoria
   * porque "nenhum resultado" transfere para a pessoa o trabalho de descobrir
   * por que, e ela quase nunca descobre.
   */
  empty?: { title: ReactNode; description: ReactNode; action?: ReactNode; icon?: ReactNode };

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

  /**
   * Altura maxima da tabela. Com ela a lista ganha moldura propria: rola por
   * dentro em vez de empurrar a pagina, e o cabecalho gruda no topo.
   *
   * Numero vira pixel. Sozinha, ela nao virtualiza nada - as linhas continuam
   * todas no DOM, e isso basta ate uns poucos milhares.
   */
  maxHeight?: number | string;

  /**
   * Desenha so as linhas que cabem na moldura, e o caminho do meio aparece:
   * cem mil linhas com `sortable` e `filter` continuando a funcionar, sem
   * mandar a pessoa para a paginacao no servidor.
   *
   * Precisa de `maxHeight` - sem altura nao ha o que caber. Nao combina com
   * `pageSize`: paginar ja resolve o mesmo problema de outro jeito.
   */
  virtual?: boolean;

  /**
   * A altura de uma linha, em pixel, quando `virtual` esta ligado.
   *
   * Nao e chute: virtualizar so fecha a conta com linha de altura conhecida -
   * e o espaco de quem nao foi desenhado sai dessa multiplicacao. Por isso a
   * linha virtualizada recebe esta altura, e o padrao acompanha a densidade
   * confortavel. Numa lista densa, ou com celula de duas linhas, passe a sua.
   */
  rowHeight?: number;

  /** Coluna de checkbox a esquerda. As chaves vem do `rowKey`. */
  selectable?: boolean;
  /**
   * As chaves marcadas, quando quem usa controla a selecao. Sem ela, a tabela
   * guarda a propria.
   */
  value?: string[];
  /** As chaves marcadas de saida, quando a tabela controla a propria selecao. */
  defaultValue?: string[];
  onValueChange?: (keys: string[]) => void;

  /**
   * Classe por parte: `table`, `head`, `row`, `cell`, `footer`. Evita o
   * `[&_tbody_tr]`, que acopla a tela de quem usa a arvore interna da peca.
   *
   * `footer` e a barra de paginacao debaixo da tabela, e nao a linha de
   * totais - essa mora dentro do `<tfoot>` e se veste pelo que o `total` de
   * cada coluna devolve.
   */
  classNames?: Slots<"table" | "head" | "row" | "cell" | "footer">;
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

const accentFreeFilter = constructFilterFn({
  filter: (dataValue, filterValue: string) => flatten(dataValue).includes(filterValue),
  resolveFilterValue: (value: unknown) => flatten(value),
  autoRemove: (value: unknown) => !value,
});

/** Sem paginacao pedida, uma "pagina" que cabe qualquer lista. */
const NO_PAGINATION = Number.MAX_SAFE_INTEGER;

const keysOf = (selection: RowSelectionState) =>
  Object.keys(selection).filter((key) => selection[key]);

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
  errorTitle = "Não foi possível carregar",
  errorMessage = "Não foi possível carregar a lista.",
  noResultsMessage = "Nenhum resultado para a busca.",
  empty,
  onRowClick,
  skeletonRows = 5,
  className,
  caption,
  pageSize,
  filter,
  maxHeight,
  virtual,
  rowHeight = 44,
  selectable,
  value,
  defaultValue,
  onValueChange,
  classNames,
}: DataTableProps<Row>) {
  const [pageIndex, setPageIndex] = useState(0);

  /*
   * A selecao fala o vocabulario do catalogo - `value`/`onValueChange` -, o
   * mesmo da `Tree` e do `TreeSelect`. Eram tres dialetos para o mesmo dado, e
   * quem escrevia uma tela com as tres pecas reescrevia o binding a cada uma.
   */
  const [internalSelection, setInternalSelection] = useState<RowSelectionState>(() =>
    Object.fromEntries((defaultValue ?? []).map((key) => [key, true])),
  );

  // Controlada quando a chave veio de fora; interna quando nao. Nos dois casos
  // o motor enxerga o mesmo formato, e o aviso ouve as mudancas.
  const selection: RowSelectionState = useMemo(
    () => (value ? Object.fromEntries(value.map((key) => [key, true])) : internalSelection),
    [value, internalSelection],
  );

  // O motor exige `Record`, e a API publica nunca exigiu: o cast fica aqui na
  // fronteira, e o resto do arquivo segue no `Row` de quem chamou.
  type EngineRow = Record<string, unknown>;

  const defs = useMemo<ColumnDef<typeof FEATURES, EngineRow>[]>(
    () =>
      columns.map((column) => ({
        id: column.key,
        accessorFn: (row: EngineRow) => (column.value ? column.value(row as Row) : row[column.key]),
        enableSorting: column.sortable ?? false,
        enableGlobalFilter: true,
      })),
    [columns],
  );

  const table = useTable<typeof FEATURES, EngineRow>({
    features: FEATURES,
    columns: defs,
    data: (data ?? []) as unknown as EngineRow[],
    getRowId: (row, index) => rowKey(row as unknown as Row, index),
    enableRowSelection: selectable ?? false,
    // Numero ordena crescente no primeiro clique, como texto: a surpresa de
    // "cliquei e desceu" nao vale a esperteza da inferencia.
    sortDescFirst: false,
    globalFilterFn: accentFreeFilter,
    getColumnCanGlobalFilter: () => true,
    onPaginationChange: (updater: Updater<{ pageIndex: number; pageSize: number }>) => {
      setPageIndex((atual) => {
        const proximo =
          typeof updater === "function"
            ? updater({ pageIndex: atual, pageSize: pageSize ?? NO_PAGINATION })
            : updater;
        return proximo.pageIndex;
      });
    },
    onRowSelectionChange: (updater: Updater<RowSelectionState>) => {
      const proxima = typeof updater === "function" ? updater(selection) : updater;
      if (!value) setInternalSelection(proxima);
      const keys = keysOf(proxima);
      onValueChange?.(keys);
    },
    state: {
      globalFilter: filter || undefined,
      pagination: { pageIndex, pageSize: pageSize ?? NO_PAGINATION },
      rowSelection: selection,
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

  const rows = table.getRowModel().rows;

  /*
   * Virtualizar exige tres coisas, e as tres precisam existir antes de qualquer
   * retorno cedo - por isso o virtualizador e criado aqui em cima, mesmo nos
   * estados de erro e de carregando, onde ele conta zero linhas.
   *
   * 1. UMA MOLDURA COM ALTURA E ROLAGEM PROPRIA. Nao ha "linha que cabe" sem
   *    um retangulo que diga quanto cabe: quem rola a pagina inteira rola o
   *    documento, e o documento nao tem fim conhecido. Por isso `virtual`
   *    depende de `maxHeight`, e a moldura vira o elemento que rola.
   *
   * 2. NAO POSICIONAR LINHA. O jeito comum de virtualizar - `position:
   *    absolute` com `translateY` em cada linha - destroi a tabela: linha
   *    absoluta sai do algoritmo de layout de tabela, e com ela vao a
   *    largura de coluna compartilhada e o alinhamento entre cabecalho e
   *    celula. O que sobra e uma grade de divs com cara de tabela, e a peca
   *    inteira existe para nao ser isso. Aqui as linhas visiveis ficam em
   *    fluxo normal, e o espaco de quem nao foi desenhado vira duas linhas
   *    vazias, uma antes e uma depois, com a altura que falta. O `<tbody>`
   *    continua tendo so `<tr>` por filho, cada `<tr>` so `<td>`, e o
   *    navegador continua calculando as colunas como sempre.
   *
   * 3. CABECALHO GRUDADO. Rolagem longa sem cabecalho fixo e ilegivel na
   *    terceira tela: a pessoa esquece qual coluna e qual e volta ao topo para
   *    conferir. Ele gruda com `--rc-z-sticky`, que e o degrau de empilhamento
   *    desta familia - abaixo de menu, dialogo e toast, que precisam passar
   *    por cima dele.
   */
  const viewport = useRef<HTMLDivElement>(null);
  const virtualized = virtual === true && maxHeight !== undefined;

  const virtualizer = useVirtualizer({
    count: virtualized ? rows.length : 0,
    getScrollElement: () => viewport.current,
    estimateSize: () => rowHeight,
    // Uma tela de folga para cada lado: rolar rapido nao pode revelar buraco.
    overscan: 10,
  });

  const visible = virtualized ? virtualizer.getVirtualItems() : [];
  const firstVisible = visible[0];
  const lastVisible = visible[visible.length - 1];
  const spaceBefore = firstVisible ? firstVisible.start : 0;
  const spaceAfter = lastVisible ? virtualizer.getTotalSize() - lastVisible.end : 0;

  if (isError) {
    return (
      <Alert tone="danger" className={className}>
        <AlertTitle>{errorTitle}</AlertTitle>
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

  const filteredTotal = table.getFilteredRowModel().rows.length;
  const columnCount = columns.length + (selectable ? 1 : 0);

  // O rodape so existe com paginacao, e conta o que sobrou do filtro: "1-2 de
  // 5" e a lista, nao o banco.
  const first = pageIndex * (pageSize ?? NO_PAGINATION) + 1;
  const last = Math.min(first + (pageSize ?? NO_PAGINATION) - 1, filteredTotal);

  /*
   * Cabecalho e corpo sao os mesmos nos dois enquadramentos abaixo; o que muda
   * e a moldura em volta deles.
   */
  const head = (
    <TableHeader
      className={cn(
        // O cabecalho so gruda dentro de uma moldura que rola. Sem
        // `maxHeight` quem rola e a pagina, e um `sticky` aqui colaria a
        // linha de titulos no topo da janela, por cima do resto da tela.
        //
        // O fundo e obrigatorio: sem ele a linha que passa por baixo aparece
        // atraves do cabecalho. E o risco de baixo vira sombra, porque
        // `border-collapse` e `position: sticky` juntos comem a borda de um
        // `<thead>` grudado - o navegador colapsa a borda para dentro da
        // primeira linha, que rola embora com ela.
        maxHeight !== undefined && [
          "sticky top-0 z-[var(--rc-z-sticky)] bg-surface",
          "shadow-[inset_0_-1px_0_var(--rc-border)]",
        ],
      )}
    >
      <TableRow aria-rowindex={virtualized ? 1 : undefined}>
        {selectable && (
          <TableHead className={cn("w-10", classNames?.head)}>
            <Checkbox
              aria-label="Selecionar todas as linhas da página"
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
                classNames?.head,
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
  );

  /**
   * As linhas que vao para o DOM, com o indice que cada uma ocupa na lista
   * inteira - e nao no pedaco desenhado. E o indice que o `aria-rowindex`
   * publica: sem ele, quem ouve a tela ouviria "linha 3 de 500" ao chegar na
   * linha 402.
   */
  const drawn: { row: (typeof rows)[number]; index: number }[] = virtualized
    ? visible.flatMap((item) => {
        const row = rows[item.index];
        return row ? [{ row, index: item.index }] : [];
      })
    : rows.map((row, index) => ({ row, index }));

  /**
   * O espaco de quem nao foi desenhado, numa linha vazia.
   *
   * Ela sai do fluxo do leitor de tela com `aria-hidden`, e a contagem certa
   * vem do `aria-rowcount` na tabela mais o `aria-rowindex` de cada linha de
   * dado - senao a lista seria anunciada como "3 linhas" o tempo todo.
   *
   * A altura vai em `style` porque e medida, e nao desenho: ela muda a cada
   * quadro de rolagem, e nenhum token poderia saber quanto vale.
   */
  const spacer = (height: number, side: string) => (
    <tr key={`espaco-${side}`} aria-hidden="true">
      <td colSpan={columnCount} style={{ height }} />
    </tr>
  );

  /*
   * A LINHA DE TOTAIS.
   *
   * Toda listagem financeira daqui termina em "Total: R$ 248,3K", e ate agora
   * isso era uma <div> embaixo da tabela: sem largura de coluna, o total nunca
   * ficava debaixo do valor que soma, e com `maxHeight` ele rolava embora. Num
   * <tfoot> a celula divide a largura com a coluna, e o rodape gruda embaixo
   * pelo mesmo mecanismo com que o cabecalho gruda em cima.
   *
   * O SOMATORIO E POR COLUNA, e nao um slot livre. Um `footer?: (rows) => ...`
   * devolveria o problema de onde ele veio: quem escreve teria de montar a
   * `<tr>` e as `<td>` na mao, contar as colunas escondidas no celular, repetir
   * o alinhamento de cada uma - e errar em qualquer um desses e voltar a ter o
   * total fora de eixo, agora dentro de uma tabela. O `total` e o irmao do
   * `cell` uma linha acima: quem sabe formatar a celula sabe formatar a soma
   * dela, e o resto a peca ja sabe.
   *
   * AS LINHAS SAO AS DO FILTRO, nao as da pagina. O rodape de paginacao ao lado
   * ja conta assim ("1-4 de 7" conta o que sobrou da busca), e um total que
   * mudasse a cada virada de pagina nao seria um total de nada.
   */
  const summed = columns.some((column) => column.total)
    ? table.getFilteredRowModel().rows.map((row) => row.original as unknown as Row)
    : undefined;

  const foot = summed && !loading && rows.length > 0 && (
    <TableFooter
      className={cn(
        // Mesmo motivo do cabecalho, do outro lado: fora de uma moldura que
        // rola quem rola e a pagina, e o `sticky` colaria o total no rodape da
        // janela. O fundo evita a linha aparecendo por baixo, e o risco vira
        // sombra porque `border-collapse` come a borda de um `<tfoot>` grudado.
        maxHeight !== undefined && [
          "sticky bottom-0 z-[var(--rc-z-sticky)] bg-surface",
          "shadow-[inset_0_1px_0_var(--rc-border)]",
        ],
      )}
    >
      {/* Virtualizada, a contagem publicada e a das linhas de dado mais o
          cabecalho; o total e a ultima, e sem indice ele seria anunciado com
          o numero de outra pessoa. */}
      <TableRow
        aria-rowindex={virtualized ? rows.length + 2 : undefined}
        className="border-b-0 hover:bg-transparent"
      >
        {selectable && <TableCell className="w-10" />}
        {columns.map((column) => (
          <TableCell
            key={column.key}
            className={cn(
              column.align === "right" && "text-right",
              column.hideOnMobile && "max-sm:hidden",
            )}
          >
            {column.total?.(summed)}
          </TableCell>
        ))}
      </TableRow>
    </TableFooter>
  );

  const body = (
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
      ) : rows.length === 0 && filter ? (
        // Filtro que zerou nao e consulta vazia: o EmptyState de `empty`
        // continua reservado para quando o banco nao tem nada.
        <TableRow>
          <TableCell colSpan={columnCount} className="py-8 text-center text-fg-muted">
            {noResultsMessage}
          </TableCell>
        </TableRow>
      ) : (
        <>
          {spaceBefore > 0 && spacer(spaceBefore, "antes")}
          {drawn.map(({ row: linha, index }) => (
            <TableRow
              key={linha.id}
              aria-rowindex={virtualized ? index + 2 : undefined}
              /*
               * Virtualizada, a linha tem altura fixa - e a estimativa deixa
               * de ser estimativa. Sem isso o `rowHeight` seria um palpite:
               * o virtualizador poe os espacadores contando com ele, e uma
               * linha que cresce faz a rolagem prometer um fim que nao
               * chega. A altura vem da prop, entao ela e dado de quem chamou
               * e nao medida cravada aqui dentro.
               */
              style={virtualized ? { height: rowHeight } : undefined}
              onClick={
                onRowClick
                  ? (event) => openRow(event, linha.original as unknown as Row)
                  : undefined
              }
              className={cn(onRowClick && "cursor-pointer", classNames?.row)}
              data-selected={linha.getIsSelected() || undefined}
            >
              {selectable && (
                <TableCell className={cn("w-10", classNames?.cell)}>
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
                    classNames?.cell,
                  )}
                >
                  {column.cell
                    ? column.cell(linha.original as unknown as Row)
                    : String(linha.original[column.key] ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {spaceAfter > 0 && spacer(spaceAfter, "depois")}
        </>
      )}
    </TableBody>
  );

  return (
    <div className={className}>
      {maxHeight === undefined ? (
        <Table className={classNames?.table}>
          {caption && <caption className="sr-only">{caption}</caption>}
          {head}
          {body}
          {foot}
        </Table>
      ) : (
        /*
         * Com altura, a moldura que rola precisa ser a mae direta da tabela: o
         * `sticky` do cabecalho se mede contra o ancestral que rola mais
         * proximo, e o `<div>` de rolagem lateral que o `Table` desenha por
         * dentro ficaria no meio - ele e um ancestral que rola, so que nunca
         * rola na vertical, e o cabecalho grudaria num lugar que nao anda.
         *
         * Por isso a `<table>` daqui e escrita a mao, com as mesmas classes
         * que o `Table` poe nela. Continua sendo tabela de verdade; o que
         * mudou foi so quem segura a rolagem.
         */
        <div
          ref={viewport}
          data-rc-viewport=""
          style={{ maxHeight }}
          className="w-full overflow-auto rounded-md border border-border bg-surface"
        >
          <table
            // Cabecalho, linhas de dado e - quando existe - a linha de totais.
            aria-rowcount={virtualized ? rows.length + (foot ? 2 : 1) : undefined}
            className={cn("w-full border-collapse text-base", classNames?.table)}
          >
            {caption && <caption className="sr-only">{caption}</caption>}
            {head}
            {body}
            {foot}
          </table>
        </div>
      )}

      {pageSize !== undefined && !loading && filteredTotal > 0 && (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 pt-3",
            classNames?.footer,
          )}
        >
          <p className="text-sm text-fg-muted">
            {first}–{last} de {filteredTotal}
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
