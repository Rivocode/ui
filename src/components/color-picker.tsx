"use client";

import {
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { Input } from "./field";

/**
 * Uma amostra da grade: so o valor, ou o valor com o nome que a marca da a ele.
 *
 * O nome importa para quem ouve a tela: uma sequencia de seis caracteres lida
 * letra a letra nao diz nada, e "Lima" diz.
 */
export type ColorSwatch = string | { value: string; label: string };

/*
 * `defaultValue` sai da `<div>` porque a colisao e de significado: em
 * `HTMLAttributes` ele e `string | number | readonly string[]`, e aqui e a cor
 * inicial em hexadecimal. Sem o `Omit`, o tipo publicado seria a interseccao
 * dos dois, e a pagina de props anunciaria uma coisa que nao existe.
 *
 * `children` sai porque a peca desenha a grade e o campo a partir de
 * `swatches`: filho escrito por fora nao apareceria em lugar nenhum.
 */
export type ColorPickerProps = Omit<ComponentProps<"div">, "defaultValue" | "children"> & {
  /** A cor escolhida, em hexadecimal de seis digitos. Controlado. */
  value?: string;
  /** A cor inicial de quem nao controla o valor de fora. */
  defaultValue?: string;
  /** Avisado com o hexadecimal normalizado, sempre de seis digitos e minusculo. */
  onValueChange?: (value: string) => void;
  /**
   * As amostras da grade. Sem elas, um leque de tons gerado - util para
   * experimentar, e nao para representar uma marca: um construtor de tema
   * entrega aqui a paleta do cliente.
   */
  swatches?: ColorSwatch[];
  /** Quantas amostras por linha. E tambem o passo das setas para cima e para baixo. */
  columns?: number;
  /** Texto acima da grade. Sem ele, passe `aria-label` no `swatchesLabel`. */
  label?: ReactNode;
  /** O que o leitor de tela chama a grade quando nao ha `label`. */
  swatchesLabel?: string;
  /** Esconde o campo de texto e deixa so a grade. */
  hideInput?: boolean;
  disabled?: boolean;
  className?: string;
  /** Classe por parte: `label`, `swatches`, `swatch`, `field`, `preview`, `input`. */
  classNames?: Slots<"label" | "swatches" | "swatch" | "field" | "preview" | "input">;
};

/** Tres ou seis digitos, com ou sem a cerquilha na frente. */
const HEX = /^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * O que a pessoa digitou virando um valor, ou `null` quando nao vira.
 *
 * Aceita o que ela cola de qualquer lugar - com cerquilha ou sem, em tres
 * digitos ou em seis, em maiuscula - e devolve sempre a mesma forma, porque e
 * ela que vai para o `onValueChange` e para a comparacao com a amostra.
 *
 * Oito digitos ficam de fora de proposito: transparencia numa cor de marca e
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
 * Um tom a partir de matiz, saturacao e claridade.
 *
 * A conta esta aqui, e nao numa constante de valores escritos a mao, porque a
 * guarda de cor literal esta certa: um valor cravado dentro de um componente
 * amarra a biblioteca a uma marca. O leque padrao nao representa marca nenhuma
 * - e um passeio pelo circulo cromatico, gerado.
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

const DEFAULT_COLUMNS = 10;

/** Dez matizes em tres claridades: claro para fundo, medio para marca, escuro para texto. */
const DEFAULT_SWATCHES: string[] = [70, 55, 38].flatMap((lightness) =>
  Array.from({ length: DEFAULT_COLUMNS }, (_, index) =>
    fromWheel((index * 360) / DEFAULT_COLUMNS, 68, lightness),
  ),
);

const valueOf = (swatch: ColorSwatch) => (typeof swatch === "string" ? swatch : swatch.value);

/** O nome sempre carrega o valor: quem enxerga confere, quem ouve tambem. */
const nameOf = (swatch: ColorSwatch) =>
  typeof swatch === "string" ? `Cor ${swatch}` : `${swatch.label}, ${swatch.value}`;

/**
 * Escolha de uma cor: a de marca de um cliente, num construtor de tema.
 *
 * Sao duas entradas para a mesma decisao. A grade de amostras e para escolher
 * olhando, e responde a seta como um grupo de radio - porque e o que ela e:
 * uma escolha entre opcoes, e nao um punhado de botoes. O campo de texto e
 * para quem ja tem o valor no manual da marca e quer colar.
 *
 * **O que ela nao faz:** roda de matiz, mapa de saturacao, canal de
 * transparencia, conta-gotas. Quem precisa do seletor completo tem o
 * `<input type="color">` do navegador de graca, com o dialogo do sistema
 * operacional junto - e ele acerta o teclado e o leitor de tela sozinho. O que
 * ele nao faz, e por isso esta peca existe, e mostrar a paleta que a casa
 * sugere e dizer qual tom esta escolhido.
 */
export function ColorPicker({
  value: valueProp,
  defaultValue,
  onValueChange,
  swatches = DEFAULT_SWATCHES,
  columns = DEFAULT_COLUMNS,
  label,
  swatchesLabel = "Amostras de cor",
  hideInput,
  disabled,
  className,
  classNames,
  ...rest
}: ColorPickerProps) {
  const labelId = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const value = valueProp ?? internalValue;

  /*
   * O campo de texto guarda um rascunho, e nao o valor.
   *
   * Sem isso, apagar para redigitar era impossivel: a primeira tecla deixava o
   * texto invalido, o valor continuava o de antes, e o campo voltava sozinho
   * para ele. O rascunho segue o que a pessoa escreve, e o valor so muda
   * quando o que esta escrito vira uma cor.
   *
   * A copia de `value` ao lado e o ajuste de estado durante o render: quando a
   * cor muda por fora - outra amostra, outro cliente carregado - o rascunho
   * acompanha, sem um efeito que renderiza duas vezes.
   */
  const [text, setText] = useState(value);
  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    setText(value);
  }

  function change(color: string) {
    setSeenValue(color);
    if (valueProp === undefined) setInternalValue(color);
    onValueChange?.(color);
  }

  function choose(color: string) {
    setText(color);
    change(color);
  }

  function typeText(raw: string) {
    setText(raw);
    const color = normalizeColor(raw);
    if (color) change(color);
  }

  /** Ao sair do campo, o rascunho vira a forma boa - ou desiste e volta ao valor. */
  function settle() {
    setText(normalizeColor(text) ?? value);
  }

  const current = normalizeColor(value);
  // Sem cor escolhida, nenhuma amostra esta escolhida - e nao a primeira que
  // tambem nao souber se normalizar.
  const selected =
    current === null
      ? -1
      : swatches.findIndex((swatch) => normalizeColor(valueOf(swatch)) === current);

  /*
   * Uma so amostra entra na ordem de tabulacao, como manda o grupo de radio: o
   * Tab entra e sai da grade num toque, e a seta e que anda dentro dela. Sem
   * isso, trinta amostras viram trinta paradas de Tab entre um campo e o
   * proximo.
   */
  const focusable = selected === -1 ? 0 : selected;

  function walk(event: KeyboardEvent<HTMLDivElement>) {
    const last = swatches.length - 1;
    const step: Record<string, number | undefined> = {
      ArrowRight: focusable + 1,
      ArrowLeft: focusable - 1,
      ArrowDown: focusable + columns,
      ArrowUp: focusable - columns,
      Home: 0,
      End: last,
    };

    const target = step[event.key];
    if (target === undefined) return;

    // Fora da grade nao anda: a ultima linha costuma ser mais curta que as
    // outras, e pular para o vazio perderia o foco.
    if (target < 0 || target > last) return;

    event.preventDefault();
    const swatch = swatches[target];
    if (!swatch) return;
    buttons.current[target]?.focus();
    choose(valueOf(swatch));
  }

  return (
    <div {...rest} className={cn("flex flex-col gap-2", className)}>
      {label && (
        <span id={labelId} className={cn("font-sans text-sm text-fg", classNames?.label)}>
          {label}
        </span>
      )}

      <div
        role="radiogroup"
        aria-label={label ? undefined : swatchesLabel}
        aria-labelledby={label ? labelId : undefined}
        onKeyDown={walk}
        className={cn("grid w-fit gap-1.5", classNames?.swatches)}
        // A grade e que sabe o passo das setas para cima e para baixo, entao o
        // numero de colunas precisa sair do mesmo lugar nos dois - por isso ele
        // e prop, e nao classe de quem monta a tela.
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {swatches.map((swatch, index) => {
          const color = valueOf(swatch);
          const isSelected = index === selected;
          return (
            <button
              key={`${color}-${index}`}
              ref={(node) => {
                buttons.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={nameOf(swatch)}
              disabled={disabled}
              tabIndex={index === focusable ? 0 : -1}
              onClick={() => choose(color)}
              className={cn(
                "size-7 rounded-md border border-border",
                "outline-none disabled:cursor-not-allowed disabled:opacity-60",
                "transition-transform duration-[var(--rc-duration-fast)] ease-rc",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "focus-visible:ring-offset-bg",
                // O escolhido ganha um anel por fora, e nao uma marca por
                // dentro: qualquer simbolo desenhado sobre a amostra fica
                // ilegivel na metade das cores possiveis, e nao ha token que
                // resolva contraste contra um valor que a pessoa escolheu. O
                // anel encosta no fundo da pagina, que e token e tem contraste
                // garantido. Quem ouve a tela nao depende de nenhum dos dois:
                // o `aria-checked` ja diz.
                isSelected && "ring-2 ring-ring ring-offset-2 ring-offset-bg",
                classNames?.swatch,
              )}
              /*
               * Aqui a cor e dado, e nao decoracao: e o valor que a pessoa esta
               * escolhendo, e ele so existe em tempo de execucao. Por isso
               * entra por `style` e nao por classe - nao ha token para uma cor
               * que ainda vai ser inventada, e a guarda de cor literal continua
               * valendo para todo o resto do arquivo.
               */
              style={{ backgroundColor: color }}
            />
          );
        })}
      </div>

      {!hideInput && (
        <div className={cn("flex items-center gap-2", classNames?.field)}>
          <span
            aria-hidden="true"
            className={cn(
              "size-[var(--rc-control-md)] shrink-0 rounded-md border border-border",
              classNames?.preview,
            )}
            // Mesma razao da amostra: o retrato mostra o valor escolhido.
            style={{ backgroundColor: current ?? "transparent" }}
          />
          <Input
            aria-label="Código hexadecimal da cor"
            spellCheck={false}
            autoComplete="off"
            disabled={disabled}
            value={text}
            onChange={(event) => typeText(event.target.value)}
            onBlur={settle}
            className={cn("font-mono", classNames?.input)}
          />
        </div>
      )}
    </div>
  );
}
