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
 * `useForm` já ligado ao Zod, **igual ao do web**: não há uma linha de
 * diferença, porque não há nada de navegador aqui — é o resolver, o schema e
 * dois tipos.
 *
 * Os dois tipos do schema andam separados de propósito: o formulário trabalha
 * com a entrada (`input`), que é o que a pessoa digita, e o `onSubmit` recebe
 * a saída (`output`), que é o que o Zod já converteu. Sem essa distinção, um
 * `z.coerce.number()` mente sobre o tipo do campo — e no celular ele mente
 * mais, porque todo `TextInput` entrega string mesmo com teclado numérico.
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
