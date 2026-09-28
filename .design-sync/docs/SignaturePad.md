---
category: Forms
---

# SignaturePad

The on-screen signature area: accepting a rental contract, acknowledging a
delivery, the "agreed" on an inspection report. The person signs with a finger,
a stylus or the mouse, and whoever cannot draw **types their name**, which
comes out in cursive script.

```tsx
const [assinatura, setAssinatura] = useState<SignatureValue | null>(null)

<Field>
  <FieldLabel>Assinatura do locatário</FieldLabel>
  <SignaturePad value={assinatura} onValueChange={setAssinatura} />
</Field>
```

The drawing comes through Pointer Events, so the same code serves finger,
stylus and mouse. The stroke is smooth: the points are joined by curves, and
the thickness varies with speed, thin when the hand runs and full when it slows
down, like real ink. With a stylus that measures pressure, pressure enters the
calculation. The right mouse button does not draw, and a second finger touching
down in the middle of a stroke (the palm of the hand, almost always) is
ignored.

## The value

`value` is `null` with no signature, or one of two shapes:

- `{ kind: 'drawn', strokes, width, height }`: the strokes, each a list of
  points `{ x, y, time, pressure? }` in drawing units. The area is 600 units
  wide on any screen size, so a signature made on the phone comes out the same
  on the monitor.
- `{ kind: 'typed', text, font, width, height }`: the typed name and the font
  family.

`onValueChange` is called **at the end of each stroke**, and not on every
point, on every typed letter, on undo and on clear. When the area empties,
`null` arrives, which is what the form schema reads as "no signature". Without
`value`, the piece keeps the signature on its own starting from
`defaultValue`.

`ratio` is the area's width over its height, with a default of `3`. The height
comes from it, and not from a fixed number: the area shrinks along with the
column.

## Undo, clear, and what the screen reader hears

Below the paper sit **Desfazer o último traço** and **Limpar assinatura**, both
`IconButton`s with a tooltip on hover, and the button that switches mode. Empty,
the area shows the baseline and "Assine aqui", and both buttons are inactive.

The piece is a `group` named by the `Field`'s label (or `aria-label`, or
"Assinatura" with neither), described by the instruction on how to sign. The
paper is an image whose name states its status: "Nenhuma assinatura",
"Assinatura desenhada, 3 traços" or "Assinatura digitada: Maria Souza". Undo and
clear announce themselves in a `status`, and clearing from the keyboard moves
focus to the mode button, which stays alive, instead of dropping focus on the
page body.

## Typing instead of drawing

Drawing takes a steady hand and a fine pointer, and many people have neither:
keyboard-only users, screen reader users, switch users, or people with a
tremor. **Digitar assinatura** swaps the paper for the "Nome para a assinatura"
field, and the name appears on the paper in cursive script. The value becomes
`kind: 'typed'`, and exports the same way as the drawing. There is no prop that
turns this mode off: the alternative is the piece.

```tsx
<SignaturePad
  value={assinatura}
  onValueChange={setAssinatura}
  font='"Great Vibes", cursive'
/>
```

`font` is the cursive family, in CSS. Load the font on the page: without it, the
browser falls back to the system cursive, and so does the PNG. Switching modes
keeps the other one's draft: whoever drew, went to type and came back finds the
strokes. When the parent resets `value` from outside (a form `reset`), both
drafts go with it: the name field empties and going back to draw brings no old
stroke. One case escapes: if the value was already `null` when the parent
resets it, React does not tell the piece, and the other mode's draft stays
stored. That happens when the person drew, switched to "Digitar" without writing
anything and the form was reset. For a reset that erases everything without
exception, remount the piece with `key`: `<SignaturePad key={tentativa} … />`,
changing `tentativa` on reset.
Clearing does not switch modes: whoever cleared the name stays in the name
field. `defaultMode="type"` opens on the typed name, for the screen where most
people sign from the keyboard.

## In a form

Inside `Field`, the group takes the label, the description and the error; the
`Field`'s `disabled` and `invalid` arrive on their own. In React Hook Form,
`forValue` ties the piece to the schema, and empty is `null`:

```tsx
const schema = z.object({
  assinatura: z.custom<SignatureValue | null>().refine((valor) => valor !== null, {
    message: 'Assine para continuar',
  }),
})

<FormField name="assinatura" label="Assinatura do locatário">
  {(field) => <SignaturePad {...forValue(field)} />}
</FormField>
```

In an HTML form, `name` puts the signature's **SVG** in a hidden field, empty
when there is no signature.

## Exporting

`signatureToSvg(valor)` returns the SVG as text, and `signatureToPng(valor)`
the image as `data:image/png`, drawn on a canvas at double resolution
(`scale`). Both return `''` with no signature.

```tsx
const svg = signatureToSvg(assinatura)
const png = await signatureToPng(assinatura, { paper: true })
```

**The ink is dark in both themes.** A signature made in the dark theme does not
come out light on the document: the ink, the paper and the guide are the
`--rc-signature-*`, fixed in `scales.css` like the machine-read code pair, and
not a theme role. `check:contrast` measures the ink and "Assine aqui" at 4.5:1
against the paper, the baseline at 3:1, and fails ink lighter than the paper.
Without `paper`, the background comes out transparent, to sit on the document;
`paper: true` paints the white paper, and `ink` changes the ink for a single
export.

The typed name comes out in the SVG as text with the `font-family`: whoever
opens the file without the font sees the system cursive. For a file that needs
to look the same anywhere, export the PNG.

## States

- **Disabled**: no drawing and no buttons, the border becomes `border-disabled`
  and the guide `signature-disabled`. A signature already there stays visible.
- **Read only** (`readOnly`): shows the signature with no buttons, no drawing
  and no typing mode. It is the way to display a signature already collected.
- **Invalid** (`invalid`, or an invalid `Field`): `danger` border and
  `aria-invalid`. The message belongs to the form.

## Parts

`classNames` reaches each node by name: `pad` (the paper), `placeholder` (the
"Assine aqui"), `baseline` (the line), `actions` (the row of buttons) and
`input` (the typed name field). `className` dresses the root.

## Texts

`labels` changes each text: `group`, `placeholder`, `instruction`, `undo`,
`clear`, `typeMode`, `drawMode`, `typedName`, `empty`, `undone`, `cleared`, and
the functions `drawn(strokes)` and `typed(name)`, which tell the screen reader
the paper's status.

## When not to use

- **An acceptance that needs no initials**, such as "I have read and agree to
  the terms", is `Checkbox`. A drawn signature weighs more on the screen and on
  the hand; ask for it only when the document requires the stroke.
- **A signature that already exists on paper**, scanned, is `FileUpload`: the
  person attaches the image, and does not redraw it.
- **Just the name, with no signature value**, such as "who received it", is
  `Input`.
- **A digital signature with legal validity**, with an ICP-Brasil certificate,
  is not this piece: the stroke on the screen is evidence of acceptance, not a
  qualified signature. The certificate belongs to the service that signs the
  document.

## In React Native

Translates, on the `@rivocode/ui-native/chart` path: the paper is drawn with `react-native-svg`, which is already that path's peer, and the house rule is **one subpath per peer**, not one per subject. Whoever only uses a `Button` does not come to need SVG because of the signature.

**The stroke is the same on both sides, line by line.** The curve smoothing, the width that varies with speed and pressure, the typed name in cursive and the exported SVG live in `src/shared/` and cross over by mirror: a signature made on the phone opens the same on the web, with the same `value`. The gesture is the core's `PanResponder`, which does not yield the touch to scrolling in the middle of a stroke; `onDrawingChange` reports when the finger starts and ends, so the surrounding `ScrollView` can turn off `scrollEnabled`. Touch force, when the device measures it, comes in as pressure.

**It exports only SVG.** `signatureToSvg` comes from here with the token's ink, dark in both themes; PNG does not port, because React Native has no canvas. Whoever needs an image rasterizes the SVG on the server, or captures the area with a screenshot library. `value` is controlled, there is no `name` (a hidden form does not exist on the phone), and the type-your-name mode is still there: the default cursive is Snell Roundhand on iOS and `cursive` on Android.

```tsx
import { SignaturePad } from '@rivocode/ui-native/chart'

<SignaturePad
  value={assinatura}
  onValueChange={setAssinatura}
  onDrawingChange={(desenhando) => setRolagem(!desenhando)}
/>
```

The group's name is `label`, in place of the web's `aria-label`, and without it `labels.group` applies. Inside `FormField`, `forValue` already delivers the `label`.

The parts are styled through the same `classNames` as the web: `pad`, `placeholder`, `actions` and `input`. `baseline` does not port as a part: the baseline is a stroke inside the `Svg`, and `react-native-svg` does not take classes.
