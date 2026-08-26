import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Button } from "./button";
import { cn } from "./cn";
import { summarize, toggleValue } from "./picker";
import { Sheet } from "./sheet";

export type SelectItem = { label: string; value: string };

type SelectBaseProps = {
  items: SelectItem[];
  /** O que o gatilho mostra sem escolha: "Selecione o período". */
  placeholder?: string;
  label: string;
  disabled?: boolean;
  /** Veste o gatilho; a folha de opcoes e da plataforma. */
  className?: string;
};

export type SelectProps = SelectBaseProps &
  (
    | { multiple?: false; value: string | null; onValueChange: (value: string) => void }
    | { multiple: true; value: string[]; onValueChange: (value: string[]) => void }
  );

export function Select(props: SelectProps) {
  const { items, placeholder, label, disabled, className } = props;
  const [open, setOpen] = useState(false);

  const chosen = props.multiple ? props.value : props.value === null ? [] : [props.value];
  const summary = summarize(chosen, items);

  const choose = (value: string) => {
    if (props.multiple) {
      props.onValueChange(toggleValue(props.value, value));
      return;
    }
    props.onValueChange(value);
    setOpen(false);
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

      <Sheet open={open} onOpenChange={setOpen} title={label}>
        <View className="gap-1">
          {items.map((item) => {
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
          })}

          {props.multiple && (
            <Button variant="secondary" className="mt-3" onPress={() => setOpen(false)}>
              Concluir
            </Button>
          )}
        </View>
      </Sheet>
    </>
  );
}
