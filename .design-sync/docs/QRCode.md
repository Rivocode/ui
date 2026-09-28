---
category: Data
---

# QRCode

A text that someone else's camera reads: the link to look up an invoice, the Pix
of a charge, the address of a menu.

The drawing is an SVG generated here, with no library: the encoder follows the
whole of ISO/IEC 18004, with versions 1 to 40, the numeric, alphanumeric and
byte modes (in UTF-8), Reed-Solomon error correction and the choice among the
eight masks by the standard's penalty. The version is the smallest one the text
fits in, so the square has as many modules as the text needs, and not one more.

```tsx
<QRCode value={linkDaNota} label="QR Code para consultar a nota 4813" />
```

`label` is required. The piece is an image (`role="img"`), and the raw content
is no use as a name: a screen reader spelling out
`00020126580014br.gov.bcb.pix…` says nothing. The name says what the code is
for.

## Colors and margin

**A machine-read code is always dark on light, in any theme.** The modules come
out in `code-ink` (almost black) and the background in `code-paper` (white),
and both have the same value in the light theme, in the dark one and in any
client theme. ISO/IEC 18004 accepts the inverted reflectance, with a light
module on a dark background, and the system camera even reads it; some readers
and banking apps do not. For a Pix, that is a payment that does not happen, and
nothing on the screen says so.

That is why the pair is not a theme role: it lives in the scale, outside
`[data-rc-theme]`, and a theme neither needs to declare it nor can invert it by
accident. The contrast guard measures the ink over the paper at 15:1 minimum
(the house gives 19.47:1) and checks that the ink is the darker of the two.
Do not wrap the piece in a light `RivoProvider` so the code reads: it already
reads.

In the dark theme the paper becomes a **white plate with rounded corners**
inside the dark card. The plate includes the **4-module quiet zone** the
standard requires: it is what separates the code from its surroundings, and
without it the camera cannot find the three finder corners. That is why the
plate has no padding of its own, and must not get `padding` from outside.

The same colors serve whoever draws another machine-read code, such as a
barcode: `fill-code-ink`, `bg-code-paper` and `text-code-ink`.

## Error correction

`level` chooses how much of the symbol can be lost without losing the text:
`L` recovers 7%, `M` 15% (the default), `Q` 25% and `H` 30%. A higher level
needs more modules for the same text, and therefore larger squares.

Use `Q` or `H` for what will be printed, crumpled or read from afar, and `M`
for the screen.

## Size

`size` is the side in px, margin included. Each module needs at least 2px of
screen for the camera to tell one from another: the Pix of a charge (version 8
at level M, 57 modules with the margin) needs 160px or more. A long text with
a small `size` draws correctly and does not read.

## With a logo

`logo` puts a mark in the center, and **only works with `level="H"`**. The
modules under the mark are really erased (the paper shows behind it, and the
mark inherits the ink as `currentColor`), and only level H recovers that loss
with room to spare. With `logo` and no `level`, the piece already starts at H;
with `logo` and another level, the mark does not show, and the console says
why.

```tsx
<QRCode value={linkDaNota} label="QR Code para consultar a nota 4813" logo={<img src="/marca.svg" alt="" />} />
```

Without `value`, the square holds the place with a dotted outline over the
surface, with no modules at all, so the screen does not jump when the text
arrives. It is not the white plate: in the dark theme an empty white square
looks like a code that failed to draw.

## Text that does not fit

Version 40 holds 2953 bytes at level L and 1273 at H. Longer text fits in no
QR at all, and the piece **does not bring the screen down** over it: in place
of the code it draws the same dotted square with the `labels.tooLong` notice,
the image's name gets the notice too, and the console warns in development.
The way out is to shorten the text, swap it for a link that leads to it, or
lower the level.

```tsx
<QRCode value={texto} label="QR Code do cardápio" labels={{ tooLong: 'Cardápio longo demais para o QR.' }} />
```

## Parts

`classNames` reaches `code` (the `svg`) and `logo` (the box in the center).

## When not to use

- **For the Pix of a charge**, use `PixCode`: it brings together this code, the
  copy-and-paste text with the copy button, the amount and the recipient, and
  checks the CRC.
- **For a text the person needs to read or type**, such as the access key that
  goes into another system's field, use `Code` with a `Clipboard` next to it.
  The QR only serves someone with a camera pointed at the screen.
- **On the screen of whoever will use the text.** Nobody points the camera at
  their own phone: if the person is already on the device, the link is a
  `Link` and the code is a `Clipboard`.

## In React Native

Translates, on the `@rivocode/ui-native/chart` path: the code is drawn with `react-native-svg`, and the house rule is **one subpath per peer**, not one per subject. Drawing with `View` would cost hundreds of boxes per code, one per run of dark modules, and the Pix of a charge exceeds two thousand modules.

**The encoder is the same on both sides, line by line**: it lives in `src/shared/` and crosses over by mirror, so version, mask and error correction do not diverge. The native test rasterizes the path the piece draws and decodes it back, like the web's.

The colors do **not** come from the theme: the modules are `tokens.code["code-ink"]` and the paper `tokens.code["code-paper"]`, dark on light in both schemes, on a plate with rounded corners. They do not go through the app's CSS or through the `RivoProvider`'s `colors`, so no client `@theme` inverts the code by accident. `level`, `size` and `logo` have the same contract as the web: with `logo` the level starts at H, and with another level the mark does not appear. Of the web's parts, only `logo` ports: `code` is the `Svg`, and `react-native-svg` does not take classes; the rest is styled through the root.

```tsx
import { QRCode } from '@rivocode/ui-native/chart'

<QRCode value={link} label="QR Code para consultar a nota 4813" />
```
