import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";

const markerVariants = cva(
  cn("relative z-[var(--rc-z-base)] mt-1.5 size-2.5 shrink-0 rounded-pill"),
  {
    variants: {
      tone: {
        neutral: "bg-border-strong",
        accent: "bg-accent",
        success: "bg-success",
        warning: "bg-warning",
        danger: "bg-danger",
      },
      /**
       * O que ainda nao aconteceu fica vazado. Preencher o marcador de um
       * evento futuro faz a linha prometer que ele ja ocorreu, que e
       * exatamente o erro que uma trilha de auditoria nao pode cometer.
       */
      pending: { true: "bg-bg ring-inset ring-2 ring-border-strong", false: "" },
    },
    defaultVariants: { tone: "neutral", pending: false },
  },
);

export type TimelineItemProps = ComponentProps<"li"> &
  VariantProps<typeof markerVariants> & {
    /** O que aconteceu. */
    title: ReactNode;
    /** Quando aconteceu. Costuma ser um `RelativeTime` ou uma data curta. */
    at?: ReactNode;
    /** Quem fez. Numa trilha de auditoria, e metade da informacao. */
    by?: ReactNode;
    /** Classe por parte: `marker`, `title`, `meta`, `content`. */
    classNames?: Slots<"marker" | "title" | "meta" | "content">;
  };

/**
 * Um ponto da linha do tempo.
 *
 * O tom e por item de proposito: numa nota fiscal, a linha do cancelamento e
 * vermelha e as outras nao, e e essa linha que a pessoa procura quando abre a
 * trilha.
 */
export function TimelineItem({
  className,
  title,
  at,
  by,
  tone,
  pending,
  children,
  classNames,
  ...props
}: TimelineItemProps) {
  return (
    <li
      {...props}
      className={cn(
        "relative flex gap-3 pb-5 last:pb-0",
        // A linha e desenhada por item, e nao pelo <ol>: assim o ultimo ponto
        // nao deixa um rabo de linha pendurado embaixo dele, e a peca continua
        // funcionando quando um item e mais alto que os outros.
        "before:absolute before:top-4 before:bottom-0 before:left-[0.3125rem] before:w-px",
        "before:bg-border last:before:hidden",
        className,
      )}
    >
      <span aria-hidden="true" className={cn(markerVariants({ tone, pending }), classNames?.marker)} />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p
            className={cn(
              "font-sans text-base",
              pending ? "text-fg-muted" : "text-fg",
              classNames?.title,
            )}
          >
            {title}
          </p>
          {(at || by) && (
            <p className={cn("font-mono text-xs text-fg-subtle", classNames?.meta)}>
              {at}
              {at && by ? " · " : null}
              {by}
            </p>
          )}
        </div>

        {children && (
          <div className={cn("text-sm text-fg-muted", classNames?.content)}>{children}</div>
        )}
      </div>
    </li>
  );
}

export type TimelineProps = ComponentProps<"ol">;

/**
 * O que aconteceu com uma coisa, em ordem.
 *
 * Nao e `Steps`. O Steps e assistente: olha para a frente, sabe quantos passos
 * faltam e so deixa voltar. Uma nota fiscal olha para tras - emitida,
 * autorizada, enviada, paga, cancelada - com carimbo de tempo e autor em cada
 * ponto, e ninguem "avanca" nela. Trocar uma pela outra faz o controle
 * prometer o que ele nao faz, que e o mesmo argumento que separa `Progress` de
 * `Meter`.
 *
 * Sai como `<ol>` porque a ordem e o dado: um leitor de tela que anuncia "lista
 * de 5 itens" na ordem certa ja entregou metade do que a linha desenha.
 *
 * A linha vertical e desenhada por item, e nao por aqui: o ultimo ponto esconde
 * a propria linha, senao sobra um rabo pendurado embaixo dele.
 */
export function Timeline({ className, ...props }: TimelineProps) {
  return <ol {...props} className={cn("flex flex-col", className)} />;
}
