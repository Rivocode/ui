import { useState } from "react";
import { type TextInputProps } from "react-native";

import { cn } from "./cn";
import { useFieldControl } from "./field";
import { useRivo } from "./provider";
import { TextInput } from "./text";

export type TextareaProps = TextInputProps & {
  invalid?: boolean;
  /** Altura inicial em linhas; o campo cresce com o conteudo. */
  rows?: number;
  /** Recebe o texto a cada tecla, como o `onValueChange` do Textarea web. Convive com o `onChangeText`: os dois sao chamados. */
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
