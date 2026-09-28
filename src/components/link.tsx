import { useRender } from "@base-ui/react/use-render";
import { ArrowUpRight } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactElement, Ref } from "react";

import { cn } from "../lib/cn";

export type LinkTone = "accent" | "neutral" | "muted" | "inherit";

const TONE: Record<LinkTone, string> = {
  accent: "text-accent-text",
  neutral: "text-fg",
  muted: "text-fg-muted hover:text-fg",
  inherit: "",
};

const SAFE_REL = ["noopener", "noreferrer"];

export type LinkProps = ComponentPropsWithoutRef<"a"> & {
  /**
   * O papel de cor. `accent` e o link solto na pagina; `neutral` e `muted`
   * servem a lista de links e ao rodape; `inherit` pega a cor da frase, e e o
   * que vai dentro de um `Alert`, onde a cor do tom ja foi medida contra o
   * fundo dele.
   */
  tone?: LinkTone;
  /**
   * `always` sublinha sempre, e e o que a pagina precisa quando o link mora
   * no meio de uma frase: a cor sozinha nao basta para quem nao distingue a
   * cor. `hover` so sublinha ao passar, e so vale fora do texto corrido, numa
   * lista em que a posicao ja diz que aquilo e link.
   */
  underline?: "always" | "hover";
  /**
   * Abre em outra aba, com `rel="noopener noreferrer"`, desenha a seta de
   * saida e avisa o leitor de tela com o `labels.external`.
   */
  external?: boolean;
  /**
   * Troca o elemento mantendo a aparencia, para o link do router:
   * `<Link render={<RouterLink to="/notas" />}>`. O `href`, o foco e a
   * navegacao passam a ser do router; o desenho continua sendo daqui.
   */
  render?: ReactElement;
  ref?: Ref<HTMLAnchorElement>;
  /**
   * Os textos da peca, para trocar o idioma: `external` e o aviso que o leitor
   * de tela ouve depois do texto de um link `external`, "(abre em nova aba)"
   * sem ele.
   */
  labels?: Partial<LinkLabels>;
};

export type LinkLabels = {
  external: string;
};

export function Link({
  tone = "accent",
  underline = "always",
  external = false,
  render,
  labels,
  className,
  children,
  target,
  rel,
  ...props
}: LinkProps) {
  const externalLabel = labels?.external ?? "(abre em nova aba)";
  const safeRel = external
    ? [...new Set([...(rel?.split(/\s+/).filter(Boolean) ?? []), ...SAFE_REL])].join(" ")
    : rel;

  return useRender({
    render: render ?? <a />,
    props: {
      ...props,
      target: external ? (target ?? "_blank") : target,
      rel: safeRel,
      "data-external": external || undefined,
      className: cn(
        "rounded-sm box-decoration-clone underline-offset-[0.2em] decoration-1",
        "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        underline === "always" ? "underline hover:decoration-2" : "no-underline hover:underline",
        TONE[tone],
        className,
      ),
      children: external ? (
        <>
          {children}
          <ArrowUpRight
            aria-hidden="true"
            className="-mr-[0.2em] ml-0.5 inline-block size-[0.9em] shrink-0 align-[-0.1em]"
          />
          <span className="sr-only">{` ${externalLabel}`}</span>
        </>
      ) : (
        children
      ),
    },
  });
}
