import { useRef, useState, type ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import { announce, useAnnounce } from "./announce";
import { Button } from "./button";
import { cn } from "./cn";
import { useKeyboardPadding } from "./keyboard";
import { useReducedMotion } from "./motion";
import { Text } from "./text";

const PASS_THROUGH = { pointerEvents: "box-none" } as const;

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Styles the central card, not the dimmed backdrop. */
  className?: string;
  /**
   * The component's texts, to change the language: `close` is the name of the
   * dimmed backdrop, which closes the modal on tap, "Fechar" without it.
   */
  labels?: Partial<DialogLabels>;
};

export type DialogLabels = {
  close: string;
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  labels,
}: DialogProps) {
  const reduced = useReducedMotion();
  const keyboard = useKeyboardPadding();
  return (
    <Modal
      visible={open}
      transparent
      animationType={reduced ? "none" : "fade"}
      onRequestClose={() => onOpenChange(false)}
    >
      <Animated.View accessibilityViewIsModal className="flex-1" style={keyboard}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels?.close ?? "Fechar"}
          className="absolute inset-0 bg-overlay"
          onPress={() => onOpenChange(false)}
        />
        <View style={PASS_THROUGH} className="flex-1 items-center justify-center p-6">
          <View className={cn("w-full rounded-xl border border-border bg-surface p-6", className)}>
            <Text
              accessibilityRole="header"
              font="display"
              className="text-xl font-rc-display text-fg"
            >
              {title}
            </Text>
            {description && <Text className="mt-1 text-sm text-fg-muted">{description}</Text>}
            {children && <View className="mt-4">{children}</View>}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

export type AlertDialogLabels = {
  confirm: string;
  cancel: string;
  busy: string;
  blocked: string;
};

export type AlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /**
   * The action, which may return a promise for the modal to wait on. With a
   * promise, the modal stays open and the button waits until it settles - and a
   * single tap becomes a single call. A promise that rejects returns the modal
   * to its previous state, with the text still on screen. Any other return
   * value is ignored and the modal closes right away.
   */
  onConfirm: () => unknown;
  /**
   * Called on every exit without confirming: the cancel button and the Android
   * back. A tap on the backdrop does not exit, as in every alert: the person
   * picks one of the two buttons. Does not fire during the wait, which does not
   * allow exiting.
   */
  onCancel?: () => void;
  /**
   * `danger` paints the button red; `neutral` is for what can be undone, like
   * archiving. The same values as the web `Popconfirm`.
   */
  tone?: "danger" | "neutral";
  /**
   * A waiting state coming from outside, for those who already have the call in
   * a store. Adds to the wait on the `onConfirm` promise.
   */
  loading?: boolean;
  /**
   * The modal texts, with the same keys as the web `Popconfirm`. `confirm` is
   * the verb of the button that executes - write the action, "Cancelar nota",
   * "Arquivar". `cancel` is that of the button that exits without doing
   * anything. `busy` is what the screen reader hears when the wait starts, and
   * the default repeats `confirm`. `blocked` is the notice for someone who
   * tries to exit during the wait. Pass only the ones that change.
   */
  labels?: Partial<AlertDialogLabels>;
};

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  tone = "danger",
  loading = false,
  labels,
}: AlertDialogProps) {
  const reduced = useReducedMotion();
  const [pending, setPending] = useState(false);
  const running = useRef(false);
  const busy = loading || pending;
  const confirmLabel = labels?.confirm ?? "Confirmar";
  const cancelLabel = labels?.cancel ?? "Cancelar";

  useAnnounce(
    open && busy ? (labels?.busy ?? `${confirmLabel}: ação em andamento. Aguarde.`) : null,
    { onMount: true },
  );

  const dismiss = () => {
    if (busy) {
      announce(labels?.blocked ?? "Não dá para cancelar enquanto a ação está em andamento.");
      return;
    }
    onOpenChange(false);
    onCancel?.();
  };

  const confirm = () => {
    if (busy || running.current) return;

    const result = onConfirm();
    if (!isThenable(result)) {
      onOpenChange(false);
      return;
    }

    running.current = true;
    setPending(true);
    const settle = (done: boolean) => {
      running.current = false;
      setPending(false);
      if (done) onOpenChange(false);
    };
    result.then(
      () => settle(true),
      () => settle(false),
    );
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType={reduced ? "none" : "fade"}
      onRequestClose={dismiss}
    >
      <View accessibilityViewIsModal className="flex-1 items-center justify-center bg-overlay p-6">
        <View className="w-full rounded-xl border border-border bg-surface p-6">
          <Text
            accessibilityRole="header"
            font="display"
            className="text-xl font-rc-display text-fg"
          >
            {title}
          </Text>
          <Text className="mt-1 text-sm text-fg-muted">{description}</Text>
          <View className="mt-5 flex-row justify-end gap-2">
            <Button variant="ghost" disabled={busy} onPress={dismiss}>
              {cancelLabel}
            </Button>
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              loading={busy}
              onPress={confirm}
            >
              {confirmLabel}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
