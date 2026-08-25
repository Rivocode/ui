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
 * O botao nativo: Pressable com os mesmos papeis do web, em tres tamanhos
 * de altura fixa - em tela de toque a densidade nao aperta os controles.
 */
export function Button({ children, variant = "primary", size = "md", ...props }: ButtonProps) {
  // Altura fixa por tamanho, por decisao: alvo de toque nao encolhe em tela
  // de dedo, entao a densidade compacta do web nao porta.
  const height = { sm: "h-8", md: "h-10", lg: "h-12" }[size];
  const pad = { sm: "px-3", md: "px-4", lg: "px-5" }[size];
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
