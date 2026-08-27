import { type TextProps } from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

export type CodeProps = Omit<TextProps, "children" | "className"> & {
  /** O trecho, cru: `app.json`, `--frozen-lockfile`, `emitida_em`. */
  children: string;
  /**
   * O toque longo seleciona e o sistema oferece copiar. Ligado, porque é o
   * gesto nativo para o que existe para ser copiado, e porque no celular
   * não há como arrastar o cursor sobre meia frase.
   *
   * Uma ressalva de plataforma: no Android quem seleciona é o bloco de texto
   * inteiro, e um `Code` dentro de um `Text` maior é um pedaço dele. Ali o
   * `selectable` precisa estar no `Text` de fora, e o toque longo seleciona a
   * frase toda.
   */
  selectable?: boolean;
  className?: string;
};

export function Code({ children, className, selectable = true, style, ...props }: CodeProps) {
  return (
    <Text
      {...props}
      selectable={selectable}
      font="mono"
      style={style}
      className={cn("rounded-sm bg-surface-raised px-1.5 text-fg-muted", className)}
    >
      {children}
    </Text>
  );
}
