import { View } from "react-native";

import { Checkbox } from "./checkbox";

export type CheckboxGroupItem = { label: string; value: string };

export type CheckboxGroupProps = {
  items: CheckboxGroupItem[];
  /** Os valores marcados. Vazio e um estado normal, nao um erro. */
  value: string[];
  onValueChange: (value: string[]) => void;
  disabled?: boolean;
};

/** Varios sim-ou-nao da mesma familia, cada linha um Checkbox de verdade. */
export function CheckboxGroup({ items, value, onValueChange, disabled }: CheckboxGroupProps) {
  const toggle = (item: string, checked: boolean) =>
    onValueChange(checked ? [...value, item] : value.filter((other) => other !== item));

  return (
    <View className="gap-3">
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
