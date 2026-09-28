Much of the code that uses this library today is written with an agent
alongside. A site that only serves HTML forces the agent to guess the API from
the name, and it guesses with confidence, which is worse than failing silently.

That is why everything here also exists as raw markdown.

## First of all: install the skill

Reading raw markdown solves today's conversation. The skill solves all of
them: it stays on the project's disk, travels through Git with the team and
comes at the library version the project actually has.

```bash
npx rivocode-ui skill
```

If you are an agent reading this page to build a screen, this is the first
command to run. The [Skill](/skill.md) guide has the variants per package
manager and the install through `curl`, for when there is none.

## The MCP server

For the agent that speaks [MCP](https://modelcontextprotocol.io),
`@rivocode/ui-mcp` delivers the same material through tools: it asks for the
right piece for an intent, reads its page and checks the token, without
leaving the conversation. It runs on your machine, over stdio, and opens no
network connection: the documentation travels inside the package.

In Claude Code:

```bash
claude mcp add rivocode-ui -- npx -y @rivocode/ui-mcp
```

In any other client that reads the JSON configuration (Claude Desktop, Cursor,
Windsurf, VS Code):

```json
{
  "mcpServers": {
    "rivocode-ui": {
      "command": "npx",
      "args": ["-y", "@rivocode/ui-mcp"]
    }
  }
}
```

| Tool | What it returns |
| --- | --- |
| `list_components` | the catalog by family, one line per piece |
| `get_component` | a piece's whole page: examples, props, when not to use, React Native |
| `search_docs` | a search across all the documentation, accent-insensitive |
| `recommend_component` | the candidate pieces for a screen intent, with the reason and the neighbors |
| `get_tokens` | color roles, scales, density and motion, and the raw DTCG JSON |
| `get_native_parity` | how the piece looks in React Native, prop by prop |
| `get_guide` | the conventions and each guide, including the skill's references |

| `audit_screen` | the audit of a finished screen, with a score from 0 to 100 (the same as the audit skill, below) |

The package ships with the documentation of the library version it was
generated from, and every answer says which one. The skill and the server do
not compete: the skill stays on the project's disk and teaches the method; the
server answers the one-off question in the middle of the work.

## Audit a finished screen

The `rivocode-ui` skill teaches how to build. `rivocode-ui-audit` checks what
has already been built: given a folder or the screen files of an app that uses
`@rivocode/ui` or `@rivocode/ui-native`, it returns a report with the
findings, file and line, and a score from 0 to 100.

```bash
dir=$HOME/.claude/skills/rivocode-ui-audit && mkdir -p "$dir/scripts" && \
  curl -fsSL https://ds.rivocode.com.br/skill-auditoria/SKILL.md -o "$dir/SKILL.md" && \
  curl -fsSL https://ds.rivocode.com.br/skill-auditoria/scripts/audit.mts -o "$dir/scripts/audit.mts"
```

Swapping `$HOME/.claude` for `.claude` puts it in the project only. Then ask
the agent to "audit the screens in `src/pages`", or run the script yourself:

```bash
bun ~/.claude/skills/rivocode-ui-audit/scripts/audit.mts src/pages
```

The script has no dependencies, and the `.mts` also runs on Node 23.6 or newer,
even in a `commonjs` project, or with `npx tsx` on any Node. `--json` swaps the
report for JSON and `--minimo 85` exits with code 1 below the score, to block
in CI.

**The audit has two halves, and the score comes out of both by the same
math.** The script finds what can be found without an opinion: literal color,
numeric `z-index`, a piece rewritten by hand (`<button>` in place of `Button`,
`<input type="checkbox">` in place of `Checkbox`, the homemade modal in place
of `Dialog`), `IconButton` without `label`, `Field` without `FieldLabel`,
screen text without accents or in English, a form without `useZodForm`, money
in `parseFloat`, CPF and CNPJ without `isValidCpf` and `isValidCnpj`, QR and
Pix made by hand, an import through the wrong path and the subpath peer
missing from `package.json`. The agent reads the screens and writes what can
only be decided by understanding what they do — the wrong piece for the
situation, text that does not say what happens, validation done with
`useState` —, in a JSON the script reads back.

**The score is deterministic: same input, same score.** Each rule weighs by
severity (critical 10, serious 5, moderate 3, minor 1), and the same rule
counts at most three times per file. The file's score is 100 minus the sum;
the final score is the average of the files minus what applies to the whole
app, like the missing peer. The agent does not give a score: it adds or
discards findings, and the discard shows up in the report with the reason.

Whoever uses the MCP server audits through the `audit_screen` tool, without
installing anything: it takes the files, the app's and the root's
`package.json` and the same judgment JSON, and returns the same report. The
raw skill lives at [/skill-auditoria/SKILL.md](/skill-auditoria/SKILL.md), and
the script at
[/skill-auditoria/scripts/audit.mts](/skill-auditoria/scripts/audit.mts).

## The addresses

| Address                        | What it delivers                                           |
| ------------------------------ | ---------------------------------------------------------- |
| `/skill/SKILL.md`              | the raw skill, to read without installing                  |
| `/skill-auditoria/SKILL.md`    | the audit skill, with the script at `/skill-auditoria/scripts/audit.mts` |
| `/llms.txt`                    | the index in the [llmstxt.org](https://llmstxt.org) format, by family, with one line about each document |
| `/llms-full.txt`               | everything in a single file: conventions, guides and every piece |
| `/componentes/<name>.md`       | a piece's document: prose, import, examples, props and React Native |
| `/<guide>.md`                  | a guide, like `/temas.md`                                  |
| `/convencoes.md`               | the library contract: Provider, tokens, vocabulary         |

The name in the address is the same as the page's: `ToggleGroup` lives at
`/componentes/toggle-group`, and its markdown at
`/componentes/toggle-group.md`.

On each piece's page, the **Copy as Markdown** button puts that same document
on the clipboard, to paste into the conversation with the agent.

**They are the same files the pages render.** There is no second copy to
maintain; what you read as an agent is what the page shows.

## In the prompt

The shortest path is to send the contract along with the piece you care about:

```
Read https://ds.rivocode.com.br/convencoes.md and
https://ds.rivocode.com.br/componentes/data-table.md and build an invoice
listing with the loading, error and empty states.
```

For bigger work, the index first:

```
Start at https://ds.rivocode.com.br/llms.txt and read what you need.
```

For an agent with context to spare and no network access after the first
fetch, the whole file at once:

```
Read https://ds.rivocode.com.br/llms-full.txt before starting.
```

## Where this comes from

The documents were not written for the site. They were born for the sync with
`claude.ai/design`, where an agent builds screens with these pieces, and that
is why they already answer what an agent asks: what it is for, when **not** to
use it, and how it differs from the similar piece next to it.

The pattern is not ours: Base UI itself ships its whole documentation inside
the package, in `node_modules/@base-ui/react/docs/`. That is how this
library's `Sheet` was built without guessing the API.

## Why the skill beats the prompt

Pasting the contract into the prompt works once. In the second conversation it
is not there, and the agent goes back to guessing the API from the name, with
confidence, which is worse than failing silently.

The skill stays installed and travels inside the package: whoever bumps the
library version has the new skill one command away. And it is a folder, not a
file — the method for building a screen, the shape of the task, the interface
copy, layout, design, choosing a piece, accessibility, forms, charts, theming
and React Native are kept apart, and the agent opens only what the work calls
for.
