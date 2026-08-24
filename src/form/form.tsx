"use client";

import type { ComponentProps } from "react";
import {
  FormProvider,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";

import { cn } from "../lib/cn";

export type FormProps<Entrada extends FieldValues, Saida extends FieldValues> = Omit<
  ComponentProps<"form">,
  "onSubmit"
> & {
  /** O retorno do `useZodForm` ou do `useForm`. */
  form: UseFormReturn<Entrada, unknown, Saida>;
  /** Chamado com os valores ja validados e convertidos pelo schema. */
  onSubmit: SubmitHandler<Saida>;
};

/**
 * O `<form>` e o contexto do React Hook Form numa peca so, para o `FormField`
 * achar o `control` sozinho.
 *
 * Vai com `noValidate`: quem valida e o schema, e o balao nativo do navegador
 * apareceria em ingles, fora do tema, e antes da nossa mensagem.
 */
export function Form<Entrada extends FieldValues, Saida extends FieldValues>({
  form,
  onSubmit,
  className,
  children,
  ...props
}: FormProps<Entrada, Saida>) {
  return (
    <FormProvider {...form}>
      <form
        {...props}
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-5", className)}
      >
        {children}
      </form>
    </FormProvider>
  );
}
