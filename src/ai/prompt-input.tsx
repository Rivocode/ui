"use client";

import { ArrowUp, Square } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { IconButton } from "../components/icon-button";
import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";

export type PromptInputLabels = {
  hint: string;
  count: (count: number, max?: number) => string;
  limit: (max: number) => string;
};

const LABELS: PromptInputLabels = {
  hint: "Enter envia, Shift+Enter quebra a linha.",
  count: (count, max) =>
    max === undefined ? `${count} caracteres` : `${count} de ${max} caracteres`,
  limit: (max) => `Limite de ${max} caracteres atingido.`,
};

export type PromptInputProps = Omit<
  ComponentPropsWithoutRef<"form">,
  "onSubmit" | "onChange" | "defaultValue"
> & {
  /** O texto do campo, controlado. Sem ele, a peca guarda o texto e o limpa ao enviar. */
  value?: string;
  /** O texto inicial, quando a peca guarda o proprio estado. */
  defaultValue?: string;
  /** Chamado a cada tecla, com o texto inteiro. */
  onValueChange?: (value: string) => void;
  /**
   * Chamado com o texto ao apertar Enter ou o botao de enviar. Nao dispara com
   * o campo vazio (so espaco conta como vazio), desabilitado ou em `streaming`.
   * No modo controlado, quem limpa o campo e quem chamou.
   */
  onSubmit?: (value: string) => void;
  /**
   * A resposta esta chegando: o botao de enviar vira o de parar, e Enter deixa
   * de enviar. O campo continua aceitando texto, para a proxima pergunta.
   */
  streaming?: boolean;
  /** Chamado pelo botao de parar, que so existe em `streaming`. */
  onStop?: () => void;
  /** Trava o campo e o envio. Anunciado ao leitor de tela pelo proprio campo. */
  disabled?: boolean;
  placeholder?: string;
  /** O nome do campo para o leitor de tela. Sem ele, "Mensagem". */
  label?: string;
  /** O nome do botao de enviar. Sem ele, "Enviar mensagem". */
  submitLabel?: string;
  /** O nome do botao de parar. Sem ele, "Parar resposta". */
  stopLabel?: string;
  /** Quantas linhas o campo cresce antes de rolar por dentro. Sem ele, 8. */
  maxRows?: number;
  /** O teto de caracteres. O campo recusa o que passa dele. */
  maxLength?: number;
  /**
   * Mostra a contagem de caracteres no rodape, como `120/4000` quando ha
   * `maxLength`. Fica no tom de perigo ao bater no teto.
   */
  showCount?: boolean;
  /**
   * Os anexos ja escolhidos, acima do campo: fichas, miniaturas. A peca nao
   * escolhe arquivo nenhum, so reserva o lugar.
   */
  attachments?: ReactNode;
  /** Os botoes do rodape, a esquerda: anexar, escolher modelo, ditar. */
  actions?: ReactNode;
  /**
   * Os textos que o leitor de tela ouve, para trocar o idioma: `hint` e a dica
   * do teclado ligada ao campo, `count` o que se ouve do contador e `limit` o
   * aviso ao bater no teto. Passe so os que mudam.
   */
  labels?: Partial<PromptInputLabels>;
  classNames?: Slots<"attachments" | "textarea" | "footer" | "count" | "submit">;
};

export function PromptInput({
  value,
  defaultValue = "",
  onValueChange,
  onSubmit,
  streaming = false,
  onStop,
  disabled = false,
  placeholder = "Escreva uma mensagem",
  label = "Mensagem",
  submitLabel = "Enviar mensagem",
  stopLabel = "Parar resposta",
  maxRows = 8,
  maxLength,
  showCount = false,
  attachments,
  actions,
  labels: labelsProp,
  className,
  classNames,
  ...props
}: PromptInputProps) {
  const [own, setOwn] = useState(defaultValue);
  const controlled = value !== undefined;
  const text = controlled ? value : own;
  const labels = { ...LABELS, ...labelsProp };
  const area = useRef<HTMLTextAreaElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const hintId = useId();
  const countId = useId();

  const empty = text.trim() === "";
  const blocked = disabled || streaming || empty;
  const full = maxLength !== undefined && text.length >= maxLength;

  const fit = useCallback(() => {
    const node = area.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, []);

  useLayoutEffect(fit, [text, fit]);

  useEffect(() => {
    const node = area.current;
    if (!node) return;
    let alive = true;
    let width = node.getBoundingClientRect().width;
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver((entries) => {
            const next = entries[0]?.contentRect.width ?? width;
            if (next === width) return;
            width = next;
            fit();
          });
    observer?.observe(node);
    document.fonts?.ready.then(() => {
      if (alive) fit();
    });
    return () => {
      alive = false;
      observer?.disconnect();
    };
  }, [fit]);

  const buttonOff = !streaming && blocked;
  useLayoutEffect(() => {
    const node = button.current;
    if (buttonOff && node && node === document.activeElement && !disabled) area.current?.focus();
  }, [buttonOff, streaming, disabled]);

  function change(next: string) {
    if (!controlled) setOwn(next);
    onValueChange?.(next);
  }

  function send() {
    if (blocked) return;
    onSubmit?.(text);
    if (!controlled) setOwn("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send();
  }

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    send();
  }

  return (
    <form
      {...props}
      onSubmit={submit}
      data-streaming={streaming || undefined}
      data-disabled={disabled || undefined}
      className={cn(
        "flex w-full flex-col gap-2 rounded-lg border border-border-strong bg-surface p-2 font-sans",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-ring",
        "has-[textarea:focus-visible]:ring-offset-2 has-[textarea:focus-visible]:ring-offset-bg",
        className,
      )}
    >
      {attachments && (
        <div className={cn("flex flex-wrap gap-2 px-1 pt-1", classNames?.attachments)}>
          {attachments}
        </div>
      )}

      <textarea
        ref={area}
        rows={1}
        value={text}
        onChange={(event) => change(event.target.value)}
        onKeyDown={keyDown}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-label={label}
        aria-describedby={showCount ? `${hintId} ${countId}` : hintId}
        style={{ maxHeight: `calc(${maxRows} * var(--rc-leading-normal) * 1em + 1rem)` }}
        className={cn(
          "w-full resize-none overflow-y-auto bg-transparent px-2 py-2 text-base text-fg",
          "leading-[var(--rc-leading-normal)] outline-none placeholder:text-fg-subtle",
          "max-sm:text-[16px] disabled:cursor-not-allowed disabled:text-fg-disabled",
          classNames?.textarea,
        )}
      />
      <span id={hintId} className="sr-only">
        {labels.hint}
      </span>

      <div className={cn("flex items-center gap-2", classNames?.footer)}>
        <div className="flex min-w-0 flex-1 items-center gap-1">{actions}</div>

        {showCount && (
          <span
            aria-hidden="true"
            className={cn(
              "font-mono text-xs tabular-nums",
              full ? "text-danger-text" : "text-fg-subtle",
              classNames?.count,
            )}
          >
            {maxLength === undefined ? text.length : `${text.length}/${maxLength}`}
          </span>
        )}
        {showCount && (
          <span id={countId} className="sr-only">
            {labels.count(text.length, maxLength)}
          </span>
        )}
        {maxLength !== undefined && (
          <span role="status" className="sr-only">
            {full ? labels.limit(maxLength) : ""}
          </span>
        )}

        {streaming ? (
          <IconButton
            ref={button}
            type="button"
            label={stopLabel}
            size="sm"
            variant="secondary"
            onClick={onStop}
            className={classNames?.submit}
          >
            <Square className="fill-current" />
          </IconButton>
        ) : (
          <IconButton
            ref={button}
            type="submit"
            label={submitLabel}
            size="sm"
            disabled={blocked}
            className={classNames?.submit}
          >
            <ArrowUp />
          </IconButton>
        )}
      </div>
    </form>
  );
}
