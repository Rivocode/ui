---
category: Forms
---

# Form

The `<form>` and the React Hook Form context in a single piece, so that
`FormField` finds the `control` on its own. Lives in `@rivocode/ui/form`.

It ships with `noValidate`: the schema is what validates, and the browser's
native bubble would show up in English, outside the theme and before our
message.

`onSubmit` receives the values already validated and converted. Use it with
`useZodForm`, which wires the resolver and separates the input type from the
output type.

## In React Native

Translates, on its own path `@rivocode/ui-native/form`, with the same arrangement as the web and for the same reason: `react-hook-form` is an optional peer. `useZodForm` is identical, line by line, because there is no browser in it.

**What changes is who triggers the submit.** In React Native there is no `<form>`, no `type="submit"` and no Enter that submits: nothing is implicit. So `Form` hands the submit to whoever draws the button (`children` can be a function that receives `{ submit, isSubmitting }`), and still accepts plain JSX for when the button lives outside, in a fixed bar at the foot of the screen.

**And the bridge to the control changes.** On the web, Base UI's `Field` links label, help and error to any control inside it, through context; here the context is narrower: the native `Field` carries to the text fields (`Input`, `Textarea`, `InputGroup`, `MaskedInput`) the label, as `accessibilityLabel` when the caller did not pass another, the error, as a hint, and the `validate` validation. The field that `FormField` delivers carries two more things anyway, `accessibilityLabel` and `invalid`, and the adapters put them on the control: the pieces named by `label` do not read the context, and without this they would be left **with no name at all** for the screen reader. `FormField`'s `label` is required here for the same reason.

The adapter delivers the label under the name the piece reads. Native pieces are named by `label`, and `forValue`, `forChecked` and `forDate` deliver it that way; `forText` delivers it as `accessibilityLabel`, because `Input` and `Textarea` are the platform's `TextInput`. `forValue` carries both, because it also serves a text field with its own value, like `CurrencyInput`.

There are four adapters. `forValue`, `forChecked` and `forDate` have the web's name and job. `forDate` now converts empty to `null` and speaks ISO, which is what the native `DatePicker` and `DateRangePicker` ask for. The fourth is native-only: `forText`, for `Input` and `Textarea`, because `TextInput` calls `onChangeText` with the raw string and not with an event: spreading the field on it would store in the form an event object that does not exist. It carries the `ref` along, and then `form.setFocus()` really works: `TextInput` has `focus()`. And it translates the field's `disabled` to `editable={false}`, because `TextInput` does not read `disabled`.
