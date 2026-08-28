import type { ReactNode } from "react";
import { View } from "react-native";

import { Alert } from "./basics";
import { Button } from "./button";
import { cn } from "./cn";
import { EmptyState } from "./empty-state";
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
   * O nome do botao que executa o `onRetry`. Sem ele, "Tentar de novo".
   *
   * O `errorTitle` acima ja dizia que um produto que nao fala portugues
   * precisa dizer isso em outra lingua, e o botao da mesma caixa nao tinha
   * como: a tela em ingles saia com o titulo traduzido e o botao em
   * portugues. O mesmo nome do web, e o mesmo nas pecas de consulta daqui.
   *
   * `string` pelo mesmo motivo do `errorTitle`: o rotulo do `Button` nativo e
   * um `Text`.
   */
  retryLabel?: string;

  /**
   * O que aparece quando a consulta volta vazia. O mesmo formato do web menos
   * o `icon` - o `EmptyState` nativo ainda nao tem esse slot -, e com o titulo
   * e a descricao em `string`, que e o que cabe dentro de um `Text`.
   *
   * A descricao e obrigatoria porque "nenhum resultado" transfere para a
   * pessoa o trabalho de descobrir por que, e ela quase nunca descobre.
   *
   * Sem ela nao ha estado vazio: os filhos desenham a resposta vazia do jeito
   * deles.
   */
  empty?: { title: string; description: string; action?: ReactNode };

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
}: QueryBoundaryProps<Data>) {
  const needsData = typeof children === "function";
  const loading = needsData ? isLoading || data === undefined : (isLoading ?? data === undefined);
  const blank = isEmpty ?? blankOf(data);

  useSilentMisuse(
    !isError && !loading && empty !== undefined && blank === undefined,
    UNDECIDABLE_EMPTY,
  );

  if (isError) {
    return (
      <View className={cn("items-start gap-3", className)}>
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
        accessibilityLabel={generic ? "Carregando" : undefined}
        accessibilityState={{ busy: true }}
        className={cn("gap-3", className)}
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

  if (empty && blank) {
    return (
      <EmptyState
        className={className}
        title={empty.title}
        description={empty.description}
        action={empty.action}
      />
    );
  }

  if (needsData) {
    if (data === undefined || data === null) return null;
    return <>{(children as (data: NonNullable<Data>) => ReactNode)(data as NonNullable<Data>)}</>;
  }

  return <>{children}</>;
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
