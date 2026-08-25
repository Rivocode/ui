import { Pressable, Text, View } from "react-native";

export type TabItem = { label: string; value: string };

export type TabsProps = {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
};

/**
 * A caixinha segmentada: ver a mesma coisa de outro jeito. Secao de pagina
 * e trabalho do router nativo, nao desta peca - a mesma divisao do web.
 */
export function Tabs({ items, value, onValueChange }: TabsProps) {
  return (
    <View className="flex-row rounded-md border border-border bg-bg p-0.5">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onValueChange(item.value)}
            className={`h-9 flex-1 items-center justify-center rounded-sm ${
              active ? "bg-surface-raised" : ""
            }`}
          >
            <Text className={`text-sm ${active ? "font-medium text-fg" : "text-fg-subtle"}`}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
