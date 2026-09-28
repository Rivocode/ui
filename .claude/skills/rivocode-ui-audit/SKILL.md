---
name: rivocode-ui-audit
description: Audits screens of an app that uses @rivocode/ui (web) or @rivocode/ui-native (React Native) against the house rules and returns a report with a deterministic score from 0 to 100. Use when asked to audit, review or score a screen, a folder of pages or a PR that builds interface with the library - literal color, numeric z-index, piece rewritten by hand, field without a label, money as float, CPF without a validator, home-made Pix, import through the wrong path, missing peer.
---

# Auditing a @rivocode/ui screen

The audit has two halves, and the score comes out of both through the same
math:

1. **The mechanics**, which the script does: `scripts/audit.mts` reads the JSX,
   the classes, the imports and `package.json`, and finds what can be found
   without an opinion.
2. **The judgment**, which is yours: read the screen and decide what can only be
   decided by understanding what it does. You write those findings in a JSON
   and run the script again with it. The final score is the script's, not
   yours: same input, same score.

Never give the score off the top of your head, and never adjust it after the
script has spoken. If a mechanical finding is wrong, dismiss it in the JSON
**with the reason**: the dismissal appears in the report, and whoever reads
decides whether they agree.

## The loop

1. **Run the script** on what you were asked to audit:

   ```bash
   bun .claude/skills/rivocode-ui-audit/scripts/audit.mts src/pages
   ```

   The path is that of the folder where the skill lives: `.claude/skills/…` in
   the project, or `~/.claude/skills/…` when it was installed for everyone.

   Without Bun, Node 23.6 or newer runs the same file
   (`node .claude/skills/rivocode-ui-audit/scripts/audit.mts src/pages`); Node
   22.6 runs it with `--experimental-strip-types`, and `npx tsx` runs it on any
   Node. The `.mts` extension is what lets the file be an ES module even in a
   project with `"type": "commonjs"`. The script has no dependencies.

   It scans `.tsx`, `.jsx`, `.ts` and `.js`, skips `node_modules`, `dist`,
   tests and stories, and leaves out whatever has neither JSX nor a library
   import. `package.json` is taken from each audited folder upwards, up to the
   repository root, and they all add up: in a monorepo, a peer hoisted at the
   root counts, and two folders from different apps bring in both manifests.

2. **Read each file the report lists**, including the ones scored 100. The
   script does not see what the screen means.

3. **Check each mechanical finding.** A right finding stays. A wrong finding
   goes to `dismissals`, with the reason in one sentence. A reason that
   convinces nobody ("does not apply") is not a reason.

4. **Write the judgment findings**, following the rules of the judgment table
   below, each with file, line and the sentence that says what is wrong.

5. **Run it again with the JSON** and deliver the report it prints:

   ```bash
   bun .claude/skills/rivocode-ui-audit/scripts/audit.mts src/pages --julgamento auditoria.json
   ```

   ```json
   {
     "findings": [
       { "rule": "escolha-de-peca", "file": "src/pages/notas.tsx", "line": 42, "message": "Toast for the issuance failure, which needs to stay visible: it is Alert" }
     ],
     "dismissals": [
       { "rule": "cor-literal", "file": "src/pages/marca.tsx", "line": 12, "reason": "ColorPicker swatches: the client's color is the screen's data" }
     ]
   }
   ```

6. **Say what to fix first**: the critical ones, then what weighed most. Do
   not fix without being asked; the audit delivers the diagnosis.

Each finding's `file` is the path as the report prints it, and `line` is the
file's line, as an integer from 1 (`42`, not `"42"`): the rule is the same for
findings and dismissals. A finding without `message`, a dismissal without
`reason`, a line that is not an integer and a dismissal that matches no finding
are refused, and the report says which. A JSON that is not an object with the
`findings` and `dismissals` lists stops the script with code 2 and the sentence
saying what is missing.

Other options: `--json` prints the report as JSON, `--manifesto` points to the
`package.json` when it is not above the folder, and `--minimo 85` exits with
code 1 below that score, for CI.

In the audited code, a comment on the finding's line or on the line above takes
the finding out of the count, and the report lists it with the reason:

```tsx
{/* rivocode-audit-ignore cor-literal: ColorPicker swatches, the client's color is the data */}
```

An import finding comes out on the `import` line, and a comment at its end
counts:

```tsx
import { useForm } from "react-hook-form"; // rivocode-audit-ignore useform-direto: legacy form
```

## The mechanical rules

Each one came from the `rivocode-ui` skill or from the conventions, and the
Source column says where. Weight: critical 10, serious 5, moderate 3, minor 1.

| Rule | Severity | What the script finds | Source |
|---|---|---|---|
| `cor-literal` | critical | hex, `rgb()`, `hsl()`, `oklch()`, Tailwind palette class (`bg-red-500`, `text-white`), arbitrary value `bg-[#fff]`, `text-[red]` and `shadow-[0_0_0_#000]`, color by name in `color`, `fill`, `stroke`; a compared hex (`location.hash === "#add"`) passes | SKILL.md, What never to do |
| `nome-acessivel` | critical | `IconButton` without `label` (in both packages the name is `label`), `Button` or `<button>` with only an icon and no name; in native, `Button` and `Pressable` with only an icon and no `accessibilityLabel`, and `Checkbox` or `Switch` without text and without `label` (there the pieces' spoken name is `label`). An empty name (`aria-label=""`) is not a name | a11y.md, Accessible name |
| `z-index-numerico` | serious | `z-10`, `z-[60]`, `zIndex: 5`, `z-index: 5` | SKILL.md, What never to do |
| `peca-reescrita` | serious | `<button>`, `<select>`, `<textarea>`, `<table>`, `<dialog>`, `<progress>`, `<meter>`, `<hr>`, `<details>`, `<input>` by type (`checkbox` is `Checkbox`, `range` is `Slider`, `password` is `PasswordInput`…), `role="dialog"`, `aria-modal` and the home-made modal's `fixed inset-0`; in native, react-native's `Button`, `TextInput`, `Switch`, `Modal`, `ActivityIndicator` and `Touchable*` | components.md |
| `campo-sem-rotulo` | serious | `Field` without `FieldLabel` (native: without `label`), a field outside `Field`/`FormField` and without a name, and `placeholder` acting as the label | a11y.md; texto.md |
| `imagem-sem-alt` | serious | `<img>` without `alt` | a11y.md |
| `elemento-clicavel` | serious | `onClick` on `div`, `span`, `li` and relatives, and on `<a>` without `href`, without `role` | a11y.md, Focus and keyboard |
| `foco-apagado` | serious | `outline-none` without `focus-visible:ring` in the same `className` or in the same call (`cn(…)`) | SKILL.md; a11y.md |
| `formulario-sem-zod` | serious | `<form>` in a file without `useZodForm` (a search with `role="search"` passes) | forms.md |
| `dinheiro-float` | serious | `parseFloat`, `Number()` or `toFixed(2)` on a line that talks about money, read by word (`valorTotal` talks, `customWidth` does not); what says `centavos` or `cents` passes; `type="number"` or `NumberField` on an amount field | forms.md, Money is CurrencyInput |
| `documento-sem-validador` | serious | a file that talks about CPF or CNPJ, validates something right there (`z.`, `.regex`, `.test`, `.length(11)`) and calls neither `isValidCpf` nor `isValidCnpj`; a schema imported from another file is checked there | forms.md |
| `pix-qr-caseiro` | serious | `qrcode`, `qrcode.react`, `react-qr-code` and relatives; `000201…` or `br.gov.bcb.pix` written by hand; home-made CRC16 | components.md, Charge by Pix |
| `import-caminho-errado` | serious | `FormField` from the root, `Button` from `/form`, a path that is not a package entry (`@rivocode/ui/dist/…`), the web package in a native file and the other way around, `QRCode` from the native root | convencoes.md, the subpaths |
| `peer-faltando` | serious, project-level | `/chart` without `recharts`, `/form` without `react-hook-form` (and without `zod` and `@hookform/resolvers` when there is `useZodForm`), `/dnd` without `@dnd-kit/*`, `/editor` without `@tiptap/*`, any entry without `lucide-react`, `react`, `react-dom` and `tailwindcss`; in native, any entry without `react`, `react-native`, `nativewind`, `react-native-reanimated` and `react-native-keyboard-controller`, `/chart` without `react-native-svg`, `/clipboard` without `expo-clipboard`, `/file-upload` without `expo-document-picker` | convencoes.md |
| `rotulo-fora-do-controle` | moderate | `Checkbox`, `Radio` or `Switch` without a child, with the text in a `<span>` beside it | convencoes.md, A control's label comes as a child |
| `tabindex-positivo` | moderate | `tabIndex` greater than zero | a11y.md |
| `useform-direto` | moderate | `useForm` imported from react-hook-form | forms.md |
| `dinheiro-escrito` | moderate | `R$ 12,4K` typed, `R$ ${valor}`, `Intl.NumberFormat` with `BRL`; the field frame's `<InputPrefix>R$</InputPrefix>` passes | SKILL.md, Money comes out abbreviated |
| `mascara-a-mao` | moderate | `replace` with `$1.$2` building a CPF, CNPJ, phone | convencoes.md, Formatting the number |
| `portal-a-mao` | moderate | `TooltipProvider`, `ToastViewport`, `createPortal` | SKILL.md, The Provider |
| `altura-cravada` | moderate | `h-10` and relatives in a control's `className` | SKILL.md, Control height |
| `descendente-arbitrario` | moderate | `[&_tr]`, `[&>div]` in a library piece's `className` | SKILL.md, classNames |
| `consulta-sem-finais` | moderate | a query `DataTable`, `ChartContainer` or `DataList` (it has `isLoading`, `isError`, `onRetry`, or the file fetches data) missing one of the endings | SKILL.md, four endings |
| `texto-sem-acento` | moderate | screen text with a word from the house dictionary without its accent, and `-cao`/`-coes` | texto.md |
| `texto-em-ingles` | moderate | screen text with an English interface word (`Save`, `Cancel`, `Loading`, `the`…) | SKILL.md; texto.md |
| `passo-sem-nome` | moderate | `"Passo 2"`, `"Etapa 3"` or `"Step 1"` written as text, the step name that does not say the decision | fluxo.md, One screen or several |
| `dado-sem-mascara` | moderate | a plain `Input` on a CPF, CNPJ, phone, mobile, CEP or plate field, read from `name`, `id`, `aria-label`, `placeholder`, `autoComplete` or from the surrounding `Field`'s `FieldLabel`; a `readOnly` or `disabled` field passes, because nobody types in it | SKILL.md, The field comes from the data |
| `movimento-literal` | minor | `duration-300`, `ease-[cubic-bezier(…)]` | convencoes.md, Motion |
| `recharts-direto` | minor | `recharts` imported on the web | convencoes.md, `/chart` |

## The judgment rules

The script does not find them: they come in through the JSON, and weigh the
same as the mechanical ones.

| Rule | Severity | When | Read |
|---|---|---|---|
| `provider-ausente` | critical, project-level | the audited tree builds screens and there is no `RivoProvider` at the app root | SKILL.md, The Provider |
| `escolha-de-peca` | serious | the wrong catalog piece for the situation: `Toast` for what needs to stay, `Dialog` for a destructive confirmation, `Select` for a long list, `Checkbox` for what turns on now | reference/components.md, the whole table |
| `validacao-a-mao` | serious | a form that validates with `useState` and `if` | reference/forms.md |
| `cor-sozinha` | serious | a status told only by tone, without a word or icon | reference/a11y.md |
| `texto-generico` | moderate | "Confirmar", "OK", "Algo deu errado", "Nenhum resultado" without a door, the "Cancelar" and "Cancelar nota" pair | reference/texto.md |
| `finais-da-consulta` | moderate | a query that only draws the happy path outside `DataTable` and `ChartContainer` | reference/components.md |
| `titulos-fora-de-ordem` | moderate | an `h1` that jumps to `h3`, two `h1` on the page | reference/a11y.md |
| `destrutivo-sem-protecao` | serious | delete for good, cancel an invoice, issue: an irreversible action that fires on click, without `AlertDialog` and without undo | reference/fluxo.md, Confirm, undo, or nothing |
| `wizard-sem-dependencia` | moderate | `Steps` breaking up a registration that is just long, with no stage that depends on the previous one | reference/fluxo.md, Wizard or single form |
| `confirmacao-em-reversivel` | moderate | `AlertDialog` or `Popconfirm` to archive, remove from the list or delete a draft, what could have been undone in the toast | reference/fluxo.md, Confirm, undo, or nothing |
| `rascunho-que-some` | moderate | a wizard that empties the fields on going back a step, or a failed submit that clears the form. A draft kept between visits is not demanded: it is a project decision | reference/fluxo.md, The well-made wizard |
| `sucesso-silencioso` | minor | an action that finishes without anything on the screen saying it finished | reference/fluxo.md, What makes the product smart |

A judgment finding points to a file and line the script audited; a
project-level one points to whichever file you want. A rule that does not exist
and a file outside the audit are refused, and the report says why.

## The math

The same one the report prints at the end:

- Weight by severity: critical 10, serious 5, moderate 3, minor 1.
- **File score** = max(0, 100 − Σ weight(rule) × min(occurrences of the rule in
  the file, 3)). The same rule repeated weighs at most three times per file: a
  file with twenty literal colors is already on the floor, and the twentieth
  says nothing the third did not.
- **Base** = average of the audited files' scores, rounded to the nearest
  integer.
- **Final score** = max(0, base − Σ weight(project rule) × min(occurrences, 3)).
  A missing peer and a missing Provider hold for the whole app, and that is why
  they are deducted from the final score, and not from the average.
- **Band**: 90 to 100 follows the house, 75 to 89 spot fixes, 50 to 74 rework,
  below 50 outside the contract. With any critical finding, the band does not
  go above spot fixes.

Dismissed and suppressed findings leave the count and stay in the report, with
the reason.

## What to deliver

The report the script printed, whole, and below it three lines of yours: what
to fix first, what the script could not check (the notes) and, if there were
any, each dismissal with its reason. No score other than the one the script
gave.

## Through MCP

Whoever has `@rivocode/ui-mcp` connected audits without the script: the
`audit_screen` tool receives the files (path and text), the manifests and the
same `findings` and `dismissals` pair, and returns the same report, through the
same math. In a monorepo, pass in `package_jsons` the `package.json` files from
the one closest to the screen to the root's, each with path and text: they are
the same ones the script would find walking up the folders, and without the
upper ones the peer hoisted at the root becomes a finding the script would not
give. `package_json`, with the text of a single one, still works for a
single-manifest app.
