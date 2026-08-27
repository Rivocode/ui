"use client";

import { Minus, Plus } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";

import { cn } from "../lib/cn";
import { useMobile } from "../lib/screen";
import { Input } from "./field";

const DAY = 24 * 60;

export const TouchStepElsewhere = createContext(false);

const HEIGHT = {
  sm: "h-[var(--rc-control-sm)]",
  md: "h-[var(--rc-control-md)]",
  lg: "h-[var(--rc-control-lg)]",
} as const;

const STEP = cn(
  "flex w-11 shrink-0 items-center justify-center text-fg-muted",
  "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
  "hover:bg-accent-subtle hover:text-fg",
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:-outline-offset-2",
  "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:hover:bg-transparent",
);

function labelOf(node: HTMLInputElement): string | undefined {
  const ids = node.getAttribute("aria-labelledby")?.trim();
  const sources = ids
    ? ids.split(/\s+/).map((id) => node.ownerDocument.getElementById(id))
    : [...(node.labels ?? [])];

  const text = sources
    .map((source) => source?.textContent?.trim() ?? "")
    .filter(Boolean)
    .join(" ");

  return text || undefined;
}

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
  /** Tamanho do campo, o mesmo vocabulario do Input. No celular o campo nunca fica abaixo de 44px, que e o alvo do dedo. */
  size?: "sm" | "md" | "lg";
  /** Quantos minutos o passo anda, pousando na grade. Anda pelas setas no teclado e pelos botoes de mais e de menos no celular. Nao recusa hora digitada fora dela. */
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
  size = "md",
  step = 15,
  min,
  max,
  className,
  placeholder = "hh:mm",
  disabled,
  name,
  onBlur,
  onKeyDown,
  ref,
  "aria-label": ariaLabel,
  "aria-invalid": invalidProp,
  ...props
}: TimeFieldProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() => formatTime(parseTime(defaultValue ?? "")));
  const current = controlled ? value : internal;

  const [text, setText] = useState(current);
  const [typing, setTyping] = useState(false);
  const [stepped, setStepped] = useState("");

  const input = useRef<HTMLInputElement>(null);
  const [labelled, setLabelled] = useState<string>();

  const isMobile = useMobile();
  const elsewhere = useContext(TouchStepElsewhere);
  const steppers = isMobile && !elsewhere;

  const named = ariaLabel ?? labelled;

  useEffect(() => {
    const node = input.current;
    if (!steppers || ariaLabel !== undefined || !node) {
      setLabelled(undefined);
      return;
    }

    const read = () => setLabelled(labelOf(node));
    read();

    const watch = new MutationObserver(read);
    watch.observe(node, { attributes: true, attributeFilter: ["aria-labelledby"] });
    return () => watch.disconnect();
  }, [steppers, ariaLabel]);

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

  function move(direction: 1 | -1) {
    setTyping(false);

    const next = formatTime(stepTime(parseTime(shown), direction, step, bounds));
    setStepped(next);
    commit(next);
  }

  function walk(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    event.preventDefault();
    move(event.key === "ArrowUp" ? 1 : -1);
  }

  const control = (
    <Input
      {...props}
      ref={(node: HTMLInputElement | null) => {
        input.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      size={size}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      placeholder={placeholder}
      value={shown}
      aria-label={ariaLabel}
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
      className={cn(
        "tabular-nums aria-[invalid=true]:border-danger",
        steppers && [
          "h-full min-w-0 flex-1 rounded-none border-0 text-center",
          "focus-visible:ring-0 focus-visible:ring-offset-0",
          "aria-[invalid=true]:border-0",
        ],
        !steppers && className,
      )}
    />
  );

  const stepper = (direction: 1 | -1) => (
    <button
      type="button"
      disabled={disabled}
      aria-label={
        direction === 1
          ? `Aumentar${named ? ` ${named}` : ""}`
          : `Diminuir${named ? ` ${named}` : ""}`
      }
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => move(direction)}
      className={cn(STEP, direction === 1 ? "border-l border-border" : "border-r border-border")}
    >
      {direction === 1 ? (
        <Plus size={16} aria-hidden="true" />
      ) : (
        <Minus size={16} aria-hidden="true" />
      )}
    </button>
  );

  const hidden = name ? <input type="hidden" name={name} value={formatTime(chosen)} /> : null;

  const announcement = (
    <div role="status" aria-live="polite" className="sr-only">
      {stepped}
    </div>
  );

  if (!steppers) {
    return (
      <>
        {control}
        {announcement}
        {hidden}
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          "flex w-full items-stretch overflow-hidden rounded-md border bg-surface",
          HEIGHT[size],
          "min-h-11",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "focus-within:ring-offset-bg",
          invalid ? "border-danger" : "border-border-strong",
          disabled && "cursor-not-allowed",
          className,
        )}
      >
        {stepper(-1)}
        {control}
        {stepper(1)}
      </div>

      {announcement}
      {hidden}
    </>
  );
}
