---
category: Forms
---

# PasswordInput

A password field with the eye that reveals it.

It exists as a piece because every project rebuilds this pair, and rebuilds it
with the same defect: the button stating the state instead of the action.
"Password visible" does not say what happens on click, and a screen reader user
decides by the verb. Here the button's name is always the action: "Mostrar
senha", "Esconder senha".

Revealing is a momentary gesture: leaving the field hides it again. Leaving the
password on screen after the person has moved elsewhere is what gets someone
read over the shoulder at a shared desk.

## Styling by part

`className` dresses the **field**, and not the frame. It is the only piece in
the catalog where the root is not its target, and changing that now would
silently change the width of every login screen that already exists. So the
frame got a name of its own:

```tsx
<PasswordInput
  aria-label="Senha"
  classNames={{ wrapper: 'w-72', input: 'font-mono', action: 'text-fg-muted' }}
/>
```

The two names the screen reader hears on the button come through `labels`, and
each has its own default. Changing only one does not erase the other:

```tsx
<PasswordInput aria-label="Senha" labels={{ show: 'Revelar a senha' }} />
```

## When not to use

For a six-digit verification code, use `OTPField`. It separates the slots,
accepts pasting the whole code and hides nothing, because the code is meant to
be read aloud from the phone.

## In React Native

Translates: `@rivocode/ui-native` exports `PasswordInput` - the button changes its name with the state (`labels.show`/`labels.hide`), and leaving the field hides it again; `classNames` with `wrapper`, `input` and `action`. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
