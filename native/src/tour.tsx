import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  AccessibilityInfo,
  Modal,
  Platform,
  View,
  type LayoutChangeEvent,
} from "react-native";

import { Button } from "./button";
import { cn, type Slots } from "./cn";
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
  /**
   * A altura da area segura de cima, em pontos: `useSafeAreaInsets().top`. So
   * pesa quando o alvo esta na metade de baixo e a folha sobe para o topo. Sem
   * ela, 24 no Android e 48 no iOS, que cobrem a barra de status e nao o entalhe.
   */
  topInset?: number;
  /** Veste a folha, nao a mascara. */
  className?: string;
  /**
   * Classe por parte: `mask` (as quatro faixas escuras em volta do alvo),
   * `counter`, `title`, `description` e `footer` (a fileira dos botoes).
   */
  classNames?: Slots<"mask" | "counter" | "title" | "description" | "footer">;
};

type Box = { x: number; y: number; width: number; height: number };

type Measurable = { measureInWindow?: (callback: (...values: number[]) => void) => void };

function measurable(node: unknown): node is Required<Measurable> {
  return typeof (node as Measurable | null | undefined)?.measureInWindow === "function";
}

function measure(node: unknown, done: (box: Box | null) => void) {
  if (!measurable(node)) return done(null);
  node.measureInWindow((x = 0, y = 0, width = 0, height = 0) => done({ x, y, width, height }));
}

const DEFAULT_TOP_INSET = Platform.select({ android: 24, default: 48 }) ?? 48;

export function Tour({
  steps,
  open,
  onOpenChange,
  step,
  onStepChange,
  onFinish,
  onSkip,
  labels,
  topInset = DEFAULT_TOP_INSET,
  className,
  classNames,
}: TourProps) {
  const text = { ...TOUR_LABELS, ...labels };
  const reduced = useReducedMotion();
  const [box, setBox] = useState<Box | null>(null);
  const [root, setRoot] = useState<Box | null>(null);
  const rootRef = useRef<View>(null);
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
    measure(rootRef.current, (next) => {
      if (next) setRoot(next);
    });
    measure(active?.target.current, (next) => {
      if (next) setBox(next);
    });
  }, [active]);

  const layRoot = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setRoot((current) => ({ x: current?.x ?? 0, y: current?.y ?? 0, width: 0, height }));
    remeasure();
  };

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
      (index) => measurable(steps[index]?.target.current),
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

  const offsetX = root?.x ?? 0;
  const offsetY = root?.y ?? 0;
  const hole = box && {
    top: box.y - offsetY - TOUR_SPOTLIGHT_PADDING,
    left: box.x - offsetX - TOUR_SPOTLIGHT_PADDING,
    width: box.width + TOUR_SPOTLIGHT_PADDING * 2,
    height: box.height + TOUR_SPOTLIGHT_PADDING * 2,
  };
  const rootHeight = root?.height ?? 0;
  const onTop =
    box !== null && rootHeight > 0 && box.y - offsetY + box.height / 2 > rootHeight / 2;
  const grabber = <View className="h-1 w-10 self-center rounded-pill bg-border-strong" />;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType={reduced ? "none" : "fade"}
      onRequestClose={skip}
    >
      <View ref={rootRef} accessibilityViewIsModal className="flex-1" onLayout={layRoot}>
        {hole && (
          <>
            <View
              testID="tour-mask"
              className={cn("absolute inset-x-0 top-0 bg-overlay", classNames?.mask)}
              style={{ height: Math.max(0, hole.top) }}
            />
            <View
              className={cn("absolute inset-x-0 bottom-0 bg-overlay", classNames?.mask)}
              style={{ top: hole.top + hole.height }}
            />
            <View
              className={cn("absolute left-0 bg-overlay", classNames?.mask)}
              style={{ top: hole.top, height: hole.height, width: Math.max(0, hole.left) }}
            />
            <View
              className={cn("absolute right-0 bg-overlay", classNames?.mask)}
              style={{ top: hole.top, height: hole.height, left: hole.left + hole.width }}
            />
          </>
        )}
        <View
          style={onTop ? { paddingTop: topInset + 12 } : undefined}
          className={cn(
            "absolute inset-x-0 border-border bg-surface px-5",
            onTop ? "top-0 rounded-b-xl border-b pb-3" : "bottom-0 rounded-t-xl border-t pt-3 pb-8",
            className,
          )}
        >
          {onTop ? null : <View className="mb-4">{grabber}</View>}
          <Text className={cn("text-xs font-rc-medium text-fg-muted", classNames?.counter)}>
            {text.counter(current + 1, total)}
          </Text>
          <Text
            accessibilityRole="header"
            font="display"
            className={cn("mt-1 text-lg font-rc-strong text-fg", classNames?.title)}
          >
            {active?.title}
          </Text>
          {active?.description && (
            <Text className={cn("mt-1 text-sm text-fg-muted", classNames?.description)}>
              {active.description}
            </Text>
          )}
          {active?.action && <View className="mt-3">{active.action}</View>}
          <View
            className={cn(
              "mt-5 flex-row flex-wrap items-center justify-end gap-2",
              classNames?.footer,
            )}
          >
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
          {onTop ? <View className="mt-4">{grabber}</View> : null}
        </View>
      </View>
    </Modal>
  );
}
