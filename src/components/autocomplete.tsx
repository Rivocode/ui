"use client";

import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { inputVariants } from "./field";

export const Autocomplete = BaseAutocomplete.Root;

export type AutocompleteInputProps = ComponentProps<typeof BaseAutocomplete.Input>;

/**
 * Campo que sugere enquanto se digita, e aceita o que nao esta na lista.
 *
 * E essa a diferenca para o `Combobox`: ali a lista manda, e o valor final tem
 * que ser uma das opcoes. Aqui a sugestao ajuda e o texto livre vale, que e o
 * que serve para busca, endereco e nome de cidade.
 *
 * O painel e o mesmo do Combobox: use `ComboboxContent`, `ComboboxList` e
 * `ComboboxItem` dentro dele.
 */
export function AutocompleteInput({ className, ...props }: AutocompleteInputProps) {
  return <BaseAutocomplete.Input {...props} className={cn(inputVariants(), className)} />;
}
