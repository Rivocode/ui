import type { FieldPath, FieldValues, Noop, RefCallBack } from "react-hook-form";

import type { FormFieldRow } from "./form-field";

/**
 * So o `Input` aceita o campo espalhado como esta. Os demais controles querem
 * `onValueChange` ou `checked`, e cada adaptador traduz o campo do React Hook
 * Form para um desses formatos.
 *
 * O nome diz o formato, e nao a peca. `forChecked` serve tudo que tem
 * `checked` e `onCheckedChange` - o `Checkbox` e o `Switch`, sem uma linha de
 * diferenca - e `forValue` serve tudo que tem `value` e `onValueChange`:
 * `Select`, `RadioGroup`, `ToggleGroup`, `NumberField`, `Slider`, `OTPField`,
 * `Combobox`, `TreeSelect`. Nomeados por peca, os dois faziam a API parecer
 * menor do que e, e mandavam procurar um `forSwitch` que nunca existiu.
 *
 * Sao funcoes, e nao componentes prontos como `FormDatePicker`, porque assim o
 * `disabled`, o `placeholder` e o resto continuam sendo props do proprio
 * controle, sem uma segunda camada de props para atravessar.
 */

type Field<V extends FieldValues, N extends FieldPath<V>> = FormFieldRow<V, N>;

/** O que todo controle recebe. O resto do fio vem do contexto do `Field`. */
type Identity = {
  name: string;
  disabled?: boolean;
};

export type DateProps = Identity & {
  ref: RefCallBack;
  onBlur: Noop;
  value: Date | undefined;
  onValueChange: (data: Date | undefined) => void;
};

/**
 * O valor mantem o tipo que o schema deu a ele, em vez de virar `unknown`:
 * `unknown` nao encaixa em controle tipado, e o `TreeSelect` e o `Combobox`
 * ficavam sem ponte por causa disso.
 */
export type ValueProps<Value = unknown> = Identity & {
  value: Value;
  onValueChange: (value: Value) => void;
};

export type CheckedProps = Identity & {
  ref: RefCallBack;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/** Os nomes de antes, em portugues numa API em ingles. Seguem valendo. */
export type PropsDeDatePicker = DateProps;
export type PropsDeSelect = ValueProps;
export type PropsDeCheckbox = CheckedProps;

/**
 * Para o `DatePicker`: mudanca vira `onValueChange`, com a data em vez do
 * evento. Sem isto o campo escreveria o texto cru no formulario, porque quem
 * recebe o evento do input e a Base UI, nao o React Hook Form.
 *
 * O `ref` segue em frente: e por ele que o React Hook Form leva o foco ate o
 * primeiro erro.
 */
export function forDate<V extends FieldValues, N extends FieldPath<V>>(
  field: Field<V, N>,
): DateProps {
  const { onChange, value, name, ...resto } = field;
  return {
    ...resto,
    name,
    value: value as Date | undefined,
    onValueChange: (data) => onChange(data),
  };
}

/**
 * Para todo controle de valor: `Select`, `RadioGroup`, `ToggleGroup`,
 * `NumberField`, `Slider`, `OTPField`, `Combobox`, `TreeSelect`. A mudanca
 * vira `onValueChange`, e o valor mantem o tipo do schema.
 *
 * O `ref` e o `onBlur` ficam para tras porque a raiz desses controles na Base
 * UI costuma nao renderizar elemento nenhum, e nao ha onde prender nem de onde
 * sair. Quem precisa saber que o campo foi tocado le a propria escolha.
 */
export function forValue<V extends FieldValues, N extends FieldPath<V>>(
  field: Field<V, N>,
): ValueProps<Field<V, N>["value"]> {
  const { onChange, ref: _ref, onBlur: _onBlur, name, ...resto } = field;
  return {
    ...resto,
    name,
    onValueChange: (value) => onChange(value),
  };
}

/**
 * Para todo controle de liga e desliga: `Checkbox` e `Switch`, que tem o mesmo
 * formato e por isso o mesmo adaptador. O valor vira `checked`.
 *
 * O `onBlur` sai fora: a Base UI nao passa o evento nativo no `onBlur` desses
 * controles, e o React Hook Form so precisa saber que o campo foi tocado, o
 * que a propria marcacao ja diz.
 */
export function forChecked<V extends FieldValues, N extends FieldPath<V>>(
  field: Field<V, N>,
): CheckedProps {
  const { onChange, value, onBlur: _onBlur, name, ...resto } = field;
  return {
    ...resto,
    name,
    checked: Boolean(value),
    onCheckedChange: (checked) => onChange(checked),
  };
}

/*
 * Os nomes de antes. Nomeiam a peca em vez do formato, entao apontam para o
 * mesmo lugar em vez de ganharem copia propria - uma copia divergiria no dia
 * em que alguem consertasse so um dos dois.
 */
export const forDatePicker = forDate;
export const forSelect = forValue;
export const forCheckbox = forChecked;
