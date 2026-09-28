---
category: Forms
---

# Editable

In-place editing: the text turns into a field when clicked, and goes back to
being text when confirmed.

It is the gesture that separates a reading dashboard from an operating one.
Fixing a customer's name without opening an edit screen, without losing the
position in the list and without waiting for two navigations is the difference
between the person fixing it and the person leaving it wrong.

Two decisions the piece makes, and that are the reason it exists. **Escape
undoes**: leaving sideways is the gesture of someone who changed their mind,
and saving there turns a wrong click into an edit nobody asked for. **Leaving
the field saves**: it is the opposite of Escape on purpose, because whoever
clicked outside has moved on, and demanding an Enter after that loses what was
written without warning.

The switch between text and field fades, briefly, at `--rc-duration-base`:
the hard jump made the row look like it blinked. On first paint there is no
fade, and with "reduce motion" the token goes to zero and the switch is hard
again.

Closed, the text is a `button`. A keyboard user needs to know that it opens
something, and a `div` with `onClick` tells nobody that.

## Who holds the value

It holds its own when it receives only `defaultValue`, and obeys the outside
one when it receives `value`, the same pair as the other form pieces. Control
it when the value needs to come back from the server after being saved; leave
it uncontrolled when the fix only matters on this screen.

```tsx
<Editable defaultValue="Clínica São Lucas" label="Cliente" onValueChange={save} />
```

`label` is still required: open, the piece is an `<input>` without a visible
label, and without it the field has no name.

## When not to use

When the change needs explicit confirmation: an amount, a tax rate, any field
the server validates and may refuse. There a `Dialog` with Save and Cancel
says what is at stake; in-place editing promises that undoing is cheap.

## In React Native

Translates, with both gestures swapped. And the two were the whole piece on the web, so it is worth reading before porting the screen.

**A long press opens it**, not a tap. It is the gesture the system already uses to act on text, and the choice is defensive: on a reading panel the finger touches everything while scrolling, and with a short tap opening the field the keyboard came up on its own at every bump. For screen reader users the gesture does not exist, so the piece also declares a `longpress` accessibility action called "Editar", which appears in the rotor.

**Leaving the field does not save.** On the web, clicking outside confirms; here there is no clicking outside: there is the keyboard hiding, and `Cancelar` itself takes focus off the field before running, so a `blur` that saved would save the draft on the way to canceling it. Nothing leaves here without explicit confirmation (the keyboard's return button) and nothing is lost without `Cancelar`, which is visible next to the field because without Escape there is no invisible exit.

The rest is the usual contract: `value` and `onValueChange` **required**, no `defaultValue`, and `label` required. Closed, the piece announces `label` and value together, because "Nome do cliente" alone makes the person open editing just to find out what is in there.

The parts are styled through the same `classNames` as the web: `preview`, the area you hold to edit, and `input`, the open field.
