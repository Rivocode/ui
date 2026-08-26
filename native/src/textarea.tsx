import { useState } from "react";
import { type TextInputProps } from "react-native";

import { cn } from "./cn";
import { useRivo } from "./provider";
import { TextInput } from "./text";

export type TextareaProps = TextInputProps & {
  invalid?: boolean;
  /** Altura inicial em linhas; o campo cresce com o conteudo. */
  rows?: number;
};

export function Textarea({
  invalid,
  rows = 4,
  onFocus,
  onBlur,
  style,
  className,
  ...props
}: TextareaProps) {
  const [focused, setFocused] = useState(false);
  const { colors } = useRivo();

  return (
    <TextInput
      multiline
      textAlignVertical="top"
      {...props}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      placeholderTextColor={colors["fg-subtle"]}
      style={[{ minHeight: rows * 24 }, style]}
      className={cn(
        "rounded-md border bg-surface px-3.5 py-3 text-base text-fg",
        invalid ? "border-danger" : focused ? "border-accent" : "border-border-strong",
        className,
      )}
    />
  );
}
