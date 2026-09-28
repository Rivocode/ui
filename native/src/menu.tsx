import type { ReactNode } from "react";
import { Pressable, View, type AccessibilityActionEvent } from "react-native";

import { cn, type Slots } from "./cn";
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
  /** Veste a lista de acoes dentro da folha, o mesmo no de `classNames.content`. */
  className?: string;
  /**
   * Classe por parte, com os nomes das pecas do web: `trigger` (a area do
   * toque longo, que envolve os filhos, entao herde o layout deles), `content`
   * (a lista de acoes) e `item` (cada acao).
   */
  classNames?: Slots<"trigger" | "content" | "item">;
  /**
   * Os textos da peca, para trocar o idioma: `open` e o nome da acao que abre a
   * folha pelo leitor de tela, e `hint` a dica da area do toque longo, que
   * recebe o `title`. Passe so os que mudam.
   */
  labels?: Partial<MenuLabels>;
};

export type MenuLabels = {
  open: string;
  hint: (title: string) => string;
};

const LABELS: MenuLabels = {
  open: "Abrir ações",
  hint: (title) => `Toque e segure para abrir as ações de ${title}`,
};

export function Menu({
  open,
  onOpenChange,
  title,
  actions,
  children,
  className,
  classNames,
  labels: labelsProp,
}: MenuProps) {
  const labels = { ...LABELS, ...labelsProp };
  const sheet = (
    <Sheet open={open} onOpenChange={onOpenChange} title={title}>
      <View className={cn("gap-1", className, classNames?.content)}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            disabled={action.disabled}
            onPress={() => {
              onOpenChange(false);
              action.onSelect();
            }}
            className={cn(
              "min-h-12 flex-row items-center rounded-md px-3",
              action.disabled ? "opacity-50" : "active:bg-selected",
              classNames?.item,
            )}
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
        accessibilityHint={labels.hint(title)}
        accessibilityActions={[{ name: "longpress", label: labels.open }]}
        onAccessibilityAction={(event: AccessibilityActionEvent) => {
          if (event.nativeEvent.actionName === "longpress") onOpenChange(true);
        }}
        onLongPress={() => onOpenChange(true)}
        className={cn("active:bg-selected", classNames?.trigger)}
      >
        {children}
      </Pressable>
      {sheet}
    </>
  );
}
