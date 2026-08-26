"use client";

import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { resolveFormat, type Format } from "../lib/format";
import { Card, CardContent } from "./card";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export type StatProps = {
  /** O que o numero mede: "Faturado em agosto". */
  label: string;
  /** O numero, ja formatado: `currencyShort(246_700)`. */
  value: ReactNode;
  /**
   * A variacao. Positivo sobe, negativo desce.
   *
   * A unidade e do `deltaFormat`, e nao do numero: sem ele o padrao continua
   * sendo porcentagem.
   */
  delta?: number;
  /** Contra o que se compara: "sobre julho". Sem ele, so a variacao. */
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
  /**
   * O icone em caixa, a esquerda do rotulo. E a convencao de painel, e sem
   * slot cada tela remontava o cartao inteiro para te-lo.
   */
  icon?: ReactNode;
  /** O canto direito do cartao: o menu de tres pontos, um botao de acao. */
  actions?: ReactNode;
  /** A faixa de baixo: meta com barra, comparacao, texto de apoio. */
  footer?: ReactNode;
  /**
   * Como a variacao e escrita: nome de formatador da casa (`percent`,
   * `currencyShort`, `integer`...) ou funcao propria. E o mesmo vocabulario do
   * `Progress`, do `Meter` e do `Slider`, e o mesmo do eixo do grafico.
   *
   * Sem ele, `percent` - que era o unico caminho que existia, cravado no JSX.
   * Delta em real ou em ponto-base saia com um `%` que nao era verdade, e a
   * unica peca de numero da casa fora do vocabulario de formatacao era esta.
   *
   * O `percent` da casa arredonda para inteiro; para casa decimal, passe a
   * funcao: `deltaFormat={(value) => percent(value, 1)}`.
   *
   * O que chega ao formatador e o modulo do `delta`: quem carrega o sinal e a
   * seta, e o texto que o leitor de tela ouve antes dele.
   */
  deltaFormat?: Format;
  /**
   * A variacao como pastilha preenchida, que e a convencao dominante em
   * painel, ou como texto com seta, que e o padrao daqui.
   */
  deltaVariant?: "text" | "pill";
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
  icon,
  actions,
  footer,
  deltaFormat = "percent",
  deltaVariant = "text",
  className,
}: StatProps) {
  const rose = (delta ?? 0) >= 0;
  const good = invert ? !rose : rose;
  const writeDelta = resolveFormat(deltaFormat) as (value: number) => string;

  return (
    <Card className={className}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3">
          {icon && (
            <span
              aria-hidden="true"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-md",
                "bg-accent-subtle text-accent-text",
              )}
            >
              {icon}
            </span>
          )}
          {/* As acoes ficam no canto e fora do fluxo do rotulo: um menu de
              tres pontos empurrando o texto muda a largura do rotulo de um
              cartao para o outro, e a fila de cartoes perde o alinhamento. */}
          {actions && <span className="-mt-1 -mr-1 ml-auto shrink-0">{actions}</span>}
        </div>

        <div className={cn("flex items-center gap-1.5", (icon || actions) && "mt-2")}>
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
              "mt-1 flex w-fit items-center gap-1 text-xs",
              deltaVariant === "pill"
                ? cn(
                    "rounded-pill px-1.5 py-0.5 font-medium",
                    good ? "bg-success-subtle text-success-text" : "bg-danger-subtle text-danger-text",
                  )
                : good
                  ? "text-success-text"
                  : "text-danger-text",
            )}
          >
            {rose ? (
              <ArrowUpRight size={13} aria-hidden="true" />
            ) : (
              <ArrowDownRight size={13} aria-hidden="true" />
            )}
            {/* A cor e a seta contam para o olho; o texto conta para o ouvido. */}
            <span className="sr-only">{rose ? "alta de" : "queda de"} </span>
            {writeDelta(Math.abs(delta))}
            {deltaLabel ? ` ${deltaLabel}` : ""}
          </p>
        )}

        {/* Embaixo do numero e de ponta a ponta, nao ao lado: lado a lado o
            cartao tinha que escolher entre mostrar a tendencia e mostrar o
            valor inteiro, e o valor e a razao do cartao. */}
        {chart && <div className="mt-3">{chart}</div>}

        {/* O rodape depois da tendencia, separado por uma linha: ele costuma
            trazer outra medida - meta, comparacao - e sem a divisoria as duas
            se leem como uma coisa so. */}
        {footer && (
          <div className="mt-3 border-t border-border pt-3 text-xs text-fg-muted">{footer}</div>
        )}
      </CardContent>
    </Card>
  );
}
