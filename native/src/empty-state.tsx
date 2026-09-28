import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "./cn";
import { Entrance } from "./motion";
import { useRivo } from "./provider";
import { Text } from "./text";

const ICON_SIZE = 32;

export type EmptyStateProps = {
  /**
   * Symbol of the empty state. Optional, and hidden from the screen reader, as
   * on the web: the title and description already say what it draws. In React
   * Native color does not flow down from the `View` to the SVG, so the form
   * that paints itself is the function: it receives the `fg-subtle` of the
   * theme currently painting and the web's 32 - `icon={({ color, size }) =>
   * <Search color={color} size={size} />}`. A node is accepted too, and then
   * color and size are up to whoever draws.
   */
  icon?: ReactNode | ((glyph: { color: string; size: number }) => ReactNode);
  /**
   * A drawing larger than the icon, for the first-time empty state: the home
   * screen with nothing yet, the onboarding step. A filter with no results and
   * a list that emptied call for `icon`, not this. Nothing is forced: the size
   * is up to whoever draws. Hidden from the screen reader, like `icon`. Paint
   * with the roles from `useRivo().colors`, never with a literal color, or the
   * drawing will not follow the client's theme. When present, it takes the
   * place of `icon`.
   */
  illustration?: ReactNode;
  title: string;
  /**
   * Required for the same reason as on the web: "nenhum resultado" without the
   * why shifts the work to the person, and they almost never figure it out.
   */
  description: string;
  action?: ReactNode;
  className?: string;
};

const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const { colors } = useRivo();
  const glyph =
    typeof icon === "function" ? icon({ color: colors["fg-subtle"], size: ICON_SIZE }) : icon;
  const art = illustration ?? glyph;

  return (
    <Entrance className={cn("items-center gap-2 px-6 py-10", className)}>
      {art !== undefined && art !== null && art !== false && (
        <View {...HIDDEN} className="mb-1 items-center justify-center">
          {art}
        </View>
      )}
      <Text className="text-lg font-rc-strong text-fg">{title}</Text>
      <Text className="text-center text-sm text-fg-muted">{description}</Text>
      {action && <View className="mt-2">{action}</View>}
    </Entrance>
  );
}
