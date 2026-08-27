import { CircleX } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { LoadingAnnouncement } from "../lib/loading-announcement";
import type { Slots } from "../lib/slots";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
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
   * O nome do botao que executa o `onRetry`. Sem ele, "Tentar de novo".
   *
   * O `errorTitle` acima ja dizia que um produto que nao fala portugues
   * precisa dizer isso em outra lingua, e o botao da mesma caixa nao tinha
   * como: a tela em ingles saia com o titulo traduzido e o botao em portugues.
   * O mesmo nome nas quatro pecas de consulta.
   */
  retryLabel?: ReactNode;

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
   * Classe por parte: `loading`, `error`, `empty`. Evita o `[&_div]`, que
   * acopla a tela de quem usa a arvore interna da peca.
   */
  classNames?: Slots<"loading" | "error" | "empty">;
};

export function QueryBoundary<Data>({
  data,
  isLoading,
  isError,
  onRetry,
  errorTitle = "Não foi possível carregar",
  errorMessage = "Tente de novo em alguns minutos.",
  retryLabel = "Tentar de novo",
  empty,
  isEmpty,
  skeleton,
  skeletonRows = 3,
  children,
  className,
  classNames,
}: QueryBoundaryProps<Data>) {
  if (isError) {
    return (
      <Alert tone="danger" icon={<CircleX />} className={cn(className, classNames?.error)}>
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

  const needsData = typeof children === "function";
  const loading = needsData ? isLoading || data === undefined : (isLoading ?? data === undefined);

  const blank = isEmpty ?? blankOf(data);

  if (!loading && empty && blank === undefined) warnAboutUndecidableEmpty();

  // Os tres finais viraram um `return` so por causa da regiao viva: ela tem que
  // ser o MESMO no do primeiro ao ultimo estado. Cada estado devolvendo a
  // propria raiz remontava a regiao junto com o conteudo, e regiao que nasce
  // com o texto dentro nao anuncia nada.
  return (
    <>
      <LoadingAnnouncement loading={loading} />

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
      ) : empty && blank ? (
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
