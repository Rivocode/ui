"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import {
  useId,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export type TrackerPoint = {
  /** O que aconteceu nesse periodo. */
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
  /** O que o leitor de tela ouve e o que a dica mostra. */
  label: ReactNode;
};

const TONE: Record<NonNullable<TrackerPoint["tone"]>, string> = {
  neutral: "bg-skeleton",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  accent: "bg-accent-text",
};

export type TrackerProps = Omit<ComponentProps<"div">, "children"> & {
  data: TrackerPoint[];
  /** O que a faixa mede, dito por extenso para o leitor de tela. */
  label: string;
  /** Classe por parte: `label`, `track`, `cell`. */
  classNames?: Slots<"label" | "track" | "cell">;
};

export function Tracker({
  data,
  label,
  className,
  classNames,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: TrackerProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<number | null>(null);

  const labelId = useId();
  const rtl = useDirection() === "rtl";
  const last = data.length - 1;
  const clamp = (index: number) => Math.min(Math.max(index, 0), last);
  const step = data.length > 0 ? 100 / data.length : 0;

  const reading = hovered ?? focused;
  const open = data.length > 0 && reading !== null && reading !== dismissed;

  const [shown, setShown] = useState(0);
  if (reading !== null && reading !== shown) setShown(reading);

  function read(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width <= 0 || data.length === 0) return;

    const offset = rtl ? box.right - event.clientX : event.clientX - box.left;
    setHovered(clamp(Math.floor((offset / box.width) * data.length)));
  }

  function walk(event: KeyboardEvent<HTMLDivElement>) {
    if (data.length === 0) return;

    if (event.key === "Escape") {
      setDismissed(reading);
      return;
    }

    const from = focused ?? last;
    const ahead = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    const next =
      event.key === ahead
        ? from + 1
        : event.key === back
          ? from - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;

    if (next === null) return;

    event.preventDefault();
    setFocused(clamp(next));
    setDismissed(null);
  }

  return (
    <div {...props} className={cn("flex flex-col gap-1.5", className)}>
      <p id={labelId} aria-hidden="true" className={cn("sr-only", classNames?.label)}>
        {label}
      </p>

      <div
        role="group"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy ?? (ariaLabel ? undefined : labelId)}
        tabIndex={0}
        onPointerMove={read}
        onPointerDown={read}
        onPointerLeave={() => setHovered(null)}
        onPointerCancel={() => setHovered(null)}
        onKeyDown={walk}
        onFocus={() => {
          if (data.length > 0) setFocused((current) => current ?? last);
        }}
        onBlur={() => {
          setFocused(null);
          setDismissed(null);
        }}
        className={cn(
          "relative flex w-full items-stretch gap-0.5",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          classNames?.track,
        )}
      >
        {data.map((point, index) => (
          <div
            key={index}
            data-rc-track={point.tone ?? "neutral"}
            className={cn(
              "h-7 min-w-0 flex-1 rounded-sm",
              TONE[point.tone ?? "neutral"],
              classNames?.cell,
            )}
          />
        ))}

        <Tooltip
          open={open}
          onOpenChange={(next) => {
            if (!next) setDismissed(reading);
          }}
        >
          <TooltipTrigger
            render={
              <div
                aria-hidden="true"
                data-rc-track-cursor=""
                style={{ insetInlineStart: `${(shown + 0.5) * step}%` }}
                className={cn(
                  "pointer-events-none absolute -inset-y-1 w-0.5 -translate-x-1/2",
                  "rounded-pill bg-fg",
                  "transition-opacity duration-[var(--rc-duration-fast)] ease-rc",
                  open ? "opacity-100" : "opacity-0",
                )}
              />
            }
          />
          <TooltipContent>{data[shown]?.label}</TooltipContent>
        </Tooltip>
      </div>

      <ul className="sr-only">
        {data.map((point, index) => (
          <li key={index}>{point.label}</li>
        ))}
      </ul>

      <div role="status" aria-live="polite" className="sr-only">
        {hovered === null && focused !== null ? data[focused]?.label : null}
      </div>
    </div>
  );
}
