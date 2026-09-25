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
  /** Veste o cartao central, nao o fundo escurecido. */
  className?: string;
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
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
          accessibilityLabel="Fechar"
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

export type AlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** O verbo do botao que confirma: "Cancelar nota", "Arquivar". */
  actionLabel: string;
  /**
   * A acao. Devolvendo promessa, o modal fica aberto e o botao entra em
   * espera ate ela terminar - e um toque so vira uma chamada so. Promessa que
   * rejeita devolve o modal ao estado anterior, com o texto ainda na tela.
   */
  onAction: () => void | Promise<unknown>;
  cancelLabel?: string;
  /**
   * `danger` pinta o botao de vermelho; `neutral` serve para o que se desfaz,
   * como arquivar. Os mesmos valores do `Popconfirm` do web.
   */
  tone?: "danger" | "neutral";
  /**
   * Estado de espera vindo de fora, para quem ja tem a chamada em uma store.
   * Soma com a espera da promessa do `onAction`.
   */
  loading?: boolean;
  /**
   * O que o leitor de tela ouve quando a espera comeca. O padrao repete o
   * verbo do `actionLabel`.
   */
  busyLabel?: string;
};

const BLOCKED_MESSAGE = "Não dá para cancelar enquanto a ação está em andamento.";

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  onAction,
  cancelLabel = "Cancelar",
  tone = "danger",
  loading = false,
  busyLabel,
}: AlertDialogProps) {
  const reduced = useReducedMotion();
  const [pending, setPending] = useState(false);
  const running = useRef(false);
  const busy = loading || pending;

  useAnnounce(open && busy ? (busyLabel ?? `${actionLabel}: ação em andamento. Aguarde.`) : null, {
    onMount: true,
  });

  const dismiss = () => {
    if (busy) {
      announce(BLOCKED_MESSAGE);
      return;
    }
    onOpenChange(false);
  };

  const confirm = () => {
    if (busy || running.current) return;

    const result = onAction();
    if (!result || typeof result.then !== "function") {
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
          <Text accessibilityRole="header" font="display" className="text-xl font-rc-display text-fg">
            {title}
          </Text>
          <Text className="mt-1 text-sm text-fg-muted">{description}</Text>
          <View className="mt-5 flex-row justify-end gap-2">
            <Button variant="ghost" disabled={busy} onPress={dismiss}>
              {cancelLabel}
            </Button>
            <Button
              variant={tone === "danger" ? "destructive" : "primary"}
              loading={busy}
              onPress={confirm}
            >
              {actionLabel}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
