import { useState } from "react";
import { Pressable, ScrollView, SectionList, View } from "react-native";

import { Button } from "./button";
import { cn } from "./cn";
import { useFieldSheet } from "./field";
import {
  PICKER_LABELS,
  flattenItems,
  fold,
  isGrouped,
  summarize,
  toggleValue,
  type PickerLabels,
} from "./picker";
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
  /** Forca a borda de erro do gatilho, ou a apaga com `false`, por cima do erro do `Field`. */
  invalid?: boolean;
  /** Veste o gatilho; a folha de busca e da plataforma. */
  className?: string /**
   * Os textos da peca, para trocar o idioma: `selected` e o resumo do gatilho
   * com mais de uma escolha, e `done` o botao que fecha a folha no `multiple`.
   * Passe so os que mudam.
   */;
  labels?: Partial<ComboboxLabels>;
};

export type ComboboxLabels = PickerLabels;

export type ComboboxProps = ComboboxBaseProps &
  (
    | { multiple?: false; value: string | null; onValueChange: (value: string) => void }
    | { multiple: true; value: string[]; onValueChange: (value: string[]) => void }
  );

function OptionGap() {
  return <View className="h-1" />;
}

export function Combobox(props: ComboboxProps) {
  const {
    items,
    label,
    placeholder,
    searchPlaceholder = "Buscar",
    emptyMessage = "Nada com esse nome. Confira a grafia ou tente outro termo.",
    disabled,
    invalid,
    className,
  } = props;
  const labels = { ...PICKER_LABELS, ...props.labels };

  const sheet = useFieldSheet(props.value);
  const flagged = invalid ?? Boolean(sheet.error);
  const [query, setQuery] = useState("");

  const chosen = props.multiple ? props.value : props.value === null ? [] : [props.value];
  const flat = flattenItems<ComboboxItem>(items);
  const summary = summarize(chosen, flat, labels.selected);
  const matches = (item: ComboboxItem) => !query || fold(item.label).includes(fold(query));
  const groups = isGrouped<ComboboxItem>(items)
    ? items
        .map((group) => ({ ...group, items: group.items.filter(matches) }))
        .filter((group) => group.items.length > 0)
    : null;
  const visible = groups ? groups.flatMap((group) => group.items) : flat.filter(matches);

  const close = (next: boolean, exit?: "blur" | "submit") => {
    if (next) {
      sheet.show();
      return;
    }
    sheet.close(exit);
    setQuery("");
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
        accessibilityHint={sheet.error}
        disabled={disabled}
        onPress={sheet.show}
        className={cn(
          "h-12 flex-row items-center justify-between rounded-md border bg-surface px-3.5",
          flagged ? "border-danger" : "border-border-strong",
          disabled && "opacity-50",
          className,
        )}
      >
        <Text className={`text-base ${summary ? "text-fg" : "text-fg-subtle"}`}>
          {summary ?? placeholder ?? "Selecione"}
        </Text>
        <Text className="text-fg-subtle">▾</Text>
      </Pressable>

      <Sheet open={sheet.open} onOpenChange={(next) => close(next)} title={label}>
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
            <Button variant="secondary" onPress={() => close(false, "submit")}>
              {labels.done}
            </Button>
          )}
        </View>
      </Sheet>
    </>
  );
}
