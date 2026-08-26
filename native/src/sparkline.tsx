import { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";

import { type RivoNativeColorRole } from "../tokens";
import { cn } from "./cn";
import { useRivo } from "./provider";

/**
 * A espessura do traco, em px. O web usa 1,5 sobre um painel de desktop; no
 * telefone, a 1,5 o traco some na primeira luz de sol, e 2 ainda cabe dentro
 * dos 32px de altura sem virar barra.
 */
const STROKE = 2;

export type SparklineProps = {
  /** So os numeros, na ordem do tempo. */
  data: number[];
  /** `line` para tendencia pura; `bar` quando cada periodo conta sozinho. */
  variant?: "line" | "bar";
  /**
   * O papel de token que pinta o traco - `chart-1` a `chart-8` quando a peca
   * entra numa serie. Sem ele, o acento do tema, que e a leitura neutra de
   * "isto e um numero desta tela".
   */
  color?: RivoNativeColorRole;
  /**
   * Pinta de verde ou vermelho conforme suba ou desca do primeiro ao ultimo
   * ponto. Use so quando subir for bom: em custo, subir e ruim.
   */
  tone?: "auto" | "none";
  /** A altura do desenho, em px. A largura vem do pai. */
  height?: number;
  className?: string;
  /** O que o leitor de tela ouve. Sem isto ela e escondida dele. */
  label?: string;
};

/**
 * A linha miuda que cabe dentro de um numero, no telefone.
 *
 * Sem eixo, sem grade, sem dica: ela nao responde "quanto foi em maio", e sim
 * "isto vem subindo ou descendo". E o slot `chart` do `Stat`, que estava
 * esperando por ela.
 *
 * ```tsx
 * <Stat label="Faturamento" value="R$ 82,4 mil" delta={12}
 *       chart={<Sparkline data={[12, 15, 14, 19, 22, 28]} tone="auto" />} />
 * ```
 *
 * Por padrao ela sai escondida do leitor de tela, pelo mesmo motivo do web: um
 * desenho de tendencia sem numero nao tem o que ler em voz alta, e o numero ao
 * lado dela ja foi lido. Passe `label` quando ela for a unica informacao ali.
 *
 * O desenho e feito com View, e nao com SVG: o pacote nao tem
 * `react-native-svg`, e trazer dependencia de terceiro para uma peca so nao e
 * decisao de quem escreve a peca. O `bar` sai identico ao que sairia em SVG; o
 * `line` e uma polilinha de segmentos girados, exata na geometria, com junta
 * arredondada em vez de `stroke-linejoin`.
 */
export function Sparkline({
  data,
  variant = "line",
  color,
  tone = "none",
  height = 32,
  className,
  label,
}: SparklineProps) {
  const { colors } = useRivo();
  
  /*
   * A diferenca que importa entre o web e o nativo: la o ResponsiveContainer
   * le a largura do DOM antes de pintar, e aqui NAO existe largura ate o
   * layout acontecer. Por isso o onLayout, e por isso o desenho fica vazio no
   * primeiro quadro - meia polilinha piscando torta e pior que um vao de
   * 32px que se preenche no quadro seguinte.
   */
  const [width, setWidth] = useState(0);

  const rose = data.length > 1 && data[data.length - 1]! >= data[0]!;
  /*
   * Os papeis `-text`, e nao `accent`/`success`/`danger` como no web: o traco
   * e uma marca fina POR CIMA da superficie do card, e no tema claro o acento
   * cru (lima) sobre branco nao se ve. Os papeis de texto sao justamente os
   * que o tema garante legiveis contra a superficie, nos dois temas.
   */
  const role: RivoNativeColorRole =
    color ?? (tone === "auto" ? (rose ? "success-text" : "danger-text") : "accent-text");
  const stroke = colors[role];

  // Sem rotulo ela e decoracao: o leitor de tela pula a caixa E os filhos.
  const access = label
    ? ({ accessibilityRole: "image", accessibilityLabel: label } as const)
    : ({
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants",
      } as const);

  if (variant === "bar") {
    /*
     * Barra le magnitude, entao ela mede a partir do zero - normalizar de
     * min a max faria a menor barra sumir e mentir "aqui nao houve nada".
     * A serie negativa e a excecao: ai o chao e o proprio minimo.
     */
    const floor = Math.min(0, ...data);
    const span = Math.max(0, ...data) - floor;

    return (
      <View style={{ height }} className={cn("w-24 flex-row items-end gap-0.5", className)} {...access}>
        {data.map((value, index) => (
          <View
            key={index}
            className="flex-1 rounded-sm"
            style={{
              // O piso de STROKE mantem o periodo vazio visivel como fio: a
              // ausencia de barra seria lida como ausencia de periodo.
              height: Math.max(STROKE, span === 0 ? 0 : ((value - floor) / span) * height),
              backgroundColor: stroke,
            }}
          />
        ))}
      </View>
    );
  }

  // A linha mede de min a max: ela nao fala de volume, so de direcao, e um
  // zero fixo achataria toda variacao pequena contra a base.
  const min = Math.min(...data);
  const range = Math.max(...data) - min;
  const usable = height - STROKE;

  const pointAt = (index: number) => {
    // Serie chata nao tem de onde tirar proporcao: fica no meio, reta.
    const ratio = range === 0 ? 0.5 : (data[index]! - min) / range;
    return {
      x: (index * width) / (data.length - 1),
      // Meio traco de folga em cima e embaixo, senao o pico sai cortado.
      y: STROKE / 2 + (1 - ratio) * usable,
    };
  };

  const segments =
    width === 0 || data.length < 2
      ? []
      : data.slice(1).map((_, index) => {
          const from = pointAt(index);
          const to = pointAt(index + 1);
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          return {
            left: from.x,
            top: from.y - STROKE / 2,
            length: Math.hypot(dx, dy),
            angle: (Math.atan2(dy, dx) * 180) / Math.PI,
          };
        });

  return (
    <View
      style={{ height }}
      className={cn("w-24 overflow-hidden", className)}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      {...access}
    >
      {segments.map((segment, index) => (
        <View
          key={index}
          style={{
            position: "absolute",
            left: segment.left,
            top: segment.top,
            width: segment.length,
            height: STROKE,
            // Ponta redonda faz as vezes do stroke-linejoin: sem ela cada
            // vertice da polilinha abre um entalhe visivel.
            borderRadius: STROKE / 2,
            backgroundColor: stroke,
            // Gira preso ao ponto de partida (borda esquerda, meio da altura),
            // que e o unico pivo que faz o segmento cair sobre os dois pontos.
            transformOrigin: [0, STROKE / 2, 0],
            transform: [{ rotate: `${segment.angle}deg` }],
          }}
        />
      ))}
    </View>
  );
}
