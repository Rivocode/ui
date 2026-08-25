import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Sheet } from "./sheet";

export type SelectItem = { label: string; value: string };

export type SelectProps = {
  items: SelectItem[];
  value: string | null;
  onValueChange: (value: string) => void;
  /** O que o gatilho mostra sem escolha: "Selecione o período". */
  placeholder?: string;
  label: string;
  disabled?: boolean;
};

/**
 * Poucas opcoes fixas, como no web - so que aqui a lista abre numa folha de
 * baixo, que e o idioma da plataforma para escolher. Lista longa ou vinda do
 * servidor continua sendo outro problema (busca), ainda sem peca nativa.
 */
export function Select({ items, value, onValueChange, placeholder, label, disabled }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = items.find((item) => item.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? placeholder }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={`h-12 flex-row items-center justify-between rounded-md border border-border-strong bg-surface px-3.5 ${
          disabled ? "opacity-50" : ""
        }`}
      >
        <Text className={`text-base ${selected ? "text-fg" : "text-fg-subtle"}`}>
          {selected?.label ?? placeholder ?? "Selecione"}
        </Text>
        <Text className="text-fg-subtle">▾</Text>
      </Pressable>

      <Sheet open={open} onOpenChange={setOpen} title={label}>
        <View className="gap-1">
          {items.map((item) => {
            const active = item.value === value;
            return (
              <Pressable
                key={item.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  onValueChange(item.value);
                  setOpen(false);
                }}
                className={`flex-row items-center justify-between rounded-md px-3 py-3 ${
                  active ? "bg-accent-subtle" : "active:bg-selected"
                }`}
              >
                <Text className={`text-base ${active ? "text-accent-text" : "text-fg"}`}>
                  {item.label}
                </Text>
                {active && <Text className="text-accent-text">✓</Text>}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}
