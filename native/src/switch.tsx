import type { ReactNode } from "react";
import { Pressable, Switch as NativeSwitch } from "react-native";

import { cn, type Slots } from "./cn";
import { useRivo } from "./provider";
import { Text } from "./text";

type SwitchName =
  | {
      /** O rotulo visivel, na mesma linha do interruptor; tocar nele tambem troca. */
      children: ReactNode;
      /**
       * O nome falado, obrigatorio quando nao ha `children`. Com texto ao
       * lado, troca o nome que o leitor de tela le.
       */
      label?: string;
    }
  | {
      children?: undefined;
      /**
       * O nome falado do interruptor sem texto ao lado. Obrigatorio aqui: sem
       * ele o leitor de tela anuncia so "interruptor, desligado".
       */
      label: string;
    };

export type SwitchProps = SwitchName & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Veste a LINHA (rotulo + interruptor); sem rotulo nao ha o que vestir. */
  className?: string;
  /**
   * Classe por parte: `label`, o texto ao lado. O polegar e desenhado pelo
   * `Switch` da plataforma e nao recebe classe; a cor dele sai do tema.
   */
  classNames?: Slots<"label">;
};

export function Switch({
  checked,
  onCheckedChange,
  children,
  label,
  disabled,
  className,
  classNames,
}: SwitchProps) {
  const { colors } = useRivo();

  const control = (
    <NativeSwitch
      accessibilityLabel={children ? undefined : label}
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
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      className={cn(
        "flex-row items-center justify-between gap-3",
        disabled && "opacity-50",
        className,
      )}
    >
      <Text className={cn("shrink text-base text-fg", classNames?.label)}>{children}</Text>
      {control}
    </Pressable>
  );
}
