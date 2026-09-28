---
category: Data
---

# PixCode

The whole Pix charge in one card: the QR Code, the amount highlighted, the
name of the recipient and the copy-and-paste code with the copy button.

It receives the **ready copy-and-paste code**, as the PSP returns it in a
dynamic charge or as `buildPixPayload` builds it in a static one, and checks
the CRC before drawing. A code with a wrong digit does not become a QR: it
becomes a notice, because a QR the bank rejects is worse than none.

```tsx
<PixCode payload={cobranca.pixCopiaECola} />
```

The amount and the name come out of the code itself (fields 54 and 59).
`amount` and `receiver` beat both: use them when the screen knows more than the
code says. The name recorded in the code is ASCII, without accents
(`buildPixPayload` strips them), so "Clínica São Lucas" shows as "Clinica Sao
Lucas"; pass the accented name in `receiver` so the screen and the screen
reader say it right.

The copy-and-paste code is trimmed before anything else: spaces and line
breaks pasted along from the PSP's response do not go into the QR nor into what
the button copies. In a dynamic QR the amount recorded in the code **does not
show**, because the Central Bank's manual tells the payer to ignore it and
read the charge's amount; there the amount comes in only through `amount`.

The QR renders **dark on light in any theme**, on a white plate with rounded
corners inside the card. In the dark theme the card goes dark and the plate
does not: light modules on a dark background are a code that some banking apps
cannot read, and a Pix the bank cannot read is a payment that does not happen.
Do not wrap the piece in a light `RivoProvider` for that; the rule belongs to
the piece, and applies to client themes too. The reason is in `QRCode`.

Copying is the house `Clipboard`, with the confirmation that swaps the
button's name. On the payer's phone the copy-and-paste code is the main path,
not the backup: nobody points the camera at their own screen.

## Building the code

`buildPixPayload` builds the static Pix BR Code according to the BCB's Manual
de Padrões para Iniciação do Pix: the GUI `br.gov.bcb.pix` with the key and the
free text in field 26, currency 986, country BR, name and city, the txid in
62/05 (or `***`, as the manual prescribes when there is none) and the
CRC16-CCITT in 63.

```tsx
const payload = buildPixPayload({
  key: '+5583988112233',
  name: 'Clínica São Lucas',
  city: 'João Pessoa',
  amount: 1284.5,
  txid: 'NF4813',
})
```

The accent comes off the name, the city and the free text, and the letter
stays: "Jørgen Ångström" becomes "Jorgen Angstrom". The code comes out entirely
in ASCII, because the length of each field and the CRC are counted in
characters and the QR records bytes, and no bank guarantees the rest.

The key is recorded the way the DICT stores it: CPF and CNPJ lose their
punctuation, a phone typed with a mask gains the `+55`, e-mail and random key
go to lowercase. A key that after that fails `isValidPixKey` is refused with a
`RangeError`, because a code with a key the DICT cannot find is a charge that
does not get paid. The amount is rounded to the cent before checking: `0.004`
is refused, and `1.005` records `1.01`. Whatever exceeds the limits of the
manual and of EMV (key up to 77, name up to 25, city up to 15, txid up to 25
letters and digits, key plus free text up to 99) is refused with a
`RangeError`, not truncated: a silently truncated name is a charge nobody
recognizes.

`parsePixPayload` goes the way back and returns `null` when the CRC does not
match or the code is not Pix. It reads the static one, the dynamic one (`url`
in place of the key, and `unique` when the code is only good for one payment)
and the composite one (`recurrence`).

`isValidPixKey` checks the key the way the DICT stores it: CPF and CNPJ
(including the alphanumeric one) without punctuation and with the right check
digit, e-mail in lowercase, phone with `+55` and the random key with its
hyphens. Strip the field's mask before checking. `parsePixPayload` refuses a
code whose field 54 is not an amount in reais greater than zero, with up to two
decimal places: `-5`, `1e3` and `0x10` do not pass.

## States

`loading` puts a placeholder in the QR and in the text, with `aria-busy`, and
copying is turned off. `expired` swaps the QR for a notice and removes the
copy: an expired code is not offered for payment. With `onRenew`, the notice
gains the button to generate another.

Both reach the screen reader through a live region the piece always mounts,
and whose text is the only thing that changes: "Gerando o código Pix…" while
loading, "Código Pix pronto." when done, and the expired notice when it
expires. A region born together with the text is not announced, and
`aria-busy` alone is read by no one.

## Parts

`classNames` reaches `code` (the QR, the placeholder or the expired notice),
`amount`, `receiver`, `payload` (the copy-and-paste text) and `copy` (the
button). `labels` swaps the texts, and the type is exported as
`PixCodeLabels`: `copy`, `copied`, `payload`, `expired`, `renew`, `invalid`,
`loading` and `ready`, plus two functions - `receiver(nome)`, the "para
Fulano" line, and `code(valor, nome)`, the QR's name for the screen reader.

```tsx
<PixCode
  payload={payload}
  labels={{ receiver: (name) => `to ${name}`, code: (amount, name) => `Pix QR ${amount} ${name}` }}
/>
```

## When not to use

- **For a QR Code that is not Pix**, such as the invoice lookup link, use
  `QRCode`: it draws the code without checking the CRC or showing an amount.
- **To show the Pix key on its own**, which the payer copies into their own
  bank, use `Code` with a `Clipboard` next to it. The field where someone
  writes the key is an `Input`, checked by `isValidPixKey`. The key is not the
  copy-and-paste code, and a QR of it carries neither amount nor txid.

## In React Native

Translates, on the `@rivocode/ui-native/chart` path, because the QR is the native `QRCode`, drawn with `react-native-svg`. The pure functions (`buildPixPayload`, `parsePixPayload` and `isValidPixKey`) come from the root: they ask for no peer, and the file is the same as the web, through the shared code mirror. The amount is formatted without `Intl`, the same on both sides.

**Copying comes in through `renderCopy`.** The native `Clipboard` lives in `@rivocode/ui-native/clipboard` because of `expo-clipboard`, and the house rule is **one subpath per peer**: if the piece imported it, whoever draws a QR would have to install the clipboard module. The function receives the copy-and-paste code and is only called when there is something to copy (not loading, not expired, not with a wrong CRC), so the button disappears along with the code. The text is `selectable` regardless, and a long press copies even without the button.

```tsx
import { PixCode } from '@rivocode/ui-native/chart'
import { Clipboard } from '@rivocode/ui-native/clipboard'

<PixCode
  payload={cobranca.pixCopiaECola}
  renderCopy={(payload) => <Clipboard value={payload}>Copiar código</Clipboard>}
/>
```

The parts are styled through the same `classNames` as the web: `code`, `amount`, `receiver` and `payload`. `copy` does not port: the button is what `renderCopy` returns, and whoever writes it already styles it.
