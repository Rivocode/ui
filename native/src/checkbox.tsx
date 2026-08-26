import type { ReactNode } from "react";
import { Pressable, View, type PressableProps } from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

export type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** O rotulo. Como no web, clicar no texto tambem marca. */
  children?: ReactNode;
  disabled?: boolean;
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
  accessibilityLabel,
  hitSlop,
  className,
}: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked, disabled }}
      hitSlop={hitSlop}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      className={cn("flex-row items-center gap-2.5", disabled && "opacity-50", className)}
    >
      <View
        className={`size-5 items-center justify-center rounded-sm border ${
          checked ? "border-accent bg-accent" : "border-border-strong bg-surface"
        }`}
      >
        {checked && (
          <View className="mb-0.5 h-2 w-3 -rotate-45 border-b-2 border-l-2 border-accent-fg" />
        )}
      </View>
      {children && <Text className="text-base text-fg">{children}</Text>}
    </Pressable>
  );
}
