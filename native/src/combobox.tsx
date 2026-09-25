import { useState } from "react";
import { Pressable, ScrollView, SectionList, View } from "react-native";

import { Button } from "./button";
import { cn } from "./cn";
import { flattenItems, isGrouped, summarize, toggleValue } from "./picker";
import { SearchInput } from "./search-input";
import { PickerGroupLabel, pickerSections } from "./select";
import { Sheet } from "./sheet";
import { Text } from "./text";

export type ComboboxItem = { label: string; value: string; description?: string };

export type ComboboxItemGroup = {
  /** O cabecalho da familia na folha, anunciado como cabecalho: "Pernambuco". */
  label: string;
  items: ComboboxItem[];
};

type ComboboxBaseProps = {
  /**
   * Lista rasa, ou grupos `{ label, items }` - a mesma forma que o `items` do
   * web aceita. Com grupos, a busca filtra dentro de cada familia e some com a
   * familia que ficou vazia.
   */
  items: ComboboxItem[] | ComboboxItemGroup[];
  label: string;
  placeholder?: string;
  searchPlaceholder?: string;
  /** O que dizer quando a busca nao acha nada - com o porque, como sempre. */
  emptyMessage?: string;
  disabled?: boolean;
  /** Veste o gatilho; a folha de busca e da plataforma. */
  className?: string;
};

export type ComboboxProps = ComboboxBaseProps &
  (
    | { multiple?: false; value: string | null; onValueChange: (value: string) => void }
    | { multiple: true; value: string[]; onValueChange: (value: string[]) => void }
  );

function OptionGap() {
  return <View className="h-1" />;
}

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function Combobox(props: ComboboxProps) {
  const {
    items,
    label,
    placeholder,
    searchPlaceholder = "Buscar",
    emptyMessage = "Nada com esse nome. Confira a grafia ou tente outro termo.",
    disabled,
    className,
  } = props;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const chosen = props.multiple ? props.value : props.value === null ? [] : [props.value];
  const flat = flattenItems<ComboboxItem>(items);
  const summary = summarize(chosen, flat);
  const matches = (item: ComboboxItem) => !query || fold(item.label).includes(fold(query));
  const groups = isGrouped<ComboboxItem>(items)
    ? items
        .map((group) => ({ ...group, items: group.items.filter(matches) }))
        .filter((group) => group.items.length > 0)
    : null;
  const visible = groups ? groups.flatMap((group) => group.items) : flat.filter(matches);

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  const choose = (value: string) => {
    if (props.multiple) {
      props.onValueChange(toggleValue(props.value, value));
      return;
    }
    props.onValueChange(value);
    close(false);
  };

  const option = (item: ComboboxItem) => {
    const active = chosen.includes(item.value);
    return (
      <Pressable
        key={item.value}
        accessibilityRole={props.multiple ? "checkbox" : "button"}
        accessibilityState={props.multiple ? { checked: active } : { selected: active }}
        onPress={() => choose(item.value)}
        className={`rounded-md px-3 py-3 ${active ? "bg-accent-subtle" : "active:bg-selected"}`}
      >
        <Text className={`text-base ${active ? "text-accent-text" : "text-fg"}`}>{item.label}</Text>
        {item.description && <Text className="text-xs text-fg-subtle">{item.description}</Text>}
      </Pressable>
    );
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: summary ?? placeholder }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={cn(
          "h-12 flex-row items-center justify-between rounded-md border border-border-strong bg-surface px-3.5",
          disabled && "opacity-50",
          className,
        )}
      >
        <Text className={`text-base ${summary ? "text-fg" : "text-fg-subtle"}`}>
          {summary ?? placeholder ?? "Selecione"}
        </Text>
        <Text className="text-fg-subtle">▾</Text>
      </Pressable>

      <Sheet open={open} onOpenChange={close} title={label}>
        <View className="shrink gap-3">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            placeholder={searchPlaceholder}
            autoFocus
          />
          {visible.length === 0 ? (
            <Text className="px-3 py-6 text-center text-sm text-fg-muted">{emptyMessage}</Text>
          ) : groups ? (
            <SectionList
              className="max-h-72 shrink"
              keyboardShouldPersistTaps="handled"
              sections={pickerSections(groups)}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => option(item)}
              renderSectionHeader={({ section }) => (
                <PickerGroupLabel>{section.title}</PickerGroupLabel>
              )}
              ItemSeparatorComponent={OptionGap}
              stickySectionHeadersEnabled={false}
            />
          ) : (
            <ScrollView className="max-h-72 shrink" keyboardShouldPersistTaps="handled">
              <View className="gap-1">{visible.map(option)}</View>
            </ScrollView>
          )}

          {props.multiple && (
            <Button variant="secondary" onPress={() => close(false)}>
              Concluir
            </Button>
          )}
        </View>
      </Sheet>
    </>
  );
}
