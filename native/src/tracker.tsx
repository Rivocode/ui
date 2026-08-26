import { useRef, useState } from "react";
import { PanResponder, View, Text, type LayoutChangeEvent } from "react-native";

import { cn } from "./cn";

export type TrackerPoint = {
  /** O que aconteceu nesse período. */
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
  /**
   * O que o leitor de tela ouve e o que a linha de baixo mostra.
   *
   * `string`, e não `ReactNode` como no web: aqui ele vai inteiro para o
   * `accessibilityValue` da faixa, que só aceita texto — e num `ReactNode` não
   * há como ler o texto de volta.
   */
  label: string;
};

const TONE: Record<NonNullable<TrackerPoint["tone"]>, string> = {
  neutral: "bg-skeleton",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  accent: "bg-accent",
};

export type TrackerProps = {
  data: TrackerPoint[];
  /** O que a faixa mede, dito por extenso: "Emissões dos últimos 90 dias". */
  label: string;
  className?: string;
};

/**
 * A faixa de quadradinhos por período: as últimas 90 emissões, a
 * disponibilidade do mês, a fila dos últimos dias.
 *
 * **O que não porta é a dica por quadrado, e não é por preguiça: é por
 * aritmética.** No web cada quadrado monta um `Tooltip`, e um tooltip é um
 * portal; 365 dias seriam 365 portais montados para que no máximo um apareça.
 * E mesmo que fossem de graça, eles não funcionariam: dica se abre ao pousar o
 * ponteiro, e no toque não há pousar. Nem adiantaria trocar cada quadrado por
 * um `Pressable` — 90 períodos em 358px dão 4px por quadrado, seis vezes menos
 * que o alvo de toque mínimo, e um alvo desse tamanho é uma promessa que o
 * dedo não cumpre.
 *
 * **O que entra no lugar é a faixa inteira como um alvo só.** O dedo pousa e
 * arrasta sobre ela, a marca acompanha, e o texto do período lido aparece numa
 * linha fixa embaixo — que é onde o rótulo da dica passa a morar. A linha
 * existe desde o primeiro quadro, mostrando o período mais recente: reservar o
 * espaço evita a tela pular no primeiro toque, e o período mais recente é o
 * que a pergunta "piorou ontem?" quer ler primeiro.
 *
 * **E a leitura de tela anda ponto a ponto.** O web põe uma lista escondida
 * com os 365 textos, o que no celular seriam 365 paradas de VoiceOver dentro
 * de um cartão. Aqui a faixa é uma parada só, do tipo ajustável — o mesmo
 * contrato do `Slider`: arrastar para cima e para baixo caminha pelos
 * períodos, e cada passo anuncia o texto daquele período. Nenhum dado fica
 * inalcançável, e nenhum deles vira obstáculo.
 */
export function Tracker({ data, label, className }: TrackerProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const countRef = useRef(data.length);
  countRef.current = data.length;

  // Começa no período mais recente, que é o da direita.
  const [index, setIndex] = useState(data.length - 1);
  const at = Math.min(Math.max(index, 0), Math.max(data.length - 1, 0));
  const point = data[at];

  const moveTo = (x: number) => {
    if (widthRef.current <= 0 || countRef.current === 0) return;
    const raw = Math.floor((x / widthRef.current) * countRef.current);
    setIndex(Math.min(Math.max(raw, 0), countRef.current - 1));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => moveTo(event.nativeEvent.locationX),
      onPanResponderMove: (event) => moveTo(event.nativeEvent.locationX),
    }),
  ).current;

  if (data.length === 0) return null;

  const step = width / data.length;

  return (
    <View className={cn("gap-1.5", className)}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: `${at + 1} de ${data.length}: ${point?.label ?? ""}` }}
        accessibilityActions={[
          { name: "increment", label: "Período seguinte" },
          { name: "decrement", label: "Período anterior" },
        ]}
        onAccessibilityAction={(event) => {
          const delta = event.nativeEvent.actionName === "increment" ? 1 : -1;
          setIndex(Math.min(Math.max(at + delta, 0), data.length - 1));
        }}
        onLayout={(event: LayoutChangeEvent) => {
          widthRef.current = event.nativeEvent.layout.width;
          setWidth(event.nativeEvent.layout.width);
        }}
        // 28px de faixa mais o resto até 44: a altura do alvo é a da linha
        // inteira, ainda que o desenho continue com a mesma barra do web.
        className="h-11 w-full flex-row items-center gap-0.5"
        {...pan.panHandlers}
      >
        {data.map((entry, position) => (
          <View
            key={position}
            className={cn("h-7 min-w-0 flex-1 rounded-sm", TONE[entry.tone ?? "neutral"])}
          />
        ))}

        {/* A marca do que está sendo lido. Ela é um fio de 2px por cima, e não
            uma borda no quadrado: num quadrado de 4px a borda ocuparia o
            quadrado inteiro e trocaria a cor do dado pela cor da marca. */}
        {width > 0 && (
          <View
            className="absolute h-9 w-0.5 rounded-pill bg-fg"
            style={{ left: Math.max(0, at * step + step / 2 - 1) }}
          />
        )}
      </View>

      {/* O rótulo do período lido. Escondido do leitor de tela porque a faixa
          acima já o anuncia como valor: aqui ele seria a mesma frase, dita
          duas vezes seguidas. */}
      <Text
        numberOfLines={1}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="text-xs text-fg-muted"
      >
        {point?.label}
      </Text>
    </View>
  );
}
