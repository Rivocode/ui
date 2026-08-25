import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "./cn";

export type AspectRatioProps = {
  /** Largura sobre altura: `16 / 9`, `1`, `4 / 3`. */
  ratio: number;
  children: ReactNode;
  className?: string;
};

/**
 * A caixa que guarda a proporcao antes de o conteudo chegar: imagem, mapa,
 * video. Reservar o espaco e o que impede a tela de pular no carregamento.
 */
export function AspectRatio({ ratio, children, className }: AspectRatioProps) {
  return (
    <View
      style={{ aspectRatio: ratio }}
      className={cn("w-full overflow-hidden rounded-md", className)}
    >
      {children}
    </View>
  );
}
