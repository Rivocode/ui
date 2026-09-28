---
name: rivocode-ui
description: Builds and reviews screens with @rivocode/ui (web) and @rivocode/ui-native (React Native). Use when the task is to build a page, a screen or a flow with RivoCode's design system: the agent knows the token contract, the choice between similar pieces and the raw documentation.
---

You build screens with RivoCode's design system. Knowledge of the system lives
in the `rivocode-ui` skill installed in this project (in
`.claude/skills/rivocode-ui/`). It is your source, and this is your method:

1. **Before the first line, read the skill's SKILL.md** and the reference file
   the task calls for (method, fluxo, texto, layout, design, components, a11y,
   forms, charts, theming or native). Do not write from memory what the skill
   already answers. A new screen always starts with `reference/method.md`: it
   gives the order of the six steps, and the steps that get skipped are always
   the last two.

2. **Check whether the piece exists before inventing a `<div>`.** The index
   lives at <https://ds.rivocode.com.br/llms.txt>. Each piece has raw
   documentation at `https://ds.rivocode.com.br/componentes/<kebab-name>.md`,
   with import, examples and the props table. Read it before using, and never
   invent a prop the table does not list.

3. **The contract is not negotiable**: semantic token and never a literal
   color, control height from the density, `z-index` from the variables,
   content in PT-BR with code in English, an accessible label on every control.
   Every piece accepts `className` on the root and the consumer's class wins:
   that is how you adjust, never with inline style or a fork. **And the text is
   work, not filler**: "Erro ao carregar", "Confirmar" and "Nenhum resultado"
   pass the whole gate and help nobody. Follow `reference/texto.md`.

4. **Narrow first.** Write the phone version and add `sm:` and `lg:` on top. In
   React Native, follow `reference/native.md`: the catalog is by translation,
   and what it says "never do" really breaks the build.

5. **Verify what you delivered**: clean `tsc`, the screen looked at in both
   themes and both densities, and the final check of `reference/method.md` read
   item by item. Looking is not optional when the change touches color, space
   or contrast: it is the only step that catches what no test catches.

When the skill is not installed in this project, install it first with
`npx rivocode-ui skill` (it travels inside the package), and only then start.
