"use client";

import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import {
  formatCents,
  outsideCents,
  readCurrencyInput,
  readPastedCurrency,
} from "../shared/currency";
import { Input, UnnamedInput, useFieldDisabled, useFieldName, type InputProps } from "./field";

export type CurrencyInputProps = Omit<
  InputProps,
  | "value"
  | "defaultValue"
  | "onValueChange"
  | "type"
  | "inputMode"
  | "min"
  | "max"
  | "step"
  | "prefix"
  | "name"
> & {
  /** O valor em centavos inteiros: `123456` e R$ 1.234,56. Campo vazio e `null`. */
  value?: number | null;
  /** O valor inicial em centavos, quando o campo controla o proprio estado. */
  defaultValue?: number | null;
  /**
   * Chamado a cada tecla com os centavos, ou `null` quando o campo esvazia.
   * Guarde os centavos: o texto pontuado e assunto de tela.
   */
  onValueChange?: (cents: number | null) => void;
  /** O menor valor aceito, em centavos. Abaixo dele o campo se marca invalido, e nada e corrigido sozinho. */
  min?: number;
  /** O maior valor aceito, em centavos. Acima dele o campo se marca invalido, e nada e corrigido sozinho. */
  max?: number;
  /**
   * Aceita valor negativo. O sinal entra pelo `-`, em qualquer ponto do campo,
   * e um segundo `-` tira o sinal. Ligado, o teclado do celular deixa de ser o
   * numerico, que no iPhone nao tem o sinal.
   */
  allowNegative?: boolean;
  /** Some no formulario nativo com os centavos, e nunca com o texto pontuado. Dentro de `<Field name>`, sem ele, vale o nome do Field. */
  name?: string;
  /** Classe por parte: `input` e `prefix` (o "R$"). `className` veste a raiz. */
  classNames?: Slots<"input" | "prefix">;
};

const PREFIX_ROOM = {
  sm: "pl-[calc(var(--rc-control-pad-sm)+1.5rem)]",
  md: "pl-[calc(var(--rc-control-pad-md)+1.75rem)]",
  lg: "pl-[calc(var(--rc-control-pad-lg)+2rem)]",
} as const;

const PREFIX_SPOT = {
  sm: "pl-[var(--rc-control-pad-sm)] text-sm",
  md: "pl-[var(--rc-control-pad-md)] text-base",
  lg: "pl-[var(--rc-control-pad-lg)] text-md",
} as const;

export function CurrencyInput({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  allowNegative = false,
  name,
  size,
  className,
  classNames,
  disabled,
  placeholder = "0,00",
  onChange,
  onPaste,
  ref,
  "aria-invalid": invalidProp,
  "aria-describedby": describedByProp,
  ...props
}: CurrencyInputProps) {
  const unitId = useId();
  const controlled = value !== undefined;
  const [internal, setInternal] = useState<number | null>(defaultValue);
  const cents = controlled ? value : internal;

  const fieldName = useFieldName();
  const fieldDisabled = useFieldDisabled();
  const submitName = name ?? fieldName;
  const [sign, setSign] = useState<{ minus: boolean; at: number | null }>({
    minus: false,
    at: null,
  });
  const minus = sign.minus && sign.at === cents;
  const shown = cents === null ? (minus && allowNegative ? "-" : "") : formatCents(cents);

  const input = useRef<HTMLInputElement | null>(null);
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  useLayoutEffect(() => {
    const node = input.current;
    if (!node || node.ownerDocument.activeElement !== node) return;
    node.setSelectionRange(shown.length, shown.length);
  }, [shown]);

  function commit(next: number | null) {
    if (next === cents) return;
    if (!controlled) setInternal(next);
    onValueChange?.(next);
  }

  const outside = outsideCents(cents, min, max);
  const invalid = invalidProp ?? (outside || undefined);
  const spot = size ?? "md";

  return (
    <div className={cn("relative w-full", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 flex items-center select-none",
          PREFIX_SPOT[spot],
          disabled ? "text-fg-disabled" : "text-fg-subtle",
          classNames?.prefix,
        )}
      >
        R$
      </span>
      <span id={unitId} hidden>
        em reais
      </span>

      <Input
        autoComplete="off"
        {...props}
        render={<UnnamedInput />}
        ref={attach}
        size={size}
        disabled={disabled}
        placeholder={placeholder}
        type="text"
        inputMode={allowNegative ? "text" : "numeric"}
        value={shown}
        aria-invalid={invalid}
        aria-describedby={describedByProp ? `${unitId} ${describedByProp}` : unitId}
        onChange={(event) => {
          const reading = readCurrencyInput(event.target.value, shown, allowNegative);

          setSign({ minus: reading.minus, at: reading.cents });
          commit(reading.cents);
          onChange?.(event);
        }}
        onBlur={(event) => {
          if (cents === null && sign.minus) setSign({ minus: false, at: null });
          props.onBlur?.(event);
        }}
        onPaste={(event) => {
          onPaste?.(event);
          if (event.defaultPrevented) return;

          event.preventDefault();
          const pasted = readPastedCurrency(event.clipboardData.getData("text"), allowNegative);
          if (pasted === null) return;

          setSign({ minus: false, at: pasted });
          commit(pasted);
        }}
        className={cn(
          PREFIX_ROOM[spot],
          "tabular-nums aria-[invalid=true]:border-danger",
          classNames?.input,
        )}
      />

      {submitName ? (
        <input
          type="hidden"
          name={submitName}
          value={cents ?? ""}
          disabled={disabled || fieldDisabled}
        />
      ) : null}
    </div>
  );
}
