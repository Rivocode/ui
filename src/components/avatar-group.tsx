import { Children, isValidElement, cloneElement, type ComponentProps, type ReactElement } from "react";

import { cn } from "../lib/cn";
import { Avatar, type AvatarProps } from "./avatar";

export type AvatarGroupProps = ComponentProps<"div"> & {
  /** Quantos aparecem antes do "+n". Sem teto, a fila cresce sem fim. */
  max?: number;
  /** O tamanho vale para a fila inteira, inclusive para o "+n". */
  size?: AvatarProps["size"];
};

/**
 * A fila de pessoas de um lugar: quem participa da conversa, quem assinou,
 * quem tem acesso.
 *
 * Duas decisoes moram aqui para nao serem tomadas cinco vezes diferentes.
 *
 * A primeira: a sobreposicao corta a inicial. Com duas letras, o avatar de
 * cima cobre a segunda letra do de baixo e o que sobra e um borrao - entao a
 * fila usa uma letra so, e a peca faz isso sozinha em vez de pedir que quem
 * chama saiba disso.
 *
 * A segunda: o excedente vira "+n" e nao some. Uma fila de tres com mais dez
 * escondidos mente sobre o tamanho do grupo, e o numero e justamente o que a
 * pessoa procura ali.
 */
export function AvatarGroup({ className, max, size, children, ...props }: AvatarGroupProps) {
  const all = Children.toArray(children).filter(isValidElement) as ReactElement<AvatarProps>[];
  const shown = max ? all.slice(0, max) : all;
  const rest = all.length - shown.length;

  return (
    <div
      {...props}
      // O da esquerda por cima: a leitura vai da esquerda para a direita, e o
      // primeiro rosto e o que fica inteiro.
      className={cn("flex items-center -space-x-2", className)}
    >
      {shown.map((child, index) =>
        cloneElement(child, {
          key: child.key ?? index,
          size: size ?? child.props.size,
          fallback: child.props.fallback?.slice(0, 1),
          className: cn("ring-2 ring-bg", child.props.className),
        }),
      )}

      {rest > 0 && (
        <Avatar
          size={size}
          fallback={`+${rest}`}
          aria-label={`mais ${rest}`}
          className="ring-2 ring-bg"
        />
      )}
    </div>
  );
}
