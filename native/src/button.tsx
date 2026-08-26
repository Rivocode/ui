import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";

import { tokens } from "../tokens";
import { cn } from "./cn";
import { useRivo } from "./provider";

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

/* A espera nao aceita classe: o ActivityIndicator pinta por prop `color`.
   O papel e o mesmo do rotulo ao lado, para o rodinha nao destoar da cor
   que a variante ja escolheu. */
const SPINNER_TOKEN: Record<string, keyof (typeof tokens.themes)["rivocode-dark"]> = {
  primary: "accent-fg",
  secondary: "fg",
  ghost: "fg-muted",
  destructive: "danger-fg",
};

/**
 * A espera vive num componente proprio para o `useRivo` so rodar quando ela
 * existe: chamado no corpo do Button, ele passaria a exigir o RivoProvider de
 * TODO botao, inclusive o que hoje monta sozinho num teste ou num trecho solto.
 */
function ButtonSpinner({ variant }: { variant: string }) {
  const { theme } = useRivo();
  return (
    // Enfeite, como o spinner aria-hidden do web: quem conta que esta ocupado
    // e o accessibilityState, e um "Carregando" solto aqui viraria uma segunda
    // parada do leitor de tela dentro do proprio botao.
    <ActivityIndicator
      accessibilityElementsHidden
      importantForAccessibility="no"
      size="small"
      color={tokens.themes[theme][SPINNER_TOKEN[variant]]}
    />
  );
}

export type ButtonProps = Omit<PressableProps, "children"> & {
  children: ReactNode;
  variant?: keyof typeof CONTAINER;
  size?: "sm" | "md" | "lg";
  /** Em espera: nao aceita toque e anuncia `busy`. O mesmo nome do web. */
  loading?: boolean;
};

/**
 * O botao nativo: Pressable com os mesmos papeis do web, em tres tamanhos
 * de altura fixa - em tela de toque a densidade nao aperta os controles.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps & { className?: string }) {
  // Enquanto espera, o botao nao aceita toque - senao a mesma requisicao sai
  // duas vezes, que e o defeito que o `loading` do web existe para evitar.
  const blocked = disabled || loading;
  // Altura fixa por tamanho, por decisao: alvo de toque nao encolhe em tela
  // de dedo, entao a densidade compacta do web nao porta. Os numeros vinham
  // do web mesmo assim: md em 40px ficava abaixo dos 44pt da Apple e dos 48dp
  // do Android, e so o lg passava - a decisao estava certa e a altura, nao.
  const height = { sm: "h-8", md: "h-11", lg: "h-12" }[size];
  const pad = { sm: "px-3", md: "px-4", lg: "px-5" }[size];
  /*
   * O `sm` desenha 32px, e subir para 44 o tornaria identico ao `md` - a
   * variante existe para a linha densa, tabela, cartao e barra de acao. Entao
   * o que cresce e a area de toque, e nao o desenho: 32 mais 6 de cada lado da
   * os 44 da Apple. Quem ja passa do minimo nao ganha area extra, porque
   * hitSlop em botao grande rouba o toque do vizinho sem nada em troca.
   */
  const hitSlop = size === "sm" ? { top: 6, bottom: 6, left: 0, right: 0 } : undefined;
  const text = { sm: "text-sm", md: "text-base", lg: "text-md" }[size];

  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      disabled={blocked}
      // Sem isto o desabilitado so escurecia: o leitor de tela anunciava um
      // botao ativo que nao responde ao toque, e a espera nao existia para ele.
      accessibilityState={{ disabled: Boolean(blocked), busy: loading }}
      hitSlop={hitSlop}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-md",
        height,
        pad,
        CONTAINER[variant],
        blocked && "opacity-50",
        // A classe de quem usa vence a da peca, como no web.
        className,
      )}
    >
      {loading && <ButtonSpinner variant={variant} />}
      <Text className={cn("font-medium", text, LABEL[variant])}>{children}</Text>
    </Pressable>
  );
}
