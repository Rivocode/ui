"use client";

import { useLayoutEffect, useMemo, useRef, useState, type ComponentProps } from "react";

import { applyMask, unmask, type Mask } from "../lib/mask";
import { assignRefs } from "../lib/refs";
import { isNumericMask } from "../shared/mask";
import { Input } from "./field";

export type MaskedInputProps = Omit<ComponentProps<typeof Input>, "onValueChange" | "value" | "defaultValue"> & {
  /** Nome de molde pronto, molde escrito na mao, ou `moeda`. */
  mask: Mask;
  /** O texto ja com mascara, quando quem usa controla o estado. */
  value?: string;
  /** O texto inicial, quando o componente controla o proprio estado. */
  defaultValue?: string;
  /**
   * Chamado a cada tecla, com o texto mascarado e o cru. Guarde o cru: e ele
   * que o servidor entende, e a pontuacao e assunto de tela.
   */
  onValueChange?: (masked: string, raw: string) => void;
};

function isData(character: string): boolean {
  return /[a-zA-Z0-9]/.test(character);
}

function countData(text: string): number {
  let count = 0;
  for (const character of text) if (isData(character)) count += 1;
  return count;
}

function caretAfterData(text: string, count: number): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (isData(text[index]!)) seen += 1;
    if (seen === count) return index + 1;
  }
  return text.length;
}

function caretBeforeDataFromEnd(text: string, count: number): number {
  if (count <= 0) return text.length;
  let seen = 0;
  for (let index = text.length - 1; index >= 0; index -= 1) {
    if (isData(text[index]!)) seen += 1;
    if (seen === count) return index;
  }
  return 0;
}

export function MaskedInput({
  mask,
  value,
  defaultValue = "",
  onValueChange,
  onChange,
  inputMode,
  ref,
  ...props
}: MaskedInputProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() => applyMask(defaultValue, mask));
  const text = controlled ? value : internal;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingCaret = useRef<number | null>(null);
  const setRefs = useMemo(() => assignRefs(inputRef, ref), [ref]);

  useLayoutEffect(() => {
    const pending = pendingCaret.current;
    pendingCaret.current = null;
    const input = inputRef.current;
    if (pending === null || !input || input.ownerDocument.activeElement !== input) return;
    const position = Math.min(pending, input.value.length);
    input.setSelectionRange(position, position);
  });

  const digitsOnly = isNumericMask(mask);

  return (
    <Input
      {...props}
      ref={setRefs}
      value={text}
      inputMode={inputMode ?? (digitsOnly ? "numeric" : undefined)}
      onChange={(event) => {
        const raw = event.target.value;
        const masked = applyMask(raw, mask);
        const caret = event.target.selectionStart ?? raw.length;
        const before = raw.slice(0, caret);
        if (mask === "moeda") pendingCaret.current = caretBeforeDataFromEnd(masked, countData(raw.slice(caret)));
        else if (masked.startsWith(before)) pendingCaret.current = caret;
        else pendingCaret.current = caretAfterData(masked, countData(before));

        if (!controlled) setInternal(masked);
        onValueChange?.(masked, unmask(masked));
        onChange?.(event);
      }}
    />
  );
}
