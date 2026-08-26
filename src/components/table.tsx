import type { ComponentPropsWithoutRef } from "react";

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
  /** Linha escolhida. Marca no aria tambem, porque cor sozinha nao e estado. */
  selected?: boolean;
};

export function TableRow({ className, selected, ...props }: TableRowProps) {
  return (
    <tr
      {...props}
      aria-selected={selected || undefined}
      className={cn(
        "border-b border-border transition-colors duration-[var(--rc-duration-fast)]",
        "hover:bg-surface-raised",
        selected && "bg-selected shadow-[inset_2px_0_0_var(--rc-accent)]",
        className,
      )}
    />
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
