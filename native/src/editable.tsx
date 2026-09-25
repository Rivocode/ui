import { useState } from "react";
import { Pressable, type AccessibilityActionEvent } from "react-native";

import { Button } from "./button";
import { cn, type Slots } from "./cn";
import { Input } from "./field";
import { Presence } from "./motion";
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
  /**
   * Classe por parte: `preview` (o valor lido, a area que se segura para
   * editar) e `input` (o campo aberto).
   */
  classNames?: Slots<"preview" | "input">;
  /**
   * Os textos da peca, para trocar o idioma: `edit` e o nome da acao que abre
   * o campo, `hint` a dica de como abrir, `empty` o que o leitor de tela ouve
   * no lugar do valor vazio e `cancel` o botao que fecha sem salvar. Passe so
   * os que mudam.
   */
  labels?: Partial<EditableLabels>;
};

export type EditableLabels = {
  edit: string;
  hint: string;
  empty: string;
  cancel: string;
};

const LABELS: EditableLabels = {
  edit: "Editar",
  hint: "Toque e segure para editar",
  empty: "vazio",
  cancel: "Cancelar",
};

export function Editable({
  value,
  onValueChange,
  label,
  placeholder = "—",
  disabled,
  className,
  classNames,
  labels: labelsProp,
}: EditableProps) {
  const labels = { ...LABELS, ...labelsProp };
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
      <Presence swapKey="reading" exit="none" className={cn("flex-row", className)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value || labels.empty}`}
          accessibilityHint={labels.hint}
          accessibilityActions={[{ name: "longpress", label: labels.edit }]}
          onAccessibilityAction={(event: AccessibilityActionEvent) => {
            if (event.nativeEvent.actionName === "longpress") open();
          }}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onLongPress={open}
          className={cn(
            "min-h-11 min-w-0 flex-1 justify-center rounded-sm px-2 active:bg-accent-subtle",
            disabled && "opacity-50",
            classNames?.preview,
          )}
        >
          <Text numberOfLines={1} className={`text-base ${value ? "text-fg" : "text-fg-subtle"}`}>
            {value || placeholder}
          </Text>
        </Pressable>
      </Presence>
    );
  }

  return (
    <Presence
      swapKey="editing"
      exit="none"
      className={cn("flex-row items-center gap-2", className)}
    >
      <Input
        accessibilityLabel={label}
        autoFocus
        selectTextOnFocus
        returnKeyType="done"
        onSubmitEditing={commit}
        value={draft}
        onChangeText={setDraft}
        className={cn("min-w-0 flex-1", classNames?.input)}
      />
      <Button variant="ghost" onPress={() => setEditing(false)}>
        {labels.cancel}
      </Button>
    </Presence>
  );
}
