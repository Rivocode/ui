"use client";

import {
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export type TrackerPoint = {
  /** O que aconteceu nesse periodo. */
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
  /** O que o leitor de tela ouve e o que a dica mostra. */
  label: ReactNode;
};

const TONE: Record<NonNullable<TrackerPoint["tone"]>, string> = {
  neutral: "bg-skeleton",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  accent: "bg-accent",
};

export type TrackerProps = Omit<ComponentProps<"div">, "children"> & {
  data: TrackerPoint[];
  /** O que a faixa mede, dito por extenso para o leitor de tela. */
  label: string;
  /** Classe por parte: `label`, `track`, `cell`. */
  classNames?: Slots<"label" | "track" | "cell">;
};

/**
 * A faixa de quadradinhos por periodo: as ultimas 90 emissoes, a
 * disponibilidade do mes, a fila dos ultimos dias.
 *
 * Ela responde uma pergunta que o numero sozinho nao responde - "esteve sempre
 * assim, ou piorou ontem?" - e por isso cabe dentro de um `Stat`, embaixo do
 * valor.
 *
 * Cada quadrado carrega o proprio texto. Uma faixa de cor sem texto nao existe
 * para quem usa leitor de tela, e "verde, verde, vermelho" tambem nao diz nada
 * para quem enxerga: o que importa e qual dia foi o vermelho.
 *
 * **A dica e uma so, e nao uma por quadrado.** Cada ponto ja montou a propria
 * raiz de `Tooltip`, e o preco disso cresce com o dado: um ano de emissoes
 * eram 365 raizes de dica montadas - cada uma com id, contexto e assinatura de
 * hover - para que no maximo uma aparecesse. Agora a faixa inteira e o alvo, e
 * quem flutua e uma ancora so, que anda ate o periodo lido; o custo de montar
 * a peca deixa de crescer com o numero de periodos. Quem for desfazer isso
 * troque tambem o teste da contagem em `test/pecas-tier2.test.tsx`, que e onde
 * a promessa esta escrita.
 *
 * **A faixa e uma parada de teclado, e nao nenhuma.** O quadrado nunca foi
 * focavel - a dica so abria no ponteiro -, entao a leitura exata de um periodo
 * era coisa de quem tem mouse. A faixa agora recebe foco, as setas caminham
 * pelos periodos, e a dica acompanha o mesmo indice que o ponteiro moveria. O
 * quadrado continua fora da ordem de tabulacao de proposito: 365 paradas
 * dentro de um cartao seriam um obstaculo, e a lista escondida abaixo ja
 * entrega os 365 textos em ordem a quem le a pagina.
 */
export function Tracker({ data, label, className, classNames, ...props }: TrackerProps) {
  /** O periodo sob o ponteiro, e o periodo sob o foco. */
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  /** O periodo cuja dica foi fechada no Escape, para ela nao voltar sozinha. */
  const [dismissed, setDismissed] = useState<number | null>(null);

  const last = data.length - 1;
  const clamp = (index: number) => Math.min(Math.max(index, 0), last);
  const step = data.length > 0 ? 100 / data.length : 0;

  // O ponteiro manda quando esta na faixa; sem ele, quem manda e o foco.
  const reading = hovered ?? focused;
  // Faixa sem dado nao tem periodo para ler, e um balao vazio seguindo o foco
  // e o que sai quando o `last` de uma lista vazia vira indice.
  const open = data.length > 0 && reading !== null && reading !== dismissed;

  /**
   * O periodo que a ancora aponta, que sobrevive ao fechamento.
   *
   * Zerar o indice no mesmo quadro em que a dica fecha faria o balao encolher
   * vazio durante a animacao de saida - ele fica montado ate ela terminar.
   */
  const [shown, setShown] = useState(0);
  if (reading !== null && reading !== shown) setShown(reading);

  /**
   * Qual quadrado o ponteiro esta lendo, por regra de tres sobre a faixa.
   *
   * A conta nao pergunta ao quadrado onde ele esta: com `flex-1` e 365 deles,
   * medir cada um custa um layout inteiro por movimento do mouse.
   */
  function read(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width <= 0 || data.length === 0) return;

    setHovered(clamp(Math.floor(((event.clientX - box.left) / box.width) * data.length)));
  }

  function walk(event: KeyboardEvent<HTMLDivElement>) {
    if (data.length === 0) return;

    // Fechar no Escape e obrigacao de qualquer conteudo que aparece por
    // apontamento; sem isso a dica cobre o que estiver embaixo dela e nao ha
    // gesto de teclado que a tire da frente.
    if (event.key === "Escape") {
      setDismissed(reading);
      return;
    }

    const from = focused ?? last;
    const next =
      event.key === "ArrowRight"
        ? from + 1
        : event.key === "ArrowLeft"
          ? from - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;

    if (next === null) return;

    // Sem isto a seta rola a pagina junto, e a faixa some da tela enquanto
    // alguem caminha por ela.
    event.preventDefault();
    setFocused(clamp(next));
    setDismissed(null);
  }

  return (
    <div {...props} className={cn("flex flex-col gap-1.5", className)}>
      <p className={cn("sr-only", classNames?.label)}>{label}</p>

      <div
        role="group"
        aria-label={label}
        // A faixa e uma parada de tabulacao so, como a moldura do Chart.
        tabIndex={0}
        onPointerMove={read}
        onPointerDown={read}
        onPointerLeave={() => setHovered(null)}
        onPointerCancel={() => setHovered(null)}
        onKeyDown={walk}
        // O periodo mais recente e o da direita, e e a resposta que a pergunta
        // "piorou ontem?" quer ler primeiro.
        onFocus={() => {
          if (data.length > 0) setFocused((current) => current ?? last);
        }}
        onBlur={() => {
          setFocused(null);
          setDismissed(null);
        }}
        className={cn(
          "relative flex w-full items-stretch gap-0.5",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          classNames?.track,
        )}
      >
        {data.map((point, index) => (
          <div
            key={index}
            data-rc-track={point.tone ?? "neutral"}
            // O quadrado desenha e nao escuta: `flex-1` com `min-w-0` deixa a
            // faixa caber em qualquer largura sem estourar, e a altura fixa
            // mantem a leitura de barra e nao de mosaico.
            className={cn(
              "h-7 min-w-0 flex-1 rounded-sm",
              TONE[point.tone ?? "neutral"],
              classNames?.cell,
            )}
          />
        ))}

        <Tooltip
          open={open}
          onOpenChange={(next) => {
            if (!next) setDismissed(reading);
          }}
        >
          <TooltipTrigger
            render={
              <div
                aria-hidden="true"
                data-rc-track-cursor=""
                style={{ left: `${(shown + 0.5) * step}%` }}
                // A ancora e tambem a marca do periodo lido, e ela e um fio de
                // 2px por cima: numa faixa de um ano o quadrado tem 1px, entao
                // contornar o quadrado trocaria a cor do dado pela da marca.
                // Ela fica montada mesmo fechada porque e o ponto de
                // ancoragem: desmontar tira o balao do lugar no meio da
                // animacao de saida.
                className={cn(
                  "pointer-events-none absolute -inset-y-1 w-0.5 -translate-x-1/2",
                  "rounded-pill bg-fg",
                  "transition-opacity duration-[var(--rc-duration-fast)] ease-rc",
                  open ? "opacity-100" : "opacity-0",
                )}
              />
            }
          />
          <TooltipContent>{data[shown]?.label}</TooltipContent>
        </Tooltip>
      </div>

      {/* O texto de cada periodo, para o leitor de tela ler a faixa inteira
          em ordem - a dica diz um periodo de cada vez, e ler os 365 assim
          seria caminhar com a seta 365 vezes. */}
      <ul className="sr-only">
        {data.map((point, index) => (
          <li key={index}>{point.label}</li>
        ))}
      </ul>

      {/* O periodo lido pelo teclado, dito em voz alta. O ponteiro fica calado
          aqui, como na moldura do Chart: quem move o mouse ja tem o balao, e
          anunciar cada quadrado varrido encheria a fila do leitor de tela. */}
      <div role="status" aria-live="polite" className="sr-only">
        {hovered === null && focused !== null ? data[focused]?.label : null}
      </div>
    </div>
  );
}
