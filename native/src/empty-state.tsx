import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "./cn";
import { Entrance } from "./motion";
import { useRivo } from "./provider";
import { Text } from "./text";

const ICON_SIZE = 32;

export type EmptyStateProps = {
  /**
   * Simbolo do vazio. Opcional, e escondido do leitor de tela, como no web: o
   * titulo e a descricao ja dizem o que ele desenha.
   *
   * No React Native a cor nao desce da `View` para o SVG, entao a forma que
   * pinta sozinha e a funcao: ela recebe o `fg-subtle` do tema que pinta agora
   * e os 32 do web - `icon={({ color, size }) => <Search color={color} size={size} />}`.
   * No aceito tambem, e ai a cor e o tamanho sao de quem desenha.
   */
  icon?: ReactNode | ((glyph: { color: string; size: number }) => ReactNode);
  /**
   * Desenho maior que o icone, para o vazio de primeira vez: a tela inicial
   * sem nada ainda, o passo de onboarding. Filtro sem resultado e lista que
   * esvaziou pedem `icon`, e nao isto.
   *
   * Nada e forcado: o tamanho e de quem desenha. Escondido do leitor de tela,
   * como o `icon`. Pinte com os papeis de `useRivo().colors`, nunca com cor
   * literal, senao o desenho nao acompanha o tema do cliente. Quando vem, toma
   * o lugar do `icon`.
   */
  illustration?: ReactNode;
  title: string;
  /** Obrigatoria pelo mesmo motivo do web: "nenhum resultado" sem o porque
   * transfere o trabalho para a pessoa, e ela quase nunca descobre. */
  description: string;
  action?: ReactNode;
  className?: string;
};

const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const { colors } = useRivo();
  const glyph =
    typeof icon === "function" ? icon({ color: colors["fg-subtle"], size: ICON_SIZE }) : icon;
  const art = illustration ?? glyph;

  return (
    <Entrance className={cn("items-center gap-2 px-6 py-10", className)}>
      {art !== undefined && art !== null && art !== false && (
        <View {...HIDDEN} className="mb-1 items-center justify-center">
          {art}
        </View>
      )}
      <Text className="text-lg font-rc-strong text-fg">{title}</Text>
      <Text className="text-center text-sm text-fg-muted">{description}</Text>
      {action && <View className="mt-2">{action}</View>}
    </Entrance>
  );
}
