import { useCallback, useState, type ReactNode } from "react";
import { View } from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

export type Step = {
  id: string;
  title: string;
  description?: string;
};

export type StepsProps = {
  steps: Step[];
  /** Índice do passo atual, contando de zero. */
  current: number;
  className?: string;
};

const percent = (index: number, total: number) => ((index + 1) / total) * 100;

export function Steps({ steps, current, className }: StepsProps) {
  if (steps.length === 0) return null;

  const index = Math.min(Math.max(current, 0), steps.length - 1);
  const step = steps[index]!;
  const position = `Passo ${index + 1} de ${steps.length}`;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${position}: ${step.title}`}
      accessibilityValue={{ min: 1, max: steps.length, now: index + 1 }}
      className={cn("gap-2", className)}
    >
      <Text className="text-sm text-fg-muted">{position}</Text>
      <Text font="display" className="text-lg font-semibold text-fg">
        {step.title}
      </Text>
      {step.description !== undefined && (
        <Text className="text-sm text-fg-muted">{step.description}</Text>
      )}

      <View className="mt-1 h-1 w-full overflow-hidden rounded-pill bg-skeleton">
        <View
          className="h-full rounded-pill bg-accent"
          style={{ width: `${percent(index, steps.length)}%` }}
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
   * Avança. Recebe uma checagem opcional que pode ser assíncrona: devolva
   * `false` e o passo não anda. É por aqui que entra o `trigger` do React Hook
   * Form, sem o assistente conhecer o React Hook Form.
   */
  next: (validate?: () => boolean | Promise<boolean>) => Promise<boolean>;
  back: () => void;
  goTo: (index: number) => void;
};

export function useWizard(steps: Step[], initial = 0): WizardState {
  const [step, setStep] = useState(initial);

  const next = useCallback(
    async (validate?: () => boolean | Promise<boolean>) => {
      if (validate && !(await validate())) return false;
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
