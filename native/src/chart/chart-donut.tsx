import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { cn } from "../cn";
import { useRivo } from "../provider";
import { arcPath } from "./arc";
import { PALETTE, type ChartConfig } from "./chart";

/** O raio de fora, em unidades do `viewBox`. Os mesmos 88% do web. */
const OUTER = 44;

/** A folga entre duas fatias, em graus. É o `paddingAngle` do web. */
const GAP = 2;

export type ChartDonutProps<Slice> = {
  data: Slice[];
  /** De onde sai o número de cada fatia. */
  valueKey: keyof Slice & string;
  /** De onde sai o nome de cada fatia. É ele que o `config` procura. */
  nameKey: keyof Slice & string;
  config?: ChartConfig;
  /**
   * O número grande no meio. `string`, e não `ReactNode` como no web: aqui ele
   * também é o que o leitor de tela ouve quando não há legenda.
   */
  centerValue?: string;
  /** A linha pequena embaixo do número. */
  centerLabel?: string;
  /**
   * Espessura do anel, em fração do raio. `1` fecha e vira pizza. Anel mais
   * fino deixa buraco maior, e é ali que o total precisa caber.
   */
  thickness?: number;
  /**
   * A lista de fatias embaixo, com nome e valor. **Ligada por padrão, e aqui
   * ela carrega mais peso que no web**: é a legenda que responde ao toque e
   * ao leitor de tela, porque nenhuma dica se abre sem ponteiro.
   */
  legend?: boolean;
  /**
   * Como o número é escrito.
   *
   * Só função, ao contrário do web, que também aceita o nome de um formatador
   * da casa (`currencyShort`, `percent`). É a mesma decisão que o `Meter`
   * nativo já tomou e escreveu: resolver nome de formatador arrasta o `Intl`
   * inteiro para o bundle do celular, e quem chama já tem o número escrito.
   */
  format?: (value: number) => string;
  className?: string;
  /**
   * O que o leitor de tela ouve no lugar do desenho.
   *
   * Com a legenda ligada — o padrão — ela não é necessária, e nem é usada: o
   * desenho fica escondido e cada fatia é uma parada de verdade logo abaixo.
   * Sem legenda, o nome sai das fatias, com valor e tudo.
   */
  label?: string;
};

/**
 * Rosca com o total no meio.
 *
 * A pizza responde "qual é a maior fatia" e nada mais; a rosca responde a
 * mesma coisa e ainda usa o buraco para dizer o total, que é o número que a
 * pessoa veio buscar.
 *
 * ```tsx
 * <ChartDonut
 *   data={porNatureza}
 *   valueKey="total"
 *   nameKey="natureza"
 *   config={NATUREZA}
 *   centerValue="R$ 246,7 mil"
 *   centerLabel="faturado"
 *   format={(valor) => moedaCurta(valor)}
 * />
 * ```
 *
 * **O que muda do web é como se lê uma fatia, e a razão é que não há pousar.**
 * Lá o ponteiro pousa no anel e a dica diz nome e valor; o total do meio sai
 * de cena enquanto isso, para os dois números não se empilharem. Aqui o gesto
 * equivalente é o toque, e ele mora na **legenda**, não na fatia:
 *
 * - **a linha da legenda é um alvo de 44px, e a fatia não é.** Um anel de
 *   190px tem 600px de contorno para dividir entre até seis fatias; a de 2%
 *   fica com doze. É a mesma aritmética que tirou a dica por quadrado do
 *   `Tracker`, e alvo que o dedo não acerta é promessa que a peça não cumpre;
 * - **a legenda já é a resposta.** Ela repete nome e valor em texto, sempre
 *   visível. O que faltava não era o valor, era saber qual desenho é qual — e
 *   é isso que o toque resolve: a linha tocada acende a fatia dela e manda
 *   nome e valor para o meio, no lugar exato onde o web põe a dica. Tocar de
 *   novo devolve o total.
 *
 * **E a leitura de tela não precisa do truque do `Tracker`.** Lá foram 90
 * períodos, e 90 paradas de VoiceOver dentro de um cartão são um obstáculo:
 * por isso a faixa virou uma parada `adjustable` só. Aqui são no máximo seis
 * fatias — acima disso a rosca para de informar e barra deitada lê melhor —, e
 * seis paradas com nome e valor são melhores que uma parada ajustável, porque
 * cada uma é também o botão que acende a fatia. Contagem diferente, saída
 * diferente.
 *
 * Sem legenda (`legend={false}`) nada disso existe, e aí o desenho vira uma
 * imagem cujo nome carrega as fatias e os valores — senão o dado ficaria
 * inalcançável, que no web ainda tinha a dica como saída e aqui não tem.
 */
export function ChartDonut<Slice extends Record<string, unknown>>({
  data,
  valueKey,
  nameKey,
  config,
  centerValue,
  centerLabel,
  thickness = 0.34,
  legend = true,
  format,
  className,
  label,
}: ChartDonutProps<Slice>) {
  const { colors: theme } = useRivo();

  /** Qual fatia está sendo lida, ou nenhuma. É o `hover` do web, por toque. */
  const [reading, setReading] = useState<number | null>(null);

  const inner = OUTER * (1 - thickness);
  const middle = (OUTER + inner) / 2;
  const band = OUTER - inner;

  const nameOf = (slice: Slice) => String(slice[nameKey]);
  const textOf = (slice: Slice) => config?.[nameOf(slice)]?.label ?? nameOf(slice);
  const colorOf = (slice: Slice, index: number) =>
    theme[config?.[nameOf(slice)]?.color ?? PALETTE[index % PALETTE.length]!];

  const write = (value: number) => (format ? format(value) : String(value));

  // Valor negativo não tem fatia possível: ele encolheria o total e daria a
  // uma fatia positiva mais de uma volta.
  const values = data.map((slice) => Math.max(0, Number(slice[valueKey]) || 0));
  const total = values.reduce((sum, value) => sum + value, 0);

  let walked = 0;
  const wedges = values.map((value) => {
    const span = total > 0 ? (value / total) * 360 : 0;
    const from = walked;
    walked += span;
    return { from, span };
  });

  const drawn = wedges.filter((wedge) => wedge.span > 0);
  /** A única fatia com valor, quando é uma só: ela dá a volta inteira. */
  const sole = drawn.length === 1 ? wedges.findIndex((wedge) => wedge.span > 0) : -1;

  const read = reading !== null ? data[reading] : undefined;
  const readValue = reading !== null ? values[reading]! : 0;

  /*
   * O nome do desenho, quando ele precisa de um.
   *
   * Com legenda ele não precisa: as fatias estão logo abaixo, cada uma numa
   * parada tocável, e nomear o anel faria a mesma lista ser dita duas vezes -
   * então o SVG sai escondido do leitor de tela.
   */
  const name =
    label ??
    (legend
      ? undefined
      : `Rosca: ${data.map((slice, index) => `${textOf(slice)} ${write(values[index]!)}`).join(", ")}`);

  const spoken = name
    ? ({ accessible: true, accessibilityRole: "image", accessibilityLabel: name } as const)
    : ({
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants",
      } as const);

  return (
    <View className={cn("w-full", className)}>
      <View className="h-48 w-full" {...spoken}>
        {/*
          O desenho não mede nada: o `viewBox` de 100 por 100 é o espaço da
          conta, e o `react-native-svg` o escala para a caixa acima. É a peça
          equivalente ao `ResponsiveContainer` do web, de graça.
        */}
        <Svg width="100%" height="100%" viewBox="-50 -50 100 100">
          {drawn.length === 0 ? null : sole >= 0 ? (
            /*
             * Uma fatia só é volta inteira, e volta inteira não é arco: um
             * comando `A` que começa e termina no mesmo ponto não desenha
             * nada, e a rosca some justamente no caso mais simples.
             */
            <Circle r={middle} fill="none" stroke={colorOf(data[sole]!, sole)} strokeWidth={band} />
          ) : (
            wedges.map((wedge, index) => {
              if (wedge.span <= 0) return null;

              // A folga sai de dentro da própria fatia, metade de cada lado.
              // O teto de um terço é para a fatia de 1% não virar folga
              // inteira - e, pior, arco de comprimento negativo.
              const edge = Math.min(GAP / 2, wedge.span / 3);
              const dim = reading !== null && reading !== index;

              return (
                <Path
                  key={nameOf(data[index]!)}
                  d={arcPath(middle, wedge.from + edge, wedge.from + wedge.span - edge)}
                  fill="none"
                  stroke={colorOf(data[index]!, index)}
                  strokeWidth={band}
                  /*
                   * Ponta reta, e é o mais próximo do web que existe aqui. O
                   * `cornerRadius={4}` de lá vem da Recharts, que recorta o
                   * canto da fatia preenchida; o que um arco traçado oferece é
                   * `strokeLinecap="round"`, que é outra coisa - a ponta
                   * redonda estende o traço em meia espessura para cada lado,
                   * quase doze graus na espessura padrão. Uma fatia de 5%
                   * apareceria como 11%, e a rosca passaria a mentir sobre a
                   * única coisa que ela informa.
                   */
                  strokeLinecap="butt"
                  strokeOpacity={dim ? 0.32 : 1}
                />
              );
            })
          )}
        </Svg>

        {(centerValue || centerLabel || read) && (
          <View
            className="absolute inset-0 items-center justify-center"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {/* Preso à largura do buraco: um total escapando por cima do anel
                é o defeito clássico da rosca com número no meio. */}
            <Text
              numberOfLines={2}
              className="max-w-[52%] text-center text-xl font-semibold text-fg"
            >
              {read ? write(readValue) : centerValue}
            </Text>
            {(read || centerLabel) && (
              <Text numberOfLines={1} className="mt-0.5 max-w-[64%] text-center text-xs text-fg-subtle">
                {read ? textOf(read) : centerLabel}
              </Text>
            )}
          </View>
        )}
      </View>

      {legend && (
        <View className="mt-3">
          {data.map((slice, index) => {
            const selected = reading === index;

            return (
              <Pressable
                key={nameOf(slice)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${textOf(slice)}: ${write(values[index]!)}`}
                accessibilityHint="Acende esta fatia e mostra o valor dela no meio"
                onPress={() => setReading(selected ? null : index)}
                // 44px de altura: o alvo que a fatia não consegue oferecer.
                className={cn(
                  "h-11 flex-row items-center gap-2 rounded-sm px-1",
                  selected && "bg-selected",
                )}
              >
                <View
                  className="size-2 rounded-sm"
                  style={{ backgroundColor: colorOf(slice, index) }}
                />
                <Text numberOfLines={1} className="min-w-0 flex-1 text-sm text-fg-muted">
                  {textOf(slice)}
                </Text>
                <Text className="font-mono text-sm text-fg">{write(values[index]!)}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
