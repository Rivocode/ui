"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Star } from "lucide-react";
import {
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { RATING_LABELS, starFill, type RatingLabels } from "../shared/rating";

const BOX = {
  sm: "size-6 [&_svg]:size-4",
  md: "size-7 [&_svg]:size-5",
  lg: "size-9 [&_svg]:size-7",
} as const;

export type RatingProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "defaultValue" | "onChange" | "children"
> & {
  /** A nota escolhida, controlada. `0` e nenhuma. Use com `onValueChange`. */
  value?: number;
  /** A nota ao montar, quando ninguem controla. Sem ela, nenhuma. */
  defaultValue?: number;
  /**
   * Chamado com a nota nova: pelo clique, pelas setas, por Home e End. Com
   * `clearable`, clicar de novo na nota escolhida chama com `0`.
   */
  onValueChange?: (value: number) => void;
  /** Quantas estrelas. Padrao 5. */
  max?: number;
  /**
   * Aceita meia estrela: as setas andam de meio em meio, e o leitor de tela ouve
   * uma opcao por meia nota. O alvo do ponteiro continua a estrela inteira; a
   * metade de inicio da leitura (a esquerda, ou a direita em rtl) e a nota `n - 0,5`.
   */
  allowHalf?: boolean;
  /**
   * Clicar de novo na nota escolhida volta a nenhuma. Desligado por padrao:
   * na maioria das telas a nota, uma vez dada, so se troca.
   */
  clearable?: boolean;
  /**
   * So exibe: a media de um produto, a nota que outra pessoa deu. Aceita
   * fracao qualquer (4,3 pinta 30% da quinta estrela) e sai como uma imagem so
   * para o leitor de tela, com o nome "4,3 de 5".
   */
  readOnly?: boolean;
  /** Desliga a escolha. As estrelas saem nas cores de desabilitado. */
  disabled?: boolean;
  /** O tamanho da estrela. A caixa de cada uma nunca fica abaixo de 24px de alvo. */
  size?: "sm" | "md" | "lg";
  /**
   * Troca a estrela por outro icone do lucide (`<Heart />`, `<ThumbsUp />`).
   * O cheio sai com `fill` na cor de destaque, entao o icone precisa ter area.
   */
  icon?: ReactNode;
  /** Nome do campo num `<form>`: a nota vai num `input` escondido. */
  name?: string;
  /** Os textos que o leitor de tela ouve: o nome do grupo, o de cada nota e o da media. */
  labels?: Partial<RatingLabels>;
  classNames?: Slots<"item" | "empty" | "filled">;
};

export function Rating({
  value,
  defaultValue = 0,
  onValueChange,
  max = 5,
  allowHalf = false,
  clearable = false,
  readOnly = false,
  disabled = false,
  size = "md",
  icon,
  name,
  labels,
  className,
  classNames,
  onPointerLeave,
  ...props
}: RatingProps) {
  const text = { ...RATING_LABELS, ...labels };
  const step = allowHalf ? 0.5 : 1;
  const [internal, setInternal] = useState(defaultValue);
  const [hover, setHover] = useState<number | null>(null);
  const group = useRef<HTMLDivElement>(null);
  const current = value ?? internal;
  const checked = readOnly ? current : Math.round(current / step) * step;
  const shown = hover ?? checked;
  const glyph = icon ?? <Star />;
  const interactive = !readOnly && !disabled;
  const rtl = useDirection() === "rtl";

  const options: number[] = [];
  for (let option = step; option <= max + 1e-9; option += step) options.push(option);

  function commit(next: number) {
    const clamped = Math.min(max, Math.max(0, next));
    if (value === undefined) setInternal(clamped);
    onValueChange?.(clamped);
  }

  function focusOption(option: number) {
    const target = group.current?.querySelector<HTMLElement>(`[data-value="${option}"]`);
    target?.focus();
  }

  function choose(option: number) {
    if (!interactive) return;
    commit(clearable && option === checked ? 0 : option);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!interactive) return;
    let next: number | undefined;
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const backward = rtl ? "ArrowRight" : "ArrowLeft";
    if (event.key === forward || event.key === "ArrowUp") next = checked + step;
    if (event.key === backward || event.key === "ArrowDown") next = checked - step;
    if (event.key === "Home") next = step;
    if (event.key === "End") next = max;
    if (next === undefined) return;
    event.preventDefault();
    const bounded = Math.min(max, Math.max(step, next));
    commit(bounded);
    focusOption(bounded);
  }

  const focusable = checked > 0 ? checked : step;

  function pointed(event: MouseEvent<HTMLElement>, index: number) {
    const box = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - box.left;
    const first = rtl ? offset > box.width / 2 : offset < box.width / 2;
    return first ? index + 0.5 : index + 1;
  }

  const stars = Array.from({ length: max }, (_, index) => {
    const fill = starFill(shown, index);
    const halves = allowHalf ? [index + 0.5, index + 1] : [index + 1];

    return (
      <span
        key={index}
        onClick={allowHalf && interactive ? (event) => choose(pointed(event, index)) : undefined}
        onPointerMove={
          allowHalf && interactive ? (event) => setHover(pointed(event, index)) : undefined
        }
        className={cn(
          "relative inline-flex shrink-0",
          allowHalf && (interactive ? "cursor-pointer" : "cursor-not-allowed"),
          BOX[size],
          classNames?.item,
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex size-full items-center justify-center",
            disabled ? "text-border-disabled" : "text-border-strong",
            classNames?.empty,
          )}
        >
          {glyph}
        </span>
        <span
          aria-hidden="true"
          data-fill={fill}
          className="pointer-events-none absolute inset-y-0 start-0 overflow-hidden"
          style={{ width: `${Math.round(fill * 1000) / 10}%` }}
        >
          <span
            className={cn(
              "flex items-center justify-center [&_svg]:fill-current",
              BOX[size],
              disabled ? "text-fg-disabled" : "text-warning",
              classNames?.filled,
            )}
          >
            {glyph}
          </span>
        </span>

        {!readOnly &&
          halves.map((option) => (
            <span
              key={option}
              role="radio"
              data-value={option}
              aria-checked={option === checked}
              aria-label={text.item(option)}
              aria-disabled={disabled || undefined}
              tabIndex={interactive && option === focusable ? 0 : -1}
              onClick={(event) => {
                event.stopPropagation();
                choose(option);
              }}
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  choose(option);
                  return;
                }
                onKeyDown(event);
              }}
              onPointerEnter={interactive && !allowHalf ? () => setHover(option) : undefined}
              className={cn(
                "absolute inset-0 rounded-sm outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring",
                allowHalf
                  ? "pointer-events-none"
                  : interactive
                    ? "cursor-pointer"
                    : "cursor-not-allowed",
              )}
            />
          ))}
      </span>
    );
  });

  if (readOnly) {
    return (
      <div
        role="img"
        aria-label={text.value(Math.min(max, Math.max(0, current)), max)}
        {...props}
        data-readonly=""
        className={cn("inline-flex items-center", className)}
      >
        {stars}
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={props["aria-labelledby"] ? undefined : text.group}
      aria-disabled={disabled || undefined}
      {...props}
      ref={group}
      data-disabled={disabled ? "" : undefined}
      onPointerLeave={(event) => {
        setHover(null);
        onPointerLeave?.(event);
      }}
      className={cn("inline-flex items-center", className)}
    >
      {stars}
      {name && <input type="hidden" name={name} value={checked} disabled={disabled} />}
    </div>
  );
}

export type { RatingLabels };
