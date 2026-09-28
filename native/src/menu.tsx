import type { ReactNode } from "react";
import { Pressable, View, type AccessibilityActionEvent } from "react-native";

import { cn, type Slots } from "./cn";
import { Sheet } from "./sheet";
import { Text } from "./text";

export type MenuAction = {
  label: string;
  onSelect: () => void;
  /** `danger` paints red the action that removes or cancels. */
  tone?: "default" | "danger";
  disabled?: boolean;
};

export type MenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The subject of the actions: "Nota 4813". */
  title: string;
  actions: MenuAction[];
  /**
   * The area that opens the menu on long press - the phone's right click.
   * Without it the menu opens only through `open`, and the trigger is up to
   * you.
   */
  children?: ReactNode;
  /** Styles the list of actions inside the sheet, the same node as `classNames.content`. */
  className?: string;
  /**
   * Class per part, with the names of the web components: `trigger` (the
   * long-press area, which wraps the children, so inherit their layout),
   * `content` (the list of actions) and `item` (each action).
   */
  classNames?: Slots<"trigger" | "content" | "item">;
  /**
   * The component's texts, to change the language: `open` is the name of the
   * action that opens the sheet from the screen reader, and `hint` the hint of
   * the long-press area, which receives `title`. Pass only the ones that
   * change.
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
