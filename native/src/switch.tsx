import type { ReactNode } from "react";
import { Pressable, Switch as NativeSwitch, Text } from "react-native";

import { tokens } from "../tokens";
import { cn } from "./cn";
import { useRivo } from "./provider";

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children?: ReactNode;
  disabled?: boolean;
  /** Veste a LINHA (rotulo + interruptor); sem rotulo nao ha o que vestir. */
  className?: string;
};

/**
 * O interruptor nativo da plataforma, vestido com o acento do tema. Liga
 * agora, sem confirmar - a mesma regra de escolha do web.
 */
export function Switch({ checked, onCheckedChange, children, disabled, className }: SwitchProps) {
  const { theme } = useRivo();
  const colors = tokens.themes[theme];

  const control = (
    <NativeSwitch
      value={checked}
      onValueChange={onCheckedChange}
      disabled={disabled}
      // Trilho desligado em border-strong, nunca em superficie: superficie
      // sobre superficie sumia no escuro do Android. O polegar segue a mesma
      // logica do botao: escuro sobre o acento, claro sobre o trilho apagado.
      trackColor={{ false: colors["border-strong"], true: colors.accent }}
      thumbColor={checked ? colors["accent-fg"] : colors["fg-muted"]}
      ios_backgroundColor={colors["border-strong"]}
    />
  );

  if (!children) return control;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      className={cn("flex-row items-center justify-between gap-3", disabled && "opacity-50", className)}
    >
      <Text className="shrink text-base text-fg">{children}</Text>
      {control}
    </Pressable>
  );
}
