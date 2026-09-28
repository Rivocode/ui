import { Pressable, View } from "react-native";

import { cn } from "./cn";
import { Presence } from "./motion";
import { Text } from "./text";

export type RadioItem = { label: string; value: string; description?: string };

export type RadioGroupProps = {
  items: RadioItem[];
  value: string | null;
  onValueChange: (value: string) => void;
  /**
   * The group's name for the screen reader. Without it, the group has no name
   * at all. The web asks for the same thing via `aria-label` or
   * `aria-labelledby`, and its page says that without it the group exists for
   * the finger and not for the screen reader. Here there was no way to say it:
   * a `radiogroup` with no name announces only the word "group", and each
   * option presents itself without saying which question it answers. It draws
   * nothing - the visible text belongs to `Field`, as in `Select` and
   * `Combobox`. Inside a `FormField`, repeat there the same text as its
   * `label`.
   */
  label?: string;
  disabled?: boolean;
  className?: string;
};

export function RadioGroup({
  items,
  value,
  onValueChange,
  label,
  disabled,
  className,
}: RadioGroupProps) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className={cn("gap-3", className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: active, disabled }}
            disabled={disabled}
            onPress={() => onValueChange(item.value)}
            className={`flex-row items-start gap-2.5 ${disabled ? "opacity-50" : ""}`}
          >
            <View
              className={`mt-0.5 size-5 items-center justify-center rounded-pill border ${
                active ? "border-accent-text" : "border-border-strong"
              }`}
            >
              <Presence show={active} enter="popIn">
                <View className="size-2.5 rounded-pill bg-accent-text" />
              </Presence>
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-base text-fg">{item.label}</Text>
              {item.description && (
                <Text className="text-xs text-fg-subtle">{item.description}</Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
