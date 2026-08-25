"use client";

import { Check } from "lucide-react";
import { useCallback, useState, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";

export type Step = {
  id: string;
  title: string;
  description?: string;
};

export type StepsProps = Omit<ComponentProps<"ol">, "onChange"> & {
  steps: Step[];
  /** Indice do passo atual, contando de zero. */
  current: number;
  /** Deixa voltar clicando num passo ja concluido. */
  onStepClick?: (index: number) => void;
};

/**
 * A regua de passos de um formulario longo.
 *
 * No celular ela vira uma linha de texto com a barra de progresso, e nao a
 * regua inteira: quatro bolinhas com rotulo em 390px viram quatro palavras
 * cortadas, e o que importa ali e saber quanto falta.
 *
 * So da para voltar, nunca pular para frente. Step adiante costuma depender
 * do que o anterior validou, e um clique que atravessa isso leva a pessoa a
 * uma tela que nao sabe se preencher.
 */
export function Steps({ className, steps, current, onStepClick, ...props }: StepsProps) {
  const step = steps[current];

  return (
    <>
      <div className="flex flex-col gap-2 sm:hidden">
        <p className="font-sans text-sm text-fg-muted">
          Step {current + 1} de {steps.length}
        </p>
        <p className="font-display text-lg tracking-tight text-fg">{step?.title}</p>
        <div className="h-1 w-full overflow-hidden rounded-pill bg-skeleton">
          <div
            className="h-full rounded-pill bg-accent transition-[width] duration-[var(--rc-duration-base)] ease-rc"
            style={{ width: `${((current + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <ol {...props} className={cn("hidden items-start gap-2 sm:flex", className)}>
        {steps.map((step, index) => {
          const concluido = index < current;
          const agora = index === current;
          const podeVoltar = Boolean(onStepClick) && concluido;

          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-start gap-3">
              <button
                type="button"
                disabled={!podeVoltar}
                onClick={podeVoltar ? () => onStepClick!(index) : undefined}
                aria-current={agora ? "step" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 items-start gap-3 rounded-md p-1 text-left",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  podeVoltar && "cursor-pointer hover:bg-accent-subtle",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-pill",
                    "font-mono text-xs",
                    concluido && "bg-accent text-accent-fg",
                    agora && "bg-accent-subtle text-accent-text ring-2 ring-accent",
                    !concluido && !agora && "border border-border text-fg-subtle",
                  )}
                >
                  {concluido ? <Check size={13} aria-hidden="true" /> : index + 1}
                </span>

                <span className="flex min-w-0 flex-col">
                  <span
                    className={cn(
                      "truncate font-sans text-sm",
                      agora ? "font-medium text-fg" : "text-fg-muted",
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="truncate text-xs text-fg-subtle">{step.description}</span>
                  )}
                </span>
              </button>

              {index < steps.length - 1 && (
                /* Largura fixa: com `flex-1` o fio dividia a linha com o
                   rotulo e comia metade dela, cortando "Cliente" em "Clie…"
                   antes de o desenho ficar apertado de verdade. */
                <span aria-hidden="true" className="mt-4 h-px w-8 shrink-0 bg-border" />
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

/**
 * O estado de um formulario em etapas. So conta e valida a passagem; o
 * desenho fica com o `Steps` e o conteudo com quem usa.
 */
export function useWizard(steps: Step[], initial = 0): WizardState {
  const [step, setStep] = useState(initial);

  const next = useCallback(
    async (validate?: () => boolean | Promise<boolean>) => {
      if (validate && !(await validate())) return false;
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

/** O rodape de um assistente: voltar de um lado, avancar do outro. */
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
