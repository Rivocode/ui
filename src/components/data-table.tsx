"use client";

import type { MouseEvent, ReactNode } from "react";

import { cn } from "../lib/cn";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { Skeleton } from "./skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export type Column<Row> = {
  /** Chave da coluna. Precisa ser unica na tabela. */
  key: string;
  header: ReactNode;
  /** O que a celula mostra. Sem isto, o valor cru da chave. */
  cell?: (linha: Row) => ReactNode;
  align?: "left" | "right";
  /** Some no celular. Use para o que da para descobrir de outro jeito. */
  hideOnMobile?: boolean;
};

export type DataTableProps<Row> = {
  data: Row[] | undefined;
  columns: Column<Row>[];
  /** Identidade da linha. Indice serve, mas quebra quando a lista reordena. */
  rowKey: (linha: Row, indice: number) => string;

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

  onRowClick?: (linha: Row) => void;
  /** Quantas linhas falsas o carregando mostra. */
  skeletonRows?: number;
  className?: string;
  caption?: string;
};

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
}: DataTableProps<Row>) {
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
    if (target.closest("a,button,input,select,textarea,label,[role='menuitem'],[data-rc-keep-row]")) {
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

  const carregando = isLoading || data === undefined;

  if (!carregando && data.length === 0 && empty) {
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

  return (
    <Table className={className}>
      {caption && <caption className="sr-only">{caption}</caption>}

      <TableHeader>
        <TableRow>
          {columns.map((coluna) => (
            <TableHead
              key={coluna.key}
              className={cn(
                coluna.align === "right" && "text-right",
                coluna.hideOnMobile && "max-sm:hidden",
              )}
            >
              {coluna.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>
        {carregando
          ? Array.from({ length: skeletonRows }, (_, linha) => (
              <TableRow key={`carregando-${linha}`}>
                {columns.map((coluna) => (
                  <TableCell
                    key={coluna.key}
                    className={cn(coluna.hideOnMobile && "max-sm:hidden")}
                  >
                    {/* A falsa linha tem a largura da coluna, e nao a do texto
                        que vier: assim a tabela nao pula quando os dados
                        chegam. */}
                    <Skeleton className="h-4 w-full max-w-[12ch]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : data.map((linha, indice) => (
              <TableRow
                key={rowKey(linha, indice)}
                onClick={onRowClick ? (event) => openRow(event, linha) : undefined}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {columns.map((coluna) => (
                  <TableCell
                    key={coluna.key}
                    className={cn(
                      coluna.align === "right" && "text-right",
                      coluna.hideOnMobile && "max-sm:hidden",
                    )}
                  >
                    {coluna.cell
                      ? coluna.cell(linha)
                      : String((linha as Record<string, unknown>)[coluna.key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
}
