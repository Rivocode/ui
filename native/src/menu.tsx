import type { ReactNode } from "react";
import { Pressable, View, type AccessibilityActionEvent } from "react-native";

import { cn } from "./cn";
import { Sheet } from "./sheet";
import { Text } from "./text";

export type MenuAction = {
  label: string;
  onSelect: () => void;
  /** `danger` pinta de vermelho a acao que remove ou cancela. */
  tone?: "default" | "danger";
  disabled?: boolean;
};

export type MenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** O sujeito das acoes: "Nota 4813". */
  title: string;
  actions: MenuAction[];
  /**
   * A area que abre o menu no toque longo - o botao direito do celular.
   * Sem ela o menu so abre por `open`, e o gatilho fica por sua conta.
   */
  children?: ReactNode;
  /** Veste a area do toque longo. Ela envolve os filhos, entao herde o layout deles. */
  triggerClassName?: string;
  /** Veste a lista de acoes dentro da folha. */
  className?: string;
};

const LONG_PRESS_ACTIONS = [{ name: "longpress", label: "Abrir ações" }];

export function Menu({
  open,
  onOpenChange,
  title,
  actions,
  children,
  triggerClassName,
  className,
}: MenuProps) {
  const sheet = (
    <Sheet open={open} onOpenChange={onOpenChange} title={title}>
      <View className={cn("gap-1", className)}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            disabled={action.disabled}
            onPress={() => {
              onOpenChange(false);
              action.onSelect();
            }}
            className={`min-h-12 flex-row items-center rounded-md px-3 ${
              action.disabled ? "opacity-50" : "active:bg-selected"
            }`}
          >
            <Text
              className={`text-base ${action.tone === "danger" ? "text-danger-text" : "text-fg"}`}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );

  if (!children) return sheet;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityHint={`Toque e segure para abrir as ações de ${title}`}
        accessibilityActions={LONG_PRESS_ACTIONS}
        onAccessibilityAction={(event: AccessibilityActionEvent) => {
          if (event.nativeEvent.actionName === "longpress") onOpenChange(true);
        }}
        onLongPress={() => onOpenChange(true)}
        className={cn("active:bg-selected", triggerClassName)}
      >
        {children}
      </Pressable>
      {sheet}
    </>
  );
}
