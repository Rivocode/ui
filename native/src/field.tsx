import type { ReactNode } from "react";
import { View } from "react-native";
import { useState } from "react";

import { cn } from "./cn";
import { Presence } from "./motion";
import { useRivo } from "./provider";
import { Text, TextInput, type TextInputProps } from "./text";

export type FieldProps = {
  label: string;
  children: ReactNode;
  /** A ajuda embaixo do campo. */
  description?: string;
  /** O erro vence a descricao, como no web. */
  error?: string;
  className?: string;
};

export function Field({ label, children, description, error, className }: FieldProps) {
  return (
    <View className={cn("gap-1.5", className)}>
      <Text className="text-sm font-rc-medium text-fg">{label}</Text>
      {children}
      <Presence
        show={Boolean(error || description)}
        swapKey={error ? `erro:${error}` : description}
      >
        {error ? (
          <Text className="text-xs text-danger-text">{error}</Text>
        ) : (
          <Text className="text-xs text-fg-subtle">{description}</Text>
        )}
      </Presence>
    </View>
  );
}

export type InputProps = TextInputProps & {
  invalid?: boolean;
  /** Recebe o texto a cada tecla, como o `onValueChange` do Input web. Convive com o `onChangeText`: os dois sao chamados. */
  onValueChange?: (value: string) => void;
};

export function Input({
  invalid,
  onFocus,
  onBlur,
  onChangeText,
  onValueChange,
  className,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const { colors } = useRivo();

  return (
    <TextInput
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
      className={cn(
        "h-12 rounded-md border bg-surface px-3.5 text-base text-fg",
        invalid ? "border-danger" : focused ? "border-accent" : "border-border-strong",
        className,
      )}
    />
  );
}
