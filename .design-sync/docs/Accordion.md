---
category: Structure
---

# Accordion

An accordion, for frequently asked questions and for long form sections.

`AccordionItem` delivers header, trigger and panel in a single component,
because Base UI requires an exact order among them and exposing the loose parts
would only create a way to assemble it wrong.

## In React Native

Translates: `@rivocode/ui-native` exports `Accordion` - `value`, `defaultValue` and `onValueChange` on the root, through the `value` of each `AccordionItem`; one open at a time, as on the web (`multiple` allows several), and an item without `value` opens on its own. It opens with the arrow rotating and the body fading in, and with no motion when the system asks to reduce it. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
