import type { ReactNode } from "react";
import { Pressable, Switch as NativeSwitch, Text } from "react-native";

import { tokens } from "../tokens";
import { useRivo } from "./provider";

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children?: ReactNode;
  disabled?: boolean;
};

/**
 * O interruptor nativo da plataforma, vestido com o acento do tema. Liga
 * agora, sem confirmar - a mesma regra de escolha do web.
 */
export function Switch({ checked, onCheckedChange, children, disabled }: SwitchProps) {
  const { theme } = useRivo();
  const colors = tokens.themes[theme];

  const control = (
    <NativeSwitch
      value={checked}
      onValueChange={onCheckedChange}
      disabled={disabled}
      trackColor={{ false: colors["surface-raised"], true: colors.accent }}
      thumbColor={colors.bg}
      ios_backgroundColor={colors["surface-raised"]}
    />
  );

  if (!children) return control;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      className={`flex-row items-center justify-between gap-3 ${disabled ? "opacity-50" : ""}`}
    >
      <Text className="shrink text-base text-fg">{children}</Text>
      {control}
    </Pressable>
  );
}
