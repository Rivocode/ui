import {
  Children,
  isValidElement,
  cloneElement,
  type ComponentProps,
  type ReactElement,
} from "react";

import { cn } from "../lib/cn";
import { Avatar, type AvatarProps } from "./avatar";

export type AvatarGroupProps = ComponentProps<"div"> & {
  /** Quantos aparecem antes do "+n". Sem teto, a fila cresce sem fim. */
  max?: number;
  /** O tamanho vale para a fila inteira, inclusive para o "+n". */
  size?: AvatarProps["size"];
  /**
   * Os textos da peca, para trocar o idioma: `more` e o que o leitor de tela
   * ouve no "+n", e recebe quantos ficaram de fora. Passe so os que mudam.
   */
  labels?: Partial<AvatarGroupLabels>;
};

export type AvatarGroupLabels = {
  more: (count: number) => string;
};

const LABELS: AvatarGroupLabels = { more: (count) => `mais ${count}` };

export function AvatarGroup({
  className,
  max,
  size,
  labels,
  children,
  ...props
}: AvatarGroupProps) {
  const text = { ...LABELS, ...labels };
  const all = Children.toArray(children).filter(isValidElement) as ReactElement<AvatarProps>[];
  const shown = max ? all.slice(0, max) : all;
  const rest = all.length - shown.length;

  return (
    <div {...props} className={cn("flex items-center -space-x-2", className)}>
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
          aria-label={text.more(rest)}
          className="ring-2 ring-bg"
        />
      )}
    </div>
  );
}
