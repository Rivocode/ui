import type { ReactNode } from "react";
import { Pressable, Text, type PressableProps } from "react-native";

/* O cn do web e tailwind-merge; aqui um join basta, porque as variantes nao
   colidem entre si. */
const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const CONTAINER: Record<string, string> = {
  primary: "bg-accent active:bg-accent-active",
  secondary: "bg-surface border border-border-strong active:bg-surface-raised",
  ghost: "active:bg-accent-subtle",
  destructive: "bg-danger active:opacity-90",
};

const LABEL: Record<string, string> = {
  primary: "text-accent-fg",
  secondary: "text-fg",
  ghost: "text-fg-muted",
  destructive: "text-danger-fg",
};

export type ButtonProps = Omit<PressableProps, "children"> & {
  children: ReactNode;
  variant?: keyof typeof CONTAINER;
  size?: "sm" | "md" | "lg";
};

/**
 * O botao nativo: Pressable com os mesmos papeis do web. A altura vem da
 * densidade, via variavel que o provider injeta - cravar 40 aqui quebraria a
 * densidade compacta igual quebra la.
 */
export function Button({ children, variant = "primary", size = "md", ...props }: ButtonProps) {
  const height = { sm: "h-[--rc-control-sm]", md: "h-[--rc-control-md]", lg: "h-[--rc-control-lg]" }[
    size
  ];
  const pad = {
    sm: "px-[--rc-control-pad-sm]",
    md: "px-[--rc-control-pad-md]",
    lg: "px-[--rc-control-pad-lg]",
  }[size];
  const text = { sm: "text-sm", md: "text-base", lg: "text-md" }[size];

  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-md",
        height,
        pad,
        CONTAINER[variant],
        props.disabled && "opacity-50",
      )}
    >
      <Text className={cn("font-medium", text, LABEL[variant])}>{children}</Text>
    </Pressable>
  );
}
