import { useState } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";

import { tokens } from "../tokens";
import { useRivo } from "./provider";

export type SearchInputProps = Omit<TextInputProps, "value" | "onChangeText"> & {
  value: string;
  onValueChange: (value: string) => void;
};

/**
 * O campo de busca: lupa na frente, limpar atras quando ha o que limpar.
 * Os dois icones sao desenhados com borda, nunca glyph de fonte - fonte
 * muda de corpo entre iOS e Android, o traco nao.
 */
export function SearchInput({ value, onValueChange, onFocus, onBlur, ...props }: SearchInputProps) {
  const [focused, setFocused] = useState(false);
  const { theme } = useRivo();

  return (
    <View
      className={`h-12 flex-row items-center gap-2.5 rounded-md border bg-surface px-3.5 ${
        focused ? "border-accent" : "border-border-strong"
      }`}
    >
      {/* A lupa: um circulo e um cabo a 45 graus. */}
      <View className="size-4 items-center justify-center" accessibilityElementsHidden>
        <View className="size-3 rounded-pill border-[1.5px] border-fg-subtle" />
        <View className="absolute right-0 bottom-0 h-[7px] w-[1.5px] rotate-45 rounded-pill bg-fg-subtle" />
      </View>

      <TextInput
        accessibilityRole="search"
        {...props}
        value={value}
        onChangeText={onValueChange}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        placeholderTextColor={tokens.themes[theme]["fg-subtle"]}
        className="h-full flex-1 text-base text-fg"
      />

      {value.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpar a busca"
          onPress={() => onValueChange("")}
          hitSlop={8}
          className="size-4 items-center justify-center"
        >
          {/* O xis: duas linhas cruzadas. */}
          <View className="absolute h-[1.5px] w-3.5 rotate-45 rounded-pill bg-fg-subtle" />
          <View className="absolute h-[1.5px] w-3.5 -rotate-45 rounded-pill bg-fg-subtle" />
        </Pressable>
      )}
    </View>
  );
}
