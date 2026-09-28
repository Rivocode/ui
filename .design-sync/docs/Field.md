---
category: Forms
---

# Field

The root of a form field. Wires label, help and error for accessibility.

Composes with `FieldLabel`, `Input`, `FieldDescription` and `FieldError`. The
wiring is automatic: do not write `htmlFor` or `aria-describedby` by hand.

Mark it invalid with `invalid` on the root and show the message with
`<FieldError match>`. `disabled` on the root disables the whole set.

## In React Native

Translates: `@rivocode/ui-native` exports `Field` - `label`, `description` and `error` as props, and `label` names the text field inside; `validate`, `validationMode` and `validationDebounceTime` with the web's name, signature and timing, and an explicit `error` wins over `validate`; `validate` receives the text of the text fields (`Input`, `Textarea`, `MaskedInput`, `InputGroup`, `PasswordInput`) and the value of the ones that open a sheet (`Autocomplete`, `Select`, `Combobox`, `DatePicker`), and the error is announced, lights their border and becomes the hint; in the sheet ones, closing the sheet is leaving the field, and `Concluir` and the submit key are the submit. Text that arrives later fades in. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
