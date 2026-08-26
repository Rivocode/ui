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
     * A cor da série, como **papel de token** — `chart-1` a `chart-8`, ou
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

/** O que a moldura já resolveu e entrega ao desenho. */
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
   * JSX, entra do jeito que está — é assim que `ChartDonut` e `ChartRadial`
   * ganham os quatro finais sem precisar de nada da moldura.
   */
  children: ReactNode | ((frame: ChartFrame) => ReactNode);

  /* Os estados de uma consulta, como no `DataList`. Um gráfico que só sabe
   * desenhar dado pronto empurra para cada tela o mesmo `if` de três galhos, e
   * cada tela resolve de um jeito. */
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
   * web, menos o `icon` — o `EmptyState` nativo ainda não tem esse slot.
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
   * aqui em cima engoliria a legenda da rosca — as fatias, que são a única
   * forma de ler o valor no toque, virariam uma frase só e nenhuma delas
   * alcançável.
   *
   * Sem ela, o nome sai dos rótulos das séries do `config`.
   */
  label?: string;
  className?: string;
};

/** Os oito papéis de série do tema, na ordem em que devem ser usados. */
export const PALETTE = Array.from(
  { length: 8 },
  (_, index) => `chart-${index + 1}`,
) as RivoNativeColorRole[];

/** A altura de cada barra do esqueleto, em fração da moldura. */
const WAITING = [0.45, 0.7, 0.35, 0.85, 0.6, 0.75];

/**
 * A moldura de todo gráfico: os quatro finais de uma consulta — dado, espera,
 * erro e vazio — e as cores de série já resolvidas para quem desenha.
 *
 * **É a mesma peça do web com a Recharts recortada de dentro.** Lá ela mede o
 * pai com o `ResponsiveContainer`, publica `var(--color-<série>)` para o
 * `<Line>` ler, e o desenho vem de terceiro. Aqui não há Recharts, não há
 * variável de CSS e não há contentor que meça sozinho — então a moldura faz
 * as três coisas à mão e **entrega** o resultado, como o `Form` nativo entrega
 * o `submit` em vez de esperar um `type="submit"`:
 *
 * ```tsx
 * <ChartContainer config={SERIES} data={meses} isLoading={q.isLoading} className="h-56">
 *   {({ width, height, colors }) => (
 *     <Svg width={width} height={height}>
 *       <Path d={linha(meses, width, height)} stroke={colors.pagas} fill="none" />
 *     </Svg>
 *   )}
 * </ChartContainer>
 * ```
 *
 * A `width` e a `height` chegam zeradas no primeiro quadro e medidas no
 * seguinte, pelo mesmo motivo da `Sparkline`: no telefone não existe largura
 * antes do layout. Não desenhe nada enquanto forem zero — meio desenho
 * piscando torto é pior que um vão que se preenche no quadro seguinte.
 *
 * Com filho em JSX ela é só a moldura, e é assim que a rosca e o arco entram:
 *
 * ```tsx
 * <ChartContainer config={NATUREZA} data={fatias} empty={vazio} className="h-72">
 *   <ChartDonut data={fatias} valueKey="total" nameKey="natureza" config={NATUREZA} />
 * </ChartContainer>
 * ```
 *
 * **A altura fica com quem usa, por classe**, igual ao web: sem altura a
 * moldura mede zero, a função recebe zero e nada aparece.
 */
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

  /*
   * O nome só entra na forma de função, e `accessible` junto com ele.
   *
   * Um desenho que a moldura mesma embrulha é uma mancha muda para o leitor de
   * tela, e agrupá-lo numa parada com nome é o mínimo. Filho em JSX é o caso
   * oposto: a rosca põe cada fatia numa linha tocável, e `accessible` aqui
   * fecharia as seis numa parada só, sem valor nenhum dentro.
   */
  const spoken = drawn
    ? ({
        accessible: true,
        accessibilityRole: "image",
        accessibilityLabel: label ?? nameFromConfig(config),
      } as const)
    : null;

  return (
    <View className={cn("w-full", className)}>
      {isLoading ? (
        <StateFrame>
          {/* Barras de altura desigual: um esqueleto retangular não parece
              gráfico, e a espera fica sem forma. */}
          <View className="h-full w-full flex-row items-end gap-3 px-2 pb-6">
            {WAITING.map((height, index) => (
              <View key={index} className="min-w-0 flex-1" style={{ height: `${height * 100}%` }}>
                <Skeleton className="h-full w-full" />
              </View>
            ))}
          </View>
        </StateFrame>
      ) : isError ? (
        <StateFrame>
          {/* O botão fica FORA do aviso, ao contrário do web: o `Alert` nativo
              tem título e corpo, e o corpo é um `Text`. */}
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
            // A comparação não é zelo: o `onLayout` dispara de novo a cada
            // relayout do pai, e não só quando a medida muda. Sem ela, cada um
            // desses grava um objeto novo — nunca igual ao anterior — e o
            // desenho inteiro é refeito por uma medida que não mudou.
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

/** Ocupa a altura que o desenho ocuparia, para a tela não pular entre estados. */
function StateFrame({ children }: { children: ReactNode }) {
  return <View className="h-full w-full items-center justify-center">{children}</View>;
}

/**
 * O nome de último recurso, montado das séries do `config`.
 *
 * Sem nenhum nome, o VoiceOver anuncia "imagem" e para. Isso passa em
 * qualquer varredura automática de "tem nome acessível?" e não diz nada a
 * quem ouve.
 */
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
  "ignorado. Quem nomeia o desenho é a peça de dentro — `ChartDonut` e `ChartRadial` têm " +
  "`label` próprio —, e nomear aqui fecharia o filho inteiro numa parada só do leitor de " +
  "tela. O `label` da moldura vale quando `children` é função.";

/**
 * O aviso sai num efeito, e não no meio do render.
 *
 * Um `console.warn` solto no corpo fala de novo a cada medida do `onLayout` e
 * a cada toque que mude o estado da tela, até esconder o próximo erro de
 * verdade. No efeito ele fala uma vez, quando a configuração entra no estado
 * que não funciona, e cala assim que ela sai dele.
 */
function useSilentMisuse(wrong: boolean, message: string) {
  useEffect(() => {
    // `__DEV__` e o global do metro, e nao `process.env.NODE_ENV` como no
    // web: `native/tsconfig.check.json` roda com `types: []` para conferir a
    // fonte publicada sem o mundo do node dentro dela, e ali nao ha `process`.
    if (!wrong || !__DEV__) return;
    console.warn(message);
  }, [wrong, message]);
}
