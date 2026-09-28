import { useState, type ReactNode } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller";

import { cn, type Slots } from "./cn";
import { KeyboardRiser } from "./keyboard";

const GAP = 16;
const FILL = { flex: 1 };
const GROW = { flexGrow: 1 };

export type ScrollAreaProps = Omit<
  KeyboardAwareScrollViewProps,
  "bottomOffset" | "className" | "contentContainerClassName" | "horizontal" | "ScrollViewComponent" | "children"
> & {
  children?: ReactNode;
  /**
   * What stays pinned below the scroll and rises with the keyboard: the form's
   * submit action. Its height enters the calculation of where the focused field
   * must stop, so no field hides behind the button.
   */
  footer?: ReactNode;
  /**
   * In points, how far above the keyboard the focused field sits - or above the
   * `footer`, when there is one. Default 16.
   */
  bottomOffset?: number;
  /** Styles the outer box, the one that fills the screen. */
  className?: string;
  /** Styles the scrolling content: `gap-4 p-5` is the usual. */
  contentContainerClassName?: string;
  /** Class per part: `footer`, the `footer` strip - background, border and padding. */
  classNames?: Slots<"footer">;
};

export function ScrollArea({
  children,
  footer,
  bottomOffset = GAP,
  className,
  contentContainerClassName,
  classNames,
  ...props
}: ScrollAreaProps) {
  const [footerHeight, setFooterHeight] = useState(0);

  return (
    <View className={cn("flex-1", className)}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        {...props}
        bottomOffset={bottomOffset + (footer ? footerHeight : 0)}
        style={FILL}
        contentContainerStyle={GROW}
      >
        <View className={cn("grow", contentContainerClassName)}>{children}</View>
      </KeyboardAwareScrollView>
      {footer && (
        <KeyboardRiser
          onLayout={(event: LayoutChangeEvent) => setFooterHeight(event.nativeEvent.layout.height)}
          className={cn("border-t border-border bg-bg px-5 py-3", classNames?.footer)}
        >
          {footer}
        </KeyboardRiser>
      )}
    </View>
  );
}
