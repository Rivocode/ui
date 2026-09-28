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
import { applyTimeMask, formatTime, parseTime, stepTime, timeWindow } from "../shared/time";
import { Input, UnnamedInput, useFieldDisabled, useFieldName } from "./field";

export { applyTimeMask, formatTime, parseTime, stepTime, timeWindow };

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

export type TimeFieldProps = Omit<
  ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange" | "onValueChange" | "size" | "min" | "max" | "step" | "name"
> & {
  /** The chosen time, in 24h and always `"HH:MM"`. An empty field is `""`. */
  value?: string;
  /** The initial time for whoever does not control the value from outside. */
  defaultValue?: string;
  /**
   * Called only with a whole time: `"08:30"`, or `""` when the field empties. Half-typed text
   * notifies nobody.
   */
  onValueChange?: (value: string) => void;
  /**
   * The field's size, the same vocabulary as Input. On the phone the field is never below 44px,
   * which is the finger target.
   */
  size?: "sm" | "md" | "lg";
  /**
   * How many minutes the step moves, landing on the grid. Moves by the arrows on the keyboard and
   * by the plus and minus buttons on the phone. Does not refuse a typed time outside it.
   */
  step?: number;
  /** First time of the window, in `"HH:MM"`. Before it the field marks itself invalid. */
  min?: string;
  /** Last time of the window, in `"HH:MM"`. After it the field marks itself invalid. */
  max?: string;
  /**
   * Goes up in the native form with the whole time, never with half-typed text. Inside `<Field
   * name>`, without it, the Field's name applies. When disabled, it stays out.
   */
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

  const fieldName = useFieldName();
  const fieldDisabled = useFieldDisabled();
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
      render={<UnnamedInput />}
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

  const submitName = name ?? fieldName;
  const hidden = submitName ? (
    <input
      type="hidden"
      name={submitName}
      value={formatTime(chosen)}
      disabled={disabled || fieldDisabled}
    />
  ) : null;

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
