"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { Input, type InputProps } from "./field";
import { InputAction, InputGroup } from "./input-group";

export type PasswordInputProps = Omit<InputProps, "type"> & {
  /** O que o leitor de tela ouve no botao, antes e depois de revelar. */
  labels?: { show?: string; hide?: string };
  /** Classe por parte: `wrapper`, `input`, `action`. */
  classNames?: Slots<"wrapper" | "input" | "action">;
  /** @deprecated Use `classNames.wrapper`. */
  wrapperClassName?: string;
  size?: ComponentProps<typeof InputGroup>["size"];
};

/**
 * Campo de senha com o olho que revela.
 *
 * Existe como peca porque todo projeto reconstroi este par - e reconstroi com
 * o mesmo defeito, que e o botao dizer o estado em vez da acao: "senha
 * visivel" nao diz o que acontece ao clicar, e quem navega por leitor de tela
 * decide pelo verbo.
 *
 * Revelar e um gesto momentaneo: sair do campo esconde de novo. Deixar a senha
 * na tela depois que a pessoa foi para outro lugar e o que faz alguem ser lido
 * por cima do ombro numa mesa compartilhada.
 *
 * O `className` veste o campo, e nao a moldura: e a unica peca do catalogo em
 * que a raiz nao e o alvo dele. Mudar isso agora trocaria em silencio a largura
 * de toda tela de login que ja existe, entao a moldura ganhou nome proprio -
 * `classNames.wrapper` - e o `className` continua onde sempre esteve.
 */
export function PasswordInput({
  labels = {},
  classNames,
  wrapperClassName,
  className,
  size,
  onBlur,
  ...props
}: PasswordInputProps) {
  // Cada nome com o proprio padrao: trocar so o verbo de revelar obrigava a
  // reescrever o de esconder junto.
  const { show = "Mostrar senha", hide = "Esconder senha" } = labels;

  const [visible, setVisible] = useState(false);

  return (
    <InputGroup
      size={size}
      // O nome antigo vem depois do novo: quem ainda passa `wrapperClassName`
      // passou de proposito, e a classe dele tem que continuar vencendo.
      className={cn(classNames?.wrapper, wrapperClassName)}
    >
      <Input
        {...props}
        type={visible ? "text" : "password"}
        size={size}
        className={cn(classNames?.input, className)}
        onBlur={(event) => {
          setVisible(false);
          onBlur?.(event);
        }}
      />
      <InputAction
        // O nome diz a acao, e nao o estado: e o verbo que a pessoa escolhe.
        aria-label={visible ? hide : show}
        onClick={() => setVisible((current) => !current)}
        className={cn("border-l-0", classNames?.action)}
      >
        {visible ? (
          <EyeOff size={16} aria-hidden="true" />
        ) : (
          <Eye size={16} aria-hidden="true" />
        )}
      </InputAction>
    </InputGroup>
  );
}
