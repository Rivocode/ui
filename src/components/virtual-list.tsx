"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useImperativeHandle, useRef, type ReactNode, type Ref } from "react";

import { cn } from "../lib/cn";
import { LoadingAnnouncement } from "../lib/loading-announcement";
import type { Slots } from "../lib/slots";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { Skeleton } from "./skeleton";

export type VirtualListHandle = {
  scrollToIndex: (
    index: number,
    options?: { align?: "start" | "center" | "end" | "auto"; behavior?: "auto" | "smooth" },
  ) => void;
};

export type VirtualListProps<Item> = {
  items: Item[] | undefined;
  /** O que cada item mostra. Recebe o indice para a numeracao visivel. */
  renderItem: (item: Item, index: number) => ReactNode;
  /**
   * Identidade do item, e nao so chave de React: e por ela que a altura medida
   * segue o item quando a lista reordena ou filtra.
   */
  itemKey: (item: Item, index: number) => string;

  /**
   * Altura maxima da moldura. Numero vira pixel.
   *
   * Obrigatoria, ao contrario da irma do `DataTable`: sem altura nao ha o que
   * caber, e uma lista virtualizada sem moldura desenha um item so.
   */
  maxHeight: number | string;

  /**
   * O palpite de altura de um item, em pixel, ou uma funcao por indice.
   *
   * E o que sustenta a barra de rolagem antes de o item existir. Com `measure`
   * ligado ele so precisa estar perto; com `measure` desligado ele e a lei, e
   * item mais alto que isto sobrepoe o de baixo.
   */
  itemHeight?: number | ((index: number) => number);
  /**
   * Cada item desenhado devolve a altura real, e a rolagem se corrige.
   *
   * Ligado de saida, porque e o que segura texto que quebra em duas linhas a
   * 390px. Desligue quando a altura for cravada por CSS: economiza um
   * observador por item visivel.
   */
  measure?: boolean;
  /** Quantos itens desenhar alem da moldura, de cada lado. */
  overscan?: number;
  /** Respiro entre um item e o proximo, em pixel. */
  gap?: number;

  isLoading?: boolean;
  isError?: boolean;
  /** Sem isto, o erro nao oferece nova tentativa. */
  onRetry?: () => void;
  /** O titulo do aviso de erro. Sem ele, "Nao foi possivel carregar". */
  errorTitle?: ReactNode;
  errorMessage?: ReactNode;
  /**
   * O nome do botao que executa o `onRetry`. Sem ele, "Tentar de novo".
   *
   * Existe pelo mesmo motivo do `errorTitle`, e com o mesmo nome nas quatro
   * pecas de consulta: sem ele, a tela em outra lingua fica com o titulo
   * traduzido e o botao em portugues, que e pior do que tudo em portugues.
   */
  retryLabel?: ReactNode;
  /**
   * O que aparece quando a consulta volta vazia. A descricao e obrigatoria
   * porque "nenhum resultado" transfere para a pessoa o trabalho de descobrir
   * por que.
   */
  empty?: { title: ReactNode; description: ReactNode; action?: ReactNode; icon?: ReactNode };
  /** Quantos itens falsos o carregando mostra. */
  skeletonItems?: number;

  /**
   * O nome da lista para o leitor de tela. Sem ele, ela sai sem nome - e a
   * moldura, que e alvo de tabulacao, sai como uma parada sem nome tambem.
   *
   * A lista de dentro repete este nome com a contagem real colada: o leitor
   * conta os filhos que estao no DOM e anuncia "lista com 15 itens" numa lista
   * de quatro mil, e o nome e o unico lugar onde cabe desmentir isso. Quem
   * escreve essa contagem e `labels.count`.
   */
  label?: string;
  /**
   * Os textos que a peca escreve sozinha: `count` e a contagem que entra no
   * nome da lista, colada ao `label`.
   *
   * Existe pelo mesmo motivo do `retryLabel`: sem ela a contagem sai em
   * portugues grudada num `label` ja traduzido, e "Shipping log, 4000 itens"
   * e pior do que a frase inteira em uma lingua so. O padrao concorda com o
   * singular - um item e "1 item", e nao "1 itens".
   */
  labels?: { count?: (total: number) => string };
  className?: string;
  /**
   * Classe por parte: `list` e a faixa de altura total que rola por dentro da
   * moldura, `item` e a caixa posicionada de cada item. Evita o `[&>div>div]`,
   * que acopla a tela de quem usa a arvore interna da peca.
   */
  classNames?: Slots<"list" | "item">;
  /**
   * Recebe um `VirtualListHandle`, com `scrollToIndex(index, { align })`.
   *
   * E o unico jeito de chegar num item que nao esta no DOM: sem elemento, o
   * `scrollIntoView` nao tem o que alcancar.
   */
  ref?: Ref<VirtualListHandle>;
};

export function VirtualList<Item>({
  items,
  renderItem,
  itemKey,
  maxHeight,
  itemHeight = 44,
  measure = true,
  overscan = 10,
  gap,
  isLoading,
  isError,
  onRetry,
  errorTitle = "Não foi possível carregar",
  errorMessage = "Não foi possível carregar a lista.",
  retryLabel = "Tentar de novo",
  empty,
  skeletonItems = 5,
  label,
  labels,
  className,
  classNames,
  ref,
}: VirtualListProps<Item>) {
  const viewport = useRef<HTMLDivElement>(null);

  const countLabel =
    labels?.count ?? ((total: number) => (total === 1 ? "1 item" : `${total} itens`));

  const estimate = typeof itemHeight === "function" ? itemHeight : () => itemHeight;

  const list = items ?? [];
  const loading = isLoading || items === undefined;
  const count = loading ? 0 : list.length;

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => viewport.current,
    estimateSize: estimate,
    overscan,
    gap,
    getItemKey: (index) => {
      const item = list[index];
      return item === undefined ? index : itemKey(item, index);
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (index, options) => virtualizer.scrollToIndex(index, options),
    }),
    [virtualizer],
  );

  if (isError) {
    return (
      <Alert tone="danger" className={className}>
        <AlertTitle>{errorTitle}</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
        {onRetry && (
          <Button variant="secondary" size="sm" className="mt-3 w-fit" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </Alert>
    );
  }

  if (!loading && list.length === 0 && empty) {
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
    <div
      ref={viewport}
      data-rc-viewport=""
      tabIndex={0}
      role="group"
      aria-label={label}
      style={{ maxHeight }}
      className={cn(
        "w-full overflow-auto rounded-md border border-border-strong bg-surface",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <LoadingAnnouncement loading={loading} />

      {loading ? (
        <div aria-hidden="true">
          {Array.from({ length: skeletonItems }, (_, index) => (
            <div
              key={`carregando-${index}`}
              style={{ height: estimate(index) }}
              className="flex items-center px-3"
            >
              <Skeleton className="h-4 w-full max-w-[24ch]" />
            </div>
          ))}
        </div>
      ) : (
        <div
          role="list"
          aria-label={label === undefined ? undefined : `${label}, ${countLabel(count)}`}
          style={{ height: virtualizer.getTotalSize() }}
          className={cn("relative w-full", classNames?.list)}
        >
          {virtualizer.getVirtualItems().map((entry) => {
            const item = list[entry.index];
            if (item === undefined) return null;

            return (
              <div
                key={entry.key}
                role="listitem"
                aria-setsize={count}
                aria-posinset={entry.index + 1}
                data-index={entry.index}
                ref={measure ? virtualizer.measureElement : undefined}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: measure ? undefined : entry.size,
                  transform: `translateY(${entry.start}px)`,
                }}
                className={classNames?.item}
              >
                {renderItem(item, entry.index)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
