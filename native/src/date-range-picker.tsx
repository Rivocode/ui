import { useState } from "react";
import { Pressable, View } from "react-native";

import { Button } from "./button";
import { MonthView, formatDate, useMonthOf, type DayPaint } from "./calendar";
import { cn } from "./cn";
import { Sheet } from "./sheet";
import { Text } from "./text";

export type DateRange = {
  /** `aaaa-mm-dd`, como no `DatePicker`. */
  from: string;
  to: string;
};

type Draft = { from: string; to: string | null };

export type DateRangePickerProps = {
  value: DateRange | null;
  /** `null` quando a pessoa toca em Limpar. */
  onValueChange: (range: DateRange | null) => void;
  /** O que o leitor de tela anuncia no gatilho, e o título da folha. */
  label: string;
  placeholder?: string;
  /** Limites inclusivos, no mesmo formato ISO. */
  min?: string;
  max?: string;
  disabled?: boolean;
  /** Veste o gatilho; a folha é a mesma para todos. */
  className?: string;
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
  onApply,
}: {
  draft: Draft | null;
  onDraftChange: (draft: Draft | null) => void;
  min?: string;
  max?: string;
  onApply: (range: DateRange | null) => void;
}) {
  const { year, month, onMonthChange } = useMonthOf(draft?.from);

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
        {describe(draft)}
      </Text>

      <MonthView
        year={year}
        month={month}
        onMonthChange={onMonthChange}
        min={min}
        max={max}
        paintOf={paintOf}
        onDayPress={(iso) => onDraftChange(nextDraft(draft, iso))}
      />

      <View className="flex-row items-center justify-between gap-3">
        <Button
          variant="ghost"
          onPress={() => {
            onDraftChange(null);
            onApply(null);
          }}
        >
          Limpar
        </Button>
        <Button
          disabled={draft === null || draft.to === null}
          onPress={() => {
            if (draft === null || draft.to === null) return;
            onApply({ from: draft.from, to: draft.to });
          }}
        >
          Aplicar
        </Button>
      </View>
    </View>
  );
}

function nextDraft(draft: Draft | null, iso: string): Draft {
  if (draft === null || draft.to !== null) return { from: iso, to: null };
  return iso < draft.from ? { from: iso, to: draft.from } : { from: draft.from, to: iso };
}

function describe(draft: Draft | null): string {
  if (draft === null) return "Toque no primeiro dia do período.";
  if (draft.to === null) return `${formatDate(draft.from)} – toque no último dia.`;
  return `${formatDate(draft.from)} – ${formatDate(draft.to)}`;
}
