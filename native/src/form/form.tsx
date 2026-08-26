import type { ReactNode } from "react";
import { View } from "react-native";
import {
  FormProvider,
  useFormState,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";

import { cn } from "../cn";

export type FormHandle = {
  /** Valida e chama o `onSubmit` com os valores já convertidos pelo schema. */
  submit: () => void;
  /** Enquanto o `onSubmit` não devolve: é o `loading` do `Button`. */
  isSubmitting: boolean;
};

export type FormProps<Values extends FieldValues, Parsed extends FieldValues> = {
  /** O retorno do `useZodForm` ou do `useForm`. */
  form: UseFormReturn<Values, unknown, Parsed>;
  /** Chamado com os valores já validados e convertidos pelo schema. */
  onSubmit: SubmitHandler<Parsed>;
  className?: string;
  /** Os campos. Como função, recebe o enviar e o "enviando". */
  children: ReactNode | ((handle: FormHandle) => ReactNode);
};

export function Form<Values extends FieldValues, Parsed extends FieldValues>({
  form,
  onSubmit,
  className,
  children,
}: FormProps<Values, Parsed>) {
  const { isSubmitting } = useFormState({ control: form.control });
  const handle = form.handleSubmit(onSubmit);

  return (
    <FormProvider {...form}>
      <View className={cn("gap-5", className)}>
        {typeof children === "function"
          ? children({
              submit: () => {
                void handle();
              },
              isSubmitting,
            })
          : children}
      </View>
    </FormProvider>
  );
}
