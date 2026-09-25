import type { ReactNode } from "react";
import { View, type PressableProps } from "react-native";

import { BUTTON_CONTAINER, BUTTON_INK, ButtonSpinner } from "./button";
import { cn } from "./cn";
import { AnimatedPressable, usePressScale } from "./motion";
import { useRivo } from "./provider";

const TARGET = 44;

const SQUARE = { sm: "size-8", md: "size-11", lg: "size-12" } as const;
const SIDE = { sm: 32, md: 44, lg: 48 } as const;
const GLYPH = { sm: 16, md: 16, lg: 20 } as const;

const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

export type IconButtonProps = Omit<PressableProps, "children" | "accessibilityLabel" | "className"> & {
  /**
   * O icone. A cor nao desce da `View` para o SVG, entao a forma que pinta
   * sozinha e a funcao: ela recebe a cor da variante e o tamanho do quadrado -
   * `{({ color, size }) => <Trash2 color={color} size={size} />}`.
   */
  children: ReactNode | ((glyph: { color: string; size: number }) => ReactNode);
  /** As variantes do `Button`, lidas das mesmas classes. */
  variant?: keyof typeof BUTTON_CONTAINER;
  /**
   * O lado do quadrado: 32, 44 ou 48. O `sm` ganha `hitSlop` ate 44, porque o
   * alvo de toque nao encolhe com o desenho.
   */
  size?: "sm" | "md" | "lg";
  /** Em espera: troca o icone pelo giro, nao aceita toque e anuncia `busy`. */
  loading?: boolean;
  /**
   * O nome do botao, obrigatorio: e o que o leitor de tela anuncia, e o
   * botao nao tem outro texto. O mesmo nome do web. Diga a acao ("Excluir
   * nota"), e nao o desenho.
   */
  label: string;
  className?: string;
};

export function IconButton({
  label,
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  style,
  onPressIn,
  onPressOut,
  ...props
}: IconButtonProps) {
  const { colors } = useRivo();
  const press = usePressScale({ style, onPressIn, onPressOut });
  const blocked = disabled || loading;
  const slop = Math.max(0, (TARGET - SIDE[size]) / 2);
  const hitSlop = slop > 0 ? { top: slop, bottom: slop, left: slop, right: slop } : undefined;
  const color = colors[BUTTON_INK[variant] ?? "fg"];
  const glyph = typeof children === "function" ? children({ color, size: GLYPH[size] }) : children;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      hitSlop={hitSlop}
      {...props}
      accessibilityLabel={label}
      {...press}
      disabled={blocked}
      accessibilityState={{ disabled: Boolean(blocked), busy: loading }}
      className={cn(
        "items-center justify-center rounded-md",
        SQUARE[size],
        BUTTON_CONTAINER[variant],
        blocked && "opacity-50",
        className,
      )}
    >
      {loading ? <ButtonSpinner variant={variant} /> : <View {...HIDDEN}>{glyph}</View>}
    </AnimatedPressable>
  );
}
