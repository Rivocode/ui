---
category: Forms
---

# PostalCodeField

The CEP field that looks up the address: it applies the `99999-999` mask and,
when the person completes the 8 digits, calls your `lookup` function and
delivers the address through `onAddress`, so the rest of the form fills itself
in.

```tsx
<Field>
  <FieldLabel>CEP</FieldLabel>
  <PostalCodeField lookup={lookupViaCep} onAddress={fillAddress} />
</Field>
```

**The library calls no service at all.** What does the lookup is the function
you pass: it receives the 8 digits and the lookup's `signal`, and returns
`{ street, district, city, state }`, or `null` when the CEP does not exist.
You pick the service (ViaCEP, BrasilAPI, your own server), the caching policy
and what to do with the data.

## With ViaCEP

```tsx
async function lookupViaCep(cep: string, signal: AbortSignal): Promise<PostalAddress | null> {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal })
  if (!response.ok) throw new Error(`ViaCEP respondeu ${response.status}`)
  const data = await response.json()
  if (data.erro) return null
  return { street: data.logradouro, district: data.bairro, city: data.localidade, state: data.uf }
}
```

Three contract rules, and the function above follows all three:

- **`null` is "does not exist".** ViaCEP answers `200` with
  `{ "erro": true }` for a CEP that does not exist, and it is the function that
  translates that to `null`.
- **Rejecting is a network failure.** Timeout, no connection, server down: the
  piece shows a different notice, with "Tentar de novo". It goes away when the
  lookup restarts, and focus goes back to the field before that.
- **Pass the `signal` on to `fetch`.** When the person changes the CEP in the
  middle of a lookup, the piece cancels the previous one. The stale response is
  discarded either way, but with the `signal` the request actually stops.

## The four outcomes

| State | On screen | On the screen reader |
|---|---|---|
| Looking up | a spinner at the end of the field, and the field with `aria-busy`; with reduced motion, the spinner stops and "Buscando endereço…" appears written below | "Buscando endereço…" |
| Found | a checkmark at the end of the field, and `onAddress` called | "Endereço encontrado." |
| Not found | a red notice below, field invalid | the notice itself |
| Network failure | a neutral notice with "Tentar de novo", field **not** invalid | the notice itself |

The network failure does not mark the field as invalid on purpose: the CEP may
be right, and the person can still fill in the address by hand. The notice is
wired to the field through `aria-describedby`, together with any
`FieldDescription` already there, and every announcement goes out through a
live region that exists before the first lookup.

The lookup only runs when the person types. `defaultValue`, or a `value` that
arrives from the server when editing a record, triggers nothing: looking up
there would overwrite the address the person had already fixed by hand.
Deleting a digit cancels the lookup in progress and clears the notice.
`onStatusChange` reports every state change, for whoever wants to lock the
submit button while looking up.

## In the form

With `FormField`, store the digits through `onValueChange` and fill in the rest
through the form's `setValue`:

```tsx
const form = useZodForm(schema, { defaultValues: { cep: '', street: '', city: '' } })

<FormField name="cep" label="CEP">
  {(field) => (
    <PostalCodeField
      name={field.name}
      value={field.value}
      onBlur={field.onBlur}
      onValueChange={(_masked, digits) => field.onChange(digits)}
      lookup={lookupViaCep}
      onAddress={(address) => {
        form.setValue('street', address.street)
        form.setValue('city', address.city)
      }}
    />
  )}
</FormField>
```

The schema's error (`z.string().length(8)`, for example) still comes out
through `FormField`, below the field, and coexists with the lookup notice.

## Parts

`classNames` reaches each node by name: `input`, `suffix` (the spinner and the
checkmark), `message` and `retry`. `className` dresses the root, which wraps
the field and the notice.

## When not to use

- **A CEP without address lookup** is `MaskedInput` with `mask="cep"`. If the
  screen is not going to fill in anything with the answer, the lookup only
  spends network and shows a spinner that serves nobody.
- **An address outside Brazil** has no CEP. Use `Input` with the country's
  label ("ZIP code", "Código postal"), without a mask.
- **Choosing among already registered addresses** is `Combobox`, with the
  customer's list of addresses. `PostalCodeField` is for writing a new address.

## In React Native

Translates, with the same `lookup`, the same `onAddress` and the same four endings, and with the lookup canceled when the CEP changes: the rule lives in a single file, shared by both packages. The field is controlled, like all of native: `value` and `onValueChange` receive the digits, without punctuation, and `onValueChange` brings the punctuated CEP in the second argument.

The spinner sits at the end of the field, the message below it, and each state change goes out through the system screen reader's announcement. The network failure's "Tentar de novo" is a real button, with a full touch target.

The parts are styled through the same `classNames` as the web: `input`, `suffix`, `message` and `retry`. `suffix` only exists while the lookup runs, because here there is no check mark for the address found.
