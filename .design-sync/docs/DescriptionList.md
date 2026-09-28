---
category: Structure
---

# DescriptionList

Label and value pairs, in the markup that already exists for this: `<dl>`.

It is the details sheet of every listing (CNPJ, issue date, due date, amount)
that each screen used to build with a pair of `<span>` in a flex. Here the
screen reader hears "term, definition" instead of two loose texts, and the
rows come out divided by the same hairline.

The value accepts any node: a `Badge` for status, `font-mono` for a number,
money from `currencyShort`. The label does not shrink; a long value wraps on
its own side.

It sits well inside a details `Sheet` or `Dialog`, and next to a `Separator`
when the sheet has more than one block.

## Parts

`DescriptionItem` is one row: `label` on one side, the child on the other. The
value accepts anything: a `Badge` for status, `font-mono` for an invoice
number, `Clipboard` for what the person is going to take away.

## In React Native

Translates: `@rivocode/ui-native` exports `DescriptionList` - the borders come in through `Children`: Tailwind's divide utility does not exist in RN. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
