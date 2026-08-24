"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type FieldValues,
  type Resolver,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";
import type { ZodType, input, output } from "zod";

/**
 * `useForm` ja ligado ao Zod, para o projeto consumidor nao precisar conhecer
 * o `@hookform/resolvers`.
 *
 * Os dois tipos do schema andam separados de proposito: o formulario trabalha
 * com a entrada (`input`), que e o que o usuario digita, e o `onSubmit` recebe
 * a saida (`output`), que e o que o Zod ja converteu. Sem essa distincao, um
 * `z.coerce.number()` mente sobre o tipo do campo.
 */
export function useZodForm<Schema extends ZodType<FieldValues, FieldValues>>(
  schema: Schema,
  options?: Omit<UseFormProps<input<Schema>, unknown, output<Schema>>, "resolver">,
): UseFormReturn<input<Schema>, unknown, output<Schema>> {
  return useForm<input<Schema>, unknown, output<Schema>>({
    // O `zodResolver` devolve o resolver ja alargado para `FieldValues`, e o
    // tipo do schema se perde no caminho. A conversao devolve os dois tipos
    // que o `useForm` precisa, e eles vem do proprio schema logo acima.
    resolver: zodResolver(schema) as unknown as Resolver<input<Schema>, unknown, output<Schema>>,
    ...options,
  });
}
