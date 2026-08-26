import { useEffect, useState } from "react";
import { AppState, Text, type TextProps } from "react-native";

import { formatDate } from "./calendar";
import { cn } from "./cn";

/**
 * As faixas, da maior para a menor, com o plural escrito à mão. A primeira que
 * couber decide a unidade, que é como uma pessoa faria: "há 2 meses" e não
 * "há 63 dias".
 *
 * O plural vai aqui porque o `Intl.RelativeTimeFormat` não existe no Hermes -
 * é a mesma razão pela qual o `Meter` nativo não tem `format`. São seis
 * palavras; carregar o ICU de um celular por elas seria caro pelo avesso.
 */
const UNITS = [
  { unit: "year", seconds: 31_536_000, one: "ano", many: "anos" },
  { unit: "month", seconds: 2_592_000, one: "mês", many: "meses" },
  { unit: "week", seconds: 604_800, one: "semana", many: "semanas" },
  { unit: "day", seconds: 86_400, one: "dia", many: "dias" },
  { unit: "hour", seconds: 3_600, one: "hora", many: "horas" },
  { unit: "minute", seconds: 60, one: "minuto", many: "minutos" },
] as const;

export type RelativeUnit = (typeof UNITS)[number]["unit"];

/**
 * De quanto em quanto tempo o texto se refaz, por unidade em que ele está.
 *
 * O passo acompanha a distância, e nunca é um segundo: um relógio de segundo
 * em segundo por linha de lista é o jeito mais fácil de acordar o aparelho
 * sem motivo e comer bateria com o que ninguém está olhando.
 *
 * A hora anda de cinco em cinco minutos, e não de minuto em minuto como no
 * web: a diferença entre "há 1 hora" e "há 2 horas" não vale um timer por
 * minuto vezes as linhas que a lista tem montadas.
 */
export const REFRESH: Record<RelativeUnit | "now", number> = {
  now: 15_000,
  minute: 30_000,
  hour: 300_000,
  day: 3_600_000,
  week: 3_600_000,
  month: 3_600_000,
  year: 3_600_000,
};

/** A data local em ISO, para o `formatDate` - `toISOString` devolveria UTC. */
const isoLocal = (date: Date) => {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/**
 * O texto e de quanto em quanto tempo ele se refaz. `step` nulo quer dizer
 * "não se refaz mais" - o único caso é a data absoluta de um instante PASSADO,
 * que só se afasta. No futuro a mesma data ainda vai voltar a ser relativa
 * quando chegar perto, e por isso ali o relógio continua.
 */
export function describeRelative(value: Date, now: Date, cutoff?: RelativeUnit) {
  const seconds = Math.round((value.getTime() - now.getTime()) / 1000);
  const size = Math.abs(seconds);
  const past = seconds <= 0;

  // Abaixo de um minuto, contar segundo por segundo é ruído: quem lê não
  // distingue "há 12 segundos" de "há 40", e o texto pisca a cada leitura.
  if (size < 60) return { text: "agora", step: REFRESH.now };

  const cutIndex = cutoff ? UNITS.findIndex((range) => range.unit === cutoff) : -1;

  for (const [index, range] of UNITS.entries()) {
    if (size < range.seconds) continue;

    if (cutIndex >= 0 && index <= cutIndex) {
      return { text: formatDate(isoLocal(value)), step: past ? null : REFRESH.year };
    }

    const amount = Math.round(size / range.seconds);
    const word = amount === 1 ? range.one : range.many;
    return {
      text: past ? `há ${amount} ${word}` : `em ${amount} ${word}`,
      step: REFRESH[range.unit],
    };
  }

  return { text: "agora", step: REFRESH.now };
}

export type RelativeTimeProps = Omit<TextProps, "children" | "className"> & {
  /** O instante que se descreve. */
  value: Date | string | number;
  /**
   * A partir de qual unidade parar de contar e mostrar a data. "há 412 dias"
   * não diz nada; a data diz.
   */
  cutoff?: RelativeUnit;
  /**
   * O agora, para teste e para tela congelada. Passando isto, o texto para de
   * se atualizar sozinho - quem fixou o agora não quer relógio.
   */
  now?: Date;
  className?: string;
};

/**
 * "há 2 minutos", "em 3 dias".
 *
 * Nenhuma biblioteca de fora entrega isto, porque é decisão de idioma e de
 * produto: onde cortar entre "agora" e "há 1 minuto", quando parar de contar e
 * mostrar a data, como o plural se escreve.
 *
 * **O relógio porta, e é ele que faz a peça valer a tradução.** Receber o
 * texto pronto teria sido mais barato de escrever e teria devolvido o
 * problema para a tela - que é onde ele já estava. O passo acompanha a
 * unidade (trinta segundos enquanto conta minuto, uma hora quando já conta
 * dia), então uma lista de vinte linhas montadas custa vinte timers lentos, e
 * não vinte por segundo. Quem não quer relógio nenhum passa `now`.
 *
 * Duas coisas são só daqui. O texto se refaz ao voltar do fundo: enquanto o
 * app dorme, o timer do JS não corre, e sem isso a tela reabre dizendo "há 2
 * minutos" três horas depois - o caso que no web quase não existe, porque a
 * aba fica viva. E o instante exato não vai junto: no web ele mora no `title`
 * do `<time>`, e no toque não há `title` nem onde pousar o ponteiro. Quando a
 * data exata importa, ela precisa estar escrita na tela, com o `formatDate`.
 */
export function RelativeTime({ value, cutoff, now, className, ...props }: RelativeTimeProps) {
  const date = value instanceof Date ? value : new Date(value);
  const [tick, setTick] = useState(0);

  const current = now ?? new Date();
  const { text, step } = describeRelative(date, current, cutoff);

  useEffect(() => {
    if (now !== undefined || step === null) return;

    const refresh = () => setTick((count) => count + 1);
    const timer = setTimeout(refresh, step);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
    // `tick` na lista é o que rearma o passo seguinte: sem ele o efeito não
    // roda de novo quando o texto sai igual, e o relógio para na primeira
    // batida que não muda nada na tela.
  }, [now, step, tick]);

  return (
    <Text {...props} className={cn("text-sm text-fg-muted", className)}>
      {text}
    </Text>
  );
}
