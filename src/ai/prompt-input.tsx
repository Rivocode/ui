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
import { PROMPT_INPUT_COUNT, type PromptInputLabels } from "../shared/ai";

const LABELS: PromptInputLabels = {
  hint: "Enter envia, Shift+Enter quebra a linha.",
  submit: "Enviar mensagem",
  stop: "Parar resposta",
  ...PROMPT_INPUT_COUNT,
};

export type PromptInputProps = Omit<
  ComponentPropsWithoutRef<"form">,
  "onSubmit" | "onChange" | "defaultValue"
> & {
  /** The field's text, controlled. Without it, the piece keeps the text and clears it on submit. */
  value?: string;
  /** The initial text, when the piece keeps its own state. */
  defaultValue?: string;
  /** Called on every keystroke, with the whole text. */
  onValueChange?: (value: string) => void;
  /**
   * Called with the text on Enter or the send button. Does not fire with
   * the field empty (whitespace only counts as empty), disabled or in `streaming`.
   * In controlled mode, whoever called it clears the field.
   */
  onSubmit?: (value: string) => void;
  /**
   * The answer is arriving: the send button becomes the stop button, and Enter stops
   * sending. The field keeps accepting text, for the next question.
   */
  streaming?: boolean;
  /** Called by the stop button, which only exists in `streaming`. */
  onStop?: () => void;
  /** Locks the field and sending. Announced to the screen reader by the field itself. */
  disabled?: boolean;
  placeholder?: string;
  /** The field's name for the screen reader. Without it, "Mensagem". */
  label?: string;
  /** How many lines the field grows before scrolling inside. Without it, 8. */
  maxRows?: number;
  /** The character cap. The field refuses whatever goes past it. */
  maxLength?: number;
  /**
   * Shows the character count in the footer, like `120/4000` when there is
   * `maxLength`. Turns to the danger tone when it hits the cap.
   */
  showCount?: boolean;
  /**
   * The attachments already chosen, above the field: chips, thumbnails. The piece does not
   * pick any file, it only reserves the space.
   */
  attachments?: ReactNode;
  /** The footer buttons, on the left: attach, choose model, dictate. */
  actions?: ReactNode;
  /**
   * The piece's texts, to change the language: `submit` and `stop` are the names of the
   * send and stop buttons, `hint` the keyboard hint tied to the field,
   * `count` what is heard from the counter and `limit` the warning on hitting the cap.
   * Pass only the ones that change.
   */
  labels?: Partial<PromptInputLabels>;
  classNames?: Slots<"attachments" | "textarea" | "footer" | "count" | "submit">;
};

export type { PromptInputLabels };

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
            label={labels.stop}
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
            label={labels.submit}
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
