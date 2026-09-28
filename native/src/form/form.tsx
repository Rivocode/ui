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
  /** Validates and calls `onSubmit` with the values already converted by the schema. */
  submit: () => void;
  /** While `onSubmit` has not returned: it is the `Button` `loading`. */
  isSubmitting: boolean;
};

export type FormProps<Values extends FieldValues, Parsed extends FieldValues> = {
  /** The return of `useZodForm` or `useForm`. */
  form: UseFormReturn<Values, unknown, Parsed>;
  /** Called with the values already validated and converted by the schema. */
  onSubmit: SubmitHandler<Parsed>;
  className?: string;
  /** The fields. As a function, it receives submit and the "submitting" state. */
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
