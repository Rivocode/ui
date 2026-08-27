"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";

export type SplitterProps = Omit<ComponentProps<"div">, "onChange"> & {
  /** O lado que a medida descreve: a esquerda na horizontal, o topo na vertical. */
  start: ReactNode;
  end: ReactNode;
  /** Tamanho do primeiro lado, em porcentagem. */
  defaultSize?: number;
  /** Controlado, quando o app quer guardar a escolha entre sessoes. */
  size?: number;
  onSizeChange?: (size: number) => void;
  /** Quanto cada lado precisa ter, em porcentagem. */
  min?: number;
  /** O que o leitor de tela chama a divisoria. */
  label: string;
  orientation?: "horizontal" | "vertical";
  /** Classe por parte: `start`, `end`, `handle`. */
  classNames?: Slots<"start" | "end" | "handle">;
};

const STEP = 2;

export function Splitter({
  start,
  end,
  defaultSize = 50,
  size,
  onSizeChange,
  min = 15,
  label,
  orientation = "horizontal",
  className,
  classNames,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: SplitterProps) {
  const [internal, setInternal] = useState(defaultSize);
  const startId = useId();
  const frame = useRef<HTMLDivElement>(null);
  const current = size ?? internal;
  const vertical = orientation === "vertical";
  const rtl = useDirection() === "rtl";

  function move(to: number) {
    const clamped = Math.max(min, Math.min(100 - min, to));
    if (size === undefined) setInternal(clamped);
    onSizeChange?.(clamped);
  }

  function drag(event: React.PointerEvent<HTMLDivElement>) {
    const box = frame.current?.getBoundingClientRect();
    if (!box) return;

    event.currentTarget.setPointerCapture(event.pointerId);

    const onMove = (pointer: PointerEvent) => {
      const along = rtl ? box.right - pointer.clientX : pointer.clientX - box.left;
      const position = vertical
        ? ((pointer.clientY - box.top) / box.height) * 100
        : (along / box.width) * 100;
      move(Math.round(position));
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div
      {...props}
      ref={frame}
      className={cn(
        "flex w-full items-stretch",
        vertical ? "flex-col" : "max-md:flex-col",
        className,
      )}
    >
      <div
        id={startId}
        className={cn("min-h-0 min-w-0 overflow-auto", classNames?.start)}
        style={{ flexBasis: `${current}%` }}
      >
        {start}
      </div>

      <div
        role="separator"
        tabIndex={0}
        aria-label={ariaLabel ?? label}
        aria-labelledby={ariaLabelledBy}
        aria-orientation={vertical ? "horizontal" : "vertical"}
        aria-valuenow={Math.round(current)}
        aria-valuemin={min}
        aria-valuemax={100 - min}
        aria-valuetext={`${Math.round(current)}%`}
        aria-controls={startId}
        onPointerDown={drag}
        onKeyDown={(event) => {
          const back = vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
          const forward = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";

          if (event.key === back) move(current - STEP);
          else if (event.key === forward) move(current + STEP);
          else if (event.key === "Home") move(min);
          else if (event.key === "End") move(100 - min);
          else return;

          event.preventDefault();
        }}
        className={cn(
          "group/handle relative shrink-0 bg-border",
          "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
          "hover:bg-line-hover focus-visible:bg-accent",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          vertical ? "h-px w-full cursor-row-resize" : "w-px cursor-col-resize max-md:hidden",
          vertical
            ? "after:absolute after:inset-x-0 after:-inset-y-3"
            : "after:absolute after:inset-y-0 after:-inset-x-3",
          classNames?.handle,
        )}
      />

      <div className={cn("min-h-0 min-w-0 flex-1 overflow-auto", classNames?.end)}>{end}</div>
    </div>
  );
}
