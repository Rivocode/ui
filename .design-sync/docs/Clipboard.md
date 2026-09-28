---
category: Actions
---

# Clipboard

Copying a piece of data to take it somewhere else.

Access key, CNPJ, trace id, Pix code, invoice number: every piece of data the
person needs to paste into another system wants this button next to it.

The confirmation is part of the component, not decoration. Copying is the
action with no visible result: nothing changes on the screen, so without
confirmation the person clicks again out of doubt. And whoever does not see the
icon change never learned it happened. That is why the button's own accessible
name changes, and the screen reader announces "Copiado" where it used to
announce "Copiar". The confirmation reverts on its own after `timeout`,
otherwise the button stays stuck in a state that has already passed.

When the clipboard is not available (no permission, or outside a secure
context), nothing is confirmed. Lying that it copied is worse than not
confirming: the person pastes what they had before and only finds out at the
destination.

The two names come in through `labels`, and each has its own default: changing
the verb does not force rewriting the confirmation along with it.

```tsx
<Clipboard value="35240612345678000199" labels={{ copy: 'Copiar a chave' }} />
```

The `variant` is `Button`'s. The confirmation check mark renders in the success
green on `secondary`, `ghost` and `outline`; on the two filled ones, `primary`
and `danger`, it renders in the label color, because the green measured over
them sits at 1.41:1 on the dark theme's `accent` and 1.08:1 on the light
theme's `danger`, against the 3:1 an icon requires.

Without `children`, the button is an `IconButton`, and the accessible name is
the one from `labels`, which changes to the copied one after copying. `size`
picks the side of the square among `sm` (the default), `md` and `lg`; with
text, it picks the height.

With `children`, the button's text is the `children` until it copies, and
becomes `labels.copied` during the confirmation. The caller's `onClick` is
called on click, before copying, and does not replace the copy.

## When not to use

For a whole code block, `CodeBlock copyable` already brings this button in the
corner, with the block's own content. Two copy buttons in the same box make the
person choose between things they think are different.

## In React Native

Translates, on its own path `@rivocode/ui-native/clipboard`, with the same arrangement as `form` and `chart` and for the same reason: `expo-clipboard` is an **optional** peer, and on the phone it is not just bytes, it is a native module the app links and rebuilds (`npx expo install expo-clipboard`). It has a path **separate** from `FileUpload` on purpose: whoever puts a copy button next to an NF-e access key attaches no file at all, and an index shared by both would charge for both.

**The confirmation becomes double, where on the web one was enough.** The rule does not change: copying is the action with no visible result, and without confirmation the person taps again out of doubt. What changes is how it arrives. The button still changes its icon and accessible name, as there; and the piece **also** fires a toast, because here changing the `accessibilityLabel` of a `Pressable` that is already under focus **is not re-announced** by either VoiceOver or TalkBack: whoever does not see the icon turn into a check mark would learn nothing. The toast the `RivoProvider` already mounts lives in an `accessibilityLiveRegion="polite"` (on iOS, where it does not exist, the same text goes out through the system announcement), and it is the only channel on this screen that speaks on its own. `toast={false}` turns it off, for the screen that copies several things in a row and does not want a stack of toasts.

**When it did not copy, nothing is confirmed**, as on the web: Expo's `setStringAsync` returns `false` when the clipboard refuses (the case of the web pass, outside a secure context), and on iOS and Android it always resolves `true`.

Without `children` the button is only the icon, and then the target is a full 44px, without depending on `hitSlop` to get there. The icon is drawn with `View`, like the `PasswordInput`'s eye.

**`variant` is the `Button`'s, and accepts the same five names as the web**: `primary`, `secondary` (the default), `ghost`, `outline` and `danger`, each with the background and the label of the native `Button` of that variant. In the two filled ones, `primary` and `danger`, the confirmation check mark comes out in the label color, not in the success green: measured, the green sits at 1.41:1 on the dark theme's `accent` and at 1.08:1 on the light theme's `danger`, against the 3:1 an icon requires.
