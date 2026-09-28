import { useState } from "react";
import { AccessibilityInfo, ScrollView, View } from "react-native";

import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { cn, type Slots } from "./cn";
import { SearchInput } from "./search-input";
import { matchesSearch } from "./shared/highlight";
import {
  OTHER_SIDE,
  TRANSFER_EMPTY,
  TRANSFER_NO_RESULTS,
  TRANSFER_SEARCH,
  TRANSFER_TITLES,
  moveAllLabel,
  moveSelectedLabel,
  searchInLabel,
  transferCount,
  transferMove,
  transferMoved,
  transferSides,
  type TransferListItem,
  type TransferSide,
} from "./shared/transfer";
import { Text } from "./text";

export type { TransferListItem } from "./shared/transfer";

export type TransferListLabels = {
  /** The title of the list you choose from. Default: "Disponíveis". */
  available?: string;
  /** The title of the list of what was chosen. Default: "Escolhidos". */
  chosen?: string;
  /** What appears in a list with no items. Default: "Nenhum item". */
  empty?: string;
  /** What appears when the search finds nothing. Default: "Nada encontrado". */
  noResults?: string;
  /** The placeholder text inside the search. Default: "Buscar". */
  search?: string;
  /** The header count, the same sentence as the web. */
  count?: (selected: number, total: number) => string;
  /** What the screen reader announces after moving. */
  moved?: (count: number, to: string) => string;
};

export type TransferListProps = {
  /** All the items, on both sides. The order here is the order of the available list. */
  items: TransferListItem[];
  /** The `value`s of the chosen items, in the order they appear in the second list. */
  value: string[];
  /** Receives the new `value` on every move. */
  onValueChange: (value: string[]) => void;
  /** Turns on the search at the top of each list, accent-insensitive. Default: on. */
  searchable?: boolean;
  /** Turns off both lists, the searches and the move buttons. */
  disabled?: boolean;
  /** The component's texts, the same as the web. */
  labels?: TransferListLabels;
  className?: string;
  /**
   * Class per part: `panel` (each list with its frame), `header`, `search`,
   * `list` (the scrolling box), `option`, `actions` (the row of move buttons,
   * below each list) and `empty`.
   */
  classNames?: Slots<"panel" | "header" | "search" | "list" | "option" | "actions" | "empty">;
};

export function TransferList({
  items,
  value,
  onValueChange,
  searchable = true,
  disabled = false,
  labels = {},
  className,
  classNames,
}: TransferListProps) {
  const titles: Record<TransferSide, string> = {
    available: labels.available ?? TRANSFER_TITLES.available,
    chosen: labels.chosen ?? TRANSFER_TITLES.chosen,
  };
  const count = labels.count ?? transferCount;
  const moved = labels.moved ?? transferMoved;
  const [query, setQuery] = useState<Record<TransferSide, string>>({ available: "", chosen: "" });
  const [picked, setPicked] = useState<Record<TransferSide, string[]>>({
    available: [],
    chosen: [],
  });

  const sides = transferSides(items, value);
  const shown = (side: TransferSide) =>
    sides[side].filter((item) => matchesSearch(item.label, query[side]));
  const open = (side: TransferSide) =>
    shown(side)
      .filter((item) => !item.disabled)
      .map((item) => item.value);
  const selected = (side: TransferSide) => {
    const visible = new Set(open(side));
    return picked[side].filter((key) => visible.has(key));
  };

  function move(from: TransferSide, keys: string[]) {
    const wanted = new Set(keys);
    const total = items.filter((item) => !item.disabled && wanted.has(item.value)).length;
    if (disabled || total === 0) return;
    const to = OTHER_SIDE[from];
    onValueChange(transferMove(items, value, keys, to));
    setPicked((current) => ({ ...current, [from]: [] }));
    AccessibilityInfo.announceForAccessibility(moved(total, titles[to]));
  }

  function toggle(side: TransferSide, key: string, on: boolean) {
    setPicked((current) => {
      const rest = current[side].filter((other) => other !== key);
      return { ...current, [side]: on ? [...rest, key] : rest };
    });
  }

  function section(side: TransferSide) {
    const list = shown(side);
    const marked = selected(side);
    const markedSet = new Set(marked);
    const searching = query[side].trim().length > 0;

    return (
      <View
        className={cn("overflow-hidden rounded-lg border border-border bg-surface", classNames?.panel)}
      >
        <View
          className={cn(
            "flex-row flex-wrap items-baseline justify-between gap-2 border-b border-border px-3 py-2",
            classNames?.header,
          )}
        >
          <Text accessibilityRole="header" className="text-sm font-rc-medium text-fg">
            {titles[side]}
          </Text>
          <Text className="text-xs text-fg-muted">{count(marked.length, sides[side].length)}</Text>
        </View>

        {searchable ? (
          <View className={cn("border-b border-border p-2", classNames?.search)}>
            <SearchInput
              accessibilityLabel={searchInLabel(titles[side])}
              placeholder={labels.search ?? TRANSFER_SEARCH}
              editable={!disabled}
              value={query[side]}
              onValueChange={(text) => setQuery((current) => ({ ...current, [side]: text }))}
            />
          </View>
        ) : null}

        <ScrollView
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          accessibilityLabel={titles[side]}
          className={cn("max-h-72", classNames?.list)}
        >
          {list.length === 0 ? (
            <Text className={cn("px-3 py-6 text-center text-sm text-fg-muted", classNames?.empty)}>
              {searching
                ? (labels.noResults ?? TRANSFER_NO_RESULTS)
                : (labels.empty ?? TRANSFER_EMPTY)}
            </Text>
          ) : (
            list.map((item) => {
              const checked = markedSet.has(item.value);
              return (
                <Checkbox
                  key={item.value}
                  checked={checked}
                  disabled={disabled || item.disabled}
                  onCheckedChange={(on) => toggle(side, item.value, on)}
                  className={cn("min-h-11 px-3 py-2", checked && "bg-selected", classNames?.option)}
                >
                  {item.label}
                </Checkbox>
              );
            })
          )}
        </ScrollView>

        <View className={cn("flex-row flex-wrap gap-2 border-t border-border p-2", classNames?.actions)}>
          <Button
            size="sm"
            variant="secondary"
            disabled={disabled || marked.length === 0}
            onPress={() => move(side, marked)}
          >
            {moveSelectedLabel(titles[OTHER_SIDE[side]])}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled || open(side).length === 0}
            onPress={() => move(side, open(side))}
          >
            {moveAllLabel(titles[OTHER_SIDE[side]])}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className={cn("gap-4", className)}>
      {section("available")}
      {section("chosen")}
    </View>
  );
}
