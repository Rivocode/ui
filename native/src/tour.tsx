import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { AccessibilityInfo, Modal, View } from "react-native";

import { Button } from "./button";
import { cn } from "./cn";
import { useReducedMotion } from "./motion";
import {
  missingTargetComplaint,
  planTourMove,
  TOUR_LABELS,
  TOUR_SPOTLIGHT_PADDING,
  type TourDirection,
  type TourLabels,
} from "./shared/tour";
import { Text } from "./text";

export type { TourLabels };

export type TourStep = {
  /**
   * O ref do elemento destacado. E medido por `measureInWindow` quando o
   * passo abre; ref vazio pula o passo, com aviso em desenvolvimento.
   */
  target: RefObject<View | null>;
  /** O titulo da folha. Vira o cabecalho que o leitor de tela anuncia. */
  title: string;
  /** O texto do passo. */
  description?: string;
  /** Conteudo extra na folha, acima dos botoes. */
  action?: ReactNode;
};

export type TourProps = {
  /** Os passos, na ordem. */
  steps: TourStep[];
  open: boolean;
  /** Chamado ao concluir, ao pular e no voltar do Android. */
  onOpenChange: (open: boolean) => void;
  /** O passo atual, contando de zero. Controlado, como todo o pacote. */
  step: number;
  /**
   * Chamado a cada troca: Voltar, Proximo e passo pulado por falta de alvo.
   * E aqui que a tela rola o alvo para a vista, sem animacao, antes da medida.
   */
  onStepChange: (step: number) => void;
  /** Chamado no Concluir do ultimo passo. Nao e chamado ao pular. */
  onFinish?: () => void;
  /** Chamado no "Pular tour" e no voltar do Android, com o passo da desistencia. */
  onSkip?: (step: number) => void;
  /** Os textos dos botoes e do contador, para trocar o idioma ou o termo. */
  labels?: Partial<TourLabels>;
  /** Veste a folha de baixo, nao a mascara. */
  className?: string;
};

type Box = { x: number; y: number; width: number; height: number };

function measure(target: RefObject<View | null> | undefined, done: (box: Box) => void) {
  const node = target?.current as
    | { measureInWindow?: (callback: (...values: number[]) => void) => void }
    | null
    | undefined;
  node?.measureInWindow?.((x = 0, y = 0, width = 0, height = 0) => done({ x, y, width, height }));
}

export function Tour({
  steps,
  open,
  onOpenChange,
  step,
  onStepChange,
  onFinish,
  onSkip,
  labels,
  className,
}: TourProps) {
  const text = { ...TOUR_LABELS, ...labels };
  const reduced = useReducedMotion();
  const [box, setBox] = useState<Box | null>(null);
  const directionRef = useRef<TourDirection>(1);
  const shownRef = useRef<number | null>(null);
  const warnedRef = useRef(new Set<number>());

  const total = steps.length;
  const current = Math.min(Math.max(step, 0), Math.max(total - 1, 0));
  const active = steps[current];
  const isLast = current === total - 1;

  const goTo = (next: number) => {
    directionRef.current = next > current ? 1 : -1;
    onStepChange(next);
  };

  const finish = () => {
    onOpenChange(false);
    onFinish?.();
  };

  const skip = () => {
    onOpenChange(false);
    onSkip?.(current);
  };

  const remeasure = useCallback(() => {
    measure(active?.target, (next) => setBox(next));
  }, [active]);

  useEffect(() => {
    if (!open) {
      setBox(null);
      shownRef.current = null;
      directionRef.current = 1;
      warnedRef.current.clear();
      return;
    }

    const move = planTourMove(
      current,
      total,
      directionRef.current,
      shownRef.current !== null,
      (index) => Boolean(steps[index]?.target.current),
      (index) => {
        if (warnedRef.current.has(index) || !__DEV__) return;
        warnedRef.current.add(index);
        console.warn(missingTargetComplaint(index, "ref"));
      },
    );

    if (move.kind === "go") return goTo(move.step);
    if (move.kind === "finish") return finish();
    if (move.kind === "close") {
      setBox(null);
      onOpenChange(false);
      return;
    }

    remeasure();
    const frame = requestAnimationFrame(remeasure);
    return () => cancelAnimationFrame(frame);
  }, [open, current, total, active]);

  useEffect(() => {
    if (!open || !box || !active) return;
    if (shownRef.current !== null && shownRef.current !== current) {
      AccessibilityInfo.announceForAccessibility(
        `${text.counter(current + 1, total)}. ${active.title}`,
      );
    }
    shownRef.current = current;
  }, [open, box, current]);

  const visible = open && box !== null && active !== undefined;

  const hole = box && {
    top: box.y - TOUR_SPOTLIGHT_PADDING,
    left: box.x - TOUR_SPOTLIGHT_PADDING,
    width: box.width + TOUR_SPOTLIGHT_PADDING * 2,
    height: box.height + TOUR_SPOTLIGHT_PADDING * 2,
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType={reduced ? "none" : "fade"}
      onRequestClose={skip}
    >
      <View accessibilityViewIsModal className="flex-1" onLayout={remeasure}>
        {hole && (
          <>
            <View
              testID="tour-mask"
              className="absolute inset-x-0 top-0 bg-overlay"
              style={{ height: Math.max(0, hole.top) }}
            />
            <View
              className="absolute inset-x-0 bottom-0 bg-overlay"
              style={{ top: hole.top + hole.height }}
            />
            <View
              className="absolute left-0 bg-overlay"
              style={{ top: hole.top, height: hole.height, width: Math.max(0, hole.left) }}
            />
            <View
              className="absolute right-0 bg-overlay"
              style={{ top: hole.top, height: hole.height, left: hole.left + hole.width }}
            />
          </>
        )}
        <View
          className={cn(
            "absolute inset-x-0 bottom-0 rounded-t-xl border-t border-border bg-surface px-5 pt-3 pb-8",
            className,
          )}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-pill bg-border-strong" />
          <Text className="text-xs font-rc-medium text-fg-muted">
            {text.counter(current + 1, total)}
          </Text>
          <Text
            accessibilityRole="header"
            font="display"
            className="mt-1 text-lg font-rc-strong text-fg"
          >
            {active?.title}
          </Text>
          {active?.description && (
            <Text className="mt-1 text-sm text-fg-muted">{active.description}</Text>
          )}
          {active?.action && <View className="mt-3">{active.action}</View>}
          <View className="mt-5 flex-row flex-wrap items-center justify-end gap-2">
            <Button variant="ghost" className="mr-auto" onPress={skip}>
              {text.skip}
            </Button>
            {current > 0 && (
              <Button variant="secondary" onPress={() => goTo(current - 1)}>
                {text.back}
              </Button>
            )}
            <Button onPress={isLast ? finish : () => goTo(current + 1)}>
              {isLast ? text.finish : text.next}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
