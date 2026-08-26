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

/** O que o formulário entrega a quem desenha o botão de enviar. */
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

/**
 * O contexto do React Hook Form e a coluna de campos numa peça só, para o
 * `FormField` achar o `control` sozinho.
 *
 * **O que muda do web é quem dispara o envio.** Lá o `<form>` faz isso
 * sozinho: um `<button type="submit">` dentro dele, ou o Enter num campo, e o
 * `onSubmit` do elemento corre. No React Native não existe elemento de
 * formulário, não existe `type="submit"` e não existe Enter que envie — nada
 * é implícito, e um `onSubmit` guardado aqui sem ninguém para chamá-lo seria
 * uma prop morta.
 *
 * Então o formulário **entrega** o enviar:
 *
 * ```tsx
 * <Form form={form} onSubmit={emitir}>
 *   {({ submit, isSubmitting }) => (
 *     <>
 *       <FormField name="email" label="E-mail">
 *         {(row) => <Input {...forText(row)} />}
 *       </FormField>
 *       <Button onPress={submit} loading={isSubmitting}>Emitir</Button>
 *     </>
 *   )}
 * </Form>
 * ```
 *
 * Os filhos continuam podendo ser JSX comum quando o botão de enviar mora
 * fora — numa barra fixa no rodapé da tela, por exemplo, que é onde ele mora
 * em metade dos aplicativos.
 *
 * O `noValidate` do web não tem par aqui, e nem precisa: não há validação
 * nativa de navegador para desligar.
 */
export function Form<Values extends FieldValues, Parsed extends FieldValues>({
  form,
  onSubmit,
  className,
  children,
}: FormProps<Values, Parsed>) {
  /*
   * O `isSubmitting` sai do `useFormState`, e nao de `form.formState`: ler o
   * proxy do formState aqui assinaria a tela INTEIRA que chamou o useForm, e
   * cada tecla digitada a redesenharia junto. Assinado aqui, o redesenho para
   * neste componente.
   */
  const { isSubmitting } = useFormState({ control: form.control });
  const handle = form.handleSubmit(onSubmit);

  return (
    <FormProvider {...form}>
      <View className={cn("gap-5", className)}>
        {typeof children === "function"
          ? children({
              // A promessa fica aqui dentro: `onPress` do Pressable devolve
              // void, e um Promise solto no retorno dele vira aviso de
              // "unhandled rejection" no primeiro erro do onSubmit.
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
