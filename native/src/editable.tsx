import { useState } from "react";
import { Pressable, View, type AccessibilityActionEvent } from "react-native";

import { Button } from "./button";
import { cn } from "./cn";
import { Input } from "./field";
import { Text } from "./text";

export type EditableProps = {
  /** O texto de agora. Controlado, como todo o resto do pacote nativo. */
  value: string;
  /** Avisado na confirmacao, e nunca no Cancelar. */
  onValueChange: (value: string) => void;
  /** O que o leitor de tela chama o campo, aberto ou fechado. */
  label: string;
  /** O que aparece no lugar do valor vazio. */
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const EDIT_ACTIONS = [{ name: "longpress", label: "Editar" }];

export function Editable({
  value,
  onValueChange,
  label,
  placeholder = "—",
  disabled,
  className,
}: EditableProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function open() {
    setDraft(value);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    if (draft !== value) onValueChange(draft);
  }

  if (!editing) {
    return (
      <View className={cn("flex-row", className)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value || "vazio"}`}
          accessibilityHint="Toque e segure para editar"
          accessibilityActions={EDIT_ACTIONS}
          onAccessibilityAction={(event: AccessibilityActionEvent) => {
            if (event.nativeEvent.actionName === "longpress") open();
          }}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onLongPress={open}
          className={cn(
            "min-h-11 min-w-0 flex-1 justify-center rounded-sm px-2 active:bg-accent-subtle",
            disabled && "opacity-50",
          )}
        >
          <Text
            numberOfLines={1}
            className={`text-base ${value ? "text-fg" : "text-fg-subtle"}`}
          >
            {value || placeholder}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className={cn("flex-row items-center gap-2", className)}>
      <Input
        accessibilityLabel={label}
        autoFocus
        selectTextOnFocus
        returnKeyType="done"
        onSubmitEditing={commit}
        value={draft}
        onChangeText={setDraft}
        className="min-w-0 flex-1"
      />
      <Button variant="ghost" onPress={() => setEditing(false)}>
        Cancelar
      </Button>
    </View>
  );
}
