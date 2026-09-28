---
category: Forms
---

# TimeField

A typeable time field, in 24 hours.

Whoever clocks in, books an appointment or closes a delivery window types
`0800` faster than they open any panel. That is why the field exists on its
own: `TimePicker` is this field with a panel on top, not the other way around.

The colon goes in on its own while typing, and the field stops at four digits.
There is no AM/PM: the value is always 24-hour, which is what the backend
understands without argument.

## The value is text, not Date

The value is a `string` in the `"14:30"` format, and the empty field is `""`.

`Date` would force inventing a day for a time that has no day, and an invented
day carries time zone, daylight saving and the midnight rollover along with it.
Whoever schedules "delivery at 14:30" wants exactly those five characters in the
database, and that is what `onValueChange` delivers:

```tsx
const [entrada, setEntrada] = useState('08:00')

<TimeField value={entrada} onValueChange={setEntrada} />
```

**Only a whole time reports.** Typing `14` does not call `onValueChange`, the
same way `03/03` does not become a date in `DatePicker`. The listener never
receives half a time, and so never needs to validate what arrives.

Three functions make the bridge and ship in the package, because a screen that
shows time outside a field needs the same rules:

| Function | What it does |
|---|---|
| `applyTimeMask(texto)` | The mask while typing: adds the colon and stops at four digits |
| `parseTime(texto)` | `"HH:MM"` to minutes since midnight, and `undefined` for what is not a time |
| `formatTime(minutos)` | Minutes to `"HH:MM"`, and an empty string when there is no time |

## What happens with 25:99

Nothing is emitted, and the field marks itself invalid on the same keystroke,
without waiting for `blur`, because the person is still looking at the field
when they get it wrong.

On leaving the field, the impossible text goes back to the last valid time, as
`31/02` goes back in `DatePicker`. The alternative would be to fix what the
person typed (`25:99` becoming `23:59`), and fixing silently is worse: nobody
checks a value the field "accepted".

While typing, `1` and `14` flag nothing. Only the complete and impossible pair
lights up the field. Flagging a prefix is flagging someone who is still
writing.

## Step and window

`step` is in minutes and governs **the step**, not validation. The step lands
on the grid from midnight and does not add the raw step: with `step={15}`,
`14:07` goes up to `14:15`, not to `14:22`. With the field empty, the step up
starts at the window's opening.

What moves the step is the ↑/↓ arrow on the keyboard, and the two plus and minus
buttons on the phone: both doors call the same math.

`min` and `max` draw the delivery window or the shift. A time outside it **does
reach the listener** and the field marks itself invalid: the person typed a real
time, and erasing their work hides the error instead of showing it. The message
belongs to the form, which is who knows why the window is what it is.

```tsx
<Field>
  <FieldLabel>Horário da entrega</FieldLabel>
  <TimeField defaultValue="09:00" min="08:00" max="18:00" step={30} />
  <FieldDescription>Das 08:00 às 18:00, de meia em meia hora.</FieldDescription>
</Field>
```

A time typed off the grid is still valid: `14:07` with `step={30}` is a
legitimate time, and rejecting it would turn a keyboard convenience into a
business rule.

A shift that crosses midnight (`min="22:00"` with `max="06:00"`) is not
supported: the inverted window is ignored and the field accepts the whole day.
Two times without a date cannot say which of them belongs to the next day.

## The step under the finger

**Below 640px the field wears `[−][field][+]`.** Both buttons call the same
calculation as the arrows, so they land on the same grid and stop at the same
window. Each one is 44px wide, and the frame does not drop below 44px tall at
any density or size: it is the target the house requires for a finger, the same
44 as the day cell in the phone `Calendar`.

Without them, `step` was unreachable by touch. There is no ↑/↓ arrow on a phone
keyboard, so the only way out was opening `TimePicker`. The field that exists
precisely for time clocks was, on the phone, worse than the panel it was
supposed to make unnecessary. The pattern is not an invention: it is
`NumberField`'s, which is the house piece that has always solved stepping, and
it is the same one the React Native port wore first.

The frame really grows, not through a transparent halo as in `Checkbox` or
`Slider`. There, there is room around the drawing for the halo to take; here
the button's neighbors are the field and the edge, and a halo over the field
would steal the touch that places the cursor in the text.

**Why only on a narrow screen.** On the desktop the step already has a door,
and it takes up no pixels: the arrow. Two buttons next to every time become
noise in a schedule with four time fields: eight buttons nobody presses with a
mouse. The cost of what was refused is paid in two currencies, and both are
small: whoever narrows the browser window on the desktop gets buttons they do
not need, and the width is only known after hydration, so a server-rendered
page shows the field without buttons for one frame before they come in.

**Why not a prop.** A `steppers` prop would leave the default as it is, and the
default is precisely the defect: whoever writes the form on the desktop does not
discover on their own that the field lost its step on the phone of whoever fills
it in. An opt-in prop fixes the screen of whoever already knows about the
problem; everyone else's screen stays broken.

Inside `TimePicker` the buttons do not appear: there the step already has a
door under the finger, which is the hours and minutes panel, and it is built on
the same `step`.

## What the screen reader gets

**The buttons inherit the field's name.** Four buttons in a schedule with
"Entrada" and "Saída" read as two "Aumentar" and two "Diminuir", and whoever was
listening did not know which time they were changing. Now the name comes from
the field's own label, whether a `FieldLabel`, a loose `label for` or an
`aria-label`: "Aumentar Entrada" and "Aumentar Saída". It is not a new prop, it
is the label that is already on the screen. A name prop would repeat the
label's text on every call, and the default for whoever forgot the prop would
still be the defect.

A field with no label at all keeps a bare "Aumentar" and "Diminuir": there is
nothing to inherit from, and inventing a name from the `placeholder` would say
"Aumentar hh:mm".

**The step is announced.** Pressing the button changes the time with focus
resting on the button, and a change outside focus is silence: the person
pressed and did not know whether anything happened. A discreet live region next
to the field says the time the step landed on, and the ↑/↓ arrow on the
keyboard goes through the same door. The region is born with the field, empty,
because a region that arrives in the same frame as its text fires no
announcement at all: the reader observes the change of a region that was
already there.

Typing does not announce. Whoever types already hears the echo of their own
keyboard, and repeating `08:30` on every completed digit turns the field into a
field that talks over whoever is writing.

**Why not `role="spinbutton"` on the field.** It seemed to solve both things at
once, and measured in Chrome it solves neither. `aria-valuetext` is ignored on
an editable field: Chrome exposes the field's text, with or without the
attribute, so the sentence that would be written there never reaches the
reader. `aria-valuenow` stays at the last valid time while the screen shows
`25:99`, which is exactly the silent fix this piece refuses. And the step
announcement would still be missing, because a screen reader reads the value
change of the widget that has focus, and focus is on the button. Besides, the
role changes the field from "text box" to "spin button", and the field accepts
masked typing, which is precisely what the role does not foresee.

## In a native form

With `name`, a hidden field carries **the whole time**, and never the
half-written text: submitting `08` because someone pressed Enter in the middle
of typing is the kind of data that only shows up weeks later, in the report.

## When not to use

To choose the time without typing anything, use `TimePicker`: it is this field
with a panel of hours and minutes, and on the phone the panel becomes a bottom
sheet. It is no longer what rescues the step on touch (this field reaches
`step` on its own), but what offers the whole time ready to choose.

For a date, `DatePicker`; for date and time together, both side by side, each
keeping its own text.

For a duration ("2h30 de serviço"), neither: a duration is not a time of day,
and `NumberField` in minutes adds up, compares and has no midnight to cross.

For a time written by hand with no rule at all, `MaskedInput` with the `hora`
mask adds the colon and stops there. It does not know `25:99`, does not know a
window and has no step: neither arrow nor button.

## In React Native

Translates, and it is still the TYPING field: whoever clocks in writes `0800` faster than they open a panel, and the system's numeric keyboard is the idiom for that.

**The value rules cross over whole.** `"HH:MM"` in 24h, empty is `""`, and only a complete time notifies whoever listens. `25:99` is not silently fixed to `23:59`: it marks invalid on the same keystroke and goes back to the last valid one on leaving. Fixing it silently is worse, because nobody checks a value the field "accepted". `step` governs the steps and the options, never validation, so `14:07` with `step={30}` is still a legitimate time.

**Both sides gained the step button, and native got there first.** Arrows do not exist on touch, and `step` needed to keep meaning something; instead of inventing a gesture, the piece put on the mold the house already has for stepping with a finger, the `NumberField`'s `[−][field][+]`. The web had the same hole on a phone, and adopted it later: there the buttons only appear below 640px, because on desktop the arrow is already the door and takes no pixels. Here they are always there, because desktop does not exist. Both call the same calculation, so they land on the same grid starting from midnight; the difference is the target, 48pt here against 44 there.

Dropped: `defaultValue` (here everything is controlled), `name` (a hidden form does not exist in React Native) and `size` (the native `Input` has no size vocabulary).
