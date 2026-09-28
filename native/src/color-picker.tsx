import { useState } from "react";
import { Pressable, View } from "react-native";

import { cn, type Slots } from "./cn";
import { Input, useInsideField } from "./field";
import { COLOR_PICKER_LABELS, type ColorPickerLabels } from "./shared/color-picker";
import { Text } from "./text";

export type ColorSwatch = string | { value: string; label: string };

export type ColorPickerProps = {
  /** The chosen color, in six-digit hexadecimal. Empty is `""`. */
  value: string;
  /** Notified with the normalized hexadecimal, always six digits and lowercase. */
  onValueChange: (value: string) => void;
  /**
   * The swatches. Without them, a generated spread of hues, useful for
   * experimenting, not for representing a brand: a theme builder passes the
   * client's palette here.
   */
  swatches?: ColorSwatch[];
  /** How many swatches per row. */
  columns?: number;
  /**
   * The text above the swatches, and their name for the screen reader. Inside a
   * `Field` it only names, without appearing: the on-screen label there is the
   * `Field`'s, and `forValue` delivers the same text here.
   */
  label?: string;
  /** Hides the text field and leaves only the swatches. */
  hideInput?: boolean;
  disabled?: boolean;
  className?: string;
  /**
   * The component's texts, to change the language: `swatches` is the name of
   * the swatch group when there is no `label`, `hex` that of the text field and
   * `swatch` that of each plain-text swatch, which receives its hexadecimal. A
   * `{ value, label }` swatch is named by its own `label`. Pass only the ones
   * that change.
   */
  labels?: Partial<ColorPickerLabels>;
  /**
   * Class per part: `label`, `swatches` (the swatch group), `swatch` (each
   * swatch's touch target), `field` (the field row), `preview` (the current
   * color beside the field) and `input`.
   */
  classNames?: Slots<"label" | "swatches" | "swatch" | "field" | "preview" | "input">;
};

const HEX = /^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function normalizeColor(text: string): string | null {
  const digits = text.trim().replace(/^#/, "");
  if (!HEX.test(digits)) return null;
  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : digits;
  return "#" + full.toLowerCase();
}

function fromWheel(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const amplitude = s * Math.min(l, 1 - l);
  const turn = (offset: number) => (offset + hue / 30) % 12;

  const channel = (offset: number) => {
    const k = turn(offset);
    const level = l - amplitude * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(level * 255)
      .toString(16)
      .padStart(2, "0");
  };

  return "#" + channel(0) + channel(8) + channel(4);
}

const HUES = 10;

const DEFAULT_COLUMNS = 6;

const DEFAULT_SWATCHES: string[] = [70, 55, 38].flatMap((lightness) =>
  Array.from({ length: HUES }, (_, index) => fromWheel((index * 360) / HUES, 68, lightness)),
);

const valueOf = (swatch: ColorSwatch) => (typeof swatch === "string" ? swatch : swatch.value);

const nameOf = (swatch: ColorSwatch, named: (value: string) => string) =>
  typeof swatch === "string" ? named(swatch) : `${swatch.label}, ${swatch.value}`;

function inRows<T>(items: T[], perRow: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += perRow) {
    rows.push(items.slice(index, index + perRow));
  }
  return rows;
}

export type { ColorPickerLabels };

export function ColorPicker({
  value,
  onValueChange,
  swatches = DEFAULT_SWATCHES,
  columns = DEFAULT_COLUMNS,
  label,
  hideInput,
  disabled,
  labels: labelsProp,
  className,
  classNames,
}: ColorPickerProps) {
  const labels = { ...COLOR_PICKER_LABELS, ...labelsProp };
  const insideField = useInsideField();
  const [text, setText] = useState(value);
  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    setText(value);
  }

  function choose(swatch: string) {
    const color = normalizeColor(swatch) ?? swatch;
    setText(color);
    setSeenValue(color);
    onValueChange(color);
  }

  function typeText(raw: string) {
    setText(raw);
    const color = normalizeColor(raw);
    if (color) {
      setSeenValue(color);
      onValueChange(color);
    }
  }

  function settle() {
    setText(normalizeColor(text) ?? value);
  }

  const current = normalizeColor(value);

  return (
    <View className={cn("gap-2", className)}>
      {label && !insideField && (
        <Text className={cn("text-sm font-rc-medium text-fg", classNames?.label)}>{label}</Text>
      )}

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label ?? labels.swatches}
        className={cn("gap-2", classNames?.swatches)}
      >
        {inRows(swatches, Math.max(1, columns)).map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row gap-2">
            {row.map((swatch, index) => {
              const color = valueOf(swatch);
              const selected = current !== null && normalizeColor(color) === current;
              return (
                <Pressable
                  key={`${color}-${index}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled }}
                  accessibilityLabel={nameOf(swatch, labels.swatch)}
                  disabled={disabled}
                  onPress={() => choose(color)}
                  className={cn(
                    "size-11 items-center justify-center rounded-md border-2",
                    selected ? "border-accent" : "border-transparent",
                    disabled && "opacity-50",
                    classNames?.swatch,
                  )}
                >
                  <View
                    className="size-8 rounded-sm border border-border"
                    style={{ backgroundColor: color }}
                  />
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {!hideInput && (
        <View className={cn("flex-row items-center gap-2", classNames?.field)}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className={cn("size-12 rounded-md border border-border", classNames?.preview)}
            style={{ backgroundColor: current ?? "transparent" }}
          />
          <Input
            accessibilityLabel={labels.hex}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            maxLength={7}
            editable={!disabled}
            value={text}
            onChangeText={typeText}
            onBlur={settle}
            font="mono"
            className={cn("flex-1", disabled && "opacity-50", classNames?.input)}
          />
        </View>
      )}
    </View>
  );
}
