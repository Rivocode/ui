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
  size?: ComponentProps<typeof InputGroup>["size"];
};

export function PasswordInput({
  labels = {},
  classNames,
  className,
  size,
  onBlur,
  ...props
}: PasswordInputProps) {
  const { show = "Mostrar senha", hide = "Esconder senha" } = labels;

  const [visible, setVisible] = useState(false);

  return (
    <InputGroup size={size} className={classNames?.wrapper}>
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
