import { CircleX, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { LoadingAnnouncement } from "../lib/loading-announcement";
import type { Slots } from "../lib/slots";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { Progress } from "./progress";
import { Skeleton } from "./skeleton";

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
   * dado na mao, os filhos ficam, a regiao ganha `aria-busy` e uma barra fina
   * corre no topo; sem dado, quem manda continua sendo o carregando.
   *
   * Passar a prop, verdadeira ou falsa, poe os filhos numa caixa (a
   * `classNames.content`), a mesma do comeco ao fim para eles nao remontarem a
   * cada busca.
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
   * O mesmo nome e o mesmo papel do `errorTitle` do `DataTable` e do
   * `ChartContainer`: uma tela que carrega tres blocos precisa dizer qual
   * deles falhou, e um produto que nao fala portugues precisa dizer isso em
   * outra lingua.
   */
  errorTitle?: ReactNode;
  errorMessage?: ReactNode;

  /**
   * O que aparece quando a consulta volta vazia. A descricao e obrigatoria
   * porque "nenhum resultado" transfere para a pessoa o trabalho de descobrir
   * por que, e ela quase nunca descobre.
   *
   * Sem ela nao ha estado vazio: os filhos desenham a resposta vazia do jeito
   * deles.
   */
  empty?: { title: ReactNode; description: ReactNode; action?: ReactNode; icon?: ReactNode };

  /**
   * Diz o vazio no lugar do `data`, para a resposta que nao e uma lista:
   * `isEmpty={page.total === 0}`. Quando vem, vence a contagem do `data`.
   */
  isEmpty?: boolean;

  /**
   * O desenho da espera, no formato do que vem depois - a lista de tres
   * linhas, o cartao, a folha de campos. Sem ele entram linhas genericas, que
   * seguram altura mas nao prometem forma nenhuma.
   */
  skeleton?: ReactNode;
  /** Quantas linhas falsas a espera generica mostra. Ignorado com `skeleton`. */
  skeletonRows?: number;

  /**
   * A resposta na tela. Como funcao, ela so e chamada depois que o dado
   * chegou, e recebe o `data` sem o `undefined` - que e o `!` que toda tela
   * escrevia aqui.
   */
  children: ReactNode | ((data: NonNullable<Data>) => ReactNode);

  /**
   * Veste os tres finais, e nao os filhos: a moldura que reserva a altura vale
   * igual para o esqueleto, para o aviso de erro e para o vazio.
   */
  className?: string;
  /**
   * Os textos da peca, para trocar o idioma: `retry` e o botao que executa o
   * `onRetry`, "Tentar de novo" sem ele - a mesma chave em todas as pecas que
   * resolvem os quatro finais.
   * `loading` e `loaded` sao o que o leitor de tela ouve quando a consulta
   * sai e quando ela volta. `refreshing` nomeia a barra da revalidacao, e
   * `refetchError` e `stale` sao o titulo e a linha do aviso de dado velho.
   */
  labels?: Partial<QueryBoundaryLabels>;
  /**
   * Classe por parte: `loading`, `error`, `empty`, e as tres da revalidacao -
   * `content` (a caixa dos filhos, so com `isFetching`), `refreshing` (a
   * barra) e `stale` (o aviso de dado velho). Evita o `[&_div]`, que acopla a
   * tela de quem usa a arvore interna da peca.
   */
  classNames?: Slots<"loading" | "error" | "empty" | "content" | "refreshing" | "stale">;
};

export type QueryBoundaryLabels = {
  retry: string;
  loading: string;
  loaded: string;
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

  if ((isError || isRefetchError) && !stale) {
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
  const loading =
    !stale &&
    (needsData ? isLoading || data === undefined : (isLoading ?? data === undefined));

  const blank = isEmpty ?? blankOf(data);

  if (!loading && empty && blank === undefined) warnAboutUndecidableEmpty();

  const body =
    empty && blank ? (
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
    );

  const warning = stale && (
    <Alert tone="warning" icon={<TriangleAlert />} className={cn("mb-3", classNames?.stale)}>
      <AlertTitle>{labels?.refetchError ?? "Não foi possível atualizar"}</AlertTitle>
      <AlertDescription>
        {labels?.stale ?? "Os dados abaixo são da última busca que deu certo."}
      </AlertDescription>
      {onRetry && (
        <Button type="button" variant="secondary" size="sm" className="mt-3 w-fit" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </Alert>
  );

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
      ) : isFetching === undefined ? (
        <>
          {warning}
          {body}
        </>
      ) : (
        <div
          aria-busy={isFetching}
          data-rc-refreshing={isFetching ? "" : undefined}
          className={cn("relative", classNames?.content)}
        >
          {isFetching && (
            <Progress
              value={null}
              aria-label={labels?.refreshing ?? "Atualizando…"}
              className={cn("absolute inset-x-0 top-0 gap-0", classNames?.refreshing)}
              classNames={{ track: "h-0.5" }}
            />
          )}
          {warning}
          {body}
        </div>
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
    "[rivocode/ui] <QueryBoundary empty={...}> sem lista para contar: o `data` que chegou " +
    "nao e array nem `null`, entao o estado vazio nunca vai aparecer e os filhos desenham " +
    "sobre o nada. Diga o vazio com `isEmpty={resposta.total === 0}`, ou passe em `data` a " +
    "lista de dentro da resposta.";

  if (process.env.NODE_ENV === "production" || warned.has(message)) return;

  warned.add(message);
  console.warn(message);
}
