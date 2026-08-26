"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { cn } from "../lib/cn";
import { Input, type InputProps } from "./field";
import { InputAction, InputGroup } from "./input-group";

export type PasswordInputProps = Omit<InputProps, "type"> & {
  /** O que o leitor de tela ouve no botao, antes e depois de revelar. */
  labels?: { show: string; hide: string };
  /** Classe da moldura, quando o campo precisa de largura propria. */
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
 */
export function PasswordInput({
  labels = { show: "Mostrar senha", hide: "Esconder senha" },
  wrapperClassName,
  className,
  size,
  onBlur,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup size={size} className={wrapperClassName}>
      <Input
        {...props}
        type={visible ? "text" : "password"}
        size={size}
        className={className}
        onBlur={(event) => {
          setVisible(false);
          onBlur?.(event);
        }}
      />
      <InputAction
        // O nome diz a acao, e nao o estado: e o verbo que a pessoa escolhe.
        aria-label={visible ? labels.hide : labels.show}
        onClick={() => setVisible((current) => !current)}
        className={cn("border-l-0")}
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
