import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { Clipboard } from "./clipboard";

export type CodeProps = ComponentProps<"code">;

/**
 * Codigo dentro de uma frase: nome de arquivo, comando de terminal, chave de
 * um JSON, nome de prop.
 *
 * Nao e `Kbd`. A sombra de tecla promete "aperte isto", e prometer errado
 * custa mais do que nao prometer nada - o `Kbd` e para a combinacao que a
 * pessoa vai digitar, e este e para o texto que ela vai ler ou copiar.
 */
export function Code({ className, ...props }: CodeProps) {
  return (
    <code
      {...props}
      className={cn(
        "rounded-sm bg-surface-raised px-1.5 py-0.5",
        "font-mono text-[0.9em] text-fg-muted",
        className,
      )}
    />
  );
}

export type CodeBlockProps = Omit<ComponentProps<"pre">, "children"> & {
  children: string;
  /** Numera as linhas a esquerda, para quem vai citar uma delas. */
  lineNumbers?: boolean;
  /** Poe o botao de copiar no canto, com o proprio conteudo do bloco. */
  copyable?: boolean;
  /** Nome do arquivo ou da origem, no topo do bloco. */
  title?: ReactNode;
};

/**
 * Codigo em bloco: retorno de API, linha de log, trecho de configuracao.
 *
 * A rolagem e propria de proposito. JSON nao quebra linha, e sem
 * `overflow-x-auto` a linha longa empurra a largura da pagina inteira - e o
 * vazamento horizontal so aparece no celular de quem usa, nunca no monitor de
 * quem escreveu.
 *
 * Sem realce de sintaxe: destacar palavra-chave exige uma gramatica por
 * linguagem, e isso e peso que toda tela paga para o que poucas usam. Quem
 * precisa traz o seu e passa o resultado como filho.
 */
export function CodeBlock({
  children,
  className,
  lineNumbers,
  copyable,
  title,
  ...props
}: CodeBlockProps) {
  const lines = children.replace(/\n$/, "").split("\n");

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-surface-raised">
      {title && (
        <div className="border-b border-border px-3 py-1.5 font-mono text-xs text-fg-subtle">
          {title}
        </div>
      )}

      {copyable && (
        <Clipboard value={children} className="absolute top-2 right-2 z-[var(--rc-z-base)]" />
      )}

      <pre
        {...props}
        className={cn("overflow-x-auto p-3 font-mono text-xs leading-relaxed text-fg", className)}
      >
        <code>
          {lineNumbers
            ? lines.map((line, index) => (
                <span key={index} className="grid grid-cols-[2.5ch_1fr] gap-3">
                  {/* O numero fica fora da selecao: copiar o bloco com os
                      numeros colados no codigo e o classico que obriga a
                      pessoa a limpar linha por linha. */}
                  <span className="text-right text-fg-subtle select-none">{index + 1}</span>
                  <span>{line}</span>
                </span>
              ))
            : children}
        </code>
      </pre>
    </div>
  );
}
