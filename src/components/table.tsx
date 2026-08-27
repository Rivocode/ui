import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";
import { Children, cloneElement, isValidElement } from "react";

import { cn } from "../lib/cn";

export function Table({ className, ...props }: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table {...props} className={cn("w-full border-collapse text-base", className)} />
    </div>
  );
}

export function TableCaption({ className, ...props }: ComponentPropsWithoutRef<"caption">) {
  return (
    <caption
      {...props}
      className={cn(
        "caption-top px-[var(--rc-control-pad-md)] py-[var(--rc-control-pad-sm)]",
        "text-left text-sm text-fg-muted",
        className,
      )}
    />
  );
}

export function TableHeader({ className, ...props }: ComponentPropsWithoutRef<"thead">) {
  return <thead {...props} className={cn("border-b border-border", className)} />;
}

export function TableBody({ className, ...props }: ComponentPropsWithoutRef<"tbody">) {
  return <tbody {...props} className={className} />;
}

export function TableFooter({ className, ...props }: ComponentPropsWithoutRef<"tfoot">) {
  return (
    <tfoot
      {...props}
      className={cn("border-t border-border bg-surface font-medium text-fg", className)}
    />
  );
}

export type TableRowProps = ComponentPropsWithoutRef<"tr"> & {
  /**
   * Linha escolhida. Pinta o fundo, desenha a barra de acento na lateral e
   * abre a PRIMEIRA celula com um marcador de texto que so o leitor de tela
   * ouve, porque cor sozinha nao e estado. Nao usa aria-selected: ele so vale
   * dentro de grid ou treegrid, e esta e uma table simples - prometer grid
   * exigiria navegacao por setas entre celulas, que a peca nao tem.
   */
  selected?: boolean;
  /** O texto do marcador da linha escolhida. Padrao "Selecionada". */
  labels?: { selected?: string };
};

function withSelectedMark(children: ReactNode, label: string) {
  let done = false;
  return Children.map(children, (child) => {
    if (done || !isValidElement(child)) return child;
    done = true;
    const cell = child as ReactElement<{ children?: ReactNode }>;
    return cloneElement(
      cell,
      undefined,
      <span key="rc-selected" className="sr-only">
        {label}{" "}
      </span>,
      cell.props.children,
    );
  });
}

export function TableRow({ className, selected, labels, children, ...props }: TableRowProps) {
  const mark = labels?.selected ?? "Selecionada";
  return (
    <tr
      {...props}
      className={cn(
        "border-b border-border transition-colors duration-[var(--rc-duration-fast)]",
        "hover:bg-surface-raised",
        selected && "bg-selected shadow-[inset_2px_0_0_var(--rc-accent)]",
        className,
      )}
    >
      {selected ? withSelectedMark(children, mark) : children}
    </tr>
  );
}

export function TableHead({ className, ...props }: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      {...props}
      className={cn(
        "px-[var(--rc-control-pad-md)] py-[var(--rc-control-pad-sm)] text-left",
        "font-sans text-xs font-medium tracking-[0.04em] text-fg-subtle uppercase",
        "whitespace-nowrap",
        className,
      )}
    />
  );
}

export function TableCell({ className, ...props }: ComponentPropsWithoutRef<"td">) {
  return (
    <td
      {...props}
      className={cn(
        "px-[var(--rc-control-pad-md)] py-[var(--rc-control-pad-sm)] text-fg align-middle",
        className,
      )}
    />
  );
}
