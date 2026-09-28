import type { ReactNode } from "react";
import { View } from "react-native";

import { cn, type Slots } from "./cn";
import { Text } from "./text";

export type PageHeaderProps = {
  title: string;
  /** The context sentence below the title, not a decorative subtitle. */
  description?: string;
  /** The tag next to the title: a Badge, typically. */
  badge?: ReactNode;
  /** The screen's actions: a primary Button, at most two. */
  actions?: ReactNode;
  /** Styles the root, the same row as `classNames.row`. */
  className?: string;
  /**
   * Class per part: `row` (the title row with the actions), `heading` (the
   * title and description column), `title`, `description` and `actions`.
   */
  classNames?: Slots<"row" | "heading" | "title" | "description" | "actions">;
};

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
  classNames,
}: PageHeaderProps) {
  return (
    <View
      className={cn("flex-row items-start justify-between gap-3", className, classNames?.row)}
    >
      <View className={cn("min-w-0 flex-1", classNames?.heading)}>
        <View className="flex-row items-center gap-2.5">
          <Text
            font="display"
            className={cn("text-2xl font-rc-display text-fg", classNames?.title)}
            numberOfLines={1}
          >
            {title}
          </Text>
          {badge}
        </View>
        {description && (
          <Text className={cn("mt-0.5 text-sm text-fg-muted", classNames?.description)}>
            {description}
          </Text>
        )}
      </View>
      {actions && (
        <View className={cn("flex-row items-center gap-2", classNames?.actions)}>{actions}</View>
      )}
    </View>
  );
}
