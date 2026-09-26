"use client";

import { Check } from "lucide-react";
import { useCallback, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { STEPS_LABELS, type StepsLabels } from "../shared/steps";

export type { StepsLabels };

export type Step = {
  id: string;
  title: string;
  description?: string;
};

export type StepsProps = Omit<ComponentProps<"ol">, "onChange"> & {
  steps: Step[];
  /** Indice do passo atual, contando de zero. */
  step: number;
  /**
   * Recebe o indice do passo ja concluido que foi clicado. Sem ele, a regua
   * nao e clicavel; com ele, so os passos anteriores ao atual viram botao.
   */
  onStepChange?: (step: number) => void;
  /**
   * Os textos da peca, para trocar o idioma: `position` e a contagem "Passo 2
   * de 5", que recebe o passo atual contando de 1 e o total. Passe so os que
   * mudam.
   */
  labels?: Partial<StepsLabels>;
};

export function Steps({
  className,
  steps,
  step: current,
  onStepChange,
  labels,
  ...props
}: StepsProps) {
  const step = steps[current];
  const { position } = { ...STEPS_LABELS, ...labels };

  return (
    <>
      <div className="flex flex-col gap-2 sm:hidden">
        <p className="font-sans text-sm text-fg-muted">{position(current + 1, steps.length)}</p>
        <p className="font-display font-rc-display text-lg tracking-tight text-fg">{step?.title}</p>
        <div className="h-1 w-full overflow-hidden rounded-pill bg-skeleton">
          <div
            className="h-full rounded-pill bg-accent-text transition-[width] duration-[var(--rc-duration-base)] ease-rc"
            style={{ width: `${((current + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <ol {...props} className={cn("hidden items-start gap-2 sm:flex", className)}>
        {steps.map((step, index) => {
          const isDone = index < current;
          const isCurrent = index === current;
          const canGoBack = Boolean(onStepChange) && isDone;

          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-start gap-3">
              <button
                type="button"
                disabled={!canGoBack}
                onClick={canGoBack ? () => onStepChange!(index) : undefined}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 items-start gap-3 rounded-md p-1 text-left",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  canGoBack && "cursor-pointer hover:bg-accent-subtle",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-pill",
                    "font-mono text-xs",
                    "transition-[color,background-color,border-color,box-shadow]",
                    "duration-[var(--rc-duration-base)] ease-rc",
                    isDone && "bg-accent text-accent-fg",
                    isCurrent && "bg-accent-subtle text-accent-text ring-2 ring-accent",
                    !isDone && !isCurrent && "border border-border text-fg-subtle",
                  )}
                >
                  {isDone ? <Check size={13} aria-hidden="true" /> : index + 1}
                </span>

                <span className="flex min-w-0 flex-col">
                  <span
                    title={step.title}
                    className={cn(
                      "truncate font-sans text-sm",
                      isCurrent ? "font-rc-medium text-fg" : "text-fg-muted",
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span title={step.description} className="truncate text-xs text-fg-subtle">
                      {step.description}
                    </span>
                  )}
                </span>
              </button>

              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-4 h-px w-8 shrink-0",
                    "transition-colors duration-[var(--rc-duration-base)] ease-rc",
                    isDone ? "bg-accent-text" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}

export type WizardState = {
  step: number;
  current: Step | undefined;
  isFirst: boolean;
  isLast: boolean;
  /**
   * Avanca. Recebe uma checagem opcional que pode ser assincrona: devolva
   * `false` e o passo nao anda. E por aqui que entra o `trigger` do React Hook
   * Form, sem o assistente conhecer o React Hook Form.
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
      setStep((current) => Math.min(current + 1, steps.length - 1));
      return true;
    },
    [steps.length],
  );

  const back = useCallback(() => setStep((current) => Math.max(current - 1, 0)), []);

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

export function WizardFooter({ className, ...props }: { className?: string; children: ReactNode }) {
  return (
    <div
      {...props}
      className={cn(
        "mt-6 flex items-center justify-between gap-3",
        "max-sm:flex-col-reverse max-sm:[&>*]:w-full",
        className,
      )}
    />
  );
}
