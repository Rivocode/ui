import { useState } from "react";
import { Pressable, View } from "react-native";

import { cn } from "./cn";
import { Input } from "./field";
import { Text } from "./text";

export type ColorSwatch = string | { value: string; label: string };

export type ColorPickerProps = {
  /** A cor escolhida, em hexadecimal de seis dígitos. Vazio é `""`. */
  value: string;
  /** Avisado com o hexadecimal normalizado, sempre de seis dígitos e minúsculo. */
  onValueChange: (value: string) => void;
  /**
   * As amostras. Sem elas, um leque de tons gerado — útil para experimentar, e
   * não para representar uma marca: um construtor de tema entrega aqui a
   * paleta do cliente.
   */
  swatches?: ColorSwatch[];
  /** Quantas amostras por linha. */
  columns?: number;
  /** O texto acima das amostras. */
  label?: string;
  /** O que o leitor de tela chama o conjunto quando não há `label`. */
  swatchesLabel?: string;
  /** Esconde o campo de texto e deixa só as amostras. */
  hideInput?: boolean;
  disabled?: boolean;
  className?: string;
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

const nameOf = (swatch: ColorSwatch) =>
  typeof swatch === "string" ? `Cor ${swatch}` : `${swatch.label}, ${swatch.value}`;

function inRows<T>(items: T[], perRow: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += perRow) {
    rows.push(items.slice(index, index + perRow));
  }
  return rows;
}

export function ColorPicker({
  value,
  onValueChange,
  swatches = DEFAULT_SWATCHES,
  columns = DEFAULT_COLUMNS,
  label,
  swatchesLabel = "Amostras de cor",
  hideInput,
  disabled,
  className,
}: ColorPickerProps) {
  const [text, setText] = useState(value);
  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    setText(value);
  }

  function choose(color: string) {
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
      {label && <Text className="text-sm font-medium text-fg">{label}</Text>}

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label ?? swatchesLabel}
        className="gap-2"
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
                  accessibilityLabel={nameOf(swatch)}
                  disabled={disabled}
                  onPress={() => choose(color)}
                  className={cn(
                    "size-11 items-center justify-center rounded-md border-2",
                    selected ? "border-accent" : "border-transparent",
                    disabled && "opacity-50",
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
        <View className="flex-row items-center gap-2">
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="size-12 rounded-md border border-border"
            style={{ backgroundColor: current ?? "transparent" }}
          />
          <Input
            accessibilityLabel="Código hexadecimal da cor"
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
            className={cn("flex-1", disabled && "opacity-50")}
          />
        </View>
      )}
    </View>
  );
}
