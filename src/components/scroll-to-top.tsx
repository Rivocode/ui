"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { useReducedMotion } from "../hooks/environment";
import { cn } from "../lib/cn";
import { focusLandmark } from "../lib/focus";
import type { Slots } from "../lib/slots";
import { Affix, type AffixProps } from "./affix";
import { IconButton, type IconButtonProps } from "./icon-button";

export type ScrollToTopProps = Omit<AffixProps, "children" | "onClick"> & {
  /** Quantos pixels a pessoa precisa descer para o botao aparecer. Acima disso ele nem existe. */
  threshold?: number;
  /**
   * A caixa que rola, quando nao e a janela. Passe o elemento, e nao o ref:
   * `const [caixa, setCaixa] = useState<HTMLElement | null>(null)`.
   */
  target?: HTMLElement | null;
  /**
   * Para onde o foco vai depois de subir. Sem ele, a caixa de `target`; sem
   * `target`, o `<main>` da pagina, e sem `<main>`, o `<body>`. O foco nao
   * pode ficar no botao, que some assim que a pagina chega ao topo.
   */
  focusTarget?: HTMLElement | null;
  /** O nome do botao, que o leitor de tela anuncia e a dica mostra. */
  label?: string;
  /** O icone. Sem ele, a seta para cima. */
  icon?: ReactNode;
  /** Mostra o `label` numa dica ao pousar o ponteiro ou focar pelo teclado. */
  tooltip?: boolean;
  /** O lado do quadrado do botao, lido de `--rc-control-*`. */
  size?: IconButtonProps["size"];
  /** A variante do `Button` por baixo. `secondary` le sobre qualquer fundo. */
  variant?: IconButtonProps["variant"];
  /** Chamado depois que a subida comecou e o foco ja foi movido. */
  onScrollToTop?: () => void;
  classNames?: Slots<"button">;
};

function offsetOf(target: HTMLElement | null | undefined) {
  if (target) return target.scrollTop;
  return typeof window === "undefined" ? 0 : window.scrollY;
}

export function ScrollToTop({
  threshold = 400,
  target,
  focusTarget,
  label = "Voltar ao topo",
  icon,
  tooltip = false,
  size = "md",
  variant = "secondary",
  onScrollToTop,
  className,
  classNames,
  ...props
}: ScrollToTopProps) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const source: HTMLElement | Window = target ?? window;
    const update = () => setVisible(offsetOf(target) > threshold);
    update();
    source.addEventListener("scroll", update, { passive: true });
    return () => source.removeEventListener("scroll", update);
  }, [target, threshold]);

  if (!visible) return null;

  function climb() {
    const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
    if (target) target.scrollTo?.({ top: 0, behavior });
    else window.scrollTo?.({ top: 0, behavior });

    const destination =
      focusTarget ?? target ?? document.querySelector<HTMLElement>("main") ?? document.body;
    focusLandmark(destination);
    onScrollToTop?.();
  }

  return (
    <Affix {...props} className={className}>
      <IconButton
        type="button"
        label={label}
        tooltip={tooltip}
        size={size}
        variant={variant}
        shape="pill"
        onClick={climb}
        className={cn("animate-pop shadow-2", classNames?.button)}
      >
        {icon ?? <ArrowUp />}
      </IconButton>
    </Affix>
  );
}
