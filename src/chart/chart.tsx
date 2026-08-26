"use client";

import {
  cloneElement,
  useEffect,
  useId,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { ResponsiveContainer } from "recharts";

import { Alert, AlertDescription, AlertTitle } from "../components/alert";
import { Button } from "../components/button";
import { EmptyState } from "../components/empty-state";
import { Skeleton } from "../components/skeleton";
import { cn } from "../lib/cn";

export type ChartConfig = Record<
  string,
  {
    /** O nome legivel da serie. Vai para a dica e para a legenda. */
    label: string;
    /**
     * A cor da serie. Sem ela, entra a proxima da paleta, na ordem em que a
     * serie aparece no `config`.
     */
    color?: string;
  }
>;

export type ChartContainerProps = Omit<ComponentProps<"div">, "children"> & {
  config: ChartConfig;
  /** Um unico grafico da Recharts: `LineChart`, `BarChart`, `AreaChart`. */
  children: ReactElement;

  /* Os estados de uma consulta, como no `DataTable`. Um grafico que so sabe
   * desenhar dado pronto empurra para cada tela o mesmo `if` de tres galhos, e
   * cada tela resolve de um jeito. */
  isLoading?: boolean;
  isError?: boolean;
  /** Sem isto, o erro nao oferece nova tentativa. */
  onRetry?: () => void;
  errorMessage?: ReactNode;
  /**
   * O que aparece quando a consulta volta sem nenhum ponto. O mesmo formato do
   * `DataTable`, `action` inclusive - ela e a saida que o `EmptyState`
   * considera fortemente recomendada, e faltava so aqui.
   */
  empty?: { title: ReactNode; description: ReactNode; action?: ReactNode; icon?: ReactNode };
  /**
   * Os pontos, para a moldura saber contar zero.
   *
   * Quase sempre dispensavel: sem ela, a contagem sai do `data` do proprio
   * grafico da Recharts que vem como filho. Passe a sua quando os pontos nao
   * moram no filho direto - `<ScatterChart>` com o `data` no `<Scatter>`, por
   * exemplo - ou quando a serie desenhada nao for a que decide o vazio.
   */
  data?: readonly unknown[];

  /**
   * O que o leitor de tela ouve no lugar do desenho.
   *
   * Sem ela, o nome sai dos rotulos das series do `config` - que ja e uma
   * frase, e nao o amontoado de ticks que o SVG daria sozinho. Escreva a sua
   * quando o grafico responde a uma pergunta ("Faturamento por mes, em reais"):
   * a serie diz o que foi medido, e nao o que a tela pergunta.
   */
  label?: string;
};

/** As oito cores de serie do tema, na ordem em que devem ser usadas. */
export const PALETTE = Array.from({ length: 8 }, (_, index) => `var(--rc-chart-${index + 1})`);

/**
 * A moldura de todo grafico: tamanho que acompanha o pai, cor de eixo e de
 * grade vindas do tema, e as cores de serie publicadas como variaveis com o
 * nome da serie.
 *
 * E esse ultimo ponto que muda a escrita do grafico. A serie chamada `pagas`
 * vira `var(--color-pagas)`, entao o `Line`, o `Bar` e a dica falam do mesmo
 * jeito e trocar a cor de uma serie e mexer num lugar so:
 *
 *     <Line dataKey="pagas" stroke="var(--color-pagas)" />
 *
 * A Recharts nao conhece nossos tokens e nao le classe do Tailwind, entao a
 * ponte tem que ser por variavel de CSS. Escrever a cor direta no `stroke`
 * funciona ate o tema mudar.
 *
 * A altura fica com quem usa, por classe: grafico sem altura definida some,
 * porque o `ResponsiveContainer` mede o pai e o pai mede o filho.
 */
export function ChartContainer({
  config,
  className,
  children,
  isLoading,
  isError,
  onRetry,
  errorMessage,
  empty,
  data,
  label,
  ...props
}: ChartContainerProps) {
  const id = useId().replace(/:/g, "");

  const colors = Object.entries(config)
    .map(([key, series], index) => {
      const color = series.color ?? PALETTE[index % PALETTE.length];
      return `--color-${key}: ${color};`;
    })
    .join("\n  ");

  /*
   * De onde sai a contagem de pontos.
   *
   * O vazio so aparecia com `empty && data && data.length === 0`: quem passava
   * o `empty` e esquecia o `data` - que e opcional, e cujo nome ja esta escrito
   * dentro do `<LineChart data={meses}>` logo abaixo - NUNCA via o estado
   * vazio, e nada acusava. O grafico simplesmente desenhava eixos sobre o nada,
   * que e o desenho mais parecido com "carregou e nao ha nada" que existe.
   *
   * Agora a moldura le o `data` do proprio filho da Recharts antes de desistir,
   * e o `data` daqui vira o reforco para os casos em que ele nao mora la. Onde
   * nem um nem outro existe, o aviso fala em desenvolvimento - falhar seria
   * derrubar a tela por causa de um estado que talvez nunca ocorra.
   */
  const points = data ?? dataOfChild(children);
  useMissingDataWarning(empty !== undefined && points === undefined);

  return (
    <div
      {...props}
      data-rc-chart={id}
      className={cn(
        "w-full font-sans",
        // O texto dos eixos e da legenda sai da Recharts com cor propria; as
        // classes abaixo devolvem o comando ao tema.
        "[&_.recharts-cartesian-axis-tick_text]:fill-fg-subtle",
        "[&_.recharts-cartesian-axis-tick_text]:text-xs",
        "[&_.recharts-cartesian-grid_line]:stroke-chart-grid",
        "[&_.recharts-cartesian-axis-line]:stroke-border",
        "[&_.recharts-cartesian-axis-tick-line]:stroke-border",
        "[&_.recharts-legend-item-text]:text-sm",
        "[&_.recharts-legend-item-text]:!text-fg-muted",
        // O rastro que segue o ponteiro. Sem isto ele sai cinza fixo, que some
        // no tema escuro e escurece demais no claro.
        "[&_.recharts-tooltip-cursor]:fill-accent-subtle",
        "[&_.recharts-tooltip-cursor]:stroke-border",
        "[&_.recharts-reference-line_line]:stroke-border-strong",
        // A Recharts entrega o `<svg>` com `tabindex="0"`, e com razao: com o
        // foco nela, seta para os lados anda com a dica de ponto em ponto, e e
        // a unica forma de ler o valor exato sem ponteiro. O que faltava era o
        // contorno - ela apaga o do navegador e nao repoe nenhum, entao a
        // parada de tabulacao existia sem pintar nada (WCAG 2.4.7).
        //
        // Anel por dentro (`-outline-offset-2`): a superficie ocupa o
        // contentor inteiro, e por fora ele seria cortado pelo cartao que quase
        // sempre embrulha o grafico.
        //
        // O `outline-solid` nao e enfeite. O `outline-none` da linha de cima
        // grava `--tw-outline-style: none` na propria superficie, e o
        // `outline-2` le esse mesmo custom property para decidir o traco - sem
        // reescrever o estilo, o anel sai com 2px de largura e estilo nenhum,
        // que e exatamente o nada de onde estamos saindo.
        "[&_.recharts-surface]:outline-none",
        "[&_.recharts-surface:focus-visible]:outline-solid",
        "[&_.recharts-surface:focus-visible]:outline-2",
        "[&_.recharts-surface:focus-visible]:-outline-offset-2",
        "[&_.recharts-surface:focus-visible]:outline-ring",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: `[data-rc-chart="${id}"] {\n  ${colors}\n}` }} />

      {isLoading ? (
        <StateFrame>
          {/* Barras de altura desigual: um esqueleto retangular nao parece
           * grafico, e a espera fica sem forma. */}
          <div className="flex h-full w-full items-end gap-3 px-2 pb-6">
            {[0.45, 0.7, 0.35, 0.85, 0.6, 0.75].map((height, index) => (
              <Skeleton key={index} className="w-full" style={{ height: `${height * 100}%` }} />
            ))}
          </div>
        </StateFrame>
      ) : isError ? (
        <StateFrame>
          <Alert tone="danger" className="w-full">
            <AlertTitle>Não foi possível carregar o gráfico</AlertTitle>
            <AlertDescription>
              {errorMessage ?? "Tente de novo em alguns minutos."}
            </AlertDescription>
            {onRetry && (
              <Button size="sm" variant="secondary" onClick={onRetry} className="mt-3">
                Tentar de novo
              </Button>
            )}
          </Alert>
        </StateFrame>
      ) : empty && points && points.length === 0 ? (
        <StateFrame>
          <EmptyState
            title={empty.title}
            description={empty.description}
            icon={empty.icon}
            action={empty.action}
          />
        </StateFrame>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          {describe(children, label ?? nameFromConfig(config))}
        </ResponsiveContainer>
      )}
    </div>
  );
}

/** O `data` que o grafico da Recharts recebeu, quando ele o recebeu direto. */
function dataOfChild(child: ReactElement): readonly unknown[] | undefined {
  const written = child.props as { data?: unknown };
  return Array.isArray(written.data) ? written.data : undefined;
}

/**
 * O aviso sai num efeito, e nao no meio do render.
 *
 * O render de um grafico se repete a cada movimento do ponteiro, e um
 * `console.warn` solto ali enche o console de copias da mesma linha ate
 * esconder o proximo erro de verdade. No efeito ele fala uma vez por
 * componente, quando a configuracao entra no estado que nao funciona - e cala
 * de novo assim que ela sai dele.
 */
function useMissingDataWarning(missing: boolean) {
  useEffect(() => {
    if (!missing || process.env.NODE_ENV === "production") return;

    console.warn(
      "[rivocode/ui] <ChartContainer empty={...}> sem pontos para contar: nem a prop " +
        "`data` foi passada, nem o grafico filho carrega um `data`. O estado vazio nunca " +
        "vai aparecer, e o grafico desenha eixos sobre o nada. Passe `data={pontos}` no " +
        "ChartContainer - e o mesmo array que voce ja entrega ao grafico.",
    );
  }, [missing]);
}

/**
 * O nome de ultimo recurso, montado das series do `config`.
 *
 * Sem nenhum nome, o navegador calcula um a partir do conteudo do SVG e
 * entrega os rotulos dos eixos colados: "MarAbrMaiJunJulAgo020406080". Isso e
 * ruido com forma de nome - passa em qualquer varredura automatica de "tem
 * nome acessivel?" e nao diz nada a quem ouve.
 */
function nameFromConfig(config: ChartConfig) {
  const series = Object.values(config)
    .map((entry) => entry.label)
    .filter(Boolean);

  return series.length > 0 ? `Gráfico de ${series.join(", ")}` : "Gráfico";
}

/**
 * Poe nome e papel no grafico da Recharts.
 *
 * Sao dois consertos numa clonagem so, e os dois mexem em atributo que so
 * existe no `<svg>` interno - a Recharts repassa `role` e `aria-label` da peca
 * dela para a superficie, entao daqui de fora nao ha outro caminho.
 *
 * O papel troca de `application` para `img`. A Recharts marca `application`
 * porque implementa teclado (seta anda com a dica, Enter fixa), mas
 * `application` faz o NVDA e o JAWS sairem do modo de navegacao e entregarem
 * TODAS as teclas ao componente - e o que ele devolve em troca, a dica, nao e
 * anunciado: nao ha regiao viva nenhuma. O usuario de leitor perde as setas do
 * modo de navegacao e nao ganha leitura de valor. Como `img` com nome, ele
 * ouve o que o grafico e e continua navegando a pagina.
 *
 * A parada de tabulacao FICA. Ela nao e vazia: para quem enxerga e navega por
 * teclado, e a unica forma de ler valor exato, e agora ela pinta um anel.
 *
 * Prop escrita na peca pela mao de quem usa vence: quem passar o proprio
 * `aria-label` no `LineChart` nao e sobrescrito aqui.
 */
function describe(chart: ReactElement, name: string) {
  type A11y = { role?: string; "aria-label"?: string };
  const written = chart.props as A11y;

  return cloneElement(chart as ReactElement<A11y>, {
    role: written.role ?? "img",
    "aria-label": written["aria-label"] ?? name,
  });
}

/** Ocupa a altura que o grafico ocuparia, para a tela nao pular entre estados. */
function StateFrame({ children }: { children: ReactNode }) {
  return <div className="flex h-full w-full items-center justify-center">{children}</div>;
}
