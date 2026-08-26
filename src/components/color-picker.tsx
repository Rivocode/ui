"use client";

import {
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { Input } from "./field";

export type ColorSwatch = string | { value: string; label: string };

export type ColorPickerProps = Omit<ComponentProps<"div">, "defaultValue" | "children"> & {
  /** A cor escolhida, em hexadecimal de seis digitos. Controlado. */
  value?: string;
  /** A cor inicial de quem nao controla o valor de fora. */
  defaultValue?: string;
  /** Avisado com o hexadecimal normalizado, sempre de seis digitos e minusculo. */
  onValueChange?: (value: string) => void;
  /**
   * As amostras da grade. Sem elas, um leque de tons gerado - util para
   * experimentar, e nao para representar uma marca: um construtor de tema
   * entrega aqui a paleta do cliente.
   */
  swatches?: ColorSwatch[];
  /** Quantas amostras por linha. E tambem o passo das setas para cima e para baixo. */
  columns?: number;
  /** Texto acima da grade. Sem ele, passe `aria-label` no `swatchesLabel`. */
  label?: ReactNode;
  /** O que o leitor de tela chama a grade quando nao ha `label`. */
  swatchesLabel?: string;
  /** Esconde o campo de texto e deixa so a grade. */
  hideInput?: boolean;
  disabled?: boolean;
  className?: string;
  /** Classe por parte: `label`, `swatches`, `swatch`, `field`, `preview`, `input`. */
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

const DEFAULT_COLUMNS = 10;

const DEFAULT_SWATCHES: string[] = [70, 55, 38].flatMap((lightness) =>
  Array.from({ length: DEFAULT_COLUMNS }, (_, index) =>
    fromWheel((index * 360) / DEFAULT_COLUMNS, 68, lightness),
  ),
);

const valueOf = (swatch: ColorSwatch) => (typeof swatch === "string" ? swatch : swatch.value);

const nameOf = (swatch: ColorSwatch) =>
  typeof swatch === "string" ? `Cor ${swatch}` : `${swatch.label}, ${swatch.value}`;

export function ColorPicker({
  value: valueProp,
  defaultValue,
  onValueChange,
  swatches = DEFAULT_SWATCHES,
  columns = DEFAULT_COLUMNS,
  label,
  swatchesLabel = "Amostras de cor",
  hideInput,
  disabled,
  className,
  classNames,
  ...rest
}: ColorPickerProps) {
  const labelId = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const value = valueProp ?? internalValue;

  const [text, setText] = useState(value);
  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    setText(value);
  }

  function change(color: string) {
    setSeenValue(color);
    if (valueProp === undefined) setInternalValue(color);
    onValueChange?.(color);
  }

  function choose(color: string) {
    setText(color);
    change(color);
  }

  function typeText(raw: string) {
    setText(raw);
    const color = normalizeColor(raw);
    if (color) change(color);
  }

  function settle() {
    setText(normalizeColor(text) ?? value);
  }

  const current = normalizeColor(value);
  const selected =
    current === null
      ? -1
      : swatches.findIndex((swatch) => normalizeColor(valueOf(swatch)) === current);

  const focusable = selected === -1 ? 0 : selected;

  function walk(event: KeyboardEvent<HTMLDivElement>) {
    const last = swatches.length - 1;
    const step: Record<string, number | undefined> = {
      ArrowRight: focusable + 1,
      ArrowLeft: focusable - 1,
      ArrowDown: focusable + columns,
      ArrowUp: focusable - columns,
      Home: 0,
      End: last,
    };

    const target = step[event.key];
    if (target === undefined) return;

    if (target < 0 || target > last) return;

    event.preventDefault();
    const swatch = swatches[target];
    if (!swatch) return;
    buttons.current[target]?.focus();
    choose(valueOf(swatch));
  }

  return (
    <div {...rest} className={cn("flex flex-col gap-2", className)}>
      {label && (
        <span id={labelId} className={cn("font-sans text-sm text-fg", classNames?.label)}>
          {label}
        </span>
      )}

      <div
        role="radiogroup"
        aria-label={label ? undefined : swatchesLabel}
        aria-labelledby={label ? labelId : undefined}
        onKeyDown={walk}
        className={cn("grid w-fit gap-1.5", classNames?.swatches)}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {swatches.map((swatch, index) => {
          const color = valueOf(swatch);
          const isSelected = index === selected;
          return (
            <button
              key={`${color}-${index}`}
              ref={(node) => {
                buttons.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={nameOf(swatch)}
              disabled={disabled}
              tabIndex={index === focusable ? 0 : -1}
              onClick={() => choose(color)}
              className={cn(
                "size-7 rounded-md border border-border",
                "outline-none disabled:cursor-not-allowed disabled:opacity-60",
                "transition-transform duration-[var(--rc-duration-fast)] ease-rc",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "focus-visible:ring-offset-bg",
                isSelected && "ring-2 ring-ring ring-offset-2 ring-offset-bg",
                classNames?.swatch,
              )}
              style={{ backgroundColor: color }}
            />
          );
        })}
      </div>

      {!hideInput && (
        <div className={cn("flex items-center gap-2", classNames?.field)}>
          <span
            aria-hidden="true"
            className={cn(
              "size-[var(--rc-control-md)] shrink-0 rounded-md border border-border",
              classNames?.preview,
            )}
            style={{ backgroundColor: current ?? "transparent" }}
          />
          <Input
            aria-label="Código hexadecimal da cor"
            spellCheck={false}
            autoComplete="off"
            disabled={disabled}
            value={text}
            onChange={(event) => typeText(event.target.value)}
            onBlur={settle}
            className={cn("font-mono", classNames?.input)}
          />
        </div>
      )}
    </div>
  );
}
