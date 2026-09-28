import type { ReactNode } from "react";
import { Pressable, Switch as NativeSwitch } from "react-native";

import { cn, type Slots } from "./cn";
import { useRivo } from "./provider";
import { Text } from "./text";

type SwitchName =
  | {
      /** The visible label, on the same line as the switch; tapping it also toggles. */
      children: ReactNode;
      /**
       * The spoken name, required when there are no `children`. With text
       * beside it, replaces the name the screen reader reads.
       */
      label?: string;
    }
  | {
      children?: undefined;
      /**
       * The spoken name of a switch with no text beside it. Required here:
       * without it the screen reader announces only "switch, off".
       */
      label: string;
    };

export type SwitchProps = SwitchName & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Styles the ROW (label + switch); without a label there is nothing to style. */
  className?: string;
  /**
   * Class per part: `label`, the text beside it. The thumb is drawn by the
   * platform `Switch` and takes no class; its color comes from the theme.
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
