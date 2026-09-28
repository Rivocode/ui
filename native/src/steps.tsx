import { useCallback, useRef, useState, type ReactNode } from "react";
import { View } from "react-native";

import { cn } from "./cn";
import { Fill, Presence } from "./motion";
import { STEPS_LABELS, type StepsLabels } from "./shared/steps";
import { Text } from "./text";

export type { StepsLabels };

export type Step = {
  id: string;
  title: string;
  description?: string;
};

export type StepsProps = {
  steps: Step[];
  /** Index of the current step, counting from zero. */
  step: number;
  className?: string;
  /**
   * The component's texts, to change the language: `position` is the "Passo 2
   * de 5" count, which receives the current step counting from 1 and the total.
   * Pass only the ones that change.
   */
  labels?: Partial<StepsLabels>;
};

const percent = (index: number, total: number) => ((index + 1) / total) * 100;

export function Steps({ steps, step: current, className, labels }: StepsProps) {
  if (steps.length === 0) return null;

  const index = Math.min(Math.max(current, 0), steps.length - 1);
  const step = steps[index]!;
  const position = { ...STEPS_LABELS, ...labels }.position(index + 1, steps.length);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${position}: ${step.title}`}
      accessibilityValue={{ min: 1, max: steps.length, now: index + 1 }}
      className={cn("gap-2", className)}
    >
      <Text className="text-sm text-fg-muted">{position}</Text>
      <Presence swapKey={step.id} exit="none" className="gap-2">
        <Text font="display" className="text-lg font-rc-display text-fg">
          {step.title}
        </Text>
        {step.description !== undefined && (
          <Text className="text-sm text-fg-muted">{step.description}</Text>
        )}
      </Presence>

      <View className="mt-1 h-1 w-full overflow-hidden rounded-pill bg-skeleton">
        <Fill
          percent={percent(index, steps.length)}
          className="h-full rounded-pill bg-accent-text"
        />
      </View>
    </View>
  );
}

export type WizardState = {
  step: number;
  current: Step | undefined;
  isFirst: boolean;
  isLast: boolean;
  /**
   * Advances. Receives an optional check that can be async: return `false` and
   * the step does not move. This is where React Hook Form's `trigger` comes in,
   * without the wizard knowing React Hook Form.
   */
  next: (validate?: () => boolean | Promise<boolean>) => Promise<boolean>;
  back: () => void;
  goTo: (index: number) => void;
};

export function useWizard(steps: Step[], initial = 0): WizardState {
  const [step, setStep] = useState(initial);
  const validating = useRef(false);

  const next = useCallback(
    async (validate?: () => boolean | Promise<boolean>) => {
      if (validating.current) return false;
      if (validate) {
        validating.current = true;
        try {
          if (!(await validate())) return false;
        } finally {
          validating.current = false;
        }
      }
      setStep((previous) => Math.min(previous + 1, steps.length - 1));
      return true;
    },
    [steps.length],
  );

  const back = useCallback(() => setStep((previous) => Math.max(previous - 1, 0)), []);

  const goTo = useCallback(
    (index: number) => setStep(Math.min(Math.max(index, 0), steps.length - 1)),
    [steps.length],
  );

  return {
    step,
    current: steps[step],
    isFirst: step === 0,
    isLast: step === steps.length - 1,
    next,
    back,
    goTo,
  };
}

export type WizardFooterProps = {
  children: ReactNode;
  className?: string;
};

export function WizardFooter({ children, className }: WizardFooterProps) {
  return <View className={cn("mt-6 gap-3", className)}>{children}</View>;
}
