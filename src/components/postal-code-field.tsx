"use client";

import { Check } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import {
  formatPostalCode,
  POSTAL_CODE_LENGTH,
  POSTAL_CODE_MESSAGES,
  postalCodeDigits,
  searchPostalCode,
  type PostalAddress,
  type PostalCodeLookup,
  type PostalCodeStatus,
} from "../shared/postal-code";
import { Input, type InputProps } from "./field";
import { Spinner } from "./spinner";

export type PostalCodeFieldProps = Omit<
  InputProps,
  "value" | "defaultValue" | "onValueChange" | "type" | "inputMode" | "maxLength"
> & {
  /**
   * A busca do endereco, escrita por quem usa: recebe os 8 digitos e o
   * `signal` da busca, e devolve o endereco ou `null` quando o CEP nao existe.
   * Rejeitar a promessa e falha de rede. A peca nao chama servico nenhum
   * sozinha.
   */
  lookup: PostalCodeLookup;
  /**
   * Chamado quando a busca acha o endereco, com ele e os 8 digitos. E aqui que
   * o resto do formulario se preenche.
   */
  onAddress?: (address: PostalAddress, postalCode: string) => void;
  /** O texto com mascara, quando quem usa controla o estado. Aceita so digitos tambem. */
  value?: string;
  /** O texto inicial, quando o campo controla o proprio estado. Nao dispara busca. */
  defaultValue?: string;
  /** Chamado a cada tecla, com o texto mascarado e os digitos. Guarde os digitos. */
  onValueChange?: (masked: string, digits: string) => void;
  /** Chamado a cada troca de estado da busca: `searching`, `found`, `notFound`, `failed`, `idle`. */
  onStatusChange?: (status: PostalCodeStatus) => void;
  /**
   * Os textos da peca, um a um: `searching`, `found`, `notFound`, `failed` e
   * `retry`. Sem eles, as frases em portugues.
   */
  labels?: Partial<typeof POSTAL_CODE_MESSAGES>;
  /** Classe por parte: `input`, `suffix` (o giro e o visto), `message` e `retry`. */
  classNames?: Slots<"input" | "suffix" | "message" | "retry">;
};

const SUFFIX_ROOM = {
  sm: "pr-8",
  md: "pr-9",
  lg: "pr-10",
} as const;

export function PostalCodeField({
  lookup,
  onAddress,
  value,
  defaultValue = "",
  onValueChange,
  onStatusChange,
  labels = {},
  size,
  className,
  classNames,
  onChange,
  disabled,
  ...props
}: PostalCodeFieldProps) {
  const messageId = useId();
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() => formatPostalCode(defaultValue));
  const text = controlled ? formatPostalCode(value) : internal;
  const digits = postalCodeDigits(text);

  const [searched, setSearched] = useState("");
  const [rawStatus, setRawStatus] = useState<PostalCodeStatus>("idle");
  const status: PostalCodeStatus = digits === searched ? rawStatus : "idle";

  const cancel = useRef<(() => void) | null>(null);
  const latest = useRef({ lookup, onAddress, onStatusChange });
  latest.current = { lookup, onAddress, onStatusChange };

  const said = { ...POSTAL_CODE_MESSAGES, ...labels };

  function settleStatus(next: PostalCodeStatus) {
    setRawStatus(next);
    latest.current.onStatusChange?.(next);
  }

  function run(postalCode: string) {
    cancel.current?.();
    setSearched(postalCode);
    settleStatus("searching");
    cancel.current = searchPostalCode(postalCode, latest.current.lookup, (outcome) => {
      cancel.current = null;
      settleStatus(outcome.status);
      if (outcome.status === "found") latest.current.onAddress?.(outcome.address, postalCode);
    });
  }

  useEffect(() => {
    if (digits === searched) return;
    cancel.current?.();
    cancel.current = null;
  }, [digits, searched]);

  useEffect(() => () => cancel.current?.(), []);

  const notFound = status === "notFound";
  const failed = status === "failed";
  const message = notFound ? said.notFound : failed ? said.failed : null;
  const announcement =
    status === "searching" ? said.searching : status === "found" ? said.found : (message ?? "");

  return (
    <div data-status={status} className={cn("flex w-full flex-col gap-1.5", className)}>
      <div className="relative">
        <Input
          autoComplete="postal-code"
          placeholder="00000-000"
          {...props}
          size={size}
          disabled={disabled}
          type="text"
          inputMode="numeric"
          maxLength={9}
          value={text}
          aria-invalid={notFound || undefined}
          aria-busy={status === "searching" || undefined}
          aria-describedby={message ? messageId : undefined}
          onChange={(event) => {
            const masked = formatPostalCode(event.target.value);
            const next = postalCodeDigits(masked);

            if (!controlled) setInternal(masked);
            onValueChange?.(masked, next);
            onChange?.(event);

            if (next === digits) return;
            if (next.length === POSTAL_CODE_LENGTH) {
              run(next);
            } else if (searched) {
              cancel.current?.();
              cancel.current = null;
              setSearched("");
              settleStatus("idle");
            }
          }}
          className={cn(
            SUFFIX_ROOM[size ?? "md"],
            "tabular-nums",
            notFound && "border-danger",
            classNames?.input,
          )}
        />

        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3",
            status === "found" ? "text-success-text" : "text-fg-subtle",
            classNames?.suffix,
          )}
        >
          {status === "searching" && <Spinner size="sm" label="" />}
          {status === "found" && <Check className="size-4" />}
        </span>
      </div>

      {message && (
        <p
          id={messageId}
          className={cn(
            "text-xs",
            notFound ? "text-danger-text" : "text-fg-muted",
            "animate-enter",
            classNames?.message,
          )}
        >
          {message}
          {failed && (
            <>
              {" "}
              <button
                type="button"
                disabled={disabled}
                onClick={() => run(digits)}
                className={cn(
                  "rounded-sm font-medium text-accent-text underline underline-offset-2",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:text-fg-disabled disabled:no-underline",
                  classNames?.retry,
                )}
              >
                {said.retry}
              </button>
            </>
          )}
        </p>
      )}

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
