"use client";

import type { ComponentProps } from "react";
import {
  FormProvider,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";

import { cn } from "../lib/cn";

export type FormProps<Entry extends FieldValues, Saida extends FieldValues> = Omit<
  ComponentProps<"form">,
  "onSubmit"
> & {
  /** O retorno do `useZodForm` ou do `useForm`. */
  form: UseFormReturn<Entry, unknown, Saida>;
  /** Chamado com os valores ja validados e convertidos pelo schema. */
  onSubmit: SubmitHandler<Saida>;
};

export function Form<Entry extends FieldValues, Saida extends FieldValues>({
  form,
  onSubmit,
  className,
  children,
  ...props
}: FormProps<Entry, Saida>) {
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
