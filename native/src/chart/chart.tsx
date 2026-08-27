import { useEffect, useState, type ReactNode } from "react";
import { View, type LayoutChangeEvent } from "react-native";

import type { RivoNativeColorRole } from "../../tokens";
import { Alert } from "../basics";
import { Button } from "../button";
import { cn } from "../cn";
import { EmptyState } from "../empty-state";
import { useRivo } from "../provider";
import { Skeleton } from "../skeleton";

export type ChartConfig = Record<
  string,
  {
    /** O nome legível da série. Vai para a legenda e para o leitor de tela. */
    label: string;
    /**
     * A cor da série, como **papel de token**: `chart-1` a `chart-8`, ou
     * qualquer outro papel do tema. Sem ela, entra o próximo da paleta, na
     * ordem em que a série aparece no `config`.
     *
     * O web aceita qualquer cor de CSS aqui porque lá ela vira
     * `var(--color-<série>)` e o tema continua no comando. Aqui não há
     * variável viva: a cor que a peça recebe é o valor final que vai para o
     * desenho, e um `#22c55e` escrito nesta prop seria a única coisa da tela
     * que não muda quando o cliente troca de tema.
     */
    color?: RivoNativeColorRole;
  }
>;

export type ChartFrame = {
  /** A largura medida, em px. Zero no primeiro quadro, antes do layout. */
  width: number;
  /** A altura medida, em px. Ela vem da classe de quem usa a moldura. */
  height: number;
  /** A cor de cada série, pela mesma chave do `config`, já resolvida. */
  colors: Record<string, string>;
};

export type ChartContainerProps = {
  config: ChartConfig;
  /**
   * O desenho. Como função, recebe a medida e as cores já resolvidas; como
   * JSX, entra do jeito que está: é assim que `ChartDonut` e `ChartRadial`
   * ganham os quatro finais sem precisar de nada da moldura.
   */
  children: ReactNode | ((frame: ChartFrame) => ReactNode);

  isLoading?: boolean;
  isError?: boolean;
  /** Sem isto, o erro não oferece nova tentativa. */
  onRetry?: () => void;
  /**
   * O titulo do aviso de erro. Sem ele, "Nao foi possivel carregar o grafico".
   *
   * O mesmo nome e o mesmo papel do `errorTitle` do web: num painel de quatro
   * graficos, o titulo de sempre repetido quatro vezes nao diz qual deles
   * caiu, e um produto que nao fala portugues nao diz nada. Ele e a metade de
   * cima do aviso, e o `errorMessage` a de baixo.
   *
   * `string` pelo mesmo motivo do `errorMessage`: o titulo do `Alert` nativo
   * tambem e um `Text`.
   */
  errorTitle?: string;
  /**
   * `string`, e não `ReactNode` como no web: o corpo do `Alert` nativo é um
   * `Text`, e um nó de React ali não teria onde caber.
   */
  errorMessage?: string;
  /**
   * O que aparece quando a consulta volta sem nenhum ponto. O mesmo formato do
   * web, menos o `icon`: o `EmptyState` nativo ainda não tem esse slot.
   */
  empty?: { title: string; description: string; action?: ReactNode };
  /**
   * Os pontos, para a moldura saber contar zero.
   *
   * **Aqui ela é a única fonte**, e é essa a diferença do web. Lá a moldura
   * abre o filho da Recharts e lê o `data` que ele já carrega; aqui o filho é
   * um desenho qualquer, e não há nada para abrir. Sem esta prop o estado
   * vazio nunca aparece, e o aviso de desenvolvimento abaixo existe por isso.
   */
  data?: readonly unknown[];

  /**
   * O que o leitor de tela ouve no lugar do desenho, quando o desenho é uma
   * função.
   *
   * Com filho em JSX ela é **ignorada**, e de propósito: quem nomeia é a peça
   * de dentro. `ChartDonut` e `ChartRadial` já se nomeiam, e um `accessible`
   * aqui em cima engoliria a legenda da rosca: as fatias, que são a única
   * forma de ler o valor no toque, virariam uma frase só e nenhuma delas
   * alcançável.
   *
   * Sem ela, o nome sai dos rótulos das séries do `config`.
   */
  label?: string;
  className?: string;
};

export const PALETTE = Array.from(
  { length: 8 },
  (_, index) => `chart-${index + 1}`,
) as RivoNativeColorRole[];

const WAITING = [0.45, 0.7, 0.35, 0.85, 0.6, 0.75];

export function ChartContainer({
  config,
  children,
  isLoading,
  isError,
  onRetry,
  errorTitle = "Não foi possível carregar o gráfico",
  errorMessage,
  empty,
  data,
  label,
  className,
}: ChartContainerProps) {
  const { colors: theme } = useRivo();
  const [box, setBox] = useState({ width: 0, height: 0 });

  const drawn = typeof children === "function";

  const colors = Object.fromEntries(
    Object.entries(config).map(([key, series], index) => [
      key,
      theme[series.color ?? PALETTE[index % PALETTE.length]!],
    ]),
  );

  useSilentMisuse(empty !== undefined && data === undefined, MISSING_DATA);
  useSilentMisuse(label !== undefined && !drawn, IGNORED_LABEL);

  const spoken = drawn
    ? ({
        accessible: true,
        accessibilityRole: "image",
        accessibilityLabel: label ?? nameFromConfig(config),
      } as const)
    : null;

  return (
    <View className={cn("w-full", className)}>
      {isError ? (
        <StateFrame>
          <View className="w-full gap-3">
            <Alert tone="danger" title={errorTitle}>
              {errorMessage ?? "Tente de novo em alguns minutos."}
            </Alert>
            {onRetry && (
              <Button size="sm" variant="secondary" onPress={onRetry}>
                Tentar de novo
              </Button>
            )}
          </View>
        </StateFrame>
      ) : isLoading ? (
        <StateFrame>
          <View className="h-full w-full flex-row items-end gap-3 px-2 pb-6">
            {WAITING.map((height, index) => (
              <View key={index} className="min-w-0 flex-1" style={{ height: `${height * 100}%` }}>
                <Skeleton className="h-full w-full" />
              </View>
            ))}
          </View>
        </StateFrame>
      ) : empty && data && data.length === 0 ? (
        <StateFrame>
          <EmptyState
            title={empty.title}
            description={empty.description}
            action={empty.action}
          />
        </StateFrame>
      ) : (
        <View
          {...spoken}
          className="h-full w-full"
          onLayout={(event: LayoutChangeEvent) => {
            const { width, height } = event.nativeEvent.layout;
            setBox((current) =>
              current.width === width && current.height === height ? current : { width, height },
            );
          }}
        >
          {drawn ? children({ ...box, colors }) : children}
        </View>
      )}
    </View>
  );
}

function StateFrame({ children }: { children: ReactNode }) {
  return <View className="h-full w-full items-center justify-center">{children}</View>;
}

function nameFromConfig(config: ChartConfig) {
  const series = Object.values(config)
    .map((entry) => entry.label)
    .filter(Boolean);

  return series.length > 0 ? `Gráfico de ${series.join(", ")}` : "Gráfico";
}

const MISSING_DATA =
  "[rivocode/ui-native] <ChartContainer empty={...}> sem `data`: a moldura não tem como " +
  "contar zero, e o estado vazio nunca vai aparecer. No web ela lê os pontos de dentro do " +
  "gráfico da Recharts quando a prop falta; aqui o filho é um desenho qualquer e não há " +
  "nada para abrir. Passe `data={pontos}`.";

const IGNORED_LABEL =
  "[rivocode/ui-native] <ChartContainer label={...}> com filho em JSX: o rótulo foi " +
  "ignorado. Quem nomeia o desenho é a peça de dentro (`ChartDonut` e `ChartRadial` têm " +
  "`label` próprio), e nomear aqui fecharia o filho inteiro numa parada só do leitor de " +
  "tela. O `label` da moldura vale quando `children` é função.";

function useSilentMisuse(wrong: boolean, message: string) {
  useEffect(() => {
    if (!wrong || !__DEV__) return;
    console.warn(message);
  }, [wrong, message]);
}
