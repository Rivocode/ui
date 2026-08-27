import { useCallback, useRef, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";

export function indicatorWidthComplaint(width: number): string | undefined {
  const widest = 48;
  if (!(width > widest)) return undefined;

  return (
    `[rivocode/ui] <Indicator>: o filho mede ${Math.round(width)}px de largura, e a ` +
    `pastilha fica por cima dele sem reservar espaco - acima de ${widest}px ela cobre ` +
    "conteudo. A peca marca alvo pequeno: o botao do sino, o item da barra, o avatar. " +
    "Para marcar uma linha inteira, ponha a contagem ao lado, com um `Badge`."
  );
}

export type IndicatorProps = ComponentProps<"span"> & {
  /** O que recebe a marca: o botao do sino, o item da barra, o avatar. */
  children: ReactNode;
  /**
   * Quantos. Zero nao desenha nada - uma pastilha com "0" chama atencao para
   * dizer que nao ha nada, que e o contrario do trabalho dela.
   */
  count?: number;
  /** O teto: acima dele sai "99+", em vez de a pastilha esticar. */
  max?: number;
  /**
   * O que o leitor de tela ouve. Sem isto ele le so o numero solto, e "7" nao
   * diz o que sao sete.
   */
  label?: string;
  /** Sem contagem: so o ponto, para "tem algo novo aqui". */
  dot?: boolean;
  /** Classe por parte: `badge`. */
  classNames?: Slots<"badge">;
};

export function Indicator({
  children,
  count,
  max = 99,
  label,
  dot,
  className,
  classNames,
  ref,
  ...props
}: IndicatorProps) {
  const show = dot || (count !== undefined && count > 0);
  const written = count !== undefined && count > max ? `${max}+` : String(count ?? "");
  const complained = useRef(false);

  const hold = useCallback(
    (node: HTMLSpanElement | null): void | (() => void) => {
      if (node && !complained.current && process.env.NODE_ENV !== "production") {
        const complaint = indicatorWidthComplaint(node.offsetWidth);
        if (complaint) {
          complained.current = true;
          console.warn(complaint);
        }
      }

      if (typeof ref === "function") return ref(node) as void | (() => void);
      if (ref) (ref as { current: HTMLSpanElement | null }).current = node;
    },
    [ref],
  );

  return (
    <span {...props} ref={hold} className={cn("relative inline-flex", className)}>
      {children}

      {show && (
        <span
          aria-hidden={label ? "true" : undefined}
          className={cn(
            "pointer-events-none absolute -top-1 -right-1 z-[var(--rc-z-base)]",
            "flex items-center justify-center rounded-pill bg-danger text-danger-fg",
            "ring-2 ring-bg",
            dot ? "size-2.5" : "h-4 min-w-4 px-1 font-mono text-[0.65rem] leading-none",
            classNames?.badge,
          )}
        >
          {dot ? null : written}
        </span>
      )}

      {show && label && <span className="sr-only">{label}</span>}
    </span>
  );
}
