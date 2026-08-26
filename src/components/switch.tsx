"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { useId, type ComponentProps, type ReactNode } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";

export type SwitchProps = Omit<ComponentProps<typeof BaseSwitch.Root>, "children"> & {
  /**
   * O texto ao lado. Com ele, a chave sai dentro de um `<label>`, entao clicar
   * no texto tambem liga e desliga.
   */
  children?: ReactNode;
  /**
   * Classe do `<label>` de fora, quando ha texto. E o nome antigo de
   * `classNames.label`, e continua valendo.
   */
  labelClassName?: string;
  /** Classe por parte: `thumb`, `label`. */
  classNames?: Slots<"thumb" | "label">;
};

/**
 * Chave de liga e desliga. Vale para o que muda na hora, sem confirmar.
 *
 * Nao e Checkbox de outro formato: o Checkbox responde uma pergunta que so
 * conta quando o formulario for enviado, e a chave age no clique. Trocar um
 * pelo outro faz o usuario clicar e nao saber se ja valeu.
 *
 * O alvo tem 44px de altura mesmo com o trilho de 24, pelo respiro invisivel:
 * e a medida do dedo, e sem ela a chave so funciona bem no mouse.
 */
export function Switch({
  className,
  children,
  labelClassName,
  classNames,
  ...props
}: SwitchProps) {
  /*
   * O `Field` passa o proprio rotulo a todo controle que mora dentro dele, e
   * quando o controle ja tem texto proprio os dois se somam: o leitor de tela
   * anunciava "Impostos" no lugar de "ISS retido na fonte". Com texto proprio,
   * o texto e que nomeia.
   */
  const textId = useId();
  const named = children !== undefined;

  const key = (
    <BaseSwitch.Root
      {...props}
      aria-labelledby={named ? textId : props["aria-labelledby"]}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill p-0.5",
        "border border-border-strong bg-surface-raised",
        "transition-colors duration-[var(--rc-duration-base)] ease-rc",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        // `not-data-disabled` no acento, e nao a ordem das classes: o Tailwind
        // emite as variantes `data-[...]` em ordem alfabetica, entao quem vence
        // quem depende de que letra vem antes. Aqui os dois seletores se
        // excluem, e a ordem deixa de decidir - o mesmo do Checkbox.
        "data-[checked]:not-data-disabled:border-accent data-[checked]:not-data-disabled:bg-accent",
        // Desabilitado se pinta com token, e nao com `opacity-60`, que era o
        // que estava aqui: o `check:contrast` nao mede opacidade, entao a peca
        // saia da guarda sem ninguem conferir o que o olho ve.
        //
        // O trilho ja e o `surface-raised` que as irmas assumem ao travar, e a
        // borda nao muda com o estado pelo mesmo motivo delas. Entao aqui quem
        // diz travado e o pino: `fg-muted` -> `fg-disabled` desligado, e o
        // trilho perdendo o acento ligado. Nao vale devolver um `accent-subtle`
        // ao trilho ligado-e-travado para o "ligado" continuar obvio: medido, o
        // pino cai para 2,54:1 sobre ele no tema escuro, abaixo dos 3:1 da WCAG
        // 1.4.11 - e o pino e o unico lugar onde se le a chave.
        "data-[disabled]:cursor-not-allowed",
        "data-[invalid]:border-danger",
        "before:absolute before:-inset-y-2.5 before:inset-x-0 before:content-['']",
        className,
      )}
    >
      <BaseSwitch.Thumb
        className={cn(
          "size-4 rounded-pill bg-fg-muted",
          "transition-[transform,background-color] duration-[var(--rc-duration-base)] ease-rc",
          "data-[checked]:translate-x-5",
          "data-[checked]:not-data-disabled:bg-accent-fg",
          // O pino some sobre o trilho apagado se continuar branco, e ele e o
          // unico lugar onde se le se a chave esta ligada ou desligada.
          "data-[disabled]:bg-fg-disabled",
          classNames?.thumb,
        )}
      />
    </BaseSwitch.Root>
  );

  if (children === undefined) return key;

  return (
    <label
      className={cn(
        // `flex` e nao `inline-flex`: tres opcoes empilhadas num `space-y`
        // caiam todas na mesma linha, porque elemento inline nao ocupa a
        // linha. `w-fit` impede o outro extremo, que e o rotulo esticar ate a
        // borda e fazer o clique valer a dez centimetros do texto.
        // `gap-2` e nao `gap-3`: e a mesma medida do Checkbox e do Radio, que
        // aparecem na mesma lista de formulario - com dois respiros diferentes
        // os rotulos nao alinham entre si.
        "flex w-fit cursor-pointer items-center gap-2 font-sans text-base text-fg",
        "has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:text-fg-disabled",
        classNames?.label,
        labelClassName,
      )}
    >
      {key}
      {/* O texto ganha id proprio, e e ele que nomeia a chave. */}
      <span id={textId}>{children}</span>
    </label>
  );
}
