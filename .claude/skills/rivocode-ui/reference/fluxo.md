# The shape of the task

The other files decide the shape of the **screen**. This one decides the shape
of the **task**: how many screens it fits in, where the person confirms, what
happens when they make a mistake, and how they go back.

It is the part no guard measures. A screen can be perfect in contrast, tokens
and keyboard, and still ask for three confirmations on something reversible and
none on what deletes.

## Contents

- One screen or several
- Wizard or single form: the check
- The well-made wizard
- Confirm, undo, or nothing
- What to do when it goes wrong
- The four endings, and what each one decides
- When the screen disappears under the person
- What makes the product smart
- Flow mistakes that always show up

## One screen or several

The question is not how many fields there are, it is **how many independent
decisions** the person makes.

| Shape | When | Piece |
|---|---|---|
| A single form | the fields are answered together, and the person already knows everything | `Card` with `Field` |
| Steps | there is a decision that changes the following fields, or the person needs to fetch data midway | `Steps` + `WizardFooter` |
| Side sheet | the task is accessory and the context behind matters | `Sheet` |
| Dialog | one short decision that cannot be dismissed by mistake | `Dialog` |

**Steps are not for fitting.** Breaking fifteen fields into three screens of
five does not reduce the work, it only hides its size and takes away the view
of the whole. Break when stage 2 **depends** on stage 1.

When there are steps, each one has to be **nameable by a noun**: "Cliente",
"Serviço", "Revisão". A step that is only called "Passo 2" was not a step, it
was a scroll.

**The last stage is always review**, with what was decided and a way back to
each part. It is where the person checks before what cannot be undone.

## Wizard or single form: the check

A wizard is not the default. The default is **a single form**, in sections with
`Fieldset` and a title, which lets the person see the size of the task, go back
to any field without navigating and submit whenever they want. Answer the four
questions before breaking it into steps; a wizard only if at least one is "yes".

1. **Does an answer change what is asked afterwards?** Individual or company
   swaps the fields; the type of service decides the tax rates.
2. **Does the person need to leave to fetch data midway?** The service code at
   the city hall, the receipt in the e-mail.
3. **Does a stage have its own cost when confirmed?** Looking up the CNPJ at
   the Receita, reserving the time slot, generating the QR.
4. **Is the task long and rare, and does the person get lost without a map?**
   Setting up the company in the system for the first time, configuring
   issuance.

All "no" is a single form, even with thirty fields. A field few people use goes
into a `Collapsible` ("Mais opções"), and not into one more step. Questions one
at a time, branching on the answer (triage, survey, the agent asking for
clarification), is `Questionnaire`, and not `Steps`.

## The well-made wizard

- **A single form beneath the steps.** One `useZodForm` with the fields of all
  stages, and each step shows its part. A form per step loses what was typed
  when going back.
- **Validate the step before moving on, and only it.**
  `next(() => form.trigger([...]))` from `useWizard` demands that step's
  fields; "Próximo" stays locked while the async check runs, and two taps move
  a single step.
- **Going back never loses anything**, and the steps already done are clickable
  in `Steps` through `onStepChange`. Skipping forward is not: the next step
  depends on the previous one.
- **Going back a step and a failed submit never lose anything**: the form stays
  in memory while the screen is open.
- **A draft across visits is a project decision, not the library's.** Storing
  it in the browser to survive a page reload exposes what was typed:
  `localStorage` stays on the machine, unencrypted, and any script on the page
  reads it. If the product wants it, store only what is not sensitive (never a
  password, card, document, health or financial data), with `useLocalStorage`,
  and clear it on a successful submit. When in doubt, do not store.
- **The last stage is review**, with each part summarized and an "Alterar"
  that goes back to its step. The final button says the effect: "Emitir nota",
  and not "Concluir".
- **No confirmation on top of the review.** The review already is the
  confirmation.
- **On a phone `Steps` becomes "2 de 4" with the step name**, and
  `WizardFooter` sticks to the bottom, with Back and the advance always in the
  same place.

```tsx
const STEPS = [
  { id: 'cliente', title: 'Cliente' },
  { id: 'servico', title: 'Serviço' },
  { id: 'revisao', title: 'Revisão' },
]
const FIELDS = [['document', 'name'], ['service', 'amount'], []] as const

const form = useZodForm(schema, { defaultValues: EMPTY })
const wizard = useWizard(STEPS)

<Steps steps={STEPS} step={wizard.step} onStepChange={wizard.goTo} />
<WizardFooter>
  {!wizard.isFirst && <Button variant="secondary" onClick={wizard.back}>Voltar</Button>}
  {wizard.isLast ? (
    <Button type="submit">Emitir nota</Button>
  ) : (
    <Button onClick={() => wizard.next(() => form.trigger([...FIELDS[wizard.step]]))}>
      Continuar
    </Button>
  )}
</WizardFooter>
```

The form is a single one for the three steps, so going back from Revisão to
Cliente finds everything as it was.

## Confirm, undo, or nothing

This is the decision most people get wrong, and it has a single rule: **the
cost of undoing decides.**

| The action | What it gets |
|---|---|
| Reversible and cheap (mark, archive, reorder) | **nothing.** Do it and done |
| Reversible but confusing to reverse (delete a draft, remove a row) | **undo**, in a `Toast`, with a deadline |
| Irreversible and with external effect (issue, cancel an invoice, delete for good) | **confirm**, with `AlertDialog` |

**Undo beats confirm whenever possible.** A confirmation charges everyone,
every time, to protect the occasional mistake - and the person learns to click
without reading, which is exactly the state the confirmation existed to
prevent. Undo only charges whoever made the mistake.

A confirmation is only justified when **undo does not exist**: the city hall
already received it, the e-mail already went out, the record is already gone.

When confirming is the right answer:

- `AlertDialog` for what is not dismissed by clicking outside;
- `Popconfirm` for what is local and small, anchored on the trigger itself;
- the title names the object, the description says the effect and who is
  notified, and the escape button names the state that remains. `texto.md` has
  the exact shape.

**Never confirm the same thing twice.** If the wizard's review already showed
what will happen, the dialog on top of it is noise.

## What to do when it goes wrong

- **Preserve what the person typed.** An error that returns the form empty
  costs the whole work again, and it is the most common reason for
  abandonment. What was typed stays in the fields, always.
- **The error appears near its cause.** A field error on the field; an
  operation error at the top of the form or in an `Alert`; a loading error in
  place of the content that did not come.
- **An error that is solved by retrying gets `onRetry`.** One that is not
  solved by retrying gets the path: whom to look for, or what to fix.
- **Validate on leaving the field, not on every keystroke.** Demanding the full
  CNPJ at the third digit is accusing someone who is still typing.
- **`Toast` does not work for an error that requires action.** It goes away.
  What needs to stay visible is `Alert`.

## The four endings, and what each one decides

Every query has four, and each is a flow decision, not just a screen:

| Ending | The decision |
|---|---|
| loading | skeleton in the shape of the coming content, with the column width, so the screen does not jump when the data arrives |
| error | what the person does now, and whether retrying solves it |
| empty | is it their first time, or did the filter find nothing? They are different texts and actions |
| data | the happy path |

Delivering only the fourth is delivering half the screen, and the missing half
is the one that shows up on the worst day.

## When the screen disappears under the person

- **Do not move what they are about to click.** Content that arrives later
  comes in below the reading point, or reserves the space from the start.
- **An action that takes a while stays tied to the button**, with `loading` and
  the button disabled - never a scrim that covers the screen and takes away the
  reference to what they were doing.
- **Confirmation does not change place.** The confirming button always stays in
  the same corner of the footer, in every dialog of the product.
- **Closing a sheet or a dialog returns focus to the trigger**, or the keyboard
  starts over from the top of the page. The house pieces already do this;
  hand-written layout does not.

## What makes the product smart

What separates a correct screen from a screen that is good to use is the work it
saves. Before delivering, go through these eight questions.

| Question | What to do | Piece |
|---|---|---|
| Can it fill itself in? | A CEP that brings the address, the amount that comes from the chosen service, today's date on the due date | `PostalCodeField`, `defaultValues` |
| Can it remember? | The filter, column, view and tab the person chose come back on the next visit | `useLocalStorage` |
| Is the default the most common one? | The field already comes with what 80% choose; the exception is what changes it | `defaultValue` |
| Can one act without opening another screen? | Edit in place, act in bulk, see the detail in a sheet | `Editable`, `ActionBar`, `Sheet` |
| Can it undo instead of confirming? | Do it right away and offer the way back in the toast | `useToast` with `actionProps` |
| Do daily users have a shortcut? | Global search and the most used actions by keyboard, with the shortcut visible | `Command`, `useHotkeys`, `Kbd` |
| Is what is rare out of the way? | Advanced options collapsed, and not mixed with the everyday ones | `Collapsible` |
| Does the person know they finished? | Visible success, with what happened and the next step: "Nota 4816 emitida. Ver PDF" | `useToast`, `Alert` |

A screen that answers "no" to almost all of them works, but charges the person
for work the system could have done.

## Flow mistakes that always show up

- A confirmation on a reversible action, and none on the one that deletes.
- A wizard used to make things fit, with no dependency between stages.
- An error that clears the form.
- `Toast` for what the person needs to read calmly.
- A filter empty state offering "create", when whoever filtered wants the
  filter back.
- Two confirmations for the same action, one in the review and another in the
  dialog.
- A stage called "Passo 2", which is not a decision but a scroll.
- Silent success: the action finished and nothing on the screen says it did.
- A wizard for a registration that is just long, with no stage that depends on
  the previous one.
- Going back a wizard step and finding the fields empty.
- A confirmation to delete what could have been undone.
- A field the system already knew how to fill, left blank for the person.
