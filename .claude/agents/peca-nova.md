---
name: peca-nova
description: Creates a complete new @rivocode/ui piece: wrapper, types, preview, doc, test, index and checks. Use when adding any component to the catalog, and before saying a piece is done.
tools: Read, Write, Edit, Bash, Glob, Grep
---

A piece of this catalog has nine artifacts, and it does not exist while the
nine do not exist. `FileUpload` was published with the documentation page
ready and the component missing: whoever followed the docs broke at build
time, and an agent reading the index proposed the piece with confidence. That
is what happens when one of the nine falls out of sync.

## The order, and no step is optional

1. **Check that the piece does not exist under another name.** The skill's
   `reference/components.md` lists the choices between similar pieces:
   `PreviewCard` is the HoverCard, `Tree` is the TreeView, `MaskedInput` is the
   MaskInput, `Alert` is the Callout, `Slider` with two values is the
   RangeSlider.

2. **A wrapper over Base UI when there is a primitive; from scratch when there
   is not.** No literal color, no numeric `z-index`, no hardcoded height: all
   three have a guard in `check`, and the color one fails the build. Control
   height comes from `--rc-control-*`, corner from `--rc-radius-*`, stacking
   from `--rc-z-*`.

3. **`classNames` per part, if the piece has more than one node.** The type is
   `Slots<"track" | "indicator">`, from `src/lib/slots.ts`, and the names are
   the same ones the page's "Parts" section will use. Without it, the consumer
   reaches the inner node through `[&_div]` and couples the screen to the
   piece's tree.

4. **Preview in `.design-sync/previews/<Piece>.tsx`.** It is the file that
   becomes the example in the docs and on the site. Publish the whole file,
   with the supporting constants: a cut that drops the constant produces an
   example that does not run, and `check:previews` does not catch that because
   the file compiles.

5. **Page in `.design-sync/docs/<Piece>.md`.** Frontmatter with `category`, the
   prose of what the piece does, and (required) the "When not to use" section,
   with the neighboring piece named: `Progress` moves and finishes, `Meter`
   stays still; `Toast` goes away, `Alert` stays; `Steps` looks forward,
   `Timeline` looks back; `Dialog` dismisses by clicking outside, `AlertDialog`
   does not. The props table you do **not** write: it comes from the compiler.

6. **Test in `test/`, with `@testing-library`.** What is tested is the behavior
   the prose promises, including the states that lie when wrong: empty,
   loading, error, disabled, indeterminate.

7. **Run `bun run gen:props`** so the tables come out, and check that the piece
   shows up with the props you expect, callbacks included.

8. **New contrast pairs in `scripts/check-contrast.ts`**, if the piece
   introduced a color combination that is not measured yet. A control boundary
   needs 3:1; text on a state background needs 4.5:1 with composited alpha.

9. **The native side, on the same day.** Write the piece's row in
   `scripts/native-parity.ts` before saying you are done: `check:parity`
   refuses a page without a row. If the piece ports, build the pair in
   `native/src/` in the same batch: the API is not the same (on native
   everything is controlled and the list comes through `items`), but the choice
   of piece and the class vocabulary are. If it does not port, say why in the
   row. And `fila` is only for a gesture decision not yet made (never for lack
   of time), and requires an entry in `FILA_DECLARADA`.

## Before saying you are done

The whole `bun run check`, which is lint, types, previews, props, literal
color, contrast, themes, contract, native and tests. Then `bun run build`,
which is where what only breaks when packaging shows up.

And the test nobody automates: render it in `demo/` and look in both themes
and both densities. An indeterminate state and a loading state are invisible
to `tsc` and glaring in a capture.
