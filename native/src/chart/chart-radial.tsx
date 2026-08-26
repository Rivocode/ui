import { Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import type { RivoNativeColorRole } from "../../tokens";
import { cn } from "../cn";
import { useRivo } from "../provider";
import { arcPath } from "./arc";

/** O raio do meio do traço, em unidades do `viewBox`. */
const RADIUS = 42;

/** A espessura do arco. Em `h-44`, os mesmos 14px do `barSize` do web. */
const BAND = 8;

export type ChartRadialProps = {
  /** De 0 a `max`. Acima disso o arco para no fim, e não dá a volta. */
  value: number;
  max?: number;
  /**
   * A cor do arco, como papel de token. Sem ela, o acento do tema.
   *
   * Papel, e não cor de CSS como no web, pela mesma razão do `config` da
   * moldura: aqui a peça pinta com o valor final, e cor escrita à mão seria a
   * única coisa da tela surda ao tema do cliente.
   */
  color?: RivoNativeColorRole;
  /** O número grande no meio. Sem ele, a porcentagem. */
  centerValue?: string;
  /** A linha pequena embaixo do número. */
  centerLabel?: string;
  /** Quantos graus o arco cobre. `360` fecha o círculo. */
  sweep?: number;
  className?: string;
  /**
   * O que o leitor de tela ouve.
   *
   * Sem ela, o nome sai do que está escrito no meio — o número e a linha de
   * baixo, nessa ordem. O web usa só a porcentagem, e é pouco: "82 por cento"
   * sozinho não diz por cento de quê.
   */
  label?: string;
  /**
   * `solid` desenha um arco liso; `segmented` desenha o arco em tracinhos, que
   * é a variação mais pedida de medidor em painel.
   */
  variant?: "solid" | "segmented";
  /** Quantos tracinhos, no `segmented`. */
  segments?: number;
};

/**
 * O arco de uma medida só: meta batida, uso de cota, taxa de conversão.
 *
 * Escolha entre ele e o `Meter` pelo espaço, não pelo gosto: a barra do
 * `Meter` cabe numa linha de formulário e lê mais rápido, e o arco pede um
 * cartão inteiro.
 *
 * ```tsx
 * <ChartRadial value={82} centerLabel="da meta do mês" />
 * ```
 *
 * **No toque não há nada a ler além do que já está escrito**, e é por isso que
 * esta peça atravessa quase inteira: ela nunca teve dica. O valor mora no meio
 * do arco, em texto, desde o web — o que o dedo faria aqui, o olho já fez.
 *
 * O papel de acessibilidade é `image`, e os dois vizinhos explicam por quê. O
 * `Meter` nativo recusou `progressbar` porque ele faz o VoiceOver anunciar
 * indicador de progresso, e esta medida não carrega nada — ela sobe e desce
 * enquanto o mês corre; e recusou `adjustable` porque prometeria que o gesto
 * muda o valor. Sobra `image`, que é o mesmo `role="img"` do web e o mesmo
 * argumento: o arco é uma figura com nome. O nome carrega o número, então
 * ouvir a peça é ouvir a medida — nenhuma parada a mais, nenhum dado fora de
 * alcance.
 */
export function ChartRadial({
  value,
  max = 100,
  color,
  centerValue,
  centerLabel,
  sweep = 270,
  className,
  label,
  variant = "solid",
  segments = 44,
}: ChartRadialProps) {
  const { colors: theme } = useRivo();
  const paint = theme[color ?? "accent"];
  const track = theme.skeleton;

  const clamped = Math.max(0, Math.min(value, max));
  const percentage = max > 0 ? Math.round((clamped / max) * 100) : 0;

  // O arco fica centrado no topo e abre embaixo, que é onde o rótulo de baixo
  // respira. Com sweep de 270 sobram 90 graus de base aberta.
  const from = -sweep / 2;
  const to = from + sweep * (max > 0 ? clamped / max : 0);

  const middle = centerValue ?? `${percentage}%`;
  const name = label ?? (centerLabel ? `${middle}, ${centerLabel}` : middle);

  return (
    <View
      className={cn("h-44 w-full", className)}
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
    >
      <Svg width="100%" height="100%" viewBox="-50 -50 100 100">
        {variant === "segmented" ? (
          <SegmentedArc
            percentage={percentage}
            sweep={sweep}
            segments={segments}
            paint={paint}
            track={track}
          />
        ) : (
          <>
            {/* A escala inteira fica desenhada por baixo: sem ela, um arco
                curto não tem contra o que ser curto. */}
            <Band from={from} to={from + sweep} stroke={track} />
            {/* Em zero não se desenha arco nenhum: um caminho de comprimento
                zero com ponta redonda vira um ponto, e um ponto aceso na
                partida se lê como "já começou". */}
            {to > from && <Band from={from} to={to} stroke={paint} />}
          </>
        )}
      </Svg>

      <View className="absolute inset-0 items-center justify-center">
        {/* O texto do meio some do leitor de tela: ele já é o nome da figura
            acima, e sairia dito duas vezes seguidas. */}
        <Text
          numberOfLines={2}
          className="max-w-[62%] text-center text-2xl font-semibold text-fg"
        >
          {middle}
        </Text>
        {centerLabel && (
          <Text numberOfLines={2} className="mt-0.5 max-w-[70%] text-center text-xs text-fg-subtle">
            {centerLabel}
          </Text>
        )}
      </View>
    </View>
  );
}

/**
 * Um pedaço do arco — ou o círculo fechado, quando o pedaço é a volta toda.
 *
 * Volta inteira não é arco: um comando `A` que começa e termina no mesmo
 * ponto não desenha coisa nenhuma, e `sweep={360}`, que a prop promete
 * aceitar, sairia como uma tela em branco.
 *
 * A ponta redonda é o `cornerRadius={999}` do web. Aqui ela não mente sobre
 * proporção como mentiria na rosca: o arco é um só, e a escala por baixo tem
 * as mesmas pontas.
 */
function Band({ from, to, stroke }: { from: number; to: number; stroke: string }) {
  if (to - from >= 359.9) {
    return <Circle r={RADIUS} fill="none" stroke={stroke} strokeWidth={BAND} />;
  }

  return (
    <Path
      d={arcPath(RADIUS, from, to)}
      fill="none"
      stroke={stroke}
      strokeWidth={BAND}
      strokeLinecap="round"
    />
  );
}

/**
 * O arco em tracinhos.
 *
 * Cada traço é o mesmo desenho girado em volta do centro: assim a espessura e
 * o comprimento não mudam com o ângulo, que é o que acontece quando se calcula
 * ponta a ponta com seno e cosseno.
 *
 * Os traços acesos e apagados são os mesmos elementos, só com cor diferente:
 * esconder o que passou do valor tiraria a escala da tela, e sem escala um
 * traço aceso não significa nada.
 */
function SegmentedArc({
  percentage,
  sweep,
  segments,
  paint,
  track,
}: {
  percentage: number;
  sweep: number;
  segments: number;
  paint: string;
  track: string;
}) {
  const lit = Math.round((percentage / 100) * segments);
  const first = -sweep / 2;
  const step = segments > 1 ? sweep / (segments - 1) : 0;

  return (
    <>
      {Array.from({ length: segments }, (_, index) => (
        <Line
          key={index}
          x1={0}
          y1={-46}
          x2={0}
          y2={-38}
          stroke={index < lit ? paint : track}
          strokeWidth={2.4}
          strokeLinecap="round"
          // `rotation` gira em torno de (0,0), que no `viewBox` desta peça é o
          // centro do arco. O `transform` em texto do SVG faria o mesmo, mas
          // esta prop é a que o react-native-svg tipa.
          rotation={first + index * step}
        />
      ))}
    </>
  );
}
