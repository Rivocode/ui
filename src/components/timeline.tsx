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
      pending: { true: "bg-bg ring-inset ring-2 ring-border-strong", false: "" },
    },
    defaultVariants: { tone: "neutral", pending: false },
  },
);

export type TimelineItemProps = Omit<ComponentProps<"li">, "title"> &
  VariantProps<typeof markerVariants> & {
    /** What happened. */
    title: ReactNode;
    /** When it happened. Usually a `RelativeTime` or a short date. */
    at?: ReactNode;
    /** Who did it. In an audit trail, it is half the information. */
    by?: ReactNode;
    /** Class per part: `marker`, `title`, `meta`, `content`. */
    classNames?: Slots<"marker" | "title" | "meta" | "content">;
    /**
     * What the screen reader hears before the title, because the marker states `pending` and `tone`
     * only through color: `pending` is one word per `tone` (`neutral` says nothing by default).
     * Pass only the ones that change; empty text silences it.
     */
    labels?: Partial<TimelineItemLabels>;
  };

export type TimelineItemLabels = {
  pending: string;
  tone: Partial<Record<NonNullable<VariantProps<typeof markerVariants>["tone"]>, string>>;
};

const LABELS: TimelineItemLabels = {
  pending: "Pendente",
  tone: { accent: "Destaque", success: "Sucesso", warning: "Atenção", danger: "Erro" },
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
  labels,
  ...props
}: TimelineItemProps) {
  const spoken = [
    pending ? (labels?.pending ?? LABELS.pending) : "",
    tone ? ({ ...LABELS.tone, ...labels?.tone }[tone] ?? "") : "",
  ].filter(Boolean);

  return (
    <li
      {...props}
      className={cn(
        "relative flex animate-enter gap-3 pb-5 last:pb-0",
        "before:absolute before:top-4 before:bottom-0 before:start-[0.3125rem] before:w-px",
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
            {spoken.length > 0 && <span className="sr-only">{`${spoken.join(", ")}: `}</span>}
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
