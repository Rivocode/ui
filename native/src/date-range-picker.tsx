import { useState } from "react";
import { Pressable, View } from "react-native";

import { useAnnounce } from "./announce";
import { Button } from "./button";
import { MonthView, formatDate, useMonthOf, type CalendarLabels, type DayPaint } from "./calendar";
import { cn } from "./cn";
import { Sheet } from "./sheet";
import { Text } from "./text";

export type DateRange = {
  /** `yyyy-mm-dd`, as in `DatePicker`. */
  from: string;
  to: string;
};

type Draft = { from: string; to: string | null };

export type DateRangePickerProps = {
  value: DateRange | null;
  /** `null` when the person taps Limpar. */
  onValueChange: (range: DateRange | null) => void;
  /** What the screen reader announces on the trigger, and the sheet title. */
  label: string;
  placeholder?: string;
  /** Inclusive limits, in the same ISO format. */
  min?: string;
  max?: string;
  disabled?: boolean;
  /** Styles the trigger; the sheet is the same for everyone. */
  className?: string;
  /**
   * The component's texts, to change the language: `clear` and `apply` are the
   * sheet's two buttons, `pickFirst` the notice before the first tap and
   * `pickLast` the one after it, which receives the first day already written.
   * `previous`, `next`, `caption` and `weekdays` go to the calendar, with the
   * names of the `Calendar` `labels`. Pass only the ones that change.
   */
  labels?: Partial<DateRangePickerLabels>;
};

export type DateRangePickerLabels = CalendarLabels & {
  clear: string;
  apply: string;
  pickFirst: string;
  pickLast: (from: string) => string;
};

const LABELS = {
  clear: "Limpar",
  apply: "Aplicar",
  pickFirst: "Toque no primeiro dia do período.",
  pickLast: (from: string) => `${from} – toque no último dia.`,
};

export function DateRangePicker({
  value,
  onValueChange,
  label,
  placeholder = "Escolha o período",
  min,
  max,
  disabled,
  className,
  labels,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(value);

  const written = value ? `${formatDate(value.from)} – ${formatDate(value.to)}` : placeholder;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: written }}
        disabled={disabled}
        onPress={() => {
          setDraft(value);
          setOpen(true);
        }}
        className={cn(
          "h-12 flex-row items-center justify-between rounded-md border border-border-strong bg-surface px-3.5",
          disabled && "opacity-50",
          className,
        )}
      >
        <Text numberOfLines={1} className={`text-base ${value ? "text-fg" : "text-fg-subtle"}`}>
          {written}
        </Text>
        <Text className="text-fg-subtle">▾</Text>
      </Pressable>

      <Sheet open={open} onOpenChange={setOpen} title={label}>
        <RangeSheet
          draft={draft}
          onDraftChange={setDraft}
          min={min}
          max={max}
          labels={labels}
          onApply={(range) => {
            onValueChange(range);
            setOpen(false);
          }}
        />
      </Sheet>
    </>
  );
}

function RangeSheet({
  draft,
  onDraftChange,
  min,
  max,
  labels: labelsProp,
  onApply,
}: {
  draft: Draft | null;
  onDraftChange: (draft: Draft | null) => void;
  min?: string;
  max?: string;
  labels?: Partial<DateRangePickerLabels>;
  onApply: (range: DateRange | null) => void;
}) {
  const labels = { ...LABELS, ...labelsProp };
  const { year, month, onMonthChange } = useMonthOf(draft?.from);
  const summary = describe(draft, labels);
  useAnnounce(summary, { liveRegion: true });

  const paintOf = (iso: string): DayPaint => {
    if (draft === null) return { chosen: false };
    if (draft.to === null) {
      const start = iso === draft.from;
      return { chosen: start, edge: start ? "both" : undefined };
    }

    const isStart = iso === draft.from;
    const isEnd = iso === draft.to;
    if (isStart || isEnd) {
      return {
        chosen: true,
        edge: draft.from === draft.to ? "both" : isStart ? "start" : "end",
      };
    }
    return { chosen: false, within: iso > draft.from && iso < draft.to };
  };

  return (
    <View className="gap-4">
      <Text accessibilityLiveRegion="polite" className="text-sm text-fg-muted">
        {summary}
      </Text>

      <MonthView
        year={year}
        month={month}
        onMonthChange={onMonthChange}
        min={min}
        max={max}
        paintOf={paintOf}
        onDayPress={(iso) => onDraftChange(nextDraft(draft, iso))}
        labels={labelsProp}
      />

      <View className="flex-row items-center justify-between gap-3">
        <Button
          variant="ghost"
          onPress={() => {
            onDraftChange(null);
            onApply(null);
          }}
        >
          {labels.clear}
        </Button>
        <Button
          disabled={draft === null || draft.to === null}
          onPress={() => {
            if (draft === null || draft.to === null) return;
            onApply({ from: draft.from, to: draft.to });
          }}
        >
          {labels.apply}
        </Button>
      </View>
    </View>
  );
}

function nextDraft(draft: Draft | null, iso: string): Draft {
  if (draft === null || draft.to !== null) return { from: iso, to: null };
  return iso < draft.from ? { from: iso, to: draft.from } : { from: draft.from, to: iso };
}

function describe(draft: Draft | null, labels: typeof LABELS): string {
  if (draft === null) return labels.pickFirst;
  if (draft.to === null) return labels.pickLast(formatDate(draft.from));
  return `${formatDate(draft.from)} – ${formatDate(draft.to)}`;
}
