import type { FieldPath, FieldValues, Noop, RefCallBack } from "react-hook-form";

import type { CampoDoFormulario } from "./form-field";

/**
 * So o `Input` aceita o campo espalhado como esta. O `DatePicker` e o `Select`
 * querem `onValueChange`, e o `Checkbox` quer `checked`. Cada adaptador traduz
 * o campo do React Hook Form para um deles.
 *
 * Sao funcoes, e nao componentes prontos como `FormDatePicker`, porque assim o
 * `disabled`, o `placeholder` e o resto continuam sendo props do proprio
 * controle, sem uma segunda camada de props para atravessar.
 */

type Campo<V extends FieldValues, N extends FieldPath<V>> = CampoDoFormulario<V, N>;

/** O que todo controle recebe. O resto do fio vem do contexto do `Field`. */
type Identidade = {
  name: string;
  disabled?: boolean;
};

export type PropsDeDatePicker = Identidade & {
  ref: RefCallBack;
  onBlur: Noop;
  value: Date | undefined;
  onValueChange: (data: Date | undefined) => void;
};

export type PropsDeSelect = Identidade & {
  value: unknown;
  onValueChange: (valor: unknown) => void;
};

export type PropsDeCheckbox = Identidade & {
  ref: RefCallBack;
  checked: boolean;
  onCheckedChange: (marcado: boolean) => void;
};

/**
 * Para o `DatePicker`: mudanca vira `onValueChange`, com a data em vez do
 * evento. Sem isto o campo escreveria o texto cru no formulario, porque quem
 * recebe o evento do input e a Base UI, nao o React Hook Form.
 *
 * O `ref` segue em frente: e por ele que o React Hook Form leva o foco ate o
 * primeiro erro.
 */
export function paraDatePicker<V extends FieldValues, N extends FieldPath<V>>(
  campo: Campo<V, N>,
): PropsDeDatePicker {
  const { onChange, value, name, ...resto } = campo;
  return {
    ...resto,
    name,
    value: value as Date | undefined,
    onValueChange: (data) => onChange(data),
  };
}

/**
 * Para o `Select`: mudanca vira `onValueChange`.
 *
 * O `ref` e o `onBlur` ficam para tras porque a raiz do Select da Base UI nao
 * renderiza elemento nenhum, e nao ha onde prender nem de onde sair. Quem
 * precisa saber que o campo foi tocado le a propria escolha.
 */
export function paraSelect<V extends FieldValues, N extends FieldPath<V>>(
  campo: Campo<V, N>,
): PropsDeSelect {
  const { onChange, ref: _ref, onBlur: _onBlur, name, ...resto } = campo;
  return {
    ...resto,
    name,
    onValueChange: (valor) => onChange(valor),
  };
}

/**
 * Para o `Checkbox`: valor vira `checked`.
 *
 * O `onBlur` sai fora: a Base UI nao passa o evento nativo no `onBlur` do
 * Checkbox, e o React Hook Form so precisa saber que o campo foi tocado, o que
 * a propria marcacao ja diz.
 */
export function paraCheckbox<V extends FieldValues, N extends FieldPath<V>>(
  campo: Campo<V, N>,
): PropsDeCheckbox {
  const { onChange, value, onBlur: _onBlur, name, ...resto } = campo;
  return {
    ...resto,
    name,
    checked: Boolean(value),
    onCheckedChange: (marcado) => onChange(marcado),
  };
}
