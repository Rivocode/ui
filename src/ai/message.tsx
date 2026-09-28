"use client";

import { CircleX, RotateCcw } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Clipboard } from "../components/clipboard";
import { IconButton } from "../components/icon-button";
import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { MESSAGE_AUTHOR as AUTHOR, type MessageRole } from "../shared/ai";

export type { MessageRole };

export type MessageProps = Omit<ComponentPropsWithoutRef<"article">, "role"> & {
  /**
   * Who is speaking. Decides the alignment and the drawing: `user` is the bubble on the right,
   * `assistant` is running text on the left, `system` is the discreet line in the
   * center.
   */
  role: MessageRole;
  /**
   * The speaker's name, for the screen reader, which hears each message as an
   * article with that name. Without it: "Você", "Assistente" or "Sistema".
   */
  author?: string;
  /** The `Avatar` beside the message. Not shown in `system`. */
  avatar?: ReactNode;
  /**
   * The text is still arriving: the message announces `aria-busy`, so the screen
   * reader reads it when it finishes and not at each chunk, shows the indicator and
   * hides the actions.
   */
  streaming?: boolean;
  /**
   * Turns on the copy button, with this text. Pass the raw text (the markdown, and
   * not what it draws): it is what the person pastes somewhere else.
   */
  copyValue?: string;
  /** Turns on the try-again button, which asks for another answer. */
  onRetry?: () => void;
  /** The names of the action buttons. Without them: "Copiar", "Copiado" and "Tentar de novo". */
  labels?: { copy?: string; copied?: string; retry?: string };
  /** Your own buttons, after copy and try again: like, dislike. */
  actions?: ReactNode;
  /**
   * The answer failed: the sentence appears below the content, with an icon and in the danger
   * tone, and the actions appear even without content.
   */
  error?: ReactNode;
  classNames?: Slots<"avatar" | "bubble" | "content" | "indicator" | "error" | "actions">;
};

function TypingIndicator({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("inline-flex items-center gap-1 py-1.5", className)}>
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className={cn(
            "size-1.5 animate-pulse rounded-pill bg-fg-subtle motion-reduce:animate-none",
            dot === 1 && "[animation-delay:150ms]",
            dot === 2 && "[animation-delay:300ms]",
          )}
        />
      ))}
    </span>
  );
}

export function Message({
  role,
  author,
  avatar,
  streaming = false,
  copyValue,
  onRetry,
  labels = {},
  actions,
  error,
  children,
  className,
  classNames,
  ...props
}: MessageProps) {
  const isUser = role === "user";
  const isSystem = role === "system";
  const hasContent = children !== undefined && children !== null && children !== "";
  const showActions = !streaming && (copyValue !== undefined || onRetry || actions);

  if (isSystem) {
    return (
      <article
        {...props}
        aria-label={author ?? AUTHOR.system}
        data-role="system"
        className={cn(
          "flex w-full justify-center px-4 py-1 text-center font-sans text-sm text-fg-muted",
          className,
        )}
      >
        <div className={cn("max-w-prose", classNames?.content)}>{children}</div>
      </article>
    );
  }

  return (
    <article
      {...props}
      aria-label={author ?? AUTHOR[role]}
      aria-busy={streaming || undefined}
      data-role={role}
      data-streaming={streaming || undefined}
      className={cn(
        "flex w-full gap-3 font-sans",
        isUser ? "flex-row-reverse" : "flex-row",
        className,
      )}
    >
      {avatar && <div className={cn("shrink-0 pt-0.5", classNames?.avatar)}>{avatar}</div>}

      <div
        className={cn(
          "flex min-w-0 flex-col gap-1.5",
          isUser ? "max-w-[85%] items-end" : "flex-1 items-start",
        )}
      >
        <div
          className={cn(
            isUser
              ? "rounded-lg rounded-br-sm bg-accent-subtle px-3.5 py-2.5 text-fg"
              : "w-full text-fg",
            classNames?.bubble,
          )}
        >
          {hasContent && (
            <div
              className={cn(
                "text-base leading-[var(--rc-leading-normal)] break-words",
                classNames?.content,
              )}
            >
              {children}
            </div>
          )}
          {streaming && <TypingIndicator className={classNames?.indicator} />}
        </div>

        {error && (
          <p
            className={cn(
              "flex items-start gap-1.5 text-sm text-danger-text [&_svg]:mt-0.5 [&_svg]:size-4",
              "[&_svg]:shrink-0",
              classNames?.error,
            )}
          >
            <CircleX aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        {showActions && (
          <div className={cn("flex items-center gap-1", classNames?.actions)}>
            {copyValue !== undefined && (
              <Clipboard
                value={copyValue}
                variant="ghost"
                labels={{ copy: labels.copy ?? "Copiar", copied: labels.copied ?? "Copiado" }}
              />
            )}
            {onRetry && (
              <IconButton
                type="button"
                label={labels.retry ?? "Tentar de novo"}
                variant="ghost"
                size="sm"
                onClick={onRetry}
              >
                <RotateCcw />
              </IconButton>
            )}
            {actions}
          </div>
        )}
      </div>
    </article>
  );
}
