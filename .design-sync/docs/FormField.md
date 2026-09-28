---
category: Forms
---

# FormField

A whole form row: label, control, help and error, wired to each other. Lives
in `@rivocode/ui/form`.

The control comes through a function, and not by cloning the child, because
each control in the catalog takes its value in a different way, and guessing
which one fails on screen, not in the type:

```tsx
<FormField name="email" label="E-mail">
  {(campo) => <Input {...campo} />}
</FormField>
```

For `Input` and `Textarea`, spreading the field is enough. For `Select`,
`Checkbox` and `DatePicker`, the adapters build the bridge.

It does not make up any `id`: what wires the label to the control is Base UI's
`Field`, through context.
