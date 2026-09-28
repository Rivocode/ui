import { View } from "react-native";

import { Checkbox } from "./checkbox";
import { cn } from "./cn";

export type CheckboxGroupItem = { label: string; value: string };

export type CheckboxGroupProps = {
  items: CheckboxGroupItem[];
  /** The checked values. Empty is a normal state, not an error. */
  value: string[];
  onValueChange: (value: string[]) => void;
  /**
   * The group's name for the screen reader. Without it, the group has no name
   * at all. The web asks for the same thing via `aria-label`, and for the same
   * reason as `RadioGroup`: the list of boxes answers a question, and without
   * the group name each box presents itself without saying which. Naming it
   * also turns on the list role: React Native has no `group` role, and a `View`
   * with no role carries no name. It draws nothing - the visible text belongs
   * to `Field`, as in `Select` and `Combobox`.
   */
  label?: string;
  disabled?: boolean;
  className?: string;
};

export function CheckboxGroup({
  items,
  value,
  onValueChange,
  label,
  disabled,
  className,
}: CheckboxGroupProps) {
  const toggle = (item: string, checked: boolean) =>
    onValueChange(checked ? [...value, item] : value.filter((other) => other !== item));

  return (
    <View
      accessibilityRole={label === undefined ? undefined : "list"}
      accessibilityLabel={label}
      className={cn("gap-3", className)}
    >
      {items.map((item) => (
        <Checkbox
          key={item.value}
          checked={value.includes(item.value)}
          onCheckedChange={(checked) => toggle(item.value, checked)}
          disabled={disabled}
        >
          {item.label}
        </Checkbox>
      ))}
    </View>
  );
}
