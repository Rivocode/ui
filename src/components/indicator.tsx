import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";

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

/**
 * A contagem por cima de outra coisa: avisos no sino, itens na aba, mensagens
 * no menu.
 *
 * Existe como peca porque a alternativa e cada tela posicionar um `Badge` com
 * `absolute` na mao, e as cinco telas acabam com cinco deslocamentos
 * diferentes - e todas com o mesmo defeito, que e a contagem existir so para
 * quem ve.
 */
export function Indicator({
  children,
  count,
  max = 99,
  label,
  dot,
  className,
  classNames,
  ...props
}: IndicatorProps) {
  const show = dot || (count !== undefined && count > 0);
  const written = count !== undefined && count > max ? `${max}+` : String(count ?? "");

  return (
    <span {...props} className={cn("relative inline-flex", className)}>
      {children}

      {show && (
        <span
          aria-hidden={label ? "true" : undefined}
          className={cn(
            "pointer-events-none absolute -top-1 -right-1 z-[var(--rc-z-base)]",
            "flex items-center justify-center rounded-pill bg-danger text-danger-fg",
            // O anel da cor do fundo separa a pastilha do que esta embaixo:
            // sem ele, um numero claro sobre um icone claro some na borda.
            "ring-2 ring-bg",
            dot ? "size-2.5" : "h-4 min-w-4 px-1 font-mono text-[0.65rem] leading-none",
            classNames?.badge,
          )}
        >
          {dot ? null : written}
        </span>
      )}

      {/* A contagem precisa ser dita, e nao so vista: o numero na pastilha e
          escondido do leitor e o texto inteiro entra aqui. */}
      {show && label && <span className="sr-only">{label}</span>}
    </span>
  );
}
