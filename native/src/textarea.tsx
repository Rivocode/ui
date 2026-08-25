import { useState } from "react";
import { TextInput, type TextInputProps } from "react-native";

import { tokens } from "../tokens";
import { useRivo } from "./provider";

export type TextareaProps = TextInputProps & {
  invalid?: boolean;
  /** Altura inicial em linhas; o campo cresce com o conteudo. */
  rows?: number;
};

/**
 * O campo de texto longo: o mesmo Input, mais alto e multilinha. A borda
 * acende no foco pela mesma razao - e o anel de foco de uma tela de toque.
 */
export function Textarea({ invalid, rows = 4, onFocus, onBlur, style, ...props }: TextareaProps) {
  const [focused, setFocused] = useState(false);
  const { theme } = useRivo();

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
      placeholderTextColor={tokens.themes[theme]["fg-subtle"]}
      style={[{ minHeight: rows * 24 }, style]}
      className={[
        "rounded-md border bg-surface px-3.5 py-3 text-base text-fg",
        invalid ? "border-danger" : focused ? "border-accent" : "border-border-strong",
      ].join(" ")}
    />
  );
}
