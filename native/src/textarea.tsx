import { useState } from "react";
import { type TextInputProps } from "react-native";

import { cn } from "./cn";
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
      onChangeText={(text) => {
        onChangeText?.(text);
        onValueChange?.(text);
      }}
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
