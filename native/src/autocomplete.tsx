import { Pressable, ScrollView, SectionList, View } from "react-native";

import { useAnnounce } from "./announce";
import { Button } from "./button";
import { cn } from "./cn";
import { Input, useFieldSheet, WithoutField } from "./field";
import { flattenItems, fold, isGrouped } from "./picker";
import { PickerGroupLabel } from "./select";
import { Sheet } from "./sheet";
import { Text } from "./text";

export type AutocompleteItemGroup = {
  /** O cabecalho da familia na folha, anunciado como cabecalho: "Paraiba". */
  label: string;
  items: string[];
};

export type AutocompleteProps = {
  /**
   * As sugestoes, em texto: lista rasa ou grupos `{ label, items }`. Sugestao
   * nao e restricao - o texto digitado vale mesmo fora dela.
   */
  items: string[] | AutocompleteItemGroup[];
  /** O texto do campo, digitado ou vindo de uma sugestao tocada. */
  value: string;
  /** Recebe o texto a cada tecla, e a sugestao inteira quando ela e tocada. */
  onValueChange: (value: string) => void;
  /** O nome do campo: rotulo do leitor de tela e titulo da folha. */
  label: string;
  placeholder?: string;
  /** O que dizer quando nenhuma sugestao casa com o texto. O texto continua valendo. */
  emptyMessage?: string;
  disabled?: boolean;
  /** Forca a borda de erro do campo fechado, ou a apaga com `false`, por cima do erro do `Field`. */
  invalid?: boolean;
  /** Veste o campo fechado; a folha de sugestoes e da plataforma. */
  className?: string;
  /**
   * Os textos da peca, para trocar o idioma: `hint` e a dica do campo fechado,
   * `count` o que o leitor de tela ouve com a quantidade de sugestoes e `done`
   * o botao que fecha a folha. Passe so os que mudam.
   */
  labels?: Partial<AutocompleteLabels>;
};

export type AutocompleteLabels = {
  hint: string;
  count: (count: number) => string;
  done: string;
};

const LABELS: AutocompleteLabels = {
  hint: "Abre o campo com sugestões.",
  count: (count) => {
    if (count === 0) return "Nenhuma sugestão.";
    return count === 1 ? "1 sugestão." : `${count} sugestões.`;
  },
  done: "Concluir",
};

function SuggestionGap() {
  return <View className="h-1" />;
}

export function Autocomplete({
  items,
  value,
  onValueChange,
  label,
  placeholder,
  emptyMessage = "Nenhuma sugestão. O texto digitado vale assim mesmo.",
  disabled,
  invalid,
  className,
  labels: labelsProp,
}: AutocompleteProps) {
  const labels = { ...LABELS, ...labelsProp };
  const sheet = useFieldSheet(value);
  const { open } = sheet;
  const flagged = invalid ?? Boolean(sheet.error);

  const query = fold(value.trim());
  const matches = (item: string) => !query || fold(item).includes(query);
  const groups = isGrouped<string>(items)
    ? items
        .map((group) => ({
          title: group.label,
          data: group.items.filter(matches),
        }))
        .filter((group) => group.data.length > 0)
    : null;
  const visible = groups
    ? groups.flatMap((group) => group.data)
    : flattenItems(items).filter(matches);

  const said = open ? labels.count(visible.length) : null;
  useAnnounce(said, { liveRegion: true });

  const choose = (item: string) => {
    onValueChange(item);
    sheet.close();
  };

  const suggestion = (item: string) => {
    const active = query !== "" && fold(item) === query;
    return (
      <Pressable
        key={item}
        accessibilityRole="button"
        accessibilityLabel={item}
        accessibilityState={{ selected: active }}
        onPress={() => choose(item)}
        className={cn(
          "min-h-11 justify-center rounded-md px-3 py-2.5",
          active ? "bg-accent-subtle" : "active:bg-selected",
        )}
      >
        <Text className={cn("text-base", active ? "text-accent-text" : "text-fg")}>{item}</Text>
      </Pressable>
    );
  };

  return (
    <>
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={label}
        accessibilityValue={{ text: value || placeholder }}
        accessibilityState={{ expanded: open, disabled: Boolean(disabled) }}
        accessibilityHint={sheet.error ?? labels.hint}
        disabled={disabled}
        onPress={sheet.show}
        className={cn(
          "h-12 flex-row items-center rounded-md border bg-surface px-3.5",
          flagged ? "border-danger" : "border-border-strong",
          disabled && "opacity-50",
          className,
        )}
      >
        <Text
          numberOfLines={1}
          className={cn("flex-1 text-base", value ? "text-fg" : "text-fg-subtle")}
        >
          {value || placeholder || " "}
        </Text>
      </Pressable>

      <Sheet open={open} onOpenChange={sheet.onOpenChange} title={label}>
        <WithoutField>
          <View className="shrink gap-3">
            <Input
              accessibilityLabel={label}
              accessibilityHint={sheet.error}
              invalid={flagged}
              value={value}
              onValueChange={onValueChange}
              placeholder={placeholder}
              autoFocus
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => sheet.close("submit")}
            />
            <Text
              accessibilityLiveRegion="polite"
              accessibilityLabel={said ?? undefined}
              className="h-0"
            >
              {""}
            </Text>
            {visible.length === 0 ? (
              <Text className="px-3 py-6 text-center text-sm text-fg-muted">{emptyMessage}</Text>
            ) : groups ? (
              <SectionList
                className="max-h-72 shrink"
                keyboardShouldPersistTaps="handled"
                sections={groups}
                keyExtractor={(item) => item}
                renderItem={({ item }) => suggestion(item)}
                renderSectionHeader={({ section }) => (
                  <PickerGroupLabel>{section.title}</PickerGroupLabel>
                )}
                ItemSeparatorComponent={SuggestionGap}
                stickySectionHeadersEnabled={false}
              />
            ) : (
              <ScrollView className="max-h-72 shrink" keyboardShouldPersistTaps="handled">
                <View className="gap-1">{visible.map(suggestion)}</View>
              </ScrollView>
            )}
            <Button variant="secondary" onPress={() => sheet.close("submit")}>
              {labels.done}
            </Button>
          </View>
        </WithoutField>
      </Sheet>
    </>
  );
}
