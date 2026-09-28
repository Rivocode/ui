import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "./cn";
import { AnimatedPressable, usePressScale } from "./motion";
import { Text } from "./text";

export type ToggleProps = {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
};

export function Toggle({ pressed, onPressedChange, children, disabled, className }: ToggleProps) {
  const press = usePressScale({});
  return (
    <AnimatedPressable
      {...press}
      accessibilityRole="togglebutton"
      accessibilityState={{ selected: pressed, disabled }}
      disabled={disabled}
      onPress={() => onPressedChange(!pressed)}
      className={cn(
        "h-11 flex-row items-center justify-center rounded-md border px-3.5",
        pressed ? "border-accent bg-accent-subtle" : "border-border-strong bg-surface",
        disabled && "opacity-50",
        className,
      )}
    >
      <Text className={`text-sm font-rc-medium ${pressed ? "text-accent-text" : "text-fg-muted"}`}>
        {children}
      </Text>
    </AnimatedPressable>
  );
}

export type ToggleGroupItem = { label: string; value: string };

export type ToggleGroupProps = {
  items: ToggleGroupItem[];
  /** The pressed values. Without `multiple`, at most one. */
  value: string[];
  onValueChange: (value: string[]) => void;
  /**
   * `multiple` accepts several at once; the default unpresses the previous one.
   * The name and meaning are the web's: the same component cannot respond the
   * opposite way on each side, and before this the native side asked for
   * `single` and was multiple by default - the exact opposite.
   */
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
};

export function ToggleGroup({
  items,
  value,
  onValueChange,
  multiple,
  disabled,
  className,
}: ToggleGroupProps) {
  const toggle = (item: string, pressed: boolean) => {
    if (multiple) {
      onValueChange(pressed ? [...value, item] : value.filter((other) => other !== item));
      return;
    }
    onValueChange(pressed ? [item] : []);
  };

  return (
    <View className={cn("flex-row flex-wrap gap-2", className)}>
      {items.map((item) => (
        <Toggle
          key={item.value}
          pressed={value.includes(item.value)}
          onPressedChange={(pressed) => toggle(item.value, pressed)}
          disabled={disabled}
        >
          {item.label}
        </Toggle>
      ))}
    </View>
  );
}
