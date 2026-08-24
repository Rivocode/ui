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
  onStepClick?: (indice: number) => void;
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
  const atual = steps[current];

  return (
    <>
      <div className="flex flex-col gap-2 sm:hidden">
        <p className="font-sans text-sm text-fg-muted">
          Step {current + 1} de {steps.length}
        </p>
        <p className="font-display text-lg text-fg">{atual?.title}</p>
        <div className="h-1 w-full overflow-hidden rounded-pill bg-skeleton">
          <div
            className="h-full rounded-pill bg-accent transition-[width] duration-[var(--rc-duration-base)] ease-rc"
            style={{ width: `${((current + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <ol {...props} className={cn("hidden items-start gap-2 sm:flex", className)}>
        {steps.map((passo, indice) => {
          const concluido = indice < current;
          const agora = indice === current;
          const podeVoltar = Boolean(onStepClick) && concluido;

          return (
            <li key={passo.id} className="flex min-w-0 flex-1 items-start gap-3">
              <button
                type="button"
                disabled={!podeVoltar}
                onClick={podeVoltar ? () => onStepClick!(indice) : undefined}
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
                  {concluido ? <Check size={13} aria-hidden="true" /> : indice + 1}
                </span>

                <span className="flex min-w-0 flex-col">
                  <span
                    className={cn(
                      "truncate font-sans text-sm",
                      agora ? "font-medium text-fg" : "text-fg-muted",
                    )}
                  >
                    {passo.title}
                  </span>
                  {passo.description && (
                    <span className="truncate text-xs text-fg-subtle">{passo.description}</span>
                  )}
                </span>
              </button>

              {indice < steps.length - 1 && (
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
  passo: number;
  atual: Step | undefined;
  primeiro: boolean;
  ultimo: boolean;
  /**
   * Avanca. Recebe uma checagem opcional que pode ser assincrona: devolva
   * `false` e o passo nao anda. E por aqui que entra o `trigger` do React Hook
   * Form, sem o assistente conhecer o React Hook Form.
   */
  avancar: (checar?: () => boolean | Promise<boolean>) => Promise<boolean>;
  voltar: () => void;
  irPara: (indice: number) => void;
};

/**
 * O estado de um formulario em etapas. So conta e valida a passagem; o
 * desenho fica com o `Steps` e o conteudo com quem usa.
 */
export function useWizard(steps: Step[], inicial = 0): WizardState {
  const [passo, setPasso] = useState(inicial);

  const avancar = useCallback(
    async (checar?: () => boolean | Promise<boolean>) => {
      if (checar && !(await checar())) return false;
      setPasso((atual) => Math.min(atual + 1, steps.length - 1));
      return true;
    },
    [steps.length],
  );

  const voltar = useCallback(() => setPasso((atual) => Math.max(atual - 1, 0)), []);

  const irPara = useCallback(
    (indice: number) => setPasso(Math.min(Math.max(indice, 0), steps.length - 1)),
    [steps.length],
  );

  return {
    passo,
    atual: steps[passo],
    primeiro: passo === 0,
    ultimo: passo === steps.length - 1,
    avancar,
    voltar,
    irPara,
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
