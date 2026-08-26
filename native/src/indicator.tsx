import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

export type IndicatorProps = {
  /** O que recebe a marca: o botão do sino, o item da barra, o avatar. */
  children: ReactNode;
  /**
   * Quantos. Zero não desenha nada - uma pastilha com "0" chama atenção para
   * dizer que não há nada, que é o contrário do trabalho dela.
   */
  count?: number;
  /** O teto: acima dele sai "99+", em vez de a pastilha esticar. */
  max?: number;
  /**
   * O que o leitor de tela ouve no lugar do número: "3 notificações".
   *
   * Obrigatório, e é a diferença que a peça existe para fazer. O número
   * sozinho não diz o que são três, e no celular ele é ainda menor do que no
   * web - quem aumenta a fonte do sistema para ler não quer descobrir o
   * assunto pela cor da pastilha.
   */
  label: string;
  /** Sem contagem: só o ponto, para "tem algo novo aqui". */
  dot?: boolean;
  className?: string;
  /** Veste a pastilha. O `className` veste o que embrulha o filho. */
  badgeClassName?: string;
};

export function Indicator({
  children,
  count,
  max = 99,
  label,
  dot,
  className,
  badgeClassName,
}: IndicatorProps) {
  const show = dot === true || (count !== undefined && count > 0);
  const written = count !== undefined && count > max ? `${max}+` : String(count ?? "");

  return (
    <View className={cn("self-start", className)}>
      {children}

      {show && (
        <View
          accessible
          accessibilityRole="text"
          accessibilityLabel={label}
          className={cn(
            "absolute -top-1 -right-1 flex-row items-center justify-center rounded-pill bg-danger",
            "border-2 border-bg",
            dot === true ? "size-3.5" : "h-[22px] min-w-[22px] px-1",
            badgeClassName,
          )}
        >
          {dot !== true && <Text className="text-xs font-medium text-danger-fg">{written}</Text>}
        </View>
      )}
    </View>
  );
}
