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
   * A resposta da consulta. `undefined` e "ainda nao chegou": sem `isLoading`,
   * e ela quem liga o carregando - e, com filho em funcao, ela liga mesmo com
   * `isLoading={false}`, porque nao ha o que entregar a funcao.
   *
   * Array vazio e `null` contam como vazio, e e assim que a peca decide
   * sozinha. Para qualquer outra forma - `{ items: [], total: 0 }` - quem
   * responde e o `isEmpty`.
   */
  data?: Data;

  isLoading?: boolean;
  isError?: boolean;
  /**
   * Ha uma busca correndo, inclusive a que revalida o dado que ja esta na
   * tela - o `isFetching` do TanStack Query, o `isValidating` do SWR. Com
   * dado na mao, os filhos ficam, a regiao diz `busy` ao leitor de tela e uma
   * barra fina pulsa no topo; sem dado, quem manda continua sendo o
   * carregando.
   *
   * Passar a prop, verdadeira ou falsa, poe os filhos numa `View` (a
   * `classNames.content`), a mesma do comeco ao fim para eles nao remontarem
   * a cada busca. O filho que era `flex-1` pede `classNames={{ content:
   * "flex-1" }}`.
   */
  isFetching?: boolean;
  /**
   * A ultima busca falhou, mas o dado anterior continua valido - o
   * `isRefetchError` do TanStack Query. Com dado na mao ele vence o
   * `isError`: os filhos ficam, e um aviso acima deles diz que a tela esta
   * desatualizada, com o botao do `onRetry`. Sem dado, vira o erro de sempre.
   */
  isRefetchError?: boolean;
  /** Sem isto, o erro nao oferece nova tentativa. */
  onRetry?: () => void;
  /**
   * O titulo do aviso de erro. Sem ele, "Nao foi possivel carregar".
   *
   * O mesmo nome e o mesmo papel do `errorTitle` do `DataList` e do
   * `ChartContainer`: uma tela que carrega tres blocos precisa dizer qual
   * deles falhou, e um produto que nao fala portugues precisa dizer isso em
   * outra lingua. Aqui ele TEM padrao, ao contrario do `DataList`, porque o
   * aviso nasce com duas linhas, como no web.
   *
   * `string`, e nao `ReactNode` como no web: o titulo do `Alert` nativo e um
   * `Text`, e um no de React ali nao teria onde caber.
   */
  errorTitle?: string;
  /**
   * A linha de baixo do aviso. Sem ela, "Tente de novo em alguns minutos".
   *
   * `string` pelo mesmo motivo do `errorTitle`: o corpo do `Alert` nativo
   * tambem e um `Text`.
   */
  errorMessage?: string;

  /**
   * O que aparece quando a consulta volta vazia. O mesmo formato do web, com o
   * titulo e a descricao em `string`, que e o que cabe dentro de um `Text`, e
   * o `icon` aceitando tambem a funcao que recebe cor e tamanho, como no
   * `EmptyState` nativo.
   *
   * A descricao e obrigatoria porque "nenhum resultado" transfere para a
   * pessoa o trabalho de descobrir por que, e ela quase nunca descobre.
   *
   * Sem ela nao ha estado vazio: os filhos desenham a resposta vazia do jeito
   * deles.
   */
  empty?: {
    title: string;
    description: string;
    action?: ReactNode;
    icon?: EmptyStateProps["icon"];
  };

  /**
   * Diz o vazio no lugar do `data`, para a resposta que nao e uma lista:
   * `isEmpty={page.total === 0}`. Quando vem, vence a contagem do `data`.
   */
  isEmpty?: boolean;

  /**
   * O desenho da espera, no formato do que vem depois - a lista de tres
   * linhas, o cartao, a folha de campos. Sem ele entram linhas genericas, que
   * seguram altura mas nao prometem forma nenhuma.
   *
   * Com molde proprio a moldura para de se anunciar como uma parada so do
   * leitor de tela: o texto que voce puser dentro do molde e quem fala, e um
   * rotulo aqui em cima o engoliria.
   */
  skeleton?: ReactNode;
  /** Quantas linhas falsas a espera generica mostra. Ignorado com `skeleton`. */
  skeletonRows?: number;

  /**
   * A resposta na tela. Como funcao, ela so e chamada depois que o dado
   * chegou, e recebe o `data` sem o `undefined` - que e o `!` que toda tela
   * escrevia aqui.
   *
   * Os filhos saem sem embrulho nenhum: uma `View` invisivel em volta
   * quebraria o `flex-1` ou o `gap` de quem esta por fora, e o defeito so
   * apareceria no aparelho.
   */
  children: ReactNode | ((data: NonNullable<Data>) => ReactNode);

  /**
   * Veste os tres finais, e nao os filhos: a moldura que reserva a altura vale
   * igual para o esqueleto, para o aviso de erro e para o vazio.
   */
  className?: string;
  /**
   * Os textos da peca, para trocar o idioma: `retry` e o botao que executa o
   * `onRetry`, "Tentar de novo" sem ele - a mesma chave do web e das pecas de
   * consulta daqui -, e `loading` o que o leitor de tela ouve na espera
   * generica, "Carregando" sem ele. `refreshing` nomeia a barra da
   * revalidacao, e `refetchError` e `stale` sao o titulo e a linha do aviso de
   * dado velho.
   */
  labels?: Partial<QueryBoundaryLabels>;
  /**
   * Classe por parte: `loading` (a moldura do esqueleto), `error` (a do aviso
   * com o botao) e `empty` (o estado vazio), cada uma no mesmo no que o
   * `className`; e as tres da revalidacao, `content` (a `View` dos filhos, so
   * com `isFetching`), `refreshing` (a barra) e `stale` (o aviso de dado
   * velho com o botao).
   */
  classNames?: Slots<"loading" | "error" | "empty" | "content" | "refreshing" | "stale">;
};

export type QueryBoundaryLabels = {
  retry: string;
  loading: string;
  refreshing: string;
  refetchError: string;
  stale: string;
};

export function QueryBoundary<Data>({
  data,
  isLoading,
  isError,
  isFetching,
  isRefetchError,
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
  const stale = isRefetchError === true && data !== undefined;
  const failed = (isError === true || isRefetchError === true) && !stale;
  const needsData = typeof children === "function";
  const loading =
    !stale &&
    (needsData ? isLoading || data === undefined : (isLoading ?? data === undefined));
  const blank = isEmpty ?? blankOf(data);

  useSilentMisuse(
    !failed && !loading && empty !== undefined && blank === undefined,
    UNDECIDABLE_EMPTY,
  );

  if (failed) {
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

  const body =
    empty && blank ? (
      <EmptyState
        className={cn(className, classNames?.empty)}
        title={empty.title}
        description={empty.description}
        action={empty.action}
        icon={empty.icon}
      />
    ) : needsData ? (
      data === undefined || data === null ? null : (
        (children as (data: NonNullable<Data>) => ReactNode)(data as NonNullable<Data>)
      )
    ) : (
      children
    );

  const warning = stale && (
    <View className={cn("mb-3 items-start gap-3", classNames?.stale)}>
      <Alert
        tone="warning"
        title={labels?.refetchError ?? "Não foi possível atualizar"}
        className="w-full"
      >
        {labels?.stale ?? "Os dados abaixo são da última busca que deu certo."}
      </Alert>
      {onRetry && (
        <Button size="sm" variant="secondary" onPress={onRetry}>
          {retryLabel}
        </Button>
      )}
    </View>
  );

  if (isFetching === undefined) {
    return (
      <>
        {warning}
        {body}
      </>
    );
  }

  return (
    <View accessibilityState={{ busy: isFetching }} className={cn("relative", classNames?.content)}>
      {warning}
      {body}
      {isFetching && (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={labels?.refreshing ?? "Atualizando…"}
          pointerEvents="none"
          className={cn("absolute inset-x-0 top-0 h-0.5", classNames?.refreshing)}
        >
          <Skeleton className="h-full w-full rounded-pill bg-accent-text" />
        </View>
      )}
    </View>
  );
}

function blankOf(data: unknown): boolean | undefined {
  if (data === null) return true;
  if (Array.isArray(data)) return data.length === 0;
  return undefined;
}

const UNDECIDABLE_EMPTY =
  "[rivocode/ui-native] <QueryBoundary empty={...}> sem lista para contar: o `data` que " +
  "chegou não é array nem `null`, então o estado vazio nunca vai aparecer e os filhos " +
  "desenham sobre o nada. Diga o vazio com `isEmpty={resposta.total === 0}`, ou passe em " +
  "`data` a lista de dentro da resposta.";
