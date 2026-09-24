"use client";

import { CircleX, RotateCcw } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Clipboard } from "../components/clipboard";
import { IconButton } from "../components/icon-button";
import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { MESSAGE_AUTHOR as AUTHOR, type MessageRole } from "../shared/ai";

export type { MessageRole };

export type MessageProps = Omit<ComponentPropsWithoutRef<"article">, "role"> & {
  /**
   * Quem fala. Decide o alinhamento e o desenho: `user` e o balao a direita,
   * `assistant` e o texto corrido a esquerda, `system` e a linha discreta no
   * centro.
   */
  role: MessageRole;
  /**
   * O nome de quem fala, para o leitor de tela, que ouve cada mensagem como um
   * artigo com esse nome. Sem ele: "Você", "Assistente" ou "Sistema".
   */
  author?: string;
  /** O `Avatar` ao lado da mensagem. Nao sai em `system`. */
  avatar?: ReactNode;
  /**
   * O texto ainda esta chegando: a mensagem anuncia `aria-busy`, para o leitor
   * de tela ler quando ela terminar e nao a cada pedaco, mostra o indicador e
   * esconde as acoes.
   */
  streaming?: boolean;
  /**
   * Liga o botao de copiar, com este texto. Passe o texto cru (o markdown, e
   * nao o que ele desenha): e o que a pessoa cola em outro lugar.
   */
  copyValue?: string;
  /** Liga o botao de tentar de novo, que pede outra resposta. */
  onRetry?: () => void;
  /** Os nomes dos botoes de acao. Sem eles: "Copiar", "Copiado" e "Tentar de novo". */
  labels?: { copy?: string; copied?: string; retry?: string };
  /** Os botoes proprios, depois do copiar e do tentar de novo: gostei, nao gostei. */
  actions?: ReactNode;
  /**
   * A resposta falhou: a frase sai embaixo do conteudo, com icone e no tom de
   * perigo, e as acoes aparecem mesmo sem conteudo.
   */
  error?: ReactNode;
  classNames?: Slots<"avatar" | "bubble" | "content" | "indicator" | "error" | "actions">;
};

function TypingIndicator({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("inline-flex items-center gap-1 py-1.5", className)}>
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className={cn(
            "size-1.5 animate-pulse rounded-pill bg-fg-subtle motion-reduce:animate-none",
            dot === 1 && "[animation-delay:150ms]",
            dot === 2 && "[animation-delay:300ms]",
          )}
        />
      ))}
    </span>
  );
}

export function Message({
  role,
  author,
  avatar,
  streaming = false,
  copyValue,
  onRetry,
  labels = {},
  actions,
  error,
  children,
  className,
  classNames,
  ...props
}: MessageProps) {
  const isUser = role === "user";
  const isSystem = role === "system";
  const hasContent = children !== undefined && children !== null && children !== "";
  const showActions = !streaming && (copyValue !== undefined || onRetry || actions);

  if (isSystem) {
    return (
      <article
        {...props}
        aria-label={author ?? AUTHOR.system}
        data-role="system"
        className={cn(
          "flex w-full justify-center px-4 py-1 text-center font-sans text-sm text-fg-muted",
          className,
        )}
      >
        <div className={cn("max-w-prose", classNames?.content)}>{children}</div>
      </article>
    );
  }

  return (
    <article
      {...props}
      aria-label={author ?? AUTHOR[role]}
      aria-busy={streaming || undefined}
      data-role={role}
      data-streaming={streaming || undefined}
      className={cn(
        "flex w-full gap-3 font-sans",
        isUser ? "flex-row-reverse" : "flex-row",
        className,
      )}
    >
      {avatar && <div className={cn("shrink-0 pt-0.5", classNames?.avatar)}>{avatar}</div>}

      <div
        className={cn(
          "flex min-w-0 flex-col gap-1.5",
          isUser ? "max-w-[85%] items-end" : "flex-1 items-start",
        )}
      >
        <div
          className={cn(
            isUser
              ? "rounded-lg rounded-br-sm bg-accent-subtle px-3.5 py-2.5 text-fg"
              : "w-full text-fg",
            classNames?.bubble,
          )}
        >
          {hasContent && (
            <div
              className={cn(
                "text-base leading-[var(--rc-leading-normal)] break-words",
                classNames?.content,
              )}
            >
              {children}
            </div>
          )}
          {streaming && <TypingIndicator className={classNames?.indicator} />}
        </div>

        {error && (
          <p
            className={cn(
              "flex items-start gap-1.5 text-sm text-danger-text [&_svg]:mt-0.5 [&_svg]:size-4",
              "[&_svg]:shrink-0",
              classNames?.error,
            )}
          >
            <CircleX aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        {showActions && (
          <div className={cn("flex items-center gap-1", classNames?.actions)}>
            {copyValue !== undefined && (
              <Clipboard
                value={copyValue}
                variant="ghost"
                labels={{ copy: labels.copy ?? "Copiar", copied: labels.copied ?? "Copiado" }}
              />
            )}
            {onRetry && (
              <IconButton
                label={labels.retry ?? "Tentar de novo"}
                variant="ghost"
                size="sm"
                onClick={onRetry}
              >
                <RotateCcw />
              </IconButton>
            )}
            {actions}
          </div>
        )}
      </div>
    </article>
  );
}
