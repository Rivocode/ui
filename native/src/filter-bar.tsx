import { useRef, useState } from "react";
import {
  I18nManager,
  Pressable,
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated from "react-native-reanimated";

import { useAnnounce } from "./announce";
import { Button } from "./button";
import { cn, type Slots } from "./cn";
import { useMotion, useSettled } from "./motion";
import { Text } from "./text";

type ChipSize = "sm" | "md";

const PILL: Record<ChipSize, string> = { sm: "top-2.5 bottom-2.5", md: "top-2 bottom-2" };
const PAD: Record<ChipSize, string> = { sm: "px-2", md: "px-2.5" };
const FONT: Record<ChipSize, string> = { sm: "text-xs", md: "text-sm" };
const EDGE = "absolute top-0 bottom-0 w-px bg-border-strong";

function describe(label: string, value?: string): string {
  return value === undefined || value === "" ? label : `${label}: ${value}`;
}

function counted(total: number): string {
  return total === 1 ? "1 filtro" : `${total} filtros`;
}

function applied(total: number): string {
  return total === 0
    ? "Nenhum filtro aplicado"
    : `${counted(total)} aplicado${total === 1 ? "" : "s"}`;
}

export type FilterChipProps = {
  /** The filtered field: "Cliente", "Vencimento". Rendered in normal weight, on the left. */
  label: string;
  /**
   * What was chosen for that field. Rendered in medium weight, and truncated
   * with an ellipsis beyond 10rem. `string`, and not `ReactNode` as on the web:
   * text on the phone lives inside a `Text`, and this value also goes whole
   * into the X's label, which accepts only text.
   */
  value?: string;
  /**
   * What happens on the X. Without it there is no X: that is how you show a
   * filter the app locks.
   */
  onRemove?: () => void;
  /** Locks the X and dims the chip, so the refetching query does not accept a second tap. */
  disabled?: boolean;
  /**
   * The height of the drawn pill, and only that: the X's touch target is 44pt
   * in both, because the finger does not shrink along with the chip.
   */
  size?: ChipSize;
  /**
   * What the screen reader hears on the X. `remove` receives "Cliente: Acme",
   * or just "Cliente" when the chip has no value.
   */
  labels?: { remove?: (filter: string) => string };
  /** Styles the whole chip - the 44pt touch strip, not the pill painted inside it. */
  className?: string;
  /**
   * Class per part: `label` (the field), `value` (the chosen value) and
   * `remove` (the X's touch target).
   */
  classNames?: Slots<"label" | "value" | "remove">;
};

export function FilterChip({
  label,
  value,
  onRemove,
  disabled,
  size = "md",
  labels = {},
  className,
  classNames,
}: FilterChipProps) {
  const remove = labels.remove ?? ((filter: string) => `Remover filtro ${filter}`);
  const hasValue = value !== undefined && value !== "";
  const cross = cn(
    "absolute h-[1.5px] w-2.5 rounded-pill",
    disabled ? "bg-fg-disabled" : "bg-fg-subtle",
  );

  return (
    <View
      className={cn(
        "h-11 flex-row items-center gap-1",
        PAD[size],
        disabled && "opacity-60",
        className,
      )}
    >
      <View
        className={cn(
          "absolute right-0 left-0 rounded-pill border border-border bg-surface-raised",
          PILL[size],
        )}
      />

      <Text numberOfLines={1} className={cn("text-fg-muted", FONT[size], classNames?.label)}>
        {label}
      </Text>

      {hasValue && (
        <Text
          numberOfLines={1}
          className={cn("max-w-40 font-rc-medium text-fg", FONT[size], classNames?.value)}
        >
          {value}
        </Text>
      )}

      {onRemove && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={remove(describe(label, value))}
          accessibilityState={{ disabled: Boolean(disabled) }}
          disabled={disabled}
          onPress={onRemove}
          hitSlop={{ top: 0, bottom: 0, left: 14, right: 14 }}
          className={cn("w-4 items-center justify-center self-stretch", classNames?.remove)}
        >
          <View className={cn(cross, "rotate-45")} />
          <View className={cn(cross, "-rotate-45")} />
        </Pressable>
      )}
    </View>
  );
}

export type AppliedFilter = {
  /** Stable key of the filter, and what identifies the chip in the row. */
  id: string;
  /** The filtered field: "Cliente". */
  label: string;
  /** What was chosen: "Acme", "01/08 a 31/08". */
  value?: string;
  /** `false` removes this chip's X: the filter shows, and leaving it is not the reader's choice. */
  removable?: boolean;
};

export type FilterBarProps = {
  /**
   * The current filters. The component keeps no list of its own and does not
   * know the query: it shows this one.
   */
  filters: AppliedFilter[];
  /** The filter that left, with the whole object, when its X is pressed. */
  onRemove?: (filter: AppliedFilter) => void;
  /** Called when "limpar" is pressed, before `onFiltersChange`. */
  onClear?: () => void;
  /** Receives what remains, on both the X and clear. On its own it is enough. */
  onFiltersChange?: (filters: AppliedFilter[]) => void;
  /** The row's name for the screen reader. */
  label?: string;
  /**
   * Keeps the row height when there is no filter at all, so the screen does not
   * jump when the first one comes in. What it keeps is a 44pt touch strip, the
   * height of the full row. `false` removes the row and keeps only the notice.
   */
  reserve?: boolean;
  /**
   * From how many filters "limpar" appears. With `1` it is always there, and
   * with `Infinity` never.
   */
  clearFrom?: number;
  /** The pill height. The row has the same height in both. */
  size?: ChipSize;
  /** Locks every X and clear, so the refetching query does not accept a second tap. */
  disabled?: boolean;
  /**
   * The texts the component writes: `remove` on the X, `clear` on the clear
   * button, `status` in the live notice and `empty` on the reserved row.
   */
  labels?: {
    remove?: (filter: string) => string;
    clear?: (total: number) => string;
    status?: (total: number) => string;
    empty?: string;
  };
  /** Styles the whole row. */
  className?: string;
  /**
   * Class per part: `list` (the scrolling row, via its content), `item` (each
   * chip's wrapper), `chip` (the chip), `clear` (the clear button) and `empty`
   * (the reserved row when there is no filter).
   */
  classNames?: Slots<"list" | "item" | "chip" | "clear" | "empty">;
};

export function FilterBar({
  filters,
  onRemove,
  onClear,
  onFiltersChange,
  label = "Filtros aplicados",
  reserve = true,
  clearFrom = 2,
  size = "md",
  disabled,
  labels = {},
  className,
  classNames,
}: FilterBarProps) {
  const total = filters.length;
  const status = labels.status ?? applied;
  const clear = labels.clear ?? ((count: number) => `Limpar ${counted(count)}`);
  const empty = labels.empty ?? applied(0);

  const rtl = I18nManager.getConstants().isRTL;
  const motion = useMotion();
  const settled = useSettled();

  const frame = useRef(0);
  const content = useRef(0);
  const passed = useRef(0);
  const [more, setMore] = useState({ left: false, right: false });

  const measure = () => {
    const hidden = Math.max(0, content.current - frame.current);
    const behind = Math.min(Math.max(passed.current, 0), hidden);
    const ahead = hidden - behind;
    const next = rtl
      ? { left: ahead > 1, right: behind > 1 }
      : { left: behind > 1, right: ahead > 1 };

    setMore((current) =>
      current.left === next.left && current.right === next.right ? current : next,
    );
  };

  const onLayout = (event: LayoutChangeEvent) => {
    frame.current = event.nativeEvent.layout.width;
    measure();
  };

  const onContentSizeChange = (width: number) => {
    content.current = width;
    measure();
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

    content.current = contentSize.width;
    frame.current = layoutMeasurement.width;
    passed.current = rtl
      ? contentSize.width - layoutMeasurement.width - contentOffset.x
      : contentOffset.x;
    measure();
  };

  const said = status(total);
  useAnnounce(said, { liveRegion: true });

  const canRemove = Boolean(onRemove ?? onFiltersChange);
  const canClear = Boolean(onClear ?? onFiltersChange);
  const locked = filters.filter((filter) => filter.removable === false);
  const clearable = total - locked.length;
  const line = total === 0 && reserve;

  return (
    <View
      className={cn(
        "w-full flex-row items-center gap-2",
        (total > 0 || reserve) && "h-11",
        className,
      )}
    >
      {total > 0 && (
        <View className="flex-1 self-stretch">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            accessibilityRole="list"
            accessibilityLabel={label}
            scrollEventThrottle={16}
            onLayout={onLayout}
            onContentSizeChange={onContentSizeChange}
            onScroll={onScroll}
            contentContainerClassName={cn("flex-row items-center gap-2", classNames?.list)}
          >
            {filters.map((filter) => (
              <Animated.View
                key={filter.id}
                entering={settled ? motion.fadeIn : undefined}
                exiting={motion.fadeOut}
                layout={motion.reflow}
                className={classNames?.item}
              >
                <FilterChip
                  label={filter.label}
                  value={filter.value}
                  size={size}
                  disabled={disabled}
                  labels={labels}
                  className={classNames?.chip}
                  onRemove={
                    filter.removable === false || !canRemove
                      ? undefined
                      : () => {
                          onRemove?.(filter);
                          onFiltersChange?.(filters.filter((other) => other.id !== filter.id));
                        }
                  }
                />
              </Animated.View>
            ))}
          </ScrollView>

          {more.left && <View pointerEvents="none" className={cn(EDGE, "left-0")} />}
          {more.right && <View pointerEvents="none" className={cn(EDGE, "right-0")} />}
        </View>
      )}

      <Text
        accessibilityLiveRegion="polite"
        accessibilityLabel={said}
        numberOfLines={1}
        className={cn(
          "text-sm text-fg-subtle",
          !line && "absolute top-0 left-0",
          line && classNames?.empty,
        )}
      >
        {line ? empty : ""}
      </Text>

      {clearable > 0 && clearable >= clearFrom && canClear && (
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={classNames?.clear}
          onPress={() => {
            onClear?.();
            onFiltersChange?.(locked);
          }}
        >
          {clear(clearable)}
        </Button>
      )}
    </View>
  );
}
