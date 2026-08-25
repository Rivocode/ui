import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { cn } from "./cn";
import { SearchInput } from "./search-input";
import { Sheet } from "./sheet";

export type ComboboxItem = { label: string; value: string; description?: string };

export type ComboboxProps = {
  items: ComboboxItem[];
  value: string | null;
  onValueChange: (value: string) => void;
  label: string;
  placeholder?: string;
  searchPlaceholder?: string;
  /** O que dizer quando a busca nao acha nada - com o porque, como sempre. */
  emptyMessage?: string;
  disabled?: boolean;
  /** Veste o gatilho; a folha de busca e da plataforma. */
  className?: string;
};

/* Busca sem acento: "clinica" acha "Clínica", como no DataTable do web. */
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * A lista longa, ou vinda do servidor: abre numa folha com busca em cima.
 * Poucas opcoes fixas continuam sendo Select - a mesma divisao do web.
 */
export function Combobox({
  items,
  value,
  onValueChange,
  label,
  placeholder,
  searchPlaceholder = "Buscar",
  emptyMessage = "Nada com esse nome. Confira a grafia ou tente outro termo.",
  disabled,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = items.find((item) => item.value === value);
  const visible = query ? items.filter((item) => fold(item.label).includes(fold(query))) : items;

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? placeholder }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={cn(
          "h-12 flex-row items-center justify-between rounded-md border border-border-strong bg-surface px-3.5",
          disabled && "opacity-50",
          className,
        )}
      >
        <Text className={`text-base ${selected ? "text-fg" : "text-fg-subtle"}`}>
          {selected?.label ?? placeholder ?? "Selecione"}
        </Text>
        <Text className="text-fg-subtle">▾</Text>
      </Pressable>

      <Sheet open={open} onOpenChange={close} title={label}>
        <View className="gap-3">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            placeholder={searchPlaceholder}
            autoFocus
          />
          <ScrollView className="max-h-72" keyboardShouldPersistTaps="handled">
            {visible.length === 0 ? (
              <Text className="px-3 py-6 text-center text-sm text-fg-muted">{emptyMessage}</Text>
            ) : (
              <View className="gap-1">
                {visible.map((item) => {
                  const active = item.value === value;
                  return (
                    <Pressable
                      key={item.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => {
                        onValueChange(item.value);
                        close(false);
                      }}
                      className={`rounded-md px-3 py-3 ${active ? "bg-accent-subtle" : "active:bg-selected"}`}
                    >
                      <Text className={`text-base ${active ? "text-accent-text" : "text-fg"}`}>
                        {item.label}
                      </Text>
                      {item.description && (
                        <Text className="text-xs text-fg-subtle">{item.description}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </Sheet>
    </>
  );
}
