The mask adds the punctuation, and does not say whether the number exists. What
says so is the check-digit math, and the library ships one function for each
document a Brazilian screen usually asks for. They are all pure, accept the
text with or without punctuation and answer `true` or `false`, and they all
exist with the same name and the same math in `@rivocode/ui` and in
`@rivocode/ui-native`.

| Function | Document | Length | Valid example |
| --- | --- | --- | --- |
| `isValidCpf` | CPF | 11 digits | `529.982.247-25` |
| `isValidCnpj` | CNPJ, numeric or alphanumeric | 14 positions | `12.ABC.345/01DE-35` |
| `isValidCnh` | CNH, the registration number | 11 digits | `02650306461` |
| `isValidVoterId` | Título de eleitor (voter ID) | 12 digits | `0043 5687 0906` |
| `isValidPis` | PIS, PASEP, NIT and NIS | 11 digits | `120.56874.10-7` |
| `isValidRenavam` | RENAVAM | 11 digits, or the old 9 | `00639884962` |
| `isValidPlate` | License plate, the old one and the Mercosul one | 7 positions | `ABC-1234`, `BRA2E19` |

```tsx
import { isValidCnh, isValidPlate } from '@rivocode/ui'

const schema = z.object({
  cnh: z.string().refine(isValidCnh, 'CNH inválida'),
  placa: z.string().refine(isValidPlate, 'Placa inválida'),
})
```

Validate on leaving the field, not on every keystroke: a half-typed document is
always invalid, and flagging someone who is still typing is noise.
`MaskedInput` adds the punctuation while the person types, and the function
checks the number when they finish.

## What each check verifies

None of these functions looks up a registry. They say the number **can**
exist, because the check digits match, and never that it is active, whose name
it is in, or that the plate is registered to a vehicle. That is a question for
the issuing agency's service, not for the screen.

- **CPF and CNPJ** check both check digits with the Receita Federal's modulo
  11. The alphanumeric CNPJ goes through the same math: each letter is worth
  its character code minus 48, and both check digits are still digits.
- **CNH** checks both check digits of the 11-digit registration number, with
  the discount of 2 on the second one when the first comes out as 10. Do not
  confuse it with the form number, printed elsewhere on the document.
- **Título de eleitor** checks the federative unit (positions 9 and 10, from
  `01` to `28`, where `28` is abroad) and both check digits. São Paulo (`01`)
  and Minas Gerais (`02`) have the TSE exception: a zero remainder becomes 1,
  not 0.
- **PIS** checks the check digit with the weights 3, 2, 9, 8, 7, 6, 5, 4, 3 and
  2. The same number serves as PASEP, NIT and NIS, so one function covers all
  four.
- **RENAVAM** checks the check digit of the 11-digit number. The old one, with
  9, is still valid: the function pads it with two leading zeros before the
  math.
- **License plate** has no check digit. The function checks the shape: three
  letters and four numbers on the old one (`ABC1234`), and three letters, a
  number, a letter and two numbers on the Mercosul one (`BRA2E19`), with or
  without a hyphen and in any case.

A sequence of a single repeated digit, like `111.111.111-11`, passes the math
of several of them and exists in none: the functions refuse it.

## Boleto

The linha digitável (the typeable line) has two forms, and the first digit
says which:

- **Bank boleto**, the ficha de compensação: 47 digits in five fields,
  `00190.00009 01149.718601 68524.522114 6 75860000102656`. The first three
  fields have their own check digit in modulo 10, and the fourth is the
  barcode's general check digit, in the modulo 11 of Banco Central's
  Carta-Circular 2.926.
- **Convênio**, the utility bill and the tax slip: 48 digits in four blocks of
  eleven, each with its own check digit, and it always starts with 8:
  `84630000000-3 29990296202-4 00410136000-8 00200644114-7`. The third position
  says the modulo: 6 and 7 are modulo 10, and 8 and 9 are modulo 11, as in
  FEBRABAN's collection layout.

`isValidBoletoLine` checks every check digit of both forms, including the
general one, which is the only one that catches a swapped digit in the amount
or the due date. `boletoLineToBarcode` returns the 44 barcode digits, or `null`
when the line does not check out. And `parseBoleto` reads what the number
carries:

```tsx
import { parseBoleto } from '@rivocode/ui'

const boleto = parseBoleto('00190.00009 01149.718601 68524.522114 6 75860000102656')
// { kind: 'bank', bank: '001', amount: 102656, dueDate: 15/07/2018, … }
```

| Field | On a bank boleto | On a convênio |
| --- | --- | --- |
| `kind` | `bank` | `collection` |
| `bank` | the clearing code, with three digits | `null` |
| `amount` | the amount in cents, or `null` when it comes zeroed | the amount in cents when the third position is 6 or 8; `null` when it is 7 or 9, which carry a reference and not reais |
| `dueDate` | the due date, or `null` with the factor `0000` | `null`: a convênio has no factor |
| `segment` | `null` | 1 city hall, 2 sanitation, 3 power and gas, 4 telecommunications, 5 government agency, 6 carnê, 7 traffic fine, 9 bank use |
| `line`, `barcode` | both, digits only | both, digits only |

`parseBoleto` also accepts the 44 digits the barcode reader returns, and builds
the line from them. A number that does not check out returns `null`, not half
of the fields.

### The due-date factor went back to 1000

The bank boleto's due date is a four-digit factor: how many days after
07/10/1997 (October 7). The factor reached 9999 on 21/02/2025, and FEBRABAN
reset it to 1000 on the next day, 22/02/2025. Since then the same factor serves
two dates 9,000 days apart, and the number alone does not say which.

`parseBoleto` picks the date closest to today, which is the one a boleto in
circulation has. Whoever reads an old stored boleto, or wants a result that
does not change with the clock, passes the reference day:

```tsx
parseBoleto(line, { today: new Date(2018, 6, 1) })
```

`MaskedInput` has the `boleto` mask, which starts as the bank one and switches
to the convênio one on its own when the first digit is 8. On mobile it is the
same name, on `@rivocode/ui-native`'s `MaskedInput`.

## With no field around

The functions do not depend on any piece, so they also work outside a form:
checking an imported spreadsheet, flagging the table row whose document came
back malformed from the server, or deciding on the server itself, because they
do not touch the DOM.

```tsx
const invalid = rows.filter((row) => !isValidRenavam(row.renavam))
```

The punctuation masks live in `MaskedInput`, which also exports the functions
that apply them outside the field, like `applyMask(text, 'cpf')`.
