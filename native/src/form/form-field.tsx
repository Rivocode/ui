import type { ReactElement } from "react";
import {
  Controller,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Field } from "../field";

/**
 * O que o controle recebe: o campo do React Hook Form, mais as duas coisas
 * que no web chegariam sozinhas pelo contexto do `Field` da Base UI.
 *
 * Lá o `Field` liga rótulo, ajuda e erro a qualquer controle dela que esteja
 * dentro — `for`, `aria-describedby` e `aria-invalid` aparecem sem ninguém
 * escrever. Aqui não existe contexto nenhum: o `Field` nativo desenha um
 * `Text` em cima e outro embaixo, e o controle do meio não fica sabendo de
 * nada. Então as duas informações viajam **no campo**, e os adaptadores as
 * põem no controle.
 */
export type FormFieldRow<
  Values extends FieldValues = FieldValues,
  Name extends FieldPath<Values> = FieldPath<Values>,
> = ControllerRenderProps<Values, Name> & {
  /** O rótulo do `FormField`. Sem ele o controle não tem nome acessível. */
  accessibilityLabel: string;
  /** Se há erro agora: é o que acende a borda vermelha do `Input`. */
  invalid: boolean;
};

export type FormFieldProps<Values extends FieldValues, Name extends FieldPath<Values>> = {
  /** O caminho do campo no schema. */
  name: Name;
  /**
   * Obrigatório, ao contrário do web.
   *
   * Lá ele é opcional porque a Base UI ainda liga o controle a um rótulo
   * escrito fora do `Field`. Aqui não há como ligar coisa nenhuma: sem este
   * texto o campo fica sem nome na tela E sem nome no leitor de tela, que são
   * as duas metades do mesmo problema.
   */
  label: string;
  description?: string;
  /** Só quando o campo vive fora de um `<Form>`. */
  control?: Control<Values>;
  className?: string;
  /** Recebe o campo pronto para o adaptador. */
  children: (row: FormFieldRow<Values, Name>, state: ControllerFieldState) => ReactElement;
};

/**
 * Uma linha de formulário: rótulo, controle, ajuda e erro, ligados entre si.
 *
 * O controle vem por função, e não por clonagem do filho, pelo mesmo motivo do
 * web: cada controle do catálogo recebe valor de um jeito, e adivinhar qual
 * falha na tela e não no tipo.
 *
 * ```tsx
 * <FormField name="email" label="E-mail" description="Para onde vai a nota">
 *   {(row) => <Input {...forText(row)} keyboardType="email-address" />}
 * </FormField>
 * ```
 *
 * A mensagem de erro é a do schema, e ela vence a descrição — regra que o
 * `Field` nativo já tinha antes deste arquivo existir, e que é a mesma dos
 * dois lados.
 */
export function FormField<Values extends FieldValues, Name extends FieldPath<Values>>({
  name,
  label,
  description,
  control,
  className,
  children,
}: FormFieldProps<Values, Name>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        // O `error` é string ou nada: o `Field` nativo mostra a descrição
        // quando não há erro, e troca por ele quando há.
        <Field
          label={label}
          description={description}
          error={fieldState.error?.message}
          className={className}
        >
          {children(
            { ...field, accessibilityLabel: label, invalid: Boolean(fieldState.error) },
            fieldState,
          )}
        </Field>
      )}
    />
  );
}
