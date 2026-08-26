import { Text, View } from "react-native";

import { cn } from "./cn";

export type MeterProps = {
  /** Onde a medida esta agora, na escala de `min` a `max`. */
  value: number;
  /** O piso da escala. Quase sempre zero, e por isso o padrao. */
  min?: number;
  /**
   * O teto da escala: a cota, o limite do plano, o disco contratado. O padrao
   * 100 e o caso porcentagem, que e o unico que o Progress daqui atende.
   */
  max?: number;
  /** O nome da medida. Fica na tela E e o que o leitor de tela anuncia. */
  label: string;
  /** Escreve a porcentagem ao lado do rotulo. O mesmo nome do web. */
  showValue?: boolean;
  /**
   * A medida ja escrita - "8 GB de 15 GB", "R$ 4.200 de R$ 5.000". Substitui a
   * porcentagem na tela e no anuncio.
   *
   * O web resolve isso com `format`, que aceita o nome de um formatador da
   * casa; aqui quem escreve e quem chama, como no `Stat`. Trazer a tabela de
   * formatadores do web para o pacote nativo custaria o `Intl` inteiro num
   * bundle de celular para escrever uma linha de texto.
   */
  valueLabel?: string;
  className?: string;
};

/**
 * Medida de quanto de uma capacidade esta em uso: espaco, cota, limite.
 *
 * Parece o `Progress` e nao e. O progresso anda para o fim e termina; a medida
 * fica parada mostrando um estado que pode subir e descer. Trocar um pelo outro
 * faz o leitor de tela anunciar "carregando" para algo que nao carrega - e ate
 * aqui o nativo so tinha o `Progress`, entao cota e espaco usado, que sao tela
 * de celular tanto quanto de desktop, so tinham o caminho errado disponivel.
 *
 * O papel de acessibilidade e a parte que NAO porta. O web tem `role="meter"`
 * na especificacao ARIA e a Base UI o entrega de graca; o React Native nao tem
 * equivalente - a uniao de `AccessibilityRole` vai de `none` a `toolbar` e nao
 * inclui medida. Dos papeis que existem, os dois candidatos mentem:
 * `progressbar` faz o VoiceOver e o TalkBack anunciarem indicador de
 * progresso, que e exatamente o erro que esta peca existe para evitar, e
 * `adjustable` promete que da para mudar o valor com gesto de deslizar, e nao
 * da - a medida e leitura. Sobra `text`, que nao promete nada: o leitor
 * anuncia o rotulo, anuncia o valor e para. E o piso honesto, e o piso e o
 * lugar certo quando a alternativa e uma promessa falsa.
 */
export function Meter({
  value,
  min = 0,
  max = 100,
  label,
  showValue,
  valueLabel,
  className,
}: MeterProps) {
  const span = max - min;
  /*
   * Escala invertida ou de largura zero (max igual a min) daria divisao por
   * zero e uma barra em NaN%, que o RN aceita e desenha como largura cheia -
   * uma cota vazia apareceria como cota estourada. Sem escala, barra vazia.
   */
  const filled = span > 0 ? Math.min(1, Math.max(0, (value - min) / span)) : 0;
  const percent = Math.round(filled * 100);
  const spoken = valueLabel ?? `${percent}%`;
  /*
   * Estourar a cota e um estado normal - o plano de 15 GB com 17 GB dentro
   * existe. Quem conta isso e o texto na tela, que quem chama escreve; o
   * `now` fica preso na escala porque um RangeInfo com now fora de min..max
   * esta fora da especificacao, e o TalkBack le porcentagem propria a partir
   * dele - 17 de 15 saia como "113 por cento" ao lado de uma barra cheia.
   */
  const announced = Math.min(max, Math.max(min, value));

  return (
    <View
      /*
       * O grupo inteiro e um no so. Sem `accessible`, o rotulo visivel e a
       * barra viram duas paradas do leitor de tela, e a segunda nao tem nome:
       * a pessoa ouve "Armazenamento" e depois um elemento mudo com um valor
       * solto. Agrupado, sai uma frase: rotulo, depois medida.
       */
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
      /*
       * `text` e o que o iOS le e o que vira `stateDescription` no Android, e
       * por isso e ele que carrega a frase. O trio min/max/now vai junto de
       * proposito: e o que o Android transforma em RangeInfo, e sem ele a
       * medida perde a escala para quem consulta a arvore de acessibilidade.
       */
      accessibilityValue={{ min, max, now: announced, text: spoken }}
      className={cn("gap-2", className)}
    >
      <View className="flex-row items-baseline justify-between gap-4">
        <Text className="text-sm text-fg">{label}</Text>
        {(showValue || valueLabel !== undefined) && (
          <Text className="text-xs text-fg-subtle">{spoken}</Text>
        )}
      </View>

      <View className="h-1.5 overflow-hidden rounded-pill bg-skeleton">
        <View className="h-full rounded-pill bg-accent" style={{ width: `${percent}%` }} />
      </View>
    </View>
  );
}
