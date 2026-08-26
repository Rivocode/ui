import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { cn } from "./cn";

export type IndicatorProps = {
  /** O que recebe a marca: o botão do sino, o item da barra, o avatar. */
  children: ReactNode;
  /**
   * Quantos. Zero não desenha nada - uma pastilha com "0" chama atenção para
   * dizer que não há nada, que é o contrário do trabalho dela.
   */
  count?: number;
  /** O teto: acima dele sai "99+", em vez de a pastilha esticar. */
  max?: number;
  /**
   * O que o leitor de tela ouve no lugar do número: "3 notificações".
   *
   * Obrigatório, e é a diferença que a peça existe para fazer. O número
   * sozinho não diz o que são três, e no celular ele é ainda menor do que no
   * web - quem aumenta a fonte do sistema para ler não quer descobrir o
   * assunto pela cor da pastilha.
   */
  label: string;
  /** Sem contagem: só o ponto, para "tem algo novo aqui". */
  dot?: boolean;
  className?: string;
  /** Veste a pastilha. O `className` veste o que embrulha o filho. */
  badgeClassName?: string;
};

/**
 * A contagem por cima de outra coisa: avisos no sino, itens na aba, mensagens
 * no menu.
 *
 * Existe como peça pelo mesmo motivo do web: a alternativa é cada tela
 * posicionar uma `View` com `absolute` na mão, e as cinco telas acabam com
 * cinco deslocamentos diferentes - todas com o mesmo defeito, que é a
 * contagem existir só para quem vê.
 *
 * A tradução muda quem carrega o nome acessível. No web o número é escondido
 * do leitor e um texto só para ele entra ao lado; aqui a pastilha inteira é
 * UM elemento de acessibilidade, com `label` no lugar do conteúdo dela - o
 * leitor lê o filho ("Notificações, botão") e a pastilha em seguida ("3
 * notificações"), e nunca um "3" solto entre os dois. Embrulhar filho e
 * pastilha num elemento só resolveria a leitura e quebraria o toque: o botão
 * de dentro deixaria de ser alcançável como botão.
 */
export function Indicator({
  children,
  count,
  max = 99,
  label,
  dot,
  className,
  badgeClassName,
}: IndicatorProps) {
  const show = dot === true || (count !== undefined && count > 0);
  const written = count !== undefined && count > max ? `${max}+` : String(count ?? "");

  return (
    // `self-start` no lugar do que no web é a caixa em linha: sem ele a
    // moldura estica na largura da coluna e a pastilha desgruda do ícone.
    <View className={cn("self-start", className)}>
      {children}

      {show && (
        <View
          accessible
          accessibilityRole="text"
          accessibilityLabel={label}
          className={cn(
            "absolute -top-1 -right-1 flex-row items-center justify-center rounded-pill bg-danger",
            // A borda da cor do fundo separa a pastilha do que está embaixo:
            // sem ela um número claro sobre um ícone claro some na emenda. No
            // web quem faz isso é a utility de anel, que no React Native não
            // existe - e borda, ao contrário dela, ocupa por DENTRO da caixa.
            // Daí os quatro pixels a mais em cada medida: 18 de dígito (a
            // altura de linha do `text-xs`) mais 2 de borda de cada lado.
            "border-2 border-bg",
            dot === true ? "size-3.5" : "h-[22px] min-w-[22px] px-1",
            badgeClassName,
          )}
        >
          {dot !== true && <Text className="text-xs font-medium text-danger-fg">{written}</Text>}
        </View>
      )}
    </View>
  );
}
