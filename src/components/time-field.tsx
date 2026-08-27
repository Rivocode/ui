"use client";

import { useState, type ComponentProps, type KeyboardEvent } from "react";

import { cn } from "../lib/cn";
import { Input } from "./field";

const DAY = 24 * 60;

export function applyTimeMask(text: string): string {
  const digits = text.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function parseTime(text: string): number | undefined {
  const parts = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!parts) return undefined;

  const hours = Number(parts[1]);
  const minutes = Number(parts[2]);
  if (hours > 23 || minutes > 59) return undefined;

  return hours * 60 + minutes;
}

export function formatTime(minutes: number | undefined): string {
  if (minutes === undefined || Number.isNaN(minutes)) return "";

  const inDay = Math.min(Math.max(Math.round(minutes), 0), DAY - 1);
  const hours = String(Math.floor(inDay / 60)).padStart(2, "0");
  return `${hours}:${String(inDay % 60).padStart(2, "0")}`;
}

export function timeWindow(min?: string, max?: string): [number, number] {
  const start = parseTime(min ?? "") ?? 0;
  const end = parseTime(max ?? "") ?? DAY - 1;
  return start <= end ? [start, end] : [0, DAY - 1];
}

export function stepTime(
  from: number | undefined,
  direction: 1 | -1,
  step: number,
  bounds: [number, number],
): number {
  const [start, end] = bounds;
  if (from === undefined) return direction === 1 ? start : end;

  const grid = Math.min(Math.max(Math.round(step), 1), DAY);
  const next =
    direction === 1 ? (Math.floor(from / grid) + 1) * grid : (Math.ceil(from / grid) - 1) * grid;

  return Math.min(Math.max(next, start), end);
}

export type TimeFieldProps = Omit<
  ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange" | "onValueChange" | "size" | "min" | "max" | "step"
> & {
  /** A hora escolhida, em 24h e sempre `"HH:MM"`. Campo vazio e `""`. */
  value?: string;
  /** A hora inicial de quem nao controla o valor de fora. */
  defaultValue?: string;
  /** Chamado so com hora inteira: `"08:30"`, ou `""` quando o campo esvazia. Texto pela metade nao avisa ninguem. */
  onValueChange?: (value: string) => void;
  /** Tamanho do campo, o mesmo vocabulario do Input. */
  size?: "sm" | "md" | "lg";
  /** Quantos minutos as setas para cima e para baixo andam, pousando na grade. Nao recusa hora digitada fora dela. */
  step?: number;
  /** Primeira hora da janela, em `"HH:MM"`. Antes dela o campo se marca invalido. */
  min?: string;
  /** Ultima hora da janela, em `"HH:MM"`. Depois dela o campo se marca invalido. */
  max?: string;
  /** Some no formulario nativo com a hora inteira, e nunca com o texto pela metade. */
  name?: string;
};

export function TimeField({
  value,
  defaultValue,
  onValueChange,
  size,
  step = 15,
  min,
  max,
  className,
  placeholder = "hh:mm",
  disabled,
  name,
  onBlur,
  onKeyDown,
  "aria-invalid": invalidProp,
  ...props
}: TimeFieldProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() => formatTime(parseTime(defaultValue ?? "")));
  const current = controlled ? value : internal;

  const [text, setText] = useState(current);
  const [typing, setTyping] = useState(false);

  const bounds = timeWindow(min, max);
  const chosen = parseTime(current);
  const shown = typing ? text : chosen === undefined ? current : formatTime(chosen);
  const impossible = typing
    ? text.length === 5 && parseTime(text) === undefined
    : current !== "" && chosen === undefined;
  const outside = chosen !== undefined && (chosen < bounds[0] || chosen > bounds[1]);
  const invalid = invalidProp ?? (impossible || outside || undefined);

  function commit(next: string) {
    if (!controlled) setInternal(next);
    onValueChange?.(next);
  }

  function walk(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    event.preventDefault();
    const from = parseTime(shown);
    const next = stepTime(from, event.key === "ArrowUp" ? 1 : -1, step, bounds);
    setTyping(false);
    commit(formatTime(next));
  }

  return (
    <>
      <Input
        {...props}
        size={size}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={shown}
        aria-invalid={invalid}
        onChange={(event) => {
          const masked = applyTimeMask(event.target.value);
          setText(masked);
          setTyping(true);

          const minutes = parseTime(masked);
          if (minutes !== undefined) commit(formatTime(minutes));
          else if (masked === "") commit("");
        }}
        onBlur={(event) => {
          setTyping(false);
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (!event.defaultPrevented) walk(event);
        }}
        className={cn("tabular-nums aria-[invalid=true]:border-danger", className)}
      />

      {name && <input type="hidden" name={name} value={formatTime(chosen)} />}
    </>
  );
}
