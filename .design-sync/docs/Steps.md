---
category: Navigation
---

# Steps

The step ruler of a long form. It goes along with `useWizard()`.

On the phone it becomes a line of text with a progress bar: four labeled dots
at 390px become four cut-off words, and what matters there is knowing how much
is left.

Both forms are always on the page, and CSS shows one at a time. `className`,
`aria-label` and the other attributes apply to both, and the phone line becomes
a `group` when it gets a name. `id`, `ref` and `data-testid` stay only on the
desktop list, because identity cannot appear twice on the page; a reference
through `aria-describedby` still reads the list even when hidden.

You can only go back, never skip ahead. A later step usually depends on what
the previous one validated, and a click that crosses that takes the person to a
screen they do not know how to fill in. That is why `onStepChange` is only
called with an already completed step, and without it the whole ruler is
read-only.

The pair is `step` and `onStepChange`, the same as `Tour`: a step in a
sequence, counted from zero.

## The state, and the footer

`useWizard(steps)` counts and validates the transition, and draws nothing. It
returns a `WizardState`: the index `step`, the list's `current`, the flags
`isFirst` and `isLast`, and `next`, `back` and `goTo`.

`next` accepts a check that can be asynchronous. Return `false` and the step
does not move. This is where React Hook Form's `trigger` comes in, without the
wizard needing to know React Hook Form:

```tsx
const steps: Step[] = [
  { id: 'client', title: 'Cliente' },
  { id: 'items', title: 'Itens' },
  { id: 'review', title: 'Conferir' },
]

const wizard = useWizard(steps)

<Steps steps={steps} step={wizard.step} onStepChange={wizard.goTo} />

<WizardFooter>
  <Button variant="ghost" onClick={wizard.back} disabled={wizard.isFirst}>
    Voltar
  </Button>
  <Button onClick={() => wizard.next(() => form.trigger())}>
    {wizard.isLast ? 'Emitir' : 'Continuar'}
  </Button>
</WizardFooter>
```

`WizardFooter` puts back on one side and forward on the other, and on the phone
stacks them in reverse order with both taking the full width: the button that
continues sits at the bottom, where the thumb is.

## When not to use

For what has already happened to something (an invoice's trail, the history of
a change), use `Timeline`. This ruler belongs to a wizard: it looks forward,
knows how many steps are left and exists to lead someone to the end of a form.
The timeline looks back, and nobody moves forward on it.

Two or three fields do not call for a wizard. Breaking a form that fits on one
screen into steps trades scrolling for clicks, and hides from whoever fills it
in the size of what they agreed to do.

## In React Native

Translates, and what ports is **the narrow mode the web already drew**: the "Passo 2 de 4" line, the step's title and the progress bar. The dot track does not cross over because it had already been measured and rejected below 640px: five steps on a 390px strip give 60px of label per step, and "Conferir os itens" becomes "Confe…" five times in a row. The description, which the web's narrow mode hides for lack of width, appears: here the current step is the only one on screen.

That is why there is no `onStepChange`: it only existed on the wide track, and without dots there is nothing to tap. Going back is the `WizardFooter` button, and skipping a step is still `goTo`.

`useWizard()` crosses over **whole and identical**: it is `useState` and three index calculations, with no DOM and no media query. Leaving the step to the native router would trade one screen state for five routes, and a wizard is not navigation: the steps share a single form, the device's back cannot lose what was already typed, and "Conferir" is not an address anyone should open directly. Whoever wants one route per step still can, because `goTo` accepts the index the router sends. `WizardFooter` always stacks, in written order (back on top, forward below, where the thumb is), and each button's `w-full`, which on the web arrives through a child selector, here is React Native's default `alignItems: stretch`.
