"use client";

import { TriangleAlert } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "../lib/cn";
import { focusIsLost } from "../lib/focus";
import { FLOATING_SIDE_OFFSET, type FloatingPositionProps } from "../lib/positioning";
import { useMobile } from "../lib/screen";
import type { Slots } from "../lib/slots";
import { Button } from "./button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "./popover";
import { Sheet, SheetClose, SheetContent, SheetHandle, SheetTrigger } from "./sheet";

type CloseRequest = { cancel: () => void };

const CANCEL_BLOCKED = cn(
  "aria-disabled:cursor-not-allowed aria-disabled:border-transparent",
  "aria-disabled:bg-surface-raised aria-disabled:text-fg-disabled aria-disabled:shadow-none",
);

export type PopconfirmProps = Omit<
  ComponentProps<"div">,
  "title" | "children" | "onCancel" | "onSubmit"
> &
  FloatingPositionProps & {
    /** The button that opens the confirmation. It is where the panel anchors. */
    trigger: ReactElement;
    /** The question, short and with the target in it: "Excluir a nota 4813?". */
    title: string;
    /**
     * The level the question is rendered at. Default `h2`, as in `DialogTitle` and
     * `AlertDialogTitle`.
     *
     * Lower it when the panel is born inside a section that already has a heading: the
     * trigger is usually a row button inside a `Card`, whose
     * `CardTitle` is `h3`, and an `h2` there opens a section above the one containing it.
     * The page outline, which is how many people navigate, gets inverted.
     */
    titleAs?: "h2" | "h3" | "h4";
    /** What the person loses on confirming, or what happens next. */
    description?: ReactNode;
    /**
     * `danger` paints the button red and brings the warning icon; `neutral`
     * serves for what can be undone, like archiving.
     */
    tone?: "danger" | "neutral";
    /**
     * The action. When it returns a promise, the panel stays open and the button
     * waits until it finishes - and one click becomes just one call. A promise
     * that rejects returns the panel to its previous state, with the text still on
     * screen.
     */
    onConfirm: () => void | Promise<unknown>;
    /** Called on every exit without confirming: button, Esc, click outside, drag. */
    onCancel?: () => void;
    /** Leaves opening up to the consumer. Without it, the piece controls itself. */
    open?: boolean;
    /** Initial state for whoever does not control opening. */
    defaultOpen?: boolean;
    /** Reports every opening and every closing, controlled or not. */
    onOpenChange?: (open: boolean) => void;
    /**
     * Waiting state coming from outside, for those who already have the call in a
     * store. Adds up with the wait for the `onConfirm` promise.
     */
    loading?: boolean;
    /**
     * The panel's texts. `confirm` is the verb of the button that runs it - write the
     * action, "Excluir", "Cancelar nota", because only the verb tells the two
     * buttons apart in a panel this size. `cancel` is that of the button that leaves without doing
     * anything. `busy` is what the screen reader hears when the wait begins, and the
     * default repeats `confirm`. `blocked` is the notice for someone who tries to leave
     * during the wait. Pass only the ones that change.
     */
    labels?: Partial<PopconfirmLabels>;
    /**
     * Where focus returns on close. Applies when the trigger itself disappears on
     * confirmation - the deleted row takes the button with it, and without this focus falls
     * onto the page body.
     */
    finalFocus?: RefObject<HTMLElement | null>;
    /**
     * Class per part: `title`, `description`, `footer`, `confirm`,
     * `cancel`. `className` dresses the panel.
     */
    classNames?: Slots<"title" | "description" | "footer" | "confirm" | "cancel">;
  };

export type PopconfirmLabels = {
  confirm: string;
  cancel: string;
  busy: string;
  blocked: string;
};

export function Popconfirm({
  trigger,
  title,
  titleAs: Title = "h2",
  description,
  tone = "danger",
  onConfirm,
  onCancel,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  loading = false,
  labels: labelsProp,
  finalFocus,
  classNames,
  className,
  side,
  align,
  sideOffset = FLOATING_SIDE_OFFSET,
  ...rest
}: PopconfirmProps) {
  const isMobile = useMobile();
  const [selfOpen, setSelfOpen] = useState(defaultOpen);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const descriptionId = useId();

  const open = openProp ?? selfOpen;
  const busy = loading || pending;

  const confirmLabel = labelsProp?.confirm ?? "Confirmar";
  const cancelLabel = labelsProp?.cancel ?? "Cancelar";
  const busyMessage = labelsProp?.busy ?? `${confirmLabel}: ação em andamento. Aguarde.`;
  const blockedMessage =
    labelsProp?.blocked ?? "Não dá para cancelar enquanto a ação está em andamento.";

  useEffect(() => {
    setNotice(busy ? busyMessage : "");
  }, [busy, busyMessage]);

  useEffect(() => {
    if (!busy) return;
    if (!focusIsLost(document.activeElement)) return;

    cancelRef.current?.focus();
  }, [busy]);

  function move(next: boolean) {
    if (openProp === undefined) setSelfOpen(next);
    onOpenChange?.(next);
  }

  function handleOpenChange(next: boolean, details: CloseRequest) {
    if (!next && busy) {
      details.cancel();
      setNotice(blockedMessage);
      return;
    }

    move(next);
    if (!next) onCancel?.();
  }

  async function confirm() {
    if (busy) return;

    const running = onConfirm();
    if (running && typeof running.then === "function") {
      setPending(true);
      try {
        await running;
      } catch {
        setPending(false);
        return;
      }
      setPending(false);
    }

    move(false);
  }

  const body = (
    <div className="flex gap-2.5">
      {tone === "danger" && (
        <TriangleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-danger-text" />
      )}
      <div className="min-w-0">
        <Title
          id={labelId}
          className={cn(
            "font-display font-rc-display text-base leading-[var(--rc-leading-tight)] tracking-tight text-fg",
            classNames?.title,
          )}
        >
          {title}
        </Title>
        {description && (
          <p
            id={descriptionId}
            className={cn("mt-1 text-sm text-fg-muted", classNames?.description)}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );

  const status = (
    <div role="status" aria-live="polite" className="sr-only">
      {notice}
    </div>
  );

  const confirmButton = (
    <Button
      type="button"
      variant={tone === "danger" ? "danger" : "primary"}
      size={isMobile ? "md" : "sm"}
      loading={busy}
      onClick={confirm}
      className={classNames?.confirm}
    >
      {confirmLabel}
    </Button>
  );

  const described = description ? descriptionId : undefined;

  if (isMobile) {
    return (
      <Sheet
        side="bottom"
        open={open}
        onOpenChange={handleOpenChange}
        disablePointerDismissal={busy}
      >
        <SheetTrigger render={trigger} />
        <SheetContent
          {...rest}
          role="alertdialog"
          aria-labelledby={labelId}
          aria-describedby={described}
          finalFocus={finalFocus}
          initialFocus={cancelRef}
          className={className}
        >
          <SheetHandle />
          {body}
          {status}
          <div className={cn("mt-5 flex flex-col-reverse gap-2 [&>*]:w-full", classNames?.footer)}>
            <SheetClose
              aria-disabled={busy || undefined}
              render={<Button type="button" variant="secondary" size="md" ref={cancelRef} />}
              className={cn(CANCEL_BLOCKED, classNames?.cancel)}
            >
              {cancelLabel}
            </SheetClose>
            {confirmButton}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal="trap-focus">
      <PopoverTrigger render={trigger} />
      <PopoverContent
        {...rest}
        role="alertdialog"
        aria-labelledby={labelId}
        aria-describedby={described}
        side={side}
        align={align}
        sideOffset={sideOffset}
        initialFocus={cancelRef}
        finalFocus={finalFocus}
        className={cn("w-[min(20rem,calc(100vw-2rem))]", className)}
      >
        {body}
        {status}
        <div className={cn("mt-4 flex items-center justify-end gap-2", classNames?.footer)}>
          <PopoverClose
            aria-disabled={busy || undefined}
            render={<Button type="button" variant="secondary" size="sm" ref={cancelRef} />}
            className={cn(CANCEL_BLOCKED, classNames?.cancel)}
          >
            {cancelLabel}
          </PopoverClose>
          {confirmButton}
        </div>
      </PopoverContent>
    </Popover>
  );
}
