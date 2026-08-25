import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

export type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** O rotulo. Como no web, clicar no texto tambem marca. */
  children?: ReactNode;
  disabled?: boolean;
};

/**
 * Caixa de marcar controlada. O visto e desenhado com borda, nao com fonte:
 * glyph de texto muda de corpo entre iOS e Android, e o traco nao.
 */
export function Checkbox({ checked, onCheckedChange, children, disabled }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      className={`flex-row items-center gap-2.5 ${disabled ? "opacity-50" : ""}`}
    >
      <View
        className={`size-5 items-center justify-center rounded-sm border ${
          checked ? "border-accent bg-accent" : "border-border-strong bg-surface"
        }`}
      >
        {checked && (
          // Margem, e nao translate: a shorthand `translate` com as vars
          // --tw-translate-* e mais um caso que derruba o compilador nativo.
          <View className="mb-0.5 h-2 w-3 -rotate-45 border-b-2 border-l-2 border-accent-fg" />
        )}
      </View>
      {children && <Text className="text-base text-fg">{children}</Text>}
    </Pressable>
  );
}
