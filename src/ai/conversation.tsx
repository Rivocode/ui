"use client";

import { ArrowDown } from "lucide-react";
import {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { Button } from "../components/button";
import { EmptyState } from "../components/empty-state";
import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { STICK_DISTANCE } from "../shared/ai";

export type ConversationProps = Omit<ComponentPropsWithoutRef<"div">, "role"> & {
  /** The messages, in order of arrival: the newest last. */
  children?: ReactNode;
  /** The region's name for the screen reader. Without it, "Conversa". */
  label?: string;
  /**
   * What appears while there is no message yet. The `suggestions` become
   * buttons, and a tap hands the text to `onSuggestion`.
   */
  empty?: {
    title: ReactNode;
    description: ReactNode;
    icon?: ReactNode;
    suggestions?: string[];
  };
  /** Called with the text of the tapped suggestion. Without it, the suggestions do not appear. */
  onSuggestion?: (suggestion: string) => void;
  /**
   * The piece's texts, to change the language: `scroll` is the button that goes back to
   * the end of the conversation, "Ir para o fim" without it.
   */
  labels?: Partial<ConversationLabels>;
  classNames?: Slots<"viewport" | "content" | "empty" | "suggestions" | "scrollButton">;
};

export type ConversationLabels = {
  scroll: string;
};

export function Conversation({
  children,
  label = "Conversa",
  empty,
  onSuggestion,
  labels,
  className,
  classNames,
  ...props
}: ConversationProps) {
  const scrollLabel = labels?.scroll ?? "Ir para o fim";
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const stuck = useRef(true);
  const [away, setAway] = useState(false);

  const isEmpty = Children.toArray(children).length === 0;

  const toEnd = useCallback((smooth: boolean) => {
    const node = viewport.current;
    if (!node) return;
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollTo({ top: node.scrollHeight, behavior: smooth && !reduced ? "smooth" : "auto" });
  }, []);

  useLayoutEffect(() => {
    if (stuck.current) toEnd(false);
  });

  useEffect(() => {
    const node = content.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (stuck.current) toEnd(false);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [toEnd, isEmpty]);

  function scroll() {
    const node = viewport.current;
    if (!node) return;
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    const atEnd = distance <= STICK_DISTANCE;
    stuck.current = atEnd;
    setAway(!atEnd);
  }

  function jump() {
    stuck.current = true;
    setAway(false);
    toEnd(true);
  }

  return (
    <div {...props} className={cn("relative flex min-h-0 flex-col font-sans", className)}>
      <div
        ref={viewport}
        role="log"
        aria-live="polite"
        aria-label={label}
        tabIndex={0}
        onScroll={scroll}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-md outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring",
          classNames?.viewport,
        )}
      >
        {isEmpty && empty ? (
          <EmptyState
            icon={empty.icon}
            title={empty.title}
            description={empty.description}
            className={cn("h-full", classNames?.empty)}
            action={
              empty.suggestions?.length && onSuggestion ? (
                <div
                  className={cn(
                    "flex max-w-xl flex-wrap justify-center gap-2",
                    classNames?.suggestions,
                  )}
                >
                  {empty.suggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="secondary"
                      size="sm"
                      shape="pill"
                      onClick={() => onSuggestion(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              ) : undefined
            }
          />
        ) : (
          <div ref={content} className={cn("flex flex-col gap-6 px-1 py-4", classNames?.content)}>
            {children}
          </div>
        )}
      </div>

      {away && !isEmpty && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          shape="pill"
          onClick={jump}
          className={cn(
            "absolute bottom-3 left-1/2 z-[var(--rc-z-sticky)] -translate-x-1/2 shadow-2",
            "animate-appear",
            classNames?.scrollButton,
          )}
        >
          <ArrowDown aria-hidden="true" className="size-4" />
          {scrollLabel}
        </Button>
      )}
    </div>
  );
}
