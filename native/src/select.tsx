import { Pressable, SectionList, View } from "react-native";

import { Button } from "./button";
import { cn } from "./cn";
import { useFieldSheet } from "./field";
import { flattenItems, isGrouped, summarize, toggleValue, type PickerGroup } from "./picker";
import { Sheet } from "./sheet";
import { Text } from "./text";

export type SelectItem = { label: string; value: string };

export type SelectItemGroup = {
  /** O cabecalho da familia na folha, anunciado como cabecalho: "Paraiba". */
  label: string;
  items: SelectItem[];
};

type SelectBaseProps = {
  /**
   * Lista rasa de `{ label, value }`, ou grupos `{ label, items }` - a mesma
   * forma que o `items` do web aceita. Com grupos, a folha vira secoes com
   * cabecalho.
   */
  items: SelectItem[] | SelectItemGroup[];
  /** O que o gatilho mostra sem escolha: "Selecione o período". */
  placeholder?: string;
  label: string;
  disabled?: boolean;
  /** Forca a borda de erro do gatilho, ou a apaga com `false`, por cima do erro do `Field`. */
  invalid?: boolean;
  /** Veste o gatilho; a folha de opcoes e da plataforma. */
  className?: string;
};

export type SelectProps = SelectBaseProps &
  (
    | { multiple?: false; value: string | null; onValueChange: (value: string) => void }
    | { multiple: true; value: string[]; onValueChange: (value: string[]) => void }
  );

export function PickerGroupLabel({ children }: { children: string }) {
  return (
    <Text
      accessibilityRole="header"
      className="px-3 pt-3 pb-1 text-xs font-rc-medium text-fg-subtle uppercase"
    >
      {children}
    </Text>
  );
}

function OptionGap() {
  return <View className="h-1" />;
}

export function pickerSections<Item>(groups: PickerGroup<Item>[]) {
  return groups.map((group) => ({ title: group.label, data: group.items }));
}

export function Select(props: SelectProps) {
  const { items, placeholder, label, disabled, invalid, className } = props;
  const sheet = useFieldSheet(props.value);
  const flagged = invalid ?? Boolean(sheet.error);

  const flat = flattenItems<SelectItem>(items);
  const chosen = props.multiple ? props.value : props.value === null ? [] : [props.value];
  const summary = summarize(chosen, flat);

  const choose = (value: string) => {
    if (props.multiple) {
      props.onValueChange(toggleValue(props.value, value));
      return;
    }
    props.onValueChange(value);
    sheet.close();
  };

  const option = (item: SelectItem) => {
    const active = chosen.includes(item.value);
    return (
      <Pressable
        key={item.value}
        accessibilityRole={props.multiple ? "checkbox" : "button"}
        accessibilityState={props.multiple ? { checked: active } : { selected: active }}
        onPress={() => choose(item.value)}
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

      <Sheet open={sheet.open} onOpenChange={sheet.onOpenChange} title={label}>
        <View className="shrink gap-1">
          {isGrouped<SelectItem>(items) ? (
            <SectionList
              className="shrink"
              sections={pickerSections(items)}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => option(item)}
              renderSectionHeader={({ section }) => (
                <PickerGroupLabel>{section.title}</PickerGroupLabel>
              )}
              ItemSeparatorComponent={OptionGap}
              stickySectionHeadersEnabled={false}
            />
          ) : (
            items.map(option)
          )}

          {props.multiple && (
            <Button variant="secondary" className="mt-3" onPress={() => sheet.close("submit")}>
              Concluir
            </Button>
          )}
        </View>
      </Sheet>
    </>
  );
}
