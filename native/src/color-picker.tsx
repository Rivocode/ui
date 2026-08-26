import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { cn } from "./cn";
import { mono } from "./font";
import { Input } from "./field";

/**
 * Uma amostra: só o valor, ou o valor com o nome que a marca dá a ele.
 *
 * O nome importa para quem ouve a tela: uma sequência de seis caracteres lida
 * letra a letra não diz nada, e "Lima" diz.
 */
export type ColorSwatch = string | { value: string; label: string };

export type ColorPickerProps = {
  /** A cor escolhida, em hexadecimal de seis dígitos. Vazio é `""`. */
  value: string;
  /** Avisado com o hexadecimal normalizado, sempre de seis dígitos e minúsculo. */
  onValueChange: (value: string) => void;
  /**
   * As amostras. Sem elas, um leque de tons gerado — útil para experimentar, e
   * não para representar uma marca: um construtor de tema entrega aqui a
   * paleta do cliente.
   */
  swatches?: ColorSwatch[];
  /** Quantas amostras por linha. */
  columns?: number;
  /** O texto acima das amostras. */
  label?: string;
  /** O que o leitor de tela chama o conjunto quando não há `label`. */
  swatchesLabel?: string;
  /** Esconde o campo de texto e deixa só as amostras. */
  hideInput?: boolean;
  disabled?: boolean;
  className?: string;
};

/** Três ou seis dígitos, com ou sem a cerquilha na frente. */
const HEX = /^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * O que a pessoa digitou virando um valor, ou `null` quando não vira.
 *
 * Aceita o que ela cola de qualquer lugar — com cerquilha ou sem, em três
 * dígitos ou em seis, em maiúscula — e devolve sempre a mesma forma, que é a
 * que vai para o `onValueChange` e para a comparação com a amostra. A mesma
 * função do web, linha por linha: não há navegador nela.
 *
 * Oito dígitos ficam de fora de propósito: transparência numa cor de marca é
 * quase sempre engano, e o tema da casa aplica opacidade por token.
 */
export function normalizeColor(text: string): string | null {
  const digits = text.trim().replace(/^#/, "");
  if (!HEX.test(digits)) return null;
  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : digits;
  return "#" + full.toLowerCase();
}

/**
 * Um tom a partir de matiz, saturação e claridade.
 *
 * A conta está aqui, e não numa constante de valores escritos à mão, porque a
 * guarda de cor literal está certa: um valor cravado dentro de um componente
 * amarra a biblioteca a uma marca. O leque padrão não representa marca nenhuma
 * — é um passeio pelo círculo cromático, calculado.
 */
function fromWheel(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const amplitude = s * Math.min(l, 1 - l);
  const turn = (offset: number) => (offset + hue / 30) % 12;

  const channel = (offset: number) => {
    const k = turn(offset);
    const level = l - amplitude * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(level * 255)
      .toString(16)
      .padStart(2, "0");
  };

  return "#" + channel(0) + channel(8) + channel(4);
}

/** Dez matizes, os mesmos do web — quantos cabem por linha é outra decisão. */
const HUES = 10;

/**
 * Seis por linha, e não dez como no web.
 *
 * O número não é estético: no web ele era, ao mesmo tempo, o desenho e o passo
 * das setas para cima e para baixo. **Aqui não há seta**, então ele é só
 * desenho — e o desenho é ditado pelo dedo. Com o alvo em 44px e o vão em 8,
 * dez colunas dariam 512px de largura numa tela de 390.
 */
const DEFAULT_COLUMNS = 6;

/** Dez matizes em três claridades: claro para fundo, médio para marca, escuro para texto. */
const DEFAULT_SWATCHES: string[] = [70, 55, 38].flatMap((lightness) =>
  Array.from({ length: HUES }, (_, index) => fromWheel((index * 360) / HUES, 68, lightness)),
);

const valueOf = (swatch: ColorSwatch) => (typeof swatch === "string" ? swatch : swatch.value);

/** O nome sempre carrega o valor: quem enxerga confere, quem ouve também. */
const nameOf = (swatch: ColorSwatch) =>
  typeof swatch === "string" ? `Cor ${swatch}` : `${swatch.label}, ${swatch.value}`;

/*
 * Em linhas de `columns`, à mão.
 *
 * A grade do CSS não existe no React Native — só linha e coluna de flex —,
 * então o que no web era uma propriedade de layout aqui é um `slice`. E o
 * nome da propriedade não pode nem aparecer escrito neste arquivo: o scanner
 * do Tailwind lê a fonte como TEXTO, e a palavra solta num comentário vira
 * uma classe de verdade no CSS gerado, para uma propriedade que a plataforma
 * não tem.
 */
function inRows<T>(items: T[], perRow: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += perRow) {
    rows.push(items.slice(index, index + perRow));
  }
  return rows;
}

/**
 * Escolha de uma cor: a de marca de um cliente, num construtor de tema.
 *
 * São duas entradas para a mesma decisão, as mesmas do web. As **amostras**
 * são para escolher olhando, e se anunciam como um grupo de radio — porque é o
 * que elas são: uma escolha entre opções, e não um punhado de botões. O
 * **campo de texto** é para quem já tem o valor no manual da marca e quer
 * colar.
 *
 * Três coisas mudam do web para cá, e as três saem do dedo:
 *
 * 1. **É controlada, sem `defaultValue`** — como todas as peças daqui.
 * 2. **Não há navegação por seta**, então não há `Home`, `End`, nem uma única
 *    parada de tabulação: cada amostra é um alvo, e o alvo mede 44px. O
 *    desenho colorido no meio dela mede 32 — o defeito clássico da grade de
 *    cores é a amostra que é bonita e não se acerta com o polegar.
 * 3. **A marca do escolhido é por fora**, e é a mesma razão do web: qualquer
 *    símbolo desenhado sobre a amostra fica ilegível em metade das cores
 *    possíveis, e não há token que garanta contraste contra um valor que a
 *    pessoa inventou. A borda de acento vive no alvo, encostada no fundo da
 *    tela, que é token. Quem ouve não depende de nenhum dos dois: o
 *    `accessibilityState.checked` já diz.
 *
 * **O que ela não faz** é o mesmo que o web não faz: roda de matiz, mapa de
 * saturação, canal de transparência, conta-gotas. Nada disso está na fila.
 */
export function ColorPicker({
  value,
  onValueChange,
  swatches = DEFAULT_SWATCHES,
  columns = DEFAULT_COLUMNS,
  label,
  swatchesLabel = "Amostras de cor",
  hideInput,
  disabled,
  className,
}: ColorPickerProps) {
  /*
   * O campo de texto guarda um rascunho, e não o valor.
   *
   * Sem isso, apagar para redigitar era impossível: a primeira tecla deixava o
   * texto inválido, o valor continuava o de antes, e o campo voltava sozinho
   * para ele. O rascunho segue o que a pessoa escreve, e o valor só muda
   * quando o que está escrito vira uma cor.
   *
   * A cópia de `value` ao lado é o ajuste de estado durante o render: quando a
   * cor muda por fora — outra amostra, outro cliente carregado — o rascunho
   * acompanha, sem um efeito que renderiza duas vezes.
   */
  const [text, setText] = useState(value);
  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    setText(value);
  }

  function choose(color: string) {
    setText(color);
    setSeenValue(color);
    onValueChange(color);
  }

  function typeText(raw: string) {
    setText(raw);
    const color = normalizeColor(raw);
    if (color) {
      setSeenValue(color);
      onValueChange(color);
    }
  }

  /** Ao sair do campo, o rascunho vira a forma boa — ou desiste e volta ao valor. */
  function settle() {
    setText(normalizeColor(text) ?? value);
  }

  const current = normalizeColor(value);

  return (
    <View className={cn("gap-2", className)}>
      {label && <Text className="text-sm font-medium text-fg">{label}</Text>}

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label ?? swatchesLabel}
        className="gap-2"
      >
        {inRows(swatches, Math.max(1, columns)).map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row gap-2">
            {row.map((swatch, index) => {
              const color = valueOf(swatch);
              const selected = current !== null && normalizeColor(color) === current;
              return (
                <Pressable
                  key={`${color}-${index}`}
                  accessibilityRole="radio"
                  /*
                   * `checked`, e não `selected`: o contrato do web nomeia
                   * `aria-checked`, e no Android o papel `radio` só vira
                   * "marcado"/"não marcado" no TalkBack por esta chave.
                   */
                  accessibilityState={{ checked: selected, disabled }}
                  accessibilityLabel={nameOf(swatch)}
                  disabled={disabled}
                  onPress={() => choose(color)}
                  // A borda existe sempre, transparente quando não escolhida:
                  // acendê-la só ao escolher moveria o desenho 2px para dentro
                  // a cada toque.
                  className={cn(
                    "size-11 items-center justify-center rounded-md border-2",
                    selected ? "border-accent" : "border-transparent",
                    disabled && "opacity-50",
                  )}
                >
                  <View
                    className="size-8 rounded-sm border border-border"
                    /*
                     * Aqui a cor é dado, e não decoração: é o valor que a
                     * pessoa está escolhendo, e ele só existe em tempo de
                     * execução. Não há token para uma cor que ainda vai ser
                     * inventada - a guarda de cor literal continua valendo
                     * para todo o resto do arquivo.
                     */
                    style={{ backgroundColor: color }}
                  />
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {!hideInput && (
        <View className="flex-row items-center gap-2">
          <View
            // O retrato repete, em cor, o que o campo ao lado diz em texto -
            // e cor não se ouve. Uma parada a menos no leitor de tela.
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="size-12 rounded-md border border-border"
            style={{ backgroundColor: current ?? "transparent" }}
          />
          <Input
            // Nome próprio, como no web: o campo se anuncia mesmo fora de um
            // `Field`. E é ele que diz, em texto, qual cor está escolhida -
            // por isso `hideInput` deixa o estado da amostra como único canal.
            accessibilityLabel="Código hexadecimal da cor"
            /*
             * O teclado é o alfanumérico comum, e não o numérico: hexadecimal
             * tem `a` a `f` e uma cerquilha, e nenhum teclado de números traz
             * as duas coisas - a pessoa digitaria `#3d` e ficaria presa. O que
             * o campo desliga é o que o sistema faria por conta: a maiúscula
             * automática viraria `Bfdd3a`, e o corretor troca seis letras sem
             * sentido pela palavra mais parecida.
             */
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            // `#` mais seis dígitos, e nada além disso cabe numa cor.
            maxLength={7}
            editable={!disabled}
            value={text}
            onChangeText={typeText}
            onBlur={settle}
            style={{ fontFamily: mono }}
            className={cn("flex-1", disabled && "opacity-50")}
          />
        </View>
      )}
    </View>
  );
}
