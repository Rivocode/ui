import { useState } from "react";
import { type TextInputProps } from "react-native";

import { cn } from "./cn";
import { useFieldControl } from "./field";
import { useRivo } from "./provider";
import { TextInput } from "./text";

export type TextareaProps = TextInputProps & {
  invalid?: boolean;
  /** Initial height in rows; the field grows with the content. */
  rows?: number;
  /**
   * Receives the text on every keystroke, like the web Textarea
   * `onValueChange`. Coexists with `onChangeText`: both are called.
   */
  onValueChange?: (value: string) => void;
};

export function Textarea({
  invalid,
  rows = 4,
  onFocus,
  onBlur,
  onChangeText,
  onValueChange,
  accessibilityHint,
  accessibilityLabel,
  style,
  className,
  ...props
}: TextareaProps) {
  const [focused, setFocused] = useState(false);
  const { colors } = useRivo();
  const field = useFieldControl(props.value);
  const flagged = invalid ?? Boolean(field.error);

  return (
    <TextInput
      multiline
      textAlignVertical="top"
      {...props}
      accessibilityLabel={accessibilityLabel ?? field.label}
      accessibilityHint={accessibilityHint ?? field.error}
      onChangeText={(text) => {
        field.change(text);
        onChangeText?.(text);
        onValueChange?.(text);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        field.blur();
        onBlur?.(event);
      }}
      placeholderTextColor={colors["fg-subtle"]}
      style={[{ minHeight: rows * 24 }, style]}
      className={cn(
        "rounded-md border bg-surface px-3.5 py-3 text-base text-fg",
        flagged ? "border-danger" : focused ? "border-accent" : "border-border-strong",
        className,
      )}
    />
  );
}
