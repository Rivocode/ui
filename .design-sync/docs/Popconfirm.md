---
category: Overlays
---

# Popconfirm

The confirmation that appears attached to the button that triggered it:
deleting a row without darkening the whole screen.

The case is the trash button inside a list. The question appears a few pixels
from the row it threatens, so the panel does not need to repeat the context
the whole screen already shows: whoever reads "Excluir a nota 4813?" next to
invoice 4813 has not lost sight of where it came from, and the list stays
behind it, readable.

It is built with a single piece: `trigger` is the element that opens it and
the panel's anchor, `title` is the question, `description` is what gets lost,
and `onConfirm` is the action. `side`, `align` and `sideOffset` are the same
as in the house's other floating panels. In an actions column against the
right edge, `align="end"` keeps the panel from pushing the width.

The texts live in `labels`: `confirm` is the verb of the button that executes
(write the action, "Excluir", not "Confirmar"), `cancel` that of the button
that leaves, `busy` what the screen reader hears when the wait begins and
`blocked` the notice for whoever tries to leave during it. Pass only the ones
that change.

## Leaving without doing anything is easy on purpose

`Esc`, the cancel button and a click outside close the panel, and all three
call `onCancel`. That is the opposite of `AlertDialog`, and the reason is that
here the distracted gesture leads to the safe result: **closing deletes
nothing**. What demands intent is the opposite: executing, which only happens
on the red button, with the verb written on it. Trapping the person in a 20rem
panel to make them read two buttons demands attention where there is no risk,
and that is how you train someone to click "Confirmar" without reading.

Focus stays trapped while the panel is open, and starts on the cancel button.
The page keeps scrolling: the panel follows the anchor, and locking the scroll
of a whole screen because of a two-line question is the weight of the modal
coming back in through the window.

When the confirmation deletes the very row that opened it, the trigger
disappears with it and focus has nowhere to go back to. That is what
`finalFocus` solves: point it at the table header, or at whatever is left on
the screen.

## The network is slow, and the button has to say so

`onConfirm` can return a promise. Until it settles, the panel stays open, the
button goes into a waiting state and announces itself busy, cancel locks, and
neither `Esc` nor a click outside closes it: one click becomes one call, not
two deleted rows. If the promise rejects, everything goes back to the previous
state with the text still on screen, and the person decides whether to try
again.

For whoever already keeps that state outside the piece (in a store, in a
`useMutation`), there is `loading`, which adds to the promise's wait.

## On a phone it becomes a bottom sheet

Below 640px the anchored panel cannot be anchored: 20rem hanging from a trash
button against the edge of a 390px screen turn into a lopsided panel, with
nowhere to escape to. At that width the piece swaps the shell for a bottom
sheet, with the buttons at full width and at touch height, the same decision
`Dialog` and `CalendarPanel` already make. The content and the actions are the
same; what changes is the shell.

## Parts

`classNames` dresses `title`, `description`, `footer`, `confirm` and `cancel`,
and `className` dresses the panel, whether it is the floating one or the
sheet. Without those names all that is left on your screen is `[&_button]`,
which ties your layout to the piece's internal tree.

`tone` picks between the two designs: `danger`, the default, brings the
warning icon and the red execute button; `neutral` serves what can be undone
(archiving, removing from the selection) because spending red on the
reversible wears it out where it matters.

## When not to use

For what is irreversible and broad in scope, use `AlertDialog`. The line
between the two is the **breadth of the damage**: a table row, an attachment,
a list item (things the person sees from where they clicked and that are worth
one sentence) call for this panel; cancelling an invoice with the city hall,
deleting an account, discarding a whole form call for the modal, which darkens
the rest, does not close on a click outside and forces reading before any
exit.

The second test is the length of the text: if the confirmation needs more than
two lines, a list of what will be lost or a field to type the name of what is
being deleted, it does not fit in an anchored panel and it never did. It is
`AlertDialog`.

And if there is no question to ask at all, use neither: an action that can be
undone calls for the `Toast` with "Desfazer", which does not cost one more
click every time the person gets it right.

## In React Native

Becomes `AlertDialog`. An anchored panel is not a touch idiom: a 20rem question attached to a trash button against the right edge at 390px goes off screen or covers the row that is about to be deleted. The web itself already recognizes this: below 640px `Popconfirm` stops being a panel and becomes a bottom sheet, which is exactly what native has.

**One contract difference, and it is deliberate:** on the web dismissing CANCELS (`Esc`, clicking outside and the button, all three call `onCancel`), because there the distracted gesture leads to the safe result. The native `AlertDialog` does not close on a tap outside, as the web's does not either. So the way out on the phone is the cancel button, written and visible: without Escape there is no invisible exit, and it is the same rule `Editable` follows. `onCancel` has the same name, and here it is called by the cancel button and Android's back.

The action in progress ports with the same names: whoever returns a promise in `onConfirm` gets the same waiting button and the same lock against the second tap, and the modal only closes when it resolves. So does `tone`: `danger` is the default, and `neutral` paints the primary button for what can be undone. The texts live in the same `labels`, with the same keys: `confirm`, `cancel`, `busy` and `blocked`.
