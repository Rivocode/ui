"use client";

import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { Card, CardContent } from "./card";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export type StatProps = {
  /** O que o numero mede: "Faturado em agosto". */
  label: string;
  /** O numero, ja formatado: `currencyShort(246_700)`. */
  value: ReactNode;
  /** Variacao em pontos percentuais. Positivo sobe, negativo desce. */
  delta?: number;
  /** Contra o que se compara: "sobre julho". Sem ele, so a porcentagem. */
  deltaLabel?: string;
  /** Explicacao curta atras de um botao de informacao. */
  hint?: string;
  /**
   * Subir e ruim aqui: vencidas, custo, inadimplencia. A seta continua
   * apontando para onde o numero foi; o que inverte e o julgamento da cor.
   */
  invert?: boolean;
  /**
   * A tendencia embaixo do numero. Passe a `Sparkline` de
   * `@rivocode/ui/chart`; o nucleo nao a importa porque ela traz o recharts
   * junto, e um painel sem grafico nao deveria pagar por ele.
   */
  chart?: ReactNode;
  className?: string;
};

/**
 * O numero de painel: rotulo, valor, variacao e tendencia, na hierarquia que
 * todo painel reinventa na mao.
 *
 * O valor chega formatado porque formatar e decisao de dominio: dinheiro sai
 * abreviado do `currencyShort`, contagem sai crua, percentual traz o sinal.
 */
export function Stat({
  label,
  value,
  delta,
  deltaLabel,
  hint,
  invert,
  chart,
  className,
}: StatProps) {
  const rose = (delta ?? 0) >= 0;
  const good = invert ? !rose : rose;

  return (
    <Card className={className}>
      <CardContent className="py-4">
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-fg-muted">{label}</p>
          {hint && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label={`Sobre ${label.toLowerCase()}`}
                    /* O icone tem 13px, mas o alvo precisa de 24. A margem
                       negativa devolve o espaco que o botao maior tomaria,
                       para a linha do rotulo nao crescer com ele. */
                    className={cn(
                      "-my-1 flex size-6 items-center justify-center rounded-sm text-fg-subtle",
                      "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  />
                }
              >
                <Info size={13} aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>{hint}</TooltipContent>
            </Tooltip>
          )}
        </div>

        <p className="mt-1 font-display text-2xl tracking-tight text-fg">{value}</p>

        {delta !== undefined && (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-xs",
              good ? "text-success-text" : "text-danger-text",
            )}
          >
            {rose ? (
              <ArrowUpRight size={13} aria-hidden="true" />
            ) : (
              <ArrowDownRight size={13} aria-hidden="true" />
            )}
            {/* A cor e a seta contam para o olho; o texto conta para o ouvido. */}
            <span className="sr-only">{rose ? "alta de" : "queda de"} </span>
            {Math.abs(delta)}%{deltaLabel ? ` ${deltaLabel}` : ""}
          </p>
        )}

        {/* Embaixo do numero e de ponta a ponta, nao ao lado: lado a lado o
            cartao tinha que escolher entre mostrar a tendencia e mostrar o
            valor inteiro, e o valor e a razao do cartao. */}
        {chart && <div className="mt-3">{chart}</div>}
      </CardContent>
    </Card>
  );
}
