"use client";

import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { inputVariants } from "./field";

export const Autocomplete = BaseAutocomplete.Root;

export type AutocompleteInputProps = ComponentProps<typeof BaseAutocomplete.Input>;

export function AutocompleteInput({ className, ...props }: AutocompleteInputProps) {
  return <BaseAutocomplete.Input {...props} className={cn(inputVariants(), className)} />;
}
