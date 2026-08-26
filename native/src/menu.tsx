import { Pressable, Text, View } from "react-native";

import { cn } from "./cn";
import { Sheet } from "./sheet";

export type MenuAction = {
  label: string;
  onSelect: () => void;
  /** `danger` pinta de vermelho a acao que remove ou cancela. */
  tone?: "default" | "danger";
  disabled?: boolean;
};

export type MenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** O sujeito das acoes: "Nota 4813". */
  title: string;
  actions: MenuAction[];
  /** Veste a lista de acoes dentro da folha. */
  className?: string;
};

export function Menu({ open, onOpenChange, title, actions, className }: MenuProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title}>
      <View className={cn("gap-1", className)}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            disabled={action.disabled}
            onPress={() => {
              onOpenChange(false);
              action.onSelect();
            }}
            className={`min-h-12 flex-row items-center rounded-md px-3 ${
              action.disabled ? "opacity-50" : "active:bg-selected"
            }`}
          >
            <Text
              className={`text-base ${action.tone === "danger" ? "text-danger-text" : "text-fg"}`}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}
