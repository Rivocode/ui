import { useState } from "react";
import { Pressable, type AccessibilityActionEvent } from "react-native";

import { Button } from "./button";
import { cn, type Slots } from "./cn";
import { Input } from "./field";
import { Presence } from "./motion";
import { Text } from "./text";

export type EditableProps = {
  /** The current text. Controlled, like everything else in the native package. */
  value: string;
  /** Notified on confirmation, and never on Cancelar. */
  onValueChange: (value: string) => void;
  /** What the screen reader calls the field, open or closed. */
  label: string;
  /** What appears in place of the empty value. */
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /**
   * Class per part: `preview` (the value as read, the area you hold to edit)
   * and `input` (the open field).
   */
  classNames?: Slots<"preview" | "input">;
  /**
   * The component's texts, to change the language: `edit` is the name of the
   * action that opens the field, `hint` the hint on how to open it, `empty`
   * what the screen reader hears in place of the empty value and `cancel` the
   * button that closes without saving. Pass only the ones that change.
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
          accessibilityHint={disabled ? undefined : labels.hint}
          accessibilityActions={disabled ? [] : [{ name: "longpress", label: labels.edit }]}
          onAccessibilityAction={(event: AccessibilityActionEvent) => {
            if (disabled) return;
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
