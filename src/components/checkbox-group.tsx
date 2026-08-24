"use client";

import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type CheckboxGroupProps = ComponentProps<typeof BaseCheckboxGroup>;

/**
 * Grupo de caixas de marcar que compartilham um valor em lista.
 *
 * Ganha algo que caixas soltas nao tem: com `allValues`, a caixa de "todos"
 * marca e desmarca o grupo inteiro e mostra o estado misto sozinha, sem
 * ninguem contar filho na mao.
 */
export function CheckboxGroup({ className, ...props }: CheckboxGroupProps) {
  return <BaseCheckboxGroup {...props} className={cn("flex flex-col gap-2", className)} />;
}
