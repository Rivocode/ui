import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { cn } from "./cn";

export type ItemProps = {
  /** O texto que nomeia a linha. Corta com reticências, nunca quebra em duas. */
  title: string;
  /** A segunda linha, menor: o complemento que cabe. Também corta. */
  description?: string;
  /** O canto da esquerda: `Avatar`, ícone, miniatura. */
  media?: ReactNode;
  /** O canto da direita: valor, `Badge`, `Button`, `Indicator`. */
  actions?: ReactNode;
  /** `plain` para lista dentro de card ou folha; `outline` para grade de escolhas. */
  variant?: "plain" | "outline";
  /**
   * Toca e vai. Dentro de um `DataList` com `onRowPress`, NÃO passe isto: o
   * `DataList` já embrulha cada linha, e um `Pressable` dentro do outro
   * segura o toque no de dentro - a linha responderia aqui e nunca lá.
   */
  onPress?: () => void;
  /**
   * O que o leitor de tela anuncia na linha. Por padrão, o título e a
   * descrição na mesma frase.
   */
  accessibilityLabel?: string;
  className?: string;
};

/**
 * A linha de lista: alguma coisa à esquerda, texto no meio, ação à direita.
 *
 * É de arranjo, e não de dado: quem preenche decide o que vai em cada lugar.
 * E não repete o `DataList` - ele resolve os quatro finais de uma consulta
 * (carregando, erro, vazio, dados), a busca e a seleção, e devolve cada linha
 * ao `renderItem` sem opinião sobre o que há dentro dela. Este é o dentro. A
 * lista de duas escolhas numa folha, que não tem consulta nenhuma, também é
 * este.
 *
 * O que muda do web é de onde vem cada coisa. Lá a linha é composição -
 * `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions` -
 * e aqui são props, pela mesma regra do `PageHeader`: os lugares são quatro e
 * sempre os mesmos, e uma prop não deixa ninguém trocar a ordem das colunas
 * sem querer. O corte com reticências também muda de lugar: no React Native
 * ele é a prop `numberOfLines`, e não uma classe - estilo que o runtime lê
 * como prop não atravessa por `className`.
 *
 * Com `onPress` a linha inteira vira alvo, com 44px de altura mínima. Quando
 * há `actions`, o alvo é só a área de texto: o botão da direita precisa
 * continuar sendo uma parada própria do leitor de tela, e um `Pressable`
 * acessível por cima dele engoliria a parada.
 */
export function Item({
  title,
  description,
  media,
  actions,
  variant = "plain",
  onPress,
  accessibilityLabel,
  className,
}: ItemProps) {
  const label = accessibilityLabel ?? [title, description].filter(Boolean).join(", ");

  const body = (
    <>
      {media !== undefined && <View className="shrink-0">{media}</View>}

      {/* O miolo é o único que encolhe: a mídia e as ações ficam do tamanho
          que têm, e é o texto que corta. */}
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="text-base text-fg">
          {title}
        </Text>
        {description !== undefined && (
          <Text numberOfLines={1} className="text-sm text-fg-muted">
            {description}
          </Text>
        )}
      </View>
    </>
  );

  const frame = cn(
    "w-full flex-row items-center gap-3",
    variant === "outline" ? "rounded-lg border border-border bg-surface p-3" : "px-1 py-2",
    // Alvo de toque: uma linha só de título desenha 37px, e o dedo pede 44.
    onPress !== undefined && "min-h-11",
    className,
  );

  /* Sem ação à direita, a linha inteira é o botão - e o realce cobre tudo,
     que é o que o dedo espera de uma linha que navega. */
  if (onPress !== undefined && actions === undefined) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        className={cn(frame, "active:bg-selected")}
      >
        {body}
      </Pressable>
    );
  }

  return (
    <View className={frame}>
      {onPress !== undefined ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          className="-my-1 flex-1 flex-row items-center gap-3 rounded-md py-1 active:bg-selected"
        >
          {body}
        </Pressable>
      ) : (
        <View className="flex-1 flex-row items-center gap-3">{body}</View>
      )}

      {actions !== undefined && (
        <View className="shrink-0 flex-row items-center gap-2">{actions}</View>
      )}
    </View>
  );
}
