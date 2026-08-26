import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export type TrackerPoint = {
  /** O que aconteceu nesse periodo. */
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
  /** O que o leitor de tela ouve e o que a dica mostra. */
  label: ReactNode;
};

const TONE: Record<NonNullable<TrackerPoint["tone"]>, string> = {
  neutral: "bg-skeleton",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  accent: "bg-accent",
};

export type TrackerProps = Omit<ComponentProps<"div">, "children"> & {
  data: TrackerPoint[];
  /** O que a faixa mede, dito por extenso para o leitor de tela. */
  label: string;
  /** Classe por parte: `label`, `track`, `cell`. */
  classNames?: Slots<"label" | "track" | "cell">;
};

/**
 * A faixa de quadradinhos por periodo: as ultimas 90 emissoes, a
 * disponibilidade do mes, a fila dos ultimos dias.
 *
 * Ela responde uma pergunta que o numero sozinho nao responde - "esteve sempre
 * assim, ou piorou ontem?" - e por isso cabe dentro de um `Stat`, embaixo do
 * valor.
 *
 * Cada quadrado carrega o proprio texto. Uma faixa de cor sem texto nao existe
 * para quem usa leitor de tela, e "verde, verde, vermelho" tambem nao diz nada
 * para quem enxerga: o que importa e qual dia foi o vermelho.
 */
export function Tracker({ data, label, className, classNames, ...props }: TrackerProps) {
  return (
    <div {...props} className={cn("flex flex-col gap-1.5", className)}>
      <p className={cn("sr-only", classNames?.label)}>{label}</p>

      <div
        role="group"
        aria-label={label}
        className={cn("flex w-full items-stretch gap-0.5", classNames?.track)}
      >
        {data.map((point, index) => (
          <Tooltip key={index}>
            <TooltipTrigger
              render={
                <div
                  data-rc-track={point.tone ?? "neutral"}
                  // Cada quadrado e um alvo: `flex-1` com `min-w-0` deixa a
                  // faixa caber em qualquer largura sem estourar, e a altura
                  // fixa mantem a leitura de barra e nao de mosaico.
                  className={cn(
                    "h-7 min-w-0 flex-1 rounded-sm",
                    TONE[point.tone ?? "neutral"],
                    classNames?.cell,
                  )}
                />
              }
            />
            <TooltipContent>{point.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* O texto de cada periodo, para o leitor de tela ler a faixa inteira
          em ordem - a dica so existe para quem tem ponteiro. */}
      <ul className="sr-only">
        {data.map((point, index) => (
          <li key={index}>{point.label}</li>
        ))}
      </ul>
    </div>
  );
}
