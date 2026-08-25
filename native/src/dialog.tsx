import type { ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { Button } from "./button";
import { cn } from "./cn";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Veste o cartao central, nao o fundo escurecido. */
  className?: string;
};

/**
 * O modal centrado. Fecha no toque fora e no back do Android; o que NAO pode
 * ser dispensado assim e AlertDialog.
 */
export function Dialog({ open, onOpenChange, title, description, children, className }: DialogProps) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => onOpenChange(false)}>
      <Pressable
        accessibilityLabel="Fechar"
        className="flex-1 items-center justify-center bg-overlay p-6"
        onPress={() => onOpenChange(false)}
      >
        <Pressable onPress={(event) => event.stopPropagation()} className="w-full">
          <View className={cn("rounded-xl border border-border bg-surface p-6", className)}>
            <Text className="text-xl font-semibold text-fg">{title}</Text>
            {description && <Text className="mt-1 text-sm text-fg-muted">{description}</Text>}
            {children && <View className="mt-4">{children}</View>}
          </View>
        </Pressable>
      </Pressable>
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

/**
 * A confirmacao destrutiva: exige resposta, nao fecha no toque fora. O
 * overlay aqui nao e Pressable de proposito.
 */
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
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => onOpenChange(false)}>
      <View className="flex-1 items-center justify-center bg-overlay p-6">
        <View className="w-full rounded-xl border border-border bg-surface p-6">
          <Text className="text-xl font-semibold text-fg">{title}</Text>
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
