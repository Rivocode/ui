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
  /**
   * Os textos da peca, para trocar o idioma: `close` e o nome do fundo
   * escurecido, que fecha o modal ao toque, "Fechar" sem ele.
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
   * A acao, que pode devolver promessa para o modal esperar por ela. Com
   * promessa, o modal fica aberto e o botao entra em espera ate ela terminar -
   * e um toque so vira uma chamada so. Promessa que rejeita devolve o modal ao
   * estado anterior, com o texto ainda na tela. Outro retorno qualquer e
   * ignorado e o modal fecha na hora.
   */
  onConfirm: () => unknown;
  /**
   * Chamado em toda saida sem confirmar: o botao de cancelar e o voltar do
   * Android. O toque no fundo nao sai, como em todo alerta: a pessoa escolhe um
   * dos dois botoes. Nao dispara durante a espera, que nao deixa sair.
   */
  onCancel?: () => void;
  /**
   * `danger` pinta o botao de vermelho; `neutral` serve para o que se desfaz,
   * como arquivar. Os mesmos valores do `Popconfirm` do web.
   */
  tone?: "danger" | "neutral";
  /**
   * Estado de espera vindo de fora, para quem ja tem a chamada em uma store.
   * Soma com a espera da promessa do `onConfirm`.
   */
  loading?: boolean;
  /**
   * Os textos do modal, com as mesmas chaves do `Popconfirm` do web. `confirm`
   * e o verbo do botao que executa - escreva a acao, "Cancelar nota",
   * "Arquivar". `cancel` e o do botao que sai sem fazer nada. `busy` e o que o
   * leitor de tela ouve quando a espera comeca, e o padrao repete o `confirm`.
   * `blocked` e o aviso de quem tenta sair durante a espera. Passe so os que
   * mudam.
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
