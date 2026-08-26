"use client";

import { useEffect, useState, type ComponentProps } from "react";

const LOCALE = "pt-BR";

/**
 * As faixas, da maior para a menor. A primeira que couber decide a unidade,
 * que e como uma pessoa faria: "ha 2 meses" e nao "ha 63 dias".
 */
const RANGES = [
  { unit: "year", seconds: 31_536_000 },
  { unit: "month", seconds: 2_592_000 },
  { unit: "week", seconds: 604_800 },
  { unit: "day", seconds: 86_400 },
  { unit: "hour", seconds: 3_600 },
  { unit: "minute", seconds: 60 },
] as const;

export type RelativeUnit = (typeof RANGES)[number]["unit"];

/** De quanto em quanto tempo o texto se refaz, por unidade em que ele esta. */
const REFRESH: Record<RelativeUnit | "now", number> = {
  now: 15_000,
  minute: 30_000,
  hour: 60_000,
  day: 3_600_000,
  week: 3_600_000,
  month: 3_600_000,
  year: 3_600_000,
};

const relative = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
const absolute = new Intl.DateTimeFormat(LOCALE, { dateStyle: "short" });
const full = new Intl.DateTimeFormat(LOCALE, { dateStyle: "long", timeStyle: "short" });

export type RelativeTimeProps = Omit<ComponentProps<"time">, "dateTime" | "title" | "children"> & {
  /** O instante que se descreve. */
  value: Date | string | number;
  /**
   * A partir de qual unidade parar de contar e mostrar a data. "ha 412 dias"
   * nao diz nada; a data diz.
   */
  cutoff?: RelativeUnit;
  /**
   * O agora, para teste e para renderizacao no servidor. Passando isto, o
   * texto para de se atualizar sozinho - quem fixou o agora nao quer relogio.
   */
  now?: Date;
};

/** O texto e a unidade em que ele esta, para o intervalo saber o proprio passo. */
function describe(value: Date, now: Date, cutoff: RelativeUnit | undefined) {
  const seconds = Math.round((value.getTime() - now.getTime()) / 1000);
  const size = Math.abs(seconds);

  // Abaixo de um minuto, contar segundo por segundo e ruido: quem le nao
  // distingue "ha 12 segundos" de "ha 40", e o texto pisca a cada leitura.
  if (size < 60) return { text: "agora", unit: "now" as const };

  for (const range of RANGES) {
    if (size < range.seconds) continue;

    if (cutoff && RANGES.findIndex((r) => r.unit === range.unit) <= RANGES.findIndex((r) => r.unit === cutoff)) {
      return { text: absolute.format(value), unit: "year" as const };
    }

    const amount = Math.round(seconds / range.seconds);
    return { text: relative.format(amount, range.unit), unit: range.unit };
  }

  return { text: "agora", unit: "now" as const };
}

/**
 * "ha 2 minutos", "em 3 dias".
 *
 * Nenhuma biblioteca de fora entrega isto, porque e decisao de idioma e de
 * produto: onde cortar entre "agora" e "ha 1 minuto", quando parar de contar e
 * mostrar a data, como o plural se escreve. Num sistema em portugues cheio de
 * log e de fila, deixar isso para a tela significa cada tela decidir diferente.
 *
 * Sai num `<time>` de verdade, com o instante exato no `datetime` e a data por
 * extenso no `title`: o relativo e resumo, e resumo perde informacao que as
 * vezes e a que importa.
 *
 * O texto se refaz sozinho, num passo que acompanha a unidade - de trinta em
 * trinta segundos enquanto conta minuto, de hora em hora quando ja conta dia.
 * Um relogio de segundo em segundo para cada linha de uma tabela de mil linhas
 * e o jeito mais facil de derrubar a rolagem.
 */
export function RelativeTime({ value, cutoff, now, ...props }: RelativeTimeProps) {
  const date = value instanceof Date ? value : new Date(value);
  const [tick, setTick] = useState(0);

  const current = now ?? new Date();
  const { text, unit } = describe(date, current, cutoff);

  useEffect(() => {
    // Com o agora fixado, nao ha relogio: quem passou `now` quer o texto
    // parado, em teste ou em renderizacao no servidor.
    if (now) return;

    const timer = setTimeout(() => setTick((value) => value + 1), REFRESH[unit]);
    return () => clearTimeout(timer);
  }, [now, unit, tick]);

  return (
    <time {...props} dateTime={date.toISOString()} title={full.format(date)}>
      {text}
    </time>
  );
}
