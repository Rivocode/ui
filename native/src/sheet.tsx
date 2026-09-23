import type { ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import { cn } from "./cn";
import { useKeyboardPadding } from "./keyboard";
import { useReducedMotion } from "./motion";
import { Text } from "./text";

export type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Veste o painel da folha, nao o fundo escurecido. */
  className?: string;
};

export function Sheet({ open, onOpenChange, title, description, children, className }: SheetProps) {
  const reduced = useReducedMotion();
  const keyboard = useKeyboardPadding();
  return (
    <Modal
      visible={open}
      transparent
      animationType={reduced ? "none" : "slide"}
      onRequestClose={() => onOpenChange(false)}
    >
      <Animated.View accessibilityViewIsModal className="flex-1 justify-end pt-16" style={keyboard}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          className="absolute inset-0 bg-overlay"
          onPress={() => onOpenChange(false)}
        />
        <View
          className={cn(
            "shrink rounded-t-xl border-t border-border bg-surface px-5 pt-3 pb-8",
            className,
          )}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-pill bg-border-strong" />
          <Text accessibilityRole="header" font="display" className="text-xl font-semibold text-fg">
            {title}
          </Text>
          {description && <Text className="mt-1 text-sm text-fg-muted">{description}</Text>}
          {children && <View className="mt-4 shrink">{children}</View>}
        </View>
      </Animated.View>
    </Modal>
  );
}
