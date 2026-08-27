import type { ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";

import { Button } from "./button";
import { cn } from "./cn";
import { Text } from "./text";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Veste o cartao central, nao o fundo escurecido. */
  className?: string;
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: DialogProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      <View accessibilityViewIsModal className="flex-1 items-center justify-center p-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          className="absolute inset-0 bg-overlay"
          onPress={() => onOpenChange(false)}
        />
        <View className={cn("w-full rounded-xl border border-border bg-surface p-6", className)}>
          <Text accessibilityRole="header" font="display" className="text-xl font-semibold text-fg">
            {title}
          </Text>
          {description && <Text className="mt-1 text-sm text-fg-muted">{description}</Text>}
          {children && <View className="mt-4">{children}</View>}
        </View>
      </View>
    </Modal>
  );
}

export type AlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** O rotulo do botao que confirma a acao destrutiva. */
  actionLabel: string;
  onAction: () => void;
  cancelLabel?: string;
};

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  onAction,
  cancelLabel = "Cancelar",
}: AlertDialogProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      <View accessibilityViewIsModal className="flex-1 items-center justify-center bg-overlay p-6">
        <View className="w-full rounded-xl border border-border bg-surface p-6">
          <Text accessibilityRole="header" font="display" className="text-xl font-semibold text-fg">
            {title}
          </Text>
          <Text className="mt-1 text-sm text-fg-muted">{description}</Text>
          <View className="mt-5 flex-row justify-end gap-2">
            <Button variant="ghost" onPress={() => onOpenChange(false)}>
              {cancelLabel}
            </Button>
            <Button
              variant="destructive"
              onPress={() => {
                onOpenChange(false);
                onAction();
              }}
            >
              {actionLabel}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
