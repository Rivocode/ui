import type { FieldPath, FieldValues, Noop, RefCallBack } from "react-hook-form";

import type { FormFieldRow } from "./form-field";

/**
 * A ponte entre o campo do React Hook Form e o controle nativo.
 *
 * No web só o `Input` aceita o campo espalhado como está, porque lá o controle
 * fala `onChange` de evento do DOM e o campo também. **Aqui nenhum aceita**, e
 * essa é a diferença que estes adaptadores existem para cobrir: o React Hook
 * Form continua entregando `onChange(evento | valor)`, e o React Native não
 * tem evento nenhum — o `TextInput` chama `onChangeText` com a string crua, e
 * o resto do catálogo chama `onValueChange` com o valor. Espalhar o campo num
 * `TextInput` guarda no formulário um objeto de evento que não existe.
 *
 * O nome diz o FORMATO, e não a peça, como no web: `forChecked` serve tudo que
 * tem `checked`, `forValue` tudo que tem `onValueChange`. O que é só daqui é o
 * `forText`, porque só aqui digitar é um formato diferente de escolher.
 *
 * ## O nome acessível viaja junto
 *
 * Os quatro carregam o `accessibilityLabel`, que sai do rótulo do próprio
 * `FormField`. No web esse fio é invisível: o `Field` da Base UI liga o
 * `<label>` ao controle pelo `for`, e ninguém precisa repetir o texto. Aqui
 * não há `for` nem `id` — o rótulo é um `Text` acima, e um `TextInput` embaixo
 * dele fica **sem nome nenhum** para o leitor de tela. Levar o texto pelo
 * adaptador é o que fecha esse buraco sem obrigar a escrevê-lo duas vezes.
 *
 * É `accessibilityLabel`, e não `label`, de propósito: `accessibilityLabel` é
 * prop de toda `View` do React Native, então ele ou nomeia o controle
 * (`Input`, `Textarea`, `MaskedInput`, `SearchInput`, `TagsInput`) ou é
 * ignorado por quem não o espalha (`Select`, `RadioGroup`, `NumberField`).
 * Um `label` injetado seria o contrário: certo no `Select` e caído dentro de
 * um `TextInput` no `MaskedInput`, que espalha o resto das props. Os cinco
 * controles que **exigem** `label` continuam exigindo — é o contrato deles, e
 * o compilador cobra.
 */

type Row<V extends FieldValues, N extends FieldPath<V>> = FormFieldRow<V, N>;

/** O que todo controle recebe, venha ele de qual adaptador vier. */
type Identity = {
  name: string;
  disabled?: boolean;
  /** O rótulo do `FormField`, para o controle carregar o próprio nome. */
  accessibilityLabel: string;
};

/** O formato de quem se digita: `TextInput` por baixo. */
export type TextProps = Identity & {
  ref: RefCallBack;
  onBlur: Noop;
  value: string;
  onChangeText: (text: string) => void;
  /** A borda vermelha do `Input` e do `Textarea`. */
  invalid: boolean;
};

/**
 * O formato de quem se escolhe. O valor mantém o tipo que o schema deu a ele,
 * em vez de virar `unknown`, senão nenhum controle tipado o aceita de volta.
 */
export type ValueProps<Value = unknown> = Identity & {
  value: Value;
  onValueChange: (value: Value) => void;
};

export type CheckedProps = Identity & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/** O formato de quem pode estar vazio com `null`, e não com `undefined`. */
export type NullableProps<Value = unknown> = Identity & {
  value: Value | null;
  onValueChange: (value: Value | null) => void;
};

/**
 * Para `Input`, `Textarea` e o que mais espalhe direto num `TextInput`.
 *
 * O `ref` segue em frente, e aqui ele serve mesmo: é por ele que o
 * `form.setFocus("email")` acha o campo, e `TextInput` tem `focus()` de
 * verdade. O `onBlur` também, que é como o React Hook Form sabe que o campo
 * foi tocado.
 *
 * O vazio vira string, e não `undefined`: um `TextInput` que recebe
 * `value={undefined}` passa a ser não-controlado no meio do caminho, e o texto
 * que a pessoa digitou deixa de responder ao `reset()` do formulário.
 */
export function forText<V extends FieldValues, N extends FieldPath<V>>(row: Row<V, N>): TextProps {
  const { onChange, value, name, ref, onBlur, disabled, accessibilityLabel, invalid } = row;
  return {
    name,
    disabled,
    accessibilityLabel,
    invalid,
    ref,
    onBlur,
    value: value === undefined || value === null ? "" : String(value),
    /* Sem devolver o retorno do `onChange`: com resolver, o React Hook Form
       devolve uma promessa dali, e o `onChangeText` do TextInput ignora o
       retorno - a promessa ficaria solta, sem ninguem para esperar por ela. */
    onChangeText: (text) => {
      onChange(text);
    },
  };
}

/**
 * Para todo controle de valor: `Select`, `RadioGroup`, `CheckboxGroup`,
 * `ToggleGroup`, `Combobox`, `NumberField`, `Slider`, `OTPField`,
 * `SearchInput`, `MaskedInput`, `TagsInput`.
 *
 * O `ref` e o `onBlur` ficam para trás: a raiz desses controles é uma `View`
 * ou um `Pressable`, que não têm `focus()` para o React Hook Form chamar nem
 * saída de foco para ele ouvir — e a palavra que faltou aqui foi escrita como
 * `onBlur` de propósito: solta no comentário, ela vira classe de verdade no
 * CSS gerado, porque o scanner do Tailwind lê este arquivo como texto. Quem
 * precisa saber que o campo foi mexido lê a própria escolha.
 */
export function forValue<V extends FieldValues, N extends FieldPath<V>>(
  row: Row<V, N>,
): ValueProps<Row<V, N>["value"]> {
  const { onChange, value, name, disabled, accessibilityLabel } = row;
  return {
    name,
    disabled,
    accessibilityLabel,
    value,
    onValueChange: (next) => {
      onChange(next);
    },
  };
}

/** Para `Checkbox` e `Switch`, que têm o mesmo formato e por isso o mesmo adaptador. */
export function forChecked<V extends FieldValues, N extends FieldPath<V>>(
  row: Row<V, N>,
): CheckedProps {
  const { onChange, value, name, disabled, accessibilityLabel } = row;
  return {
    name,
    disabled,
    accessibilityLabel,
    checked: Boolean(value),
    onCheckedChange: (checked) => {
      onChange(checked);
    },
  };
}

/**
 * Para o `DatePicker` e o `DateRangePicker`.
 *
 * Guarda o nome do web, e não o do formato, porque quem porta uma tela procura
 * a palavra que já usou do outro lado — mas o formato mudou junto com a peça:
 * lá o valor é `Date | undefined`, e aqui a data é o ISO `aaaa-mm-dd` e o
 * vazio é `null`. A conversão de `undefined` para `null` é o serviço: um campo
 * que o schema ainda não preencheu chega `undefined`, e os dois pickers pedem
 * `null` — quem espalhasse o campo cru levava erro de tipo e nenhuma pista do
 * porquê.
 */
export function forDate<V extends FieldValues, N extends FieldPath<V>>(
  row: Row<V, N>,
): NullableProps<NonNullable<Row<V, N>["value"]>> {
  const { onChange, value, name, disabled, accessibilityLabel } = row;
  return {
    name,
    disabled,
    accessibilityLabel,
    value: value ?? null,
    onValueChange: (next) => {
      onChange(next);
    },
  };
}
