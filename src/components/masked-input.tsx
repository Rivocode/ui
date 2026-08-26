"use client";

import { useState, type ComponentProps } from "react";

import { applyMask, unmask, type Mask } from "../lib/mask";
import { Input } from "./field";

export type MaskedInputProps = Omit<ComponentProps<typeof Input>, "onValueChange" | "value"> & {
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

export function MaskedInput({
  mask,
  value,
  defaultValue = "",
  onValueChange,
  onChange,
  inputMode,
  ...props
}: MaskedInputProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() =>
    applyMask(defaultValue, mask),
  );
  const text = controlled ? value : internal;

  const digitsOnly = mask === "moeda" || /^[9\W]+$/.test(String(mask)) || mask in NUMERIC_PATTERNS;

  return (
    <Input
      {...props}
      value={text}
      inputMode={inputMode ?? (digitsOnly ? "numeric" : undefined)}
      onChange={(event) => {
        const raw = event.target.value;
        const masked = applyMask(raw, mask);

        if (!controlled) setInternal(masked);
        onValueChange?.(masked, unmask(masked));
        onChange?.(event);
      }}
    />
  );
}

const NUMERIC_PATTERNS = {
  cpf: true,
  cnpj: true,
  cep: true,
  data: true,
  hora: true,
  cartao: true,
  telefone: true,
} as const;
