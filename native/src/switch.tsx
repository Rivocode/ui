import type { ReactNode } from "react";
import { Pressable, Switch as NativeSwitch } from "react-native";

import { cn } from "./cn";
import { useRivo } from "./provider";
import { Text } from "./text";

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children?: ReactNode;
  disabled?: boolean;
  /** Veste a LINHA (rotulo + interruptor); sem rotulo nao ha o que vestir. */
  className?: string;
};

export function Switch({ checked, onCheckedChange, children, disabled, className }: SwitchProps) {
  const { colors } = useRivo();

  const control = (
    <NativeSwitch
      value={checked}
      onValueChange={onCheckedChange}
      disabled={disabled}
      trackColor={{ false: colors["border-strong"], true: colors["accent-text"] }}
      thumbColor={checked ? colors["surface-raised"] : colors["fg-muted"]}
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
      className={cn(
        "flex-row items-center justify-between gap-3",
        disabled && "opacity-50",
        className,
      )}
    >
      <Text className="shrink text-base text-fg">{children}</Text>
      {control}
    </Pressable>
  );
}
