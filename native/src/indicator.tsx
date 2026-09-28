import { useRef, type ReactNode } from "react";
import { View, type LayoutChangeEvent } from "react-native";

import { cn, type Slots } from "./cn";
import { Entrance } from "./motion";
import { Text } from "./text";

const WIDEST_MARKED = 48;

export function indicatorWidthComplaint(width: number): string | undefined {
  if (width <= WIDEST_MARKED) return undefined;
  return (
    "[rivocode/ui-native] <Indicator>: the child is " +
    `${Math.round(width)}px wide, and the pill sits on top of it without ` +
    `reserving space - above ${WIDEST_MARKED}px it covers content. ` +
    "The component marks a small target: the bell button, the tab bar item, the avatar. " +
    "To mark a whole row, put the count beside it, with a `Badge`."
  );
}

export type IndicatorProps = {
  /** What receives the mark: the bell button, the tab bar item, the avatar. */
  children: ReactNode;
  /**
   * How many. Zero draws nothing - a pill with "0" draws attention to say there
   * is nothing, which is the opposite of its job.
   */
  count?: number;
  /** The cap: above it "99+" is shown, instead of the pill stretching. */
  max?: number;
  /**
   * What the screen reader hears instead of the number: "3 notificações".
   * Required, and it is the difference the component exists to make. The number
   * alone does not say what the three are, and on the phone it is even smaller
   * than on the web - someone who enlarges the system font to read does not
   * want to discover the subject by the pill's color.
   */
  label: string;
  /** No count: just the dot, for "there is something new here". */
  dot?: boolean;
  className?: string;
  /** Class per part: `badge`, the pill. `className` styles the wrapper around the child. */
  classNames?: Slots<"badge">;
};

export function Indicator({
  children,
  count,
  max = 99,
  label,
  dot,
  className,
  classNames,
}: IndicatorProps) {
  const show = dot === true || (count !== undefined && count > 0);
  const written = count !== undefined && count > max ? `${max}+` : String(count ?? "");
  const complained = useRef(false);

  const onLayout = (event: LayoutChangeEvent) => {
    if (complained.current) return;
    const complaint = indicatorWidthComplaint(event.nativeEvent.layout.width);
    if (!complaint) return;
    complained.current = true;
    console.warn(complaint);
  };

  return (
    <View className={cn("self-start", className)} onLayout={__DEV__ ? onLayout : undefined}>
      {children}

      {show && (
        <Entrance
          effect="popIn"
          accessible
          accessibilityRole="text"
          accessibilityLabel={label}
          className={cn(
            "absolute -top-1 -right-1 flex-row items-center justify-center rounded-pill bg-danger",
            "border-2 border-bg",
            dot === true ? "size-3.5" : "h-[22px] min-w-[22px] px-1",
            classNames?.badge,
          )}
        >
          {dot !== true && <Text className="text-xs font-rc-medium text-danger-fg">{written}</Text>}
        </Entrance>
      )}
    </View>
  );
}
