import { View } from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

export type MeterProps = {
  /** Onde a medida esta agora, na escala de `min` a `max`. */
  value: number;
  /** O piso da escala. Quase sempre zero, e por isso o padrao. */
  min?: number;
  /**
   * O teto da escala: a cota, o limite do plano, o disco contratado. O padrao
   * 100 e o caso porcentagem, que e o unico que o Progress daqui atende.
   */
  max?: number;
  /** O nome da medida. Fica na tela E e o que o leitor de tela anuncia. */
  label: string;
  /** Escreve a porcentagem ao lado do rotulo. O mesmo nome do web. */
  showValue?: boolean;
  /**
   * A medida ja escrita - "8 GB de 15 GB", "R$ 4.200 de R$ 5.000". Substitui a
   * porcentagem na tela e no anuncio.
   *
   * O web resolve isso com `format`, que aceita o nome de um formatador da
   * casa; aqui quem escreve e quem chama, como no `Stat`. Trazer a tabela de
   * formatadores do web para o pacote nativo custaria o `Intl` inteiro num
   * bundle de celular para escrever uma linha de texto.
   */
  valueLabel?: string;
  className?: string;
};

export function Meter({
  value,
  min = 0,
  max = 100,
  label,
  showValue,
  valueLabel,
  className,
}: MeterProps) {
  const span = max - min;
  const filled = span > 0 ? Math.min(1, Math.max(0, (value - min) / span)) : 0;
  const percent = Math.round(filled * 100);
  const spoken = valueLabel ?? `${percent}%`;
  const announced = Math.min(max, Math.max(min, value));

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: announced, text: spoken }}
      className={cn("gap-2", className)}
    >
      <View className="flex-row items-baseline justify-between gap-4">
        <Text className="text-sm text-fg">{label}</Text>
        {(showValue || valueLabel !== undefined) && (
          <Text className="text-xs text-fg-subtle">{spoken}</Text>
        )}
      </View>

      <View className="h-1.5 overflow-hidden rounded-pill bg-skeleton">
        <View className="h-full rounded-pill bg-accent-text" style={{ width: `${percent}%` }} />
      </View>
    </View>
  );
}
