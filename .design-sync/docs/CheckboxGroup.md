---
category: Forms
---

# CheckboxGroup

A group of checkboxes that share a list value.

It gains what loose checkboxes do not have: with `allValues`, the "all" box
checks and unchecks the whole group and shows the mixed state on its own,
without anyone counting children by hand.

```tsx
<CheckboxGroup defaultValue={['pix', 'boleto']} aria-label="Formas aceitas">
  <Checkbox name="forma" value="pix">Pix</Checkbox>
  <Checkbox name="forma" value="boleto">Boleto</Checkbox>
  <Checkbox name="forma" value="cartao">Cartão</Checkbox>
</CheckboxGroup>
```

The `name` is the same on all of them, because it is a single field; the
`value` is what tells one option from another and is what goes into the
group's list.

**The label goes in as children**, and never in a `<span>` beside it: with
children the box renders inside a `<label>` it builds itself, and clicking the
text checks it. A hand-written `<label>` around it works in the browser and
undoes the component's work, and it is one of the few things the contract
lists under "never do".

For "select all", pass `allValues` with the whole list and mark the master box
with `parent`:

```tsx
<CheckboxGroup allValues={['pix', 'boleto', 'cartao']} defaultValue={['pix']}>
  <Checkbox parent>Todas</Checkbox>
  <Checkbox name="forma" value="pix">Pix</Checkbox>
  …
</CheckboxGroup>
```

Without `parent` the top box becomes just one more option: it does not read
the group, does not show the mixed state, and checking all three does not
check it. It is the easiest defect to miss here, because the screen looks right
until someone checks half the list.

## In React Native

Translates with `items` on the root and `value: string[]`, instead of one `Checkbox` per child, and without the web's `allValues`/`parent`: the master box stays outside the group, and it is a `Checkbox` with `indeterminate` when part of the list is checked.

**`label` is the web's `aria-label` under another name**, for the same reason as `RadioGroup`: the list of boxes answers a question, and without the set's name each box presents itself without saying which one. Naming also turns on the list role, because in React Native there is no `group` role and a `View` with no role at all carries no name.
