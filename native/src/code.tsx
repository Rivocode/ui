import { Text, type TextProps } from "react-native";

import { cn } from "./cn";

export type CodeProps = Omit<TextProps, "children" | "className"> & {
  /** O trecho, cru: `app.json`, `--frozen-lockfile`, `emitida_em`. */
  children: string;
  /**
   * O toque longo seleciona e o sistema oferece copiar. Ligado, porque é o
   * gesto nativo para o que existe para ser copiado — e porque no celular
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

/**
 * Código dentro de uma frase: nome de arquivo, comando de terminal, chave de
 * um JSON, nome de prop.
 *
 * ```tsx
 * <Text className="text-base text-fg">
 *   Abra o <Code>app.json</Code> e troque a chave <Code>slug</Code>.
 * </Text>
 * ```
 *
 * **Ele não rola de lado, e isso não é uma pendência: é o que separa esta peça
 * do `CodeBlock`.** Um trecho dentro de uma frase quebra linha junto com a
 * frase, e uma barra de rolagem dentro de um parágrafo seria uma armadilha —
 * o dedo que rola a tela pararia dentro dela. Quem tem retorno de API, linha
 * de log ou trecho de configuração quer o `CodeBlock`, que é bloco, tem a
 * rolagem própria e ainda não portou: lá quebrar um JSON no meio muda o que
 * está escrito, e aqui quebrar um caminho longo no meio é o comportamento
 * certo, porque a alternativa é esticar a tela inteira.
 *
 * **O corpo da letra não é escrito, é herdado.** No web ele é `0.9em`,
 * relativo ao texto que o cerca; no React Native não há unidade relativa, e o
 * `Text` aninhado já herda o tamanho do `Text` de fora — que é a mesma ideia,
 * pela via da herança. Sozinho, fora de uma frase, ele sai no corpo padrão.
 *
 * A folga lateral e o canto arredondado só aparecem quando ele está sozinho:
 * dentro de uma frase o React Native o trata como um pedaço da linha, e pedaço
 * de linha não recebe folga. O que identifica o trecho nos dois casos é o
 * fundo e a letra.
 *
 * Não é `Kbd`, que não porta: a sombra de tecla promete "aperte isto", e não
 * há teclado para apertar no celular.
 */
export function Code({ children, className, selectable = true, ...props }: CodeProps) {
  return (
    <Text
      {...props}
      selectable={selectable}
      className={cn("rounded-sm bg-surface-raised px-1.5 font-mono text-fg-muted", className)}
    >
      {children}
    </Text>
  );
}
