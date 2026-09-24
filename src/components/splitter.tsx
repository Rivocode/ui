"use client";

import { useState, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./resizable";

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
  const current = size ?? internal;
  const vertical = orientation === "vertical";

  function move(to: number) {
    const clamped = Math.max(min, Math.min(100 - min, to));
    if (clamped === current) return;
    if (size === undefined) setInternal(clamped);
    onSizeChange?.(clamped);
  }

  return (
    <ResizablePanelGroup
      {...props}
      orientation={orientation}
      layout={[current, 100 - current]}
      onLayoutChange={(sizes) => move(Math.round(sizes[0]!))}
      className={cn("h-auto", !vertical && "max-md:flex-col", className)}
    >
      <ResizablePanel
        defaultSize={current}
        minSize={min}
        maxSize={100 - min}
        className={classNames?.start}
      >
        {start}
      </ResizablePanel>

      <ResizableHandle
        aria-label={ariaLabel ?? label}
        aria-labelledby={ariaLabelledBy}
        className={cn(!vertical && "max-md:hidden", classNames?.handle)}
      />

      <ResizablePanel defaultSize={100 - current} minSize={min} className={classNames?.end}>
        {end}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
