import type { ReactNode } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { useState } from "react";

import { tokens } from "../tokens";
import { cn } from "./cn";
import { useRivo } from "./provider";

export type FieldProps = {
  label: string;
  children: ReactNode;
  /** A ajuda embaixo do campo. */
  description?: string;
  /** O erro vence a descricao, como no web. */
  error?: string;
  className?: string;
};

/** Rotulo, campo, ajuda e erro, na mesma ordem do Field do web. */
export function Field({ label, children, description, error, className }: FieldProps) {
  return (
    <View className={cn("gap-1.5", className)}>
      <Text className="text-sm font-medium text-fg">{label}</Text>
      {children}
      {error ? (
        <Text className="text-xs text-danger-text">{error}</Text>
      ) : description ? (
        <Text className="text-xs text-fg-subtle">{description}</Text>
      ) : null}
    </View>
  );
}

export type InputProps = TextInputProps & { invalid?: boolean };

/**
 * O campo de texto. RN nao tem focus-visible: a borda acende no foco via
 * estado, que e o que um anel de foco quer dizer numa tela de toque.
 */
export function Input({ invalid, onFocus, onBlur, className, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const { theme } = useRivo();

  return (
    <TextInput
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
      className={cn(
        "h-12 rounded-md border bg-surface px-3.5 text-base text-fg",
        invalid ? "border-danger" : focused ? "border-accent" : "border-border-strong",
        className,
      )}
    />
  );
}
