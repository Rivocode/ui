"use client";

import { useEffect, useId, useState, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { resolveFormat, type Format } from "../lib/format";
import type { Slots } from "../lib/slots";
import { GAUGE_GAP, GAUGE_REACH, GAUGE_RING, bandAt } from "../shared/chart-layout";

export type ChartGaugeBand = {
  /** Onde a faixa termina, na mesma unidade do `value`. Ela comeca onde a anterior parou. */
  until: number;
  /** A cor da faixa, e do arco quando o valor cai nela. */
  tone: "success" | "warning" | "danger";
  /** O nome da faixa por extenso: vai para baixo do numero e para o leitor de tela. */
  label: string;
};

export type ChartGaugeProps = Omit<ComponentProps<"div">, "children"> & {
  /** De 0 a `max`. Fora disso o ponteiro para na ponta, e nao da a volta. */
  value: number;
  max?: number;
  /**
   * As faixas, em ordem, cada uma ate o seu `until`. A ultima deveria terminar
   * em `max`. Sem faixas, o medidor e um arco neutro de acento, e a leitura
   * boa ou ruim fica por conta de quem le.
   */
  bands?: readonly ChartGaugeBand[];
  /** O numero grande no meio. Sem ele, o `value` escrito pelo `format`. */
  centerValue?: ReactNode;
  /** A linha pequena embaixo do numero. Sem ela, o nome da faixa em que o valor caiu. */
  centerLabel?: ReactNode;
  /** Como o numero e escrito, no meio e no nome acessivel. */
  format?: Format;
  /** Quantos graus o arco cobre, com a abertura embaixo. */
  sweep?: number;
  /**
   * O que o leitor de tela ouve. Sem ela, o valor, o maximo e o nome da faixa:
   * "72 de 100, atencao".
   */
  label?: string;
  /** Classe por parte: `arc`, `value`, `label`. */
  classNames?: Slots<"arc" | "value" | "label">;
};

const TONE_COLOR: Record<ChartGaugeBand["tone"], string> = {
  success: "var(--rc-success-text)",
  warning: "var(--rc-warning-text)",
  danger: "var(--rc-danger-text)",
};

function pointAt(radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return `${(radius * Math.cos(radians)).toFixed(3)} ${(radius * Math.sin(radians)).toFixed(3)}`;
}

function arcPath(radius: number, from: number, to: number) {
  const long = Math.abs(to - from) > 180 ? 1 : 0;
  return `M ${pointAt(radius, from)} A ${radius} ${radius} 0 ${long} 1 ${pointAt(radius, to)}`;
}

export function ChartGauge({
  value,
  max = 100,
  bands,
  centerValue,
  centerLabel,
  format,
  sweep = 240,
  label,
  classNames,
  className,
  "aria-describedby": describedBy,
  ...props
}: ChartGaugeProps) {
  const write = resolveFormat(format) as ((value: number) => string) | undefined;
  const say = (number: number) => (write ? write(number) : number.toLocaleString("pt-BR"));

  const clamped = Math.max(0, Math.min(value, max));
  const share = max > 0 ? clamped / max : 0;
  const band = bands && bands.length > 0 ? bandAt(bands, clamped) : undefined;
  const paint = band ? TONE_COLOR[band.tone] : "var(--rc-accent-text)";

  const [shown, setShown] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(share));
    return () => cancelAnimationFrame(frame);
  }, [share]);

  const from = -sweep / 2;
  const to = sweep / 2;
  const angleOf = (number: number) =>
    from + sweep * (max > 0 ? Math.max(0, Math.min(number, max)) / max : 0);

  const bandsId = useId();
  const name = label ?? `${say(clamped)} de ${say(max)}${band ? `, ${band.label}` : ""}`;
  const described = [describedBy, bands?.length ? bandsId : undefined].filter(Boolean).join(" ");

  let start = 0;
  const ring = (bands ?? []).map((item) => {
    const begin = angleOf(start);
    const end = angleOf(item.until);
    start = item.until;
    return { item, begin, end };
  });

  return (
    <div
      {...props}
      role="img"
      aria-label={name}
      aria-describedby={described || undefined}
      data-rc-gauge-tone={band?.tone ?? "neutral"}
      className={cn("relative h-44 w-full", className)}
    >
      <svg
        viewBox="-50 -50 100 100"
        aria-hidden="true"
        className={cn("h-full w-full", classNames?.arc)}
      >
        {ring.map(({ item, begin, end }, index) =>
          end - begin > GAUGE_GAP ? (
            <path
              key={index}
              data-rc-gauge-band={item.tone}
              d={arcPath(
                GAUGE_RING,
                index === 0 ? begin : begin + GAUGE_GAP / 2,
                index === ring.length - 1 ? end : end - GAUGE_GAP / 2,
              )}
              fill="none"
              stroke={TONE_COLOR[item.tone]}
              strokeWidth={3}
            />
          ) : null,
        )}

        <path
          d={arcPath(GAUGE_REACH, from, to)}
          fill="none"
          stroke="var(--rc-skeleton)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        <path
          data-rc-gauge-value=""
          d={arcPath(GAUGE_REACH, from, to)}
          fill="none"
          stroke={paint}
          strokeWidth={10}
          strokeLinecap="round"
          pathLength={100}
          strokeOpacity={shown > 0 ? 1 : 0}
          style={{ strokeDasharray: `${shown * 100} 100` }}
          className="transition-[stroke-dasharray,stroke] duration-[var(--rc-duration-slow)] ease-rc"
        />

        {bands && bands.length > 0 && (
          <line
            data-rc-gauge-needle=""
            x1={0}
            y1={-(GAUGE_RING - 4)}
            x2={0}
            y2={-(GAUGE_RING + 3.5)}
            stroke="var(--rc-fg)"
            strokeWidth={2}
            strokeLinecap="round"
            style={{ transform: `rotate(${from + sweep * shown}deg)` }}
            className="transition-transform duration-[var(--rc-duration-slow)] ease-rc"
          />
        )}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "max-w-[62%] text-center font-display font-rc-display text-2xl leading-tight text-balance text-fg",
            classNames?.value,
          )}
        >
          {centerValue ?? say(clamped)}
        </span>
        {(centerLabel ?? band?.label) && (
          <span
            className={cn(
              "mt-0.5 max-w-[70%] text-center text-xs text-fg-subtle",
              classNames?.label,
            )}
          >
            {centerLabel ?? band?.label}
          </span>
        )}
      </div>

      {bands && bands.length > 0 && (
        <p id={bandsId} className="sr-only">
          {bands
            .map((item, index) => {
              const begin = index === 0 ? 0 : bands[index - 1]!.until;
              return `${item.label}: de ${say(begin)} a ${say(item.until)}`;
            })
            .join("; ")}
        </p>
      )}
    </div>
  );
}
