import { useRef, useState, type ComponentRef } from "react";
import { Pressable, View, type TextInputProps } from "react-native";

import { cn } from "./cn";
import { useRivo } from "./provider";
import { Text, TextInput } from "./text";

export type TagsInputProps = Omit<TextInputProps, "value" | "onChangeText" | "className"> & {
  /** As fichas de agora. A peça é controlada: quem guarda a lista é o app. */
  value: string[];
  onValueChange: (value: string[]) => void;
  /** O que fecha uma ficha além do Enter. Vírgula por padrão. */
  separators?: string[];
  /** Teto de fichas. Alcançado, o campo para de aceitar. */
  max?: number;
  /** O que o leitor de tela ouve no botão de cada ficha. */
  removeLabel?: (tag: string) => string;
  invalid?: boolean;
  /** Veste a caixa toda. O campo de digitar é `inputClassName`. */
  className?: string;
  inputClassName?: string;
};

function splitTags(text: string, separators: string[]) {
  const parts: string[] = [];
  let current = "";
  for (const char of text) {
    if (separators.includes(char)) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

export function TagsInput({
  value,
  onValueChange,
  separators = [","],
  max,
  removeLabel = (tag) => `Remover ${tag}`,
  invalid,
  editable = true,
  onBlur,
  onFocus,
  className,
  inputClassName,
  ...props
}: TagsInputProps) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const { colors } = useRivo();

  const full = max !== undefined && value.length >= max;

  function commit(incoming: string[]) {
    const next = [...value];
    for (const raw of incoming) {
      const tag = raw.trim();
      if (!tag || next.includes(tag)) continue;
      if (max !== undefined && next.length >= max) break;
      next.push(tag);
    }
    if (next.length !== value.length) onValueChange(next);
    setDraft("");
  }

  function handleChangeText(text: string) {
    const parts = splitTags(text, separators);
    if (parts.length === 1) {
      setDraft(text);
      return;
    }
    const rest = parts.pop() ?? "";
    commit(parts);
    setDraft(rest);
  }

  return (
    <Pressable
      accessibilityRole="none"
      onPress={() => input.current?.focus()}
      className={cn(
        "min-h-12 flex-row flex-wrap items-center gap-1.5 rounded-md border bg-surface p-2",
        invalid ? "border-danger" : focused ? "border-accent" : "border-border-strong",
        !editable && "opacity-60",
        className,
      )}
    >
      {value.map((tag) => (
        <View
          key={tag}
          className="flex-row items-center gap-1.5 rounded-sm bg-accent-subtle py-1 pr-1.5 pl-2"
        >
          <Text className="text-sm text-fg">{tag}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={removeLabel(tag)}
            accessibilityState={{ disabled: !editable }}
            disabled={!editable}
            onPress={() => onValueChange(value.filter((current) => current !== tag))}
            hitSlop={8}
            className="size-4 items-center justify-center"
          >
            <View className="absolute h-[1.5px] w-2.5 rotate-45 rounded-pill bg-fg-subtle" />
            <View className="absolute h-[1.5px] w-2.5 -rotate-45 rounded-pill bg-fg-subtle" />
          </Pressable>
        </View>
      ))}

      <TextInput
        {...props}
        ref={input}
        value={draft}
        editable={editable && !full}
        onChangeText={handleChangeText}
        onSubmitEditing={() => commit([draft])}
        submitBehavior="submit"
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          commit([draft]);
          onBlur?.(event);
        }}
        placeholderTextColor={colors["fg-subtle"]}
        className={cn("h-8 min-w-24 flex-1 text-base text-fg", inputClassName)}
      />
    </Pressable>
  );
}
