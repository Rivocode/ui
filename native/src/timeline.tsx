import { Text, View } from "react-native";

import { cn } from "./cn";

export type TimelineTone = "neutral" | "accent" | "success" | "warning" | "danger";

/**
 * O tom pinta o marcador, e só ele. É por evento de propósito: numa nota
 * fiscal, o ponto do cancelamento é vermelho e os outros não, e é esse ponto
 * que a pessoa procura quando abre a trilha.
 */
const TONE: Record<TimelineTone, string> = {
  neutral: "bg-border-strong",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export type TimelineEvent = {
  /** O que aconteceu: "Nota autorizada pela Sefaz". */
  title: string;
  /**
   * Quando aconteceu, já escrito: `formatDate(...)`, "12/03 às 14:20", "há 2
   * minutos".
   *
   * `string`, e não um `RelativeTime` como no web, e a razão é o leitor de
   * tela. Cada evento é uma parada só, e o rótulo dessa parada é montado aqui
   * a partir deste texto — um relógio vivo lá dentro continuaria se refazendo
   * na tela enquanto o rótulo ficaria preso no "há 2 minutos" de quando o
   * evento montou. Trilha de auditoria não pode dizer duas horas diferentes.
   */
  at?: string;
  /** Quem fez. Numa trilha de auditoria, é metade da informação. */
  by?: string;
  /** O detalhe embaixo do título, quando o título não basta. */
  description?: string;
  tone?: TimelineTone;
  /**
   * O que ainda não aconteceu: marcador vazado, texto apagado, e o leitor de
   * tela dizendo isso com todas as letras. Preencher o marcador de um evento
   * futuro faz a linha prometer que ele já ocorreu, que é exatamente o erro
   * que uma trilha de auditoria não pode cometer.
   */
  pending?: boolean;
  /** O que o leitor de tela anuncia. Por padrão, a frase montada com o resto. */
  accessibilityLabel?: string;
};

export type TimelineProps = {
  items: TimelineEvent[];
  /** O que a linha conta: "Histórico da nota 4471". */
  label?: string;
  className?: string;
};

/** "3 de 5: Nota autorizada, há 2 minutos, por Ana Duarte." */
function describe(event: TimelineEvent, position: number, total: number) {
  if (event.accessibilityLabel !== undefined) return event.accessibilityLabel;

  const parts = [`${position} de ${total}: ${event.title}`];
  if (event.pending === true) parts.push("ainda não aconteceu");
  if (event.at !== undefined) parts.push(event.at);
  if (event.by !== undefined) parts.push(`por ${event.by}`);

  const sentence = parts.join(", ");
  return event.description === undefined ? sentence : `${sentence}. ${event.description}`;
}

/**
 * O que aconteceu com uma coisa, em ordem: a nota emitida, autorizada,
 * enviada, paga, cancelada, com carimbo de tempo e autor em cada ponto.
 *
 * Não é `Steps`. O `Steps` é assistente — olha para a frente, sabe quantos
 * passos faltam e só deixa voltar. Esta olha para trás, e ninguém "avança"
 * nela.
 *
 * **A composição do web não atravessa.** Lá cada ponto é um `TimelineItem`
 * escrito à mão; aqui a lista vem por `items`, pela mesma regra do
 * `RadioGroup` e do `Select` — e por uma razão a mais, que é a de baixo: o
 * texto de cada evento precisa ser legível de volta para montar o rótulo, e
 * num nó não há como lê-lo.
 *
 * **A leitura de tela é a metade do desenho que mais muda.** No web o `<ol>`
 * entrega "lista de 5 itens" e a ordem de graça. Aqui o papel `list` só tem
 * efeito no Android, e não existe papel de item de lista nenhum — então cada
 * evento é uma parada só do leitor de tela, e a posição vai escrita no rótulo:
 * "3 de 5: Nota autorizada, há 2 minutos, por Ana Duarte". Uma frase por
 * parada, com o que mudou, quando e por quem, é o que a trilha existe para
 * dizer; quebrada em título, carimbo e autor, ela viraria três paradas de
 * VoiceOver por evento e nenhuma delas diria o assunto.
 *
 * **O título e o carimbo empilham**, em vez de dividirem a linha como no web.
 * Lá eles só cabem lado a lado no monitor: abaixo de 640px o `flex-wrap` já
 * os empilhava, e 390px é sempre abaixo de 640px. Empilhar aqui é chegar
 * direto no que o web faz nesta largura, sem pagar o cálculo de quebra.
 *
 * **A linha vertical é desenhada evento a evento**, e o último não desenha a
 * dele — senão sobra um rabo de linha pendurado embaixo do último ponto. No
 * web isso é `last:`, um seletor de irmão; aqui é o índice, porque seletor de
 * filho não existe no React Native.
 *
 * Nada aqui é tocável, e é assim de propósito: uma trilha se lê. Quem precisa
 * abrir o detalhe de um evento põe um `Item` com `onPress` embaixo dela — o
 * marcador é um ponto de 9px e nunca seria um alvo de dedo.
 */
export function Timeline({ items, label, className }: TimelineProps) {
  if (items.length === 0) return null;

  return (
    <View accessibilityRole="list" accessibilityLabel={label} className={cn(className)}>
      {items.map((event, index) => {
        const isLast = index === items.length - 1;
        const pending = event.pending === true;

        return (
          <View
            accessible
            accessibilityLabel={describe(event, index + 1, items.length)}
            className="w-full flex-row gap-3"
            key={index}
          >
            {/* A calha: o ponto em cima, o fio descendo até o ponto seguinte.
                O fio estica porque a coluna acompanha a altura da linha, e um
                evento mais alto que os outros continua ligado ao próximo. */}
            <View className="w-2.5 items-center">
              <View
                className={cn(
                  "mt-1.5 h-2.5 w-2.5 rounded-pill",
                  pending ? "border-2 border-border-strong bg-bg" : TONE[event.tone ?? "neutral"],
                )}
              />
              {!isLast && <View className="mt-1 w-px flex-1 bg-border" />}
            </View>

            <View className={cn("flex-1 gap-0.5", !isLast && "pb-5")}>
              <Text className={cn("text-base", pending ? "text-fg-muted" : "text-fg")}>
                {event.title}
              </Text>

              {(event.at !== undefined || event.by !== undefined) && (
                <Text className="font-mono text-xs text-fg-subtle">
                  {[event.at, event.by].filter((part) => part !== undefined).join(" · ")}
                </Text>
              )}

              {event.description !== undefined && (
                <Text className="text-sm text-fg-muted">{event.description}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
