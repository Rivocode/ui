import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";

const markerVariants = cva(
  cn("relative z-[var(--rc-z-base)] mt-1.5 size-2.5 shrink-0 rounded-pill"),
  {
    variants: {
      tone: {
        neutral: "bg-border-strong",
        accent: "bg-accent",
        success: "bg-success",
        warning: "bg-warning",
        danger: "bg-danger",
      },
      /**
       * O que ainda nao aconteceu fica vazado. Preencher o marcador de um
       * evento futuro faz a linha prometer que ele ja ocorreu, que e
       * exatamente o erro que uma trilha de auditoria nao pode cometer.
       */
      pending: { true: "bg-bg ring-inset ring-2 ring-border-strong", false: "" },
    },
    defaultVariants: { tone: "neutral", pending: false },
  },
);

export type TimelineItemProps = ComponentProps<"li"> &
  VariantProps<typeof markerVariants> & {
    /** O que aconteceu. */
    title: ReactNode;
    /** Quando aconteceu. Costuma ser um `RelativeTime` ou uma data curta. */
    at?: ReactNode;
    /** Quem fez. Numa trilha de auditoria, e metade da informacao. */
    by?: ReactNode;
    /** Classe por parte: `marker`, `title`, `meta`, `content`. */
    classNames?: Slots<"marker" | "title" | "meta" | "content">;
  };

export function TimelineItem({
  className,
  title,
  at,
  by,
  tone,
  pending,
  children,
  classNames,
  ...props
}: TimelineItemProps) {
  return (
    <li
      {...props}
      className={cn(
        "relative flex gap-3 pb-5 last:pb-0",
        "before:absolute before:top-4 before:bottom-0 before:left-[0.3125rem] before:w-px",
        "before:bg-border last:before:hidden",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(markerVariants({ tone, pending }), classNames?.marker)}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p
            className={cn(
              "font-sans text-base",
              pending ? "text-fg-muted" : "text-fg",
              classNames?.title,
            )}
          >
            {title}
          </p>
          {(at || by) && (
            <p className={cn("font-mono text-xs text-fg-subtle", classNames?.meta)}>
              {at}
              {at && by ? " · " : null}
              {by}
            </p>
          )}
        </div>

        {children && (
          <div className={cn("text-sm text-fg-muted", classNames?.content)}>{children}</div>
        )}
      </div>
    </li>
  );
}

export type TimelineProps = ComponentProps<"ol">;

export function Timeline({ className, ...props }: TimelineProps) {
  return <ol {...props} className={cn("flex flex-col", className)} />;
}
