import type { ReactNode } from "react";
import { Pressable, View, type PressableProps } from "react-native";

import { cn } from "./cn";
import { Presence } from "./motion";
import { Text } from "./text";

export type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** O rotulo. Como no web, clicar no texto tambem marca. */
  children?: ReactNode;
  disabled?: boolean;
  /**
   * O terceiro estado, o da caixa mestra de uma lista meio marcada: desenha um
   * traco no lugar do tique e anuncia `mixed`. Vence o `checked` no desenho, e o
   * toque marca tudo.
   */
  indeterminate?: boolean;
  /**
   * O nome falado, para a caixa que nao tem rotulo ao lado - a de marcar uma
   * linha de lista, por exemplo. Sem ele o leitor de tela le "caixa de
   * selecao, marcado" e a pessoa nao fica sabendo o que marcou.
   */
  accessibilityLabel?: string;
  /**
   * Area de toque alem do desenho. A caixa desenha 20px, bem abaixo dos 44pt
   * da Apple e dos 48dp do Android, e quem a poe sem rotulo ao lado perde o
   * resto do alvo que o texto dava.
   */
  hitSlop?: PressableProps["hitSlop"];
  className?: string;
};

export function Checkbox({
  checked,
  onCheckedChange,
  children,
  disabled,
  indeterminate = false,
  accessibilityLabel,
  hitSlop,
  className,
}: CheckboxProps) {
  const filled = checked || indeterminate;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: indeterminate ? "mixed" : checked, disabled }}
      hitSlop={hitSlop}
      disabled={disabled}
      onPress={() => onCheckedChange(indeterminate ? true : !checked)}
      className={cn("flex-row items-center gap-2.5", disabled && "opacity-50", className)}
    >
      <View
        className={`size-5 items-center justify-center rounded-sm border ${
          filled ? "border-accent-text bg-accent-text" : "border-border-strong bg-surface"
        }`}
      >
        <Presence show={filled} swapKey={indeterminate ? "mixed" : "checked"} enter="popIn">
          {indeterminate ? (
            <View className="h-0.5 w-2.5 rounded-pill bg-surface-raised" />
          ) : (
            <View className="mb-0.5 h-2 w-3 -rotate-45 border-b-2 border-l-2 border-surface-raised" />
          )}
        </Presence>
      </View>
      {children && <Text className="text-base text-fg">{children}</Text>}
    </Pressable>
  );
}
