If you program with an agent alongside, Claude Code, Cursor, or any other that
reads skills, you can teach it the whole library at once.

The skill is a folder: a `SKILL.md` the agent always reads, and the files in
`reference/` it opens only when the work calls for them. The method, the flow,
the copy, layout, design, choosing a piece, accessibility, forms, charts,
theming and React Native are kept apart precisely so they do not take up
context while they are not the subject.

## Install

The package command is the normal path. It copies the skill **from the
installed version**: a project pinned to `0.2.0` gets the `0.2.0` skill, not
the site's, which talks about pieces it does not have yet.

```bash
npx rivocode-ui skill        # npm
pnpm exec rivocode-ui skill  # pnpm
yarn rivocode-ui skill       # yarn
bunx rivocode-ui skill       # bun
```

With no argument, it goes into the project, at `.claude/skills/rivocode-ui`,
and the team gets it along through Git. With `--global`, it goes into
`~/.claude` and applies to all of your projects.

The same command also installs the `rivocode-ui` **agent**, in
`.claude/agents/`. The skill teaches; the agent is the specialist that loads it
on its own: delegate "build the invoices screen" to it and the method comes
along (check the catalog before inventing a `<div>`, read the piece's `.md`
before using it, and the token contract that is not up for negotiation).

### Without the library in the project

```bash
bunx @rivocode/ui skill
pnpm dlx @rivocode/ui skill
npx -y @rivocode/ui skill
```

Classic `yarn` has no `dlx`. There, install the package and use the form above.

### With no package manager at all

The site serves the raw skill, always at the newest version:

```bash
dir=$HOME/.claude/skills/rivocode-ui && mkdir -p "$dir/reference" && \
  curl -fsSL https://ds.rivocode.com.br/skill/SKILL.md -o "$dir/SKILL.md" && \
  for f in method fluxo texto layout design components a11y forms hooks charts ai theming native; do \
    curl -fsSL "https://ds.rivocode.com.br/skill/reference/$f.md" \
      -o "$dir/reference/$f.md"; \
  done
```

Swapping `$HOME/.claude` for `.claude` puts it in the project only.

<details>
<summary>If npm complains about a dependency conflict</summary>

Up to version `0.3.0`, the `zod` peer was declared as `^4`, and
`@hookform/resolvers` drags in packages that ask for zod 3. To run a command,
npm installs everything in a temporary directory, optional peers included, and
the conflict showed up there. On those versions, add `--legacy-peer-deps`.

The range was widened and the conflict no longer exists.

</details>

## Update

The same command again. The copy replaces the whole folder, so no old reference
is left pointing to a piece that changed.

## What it teaches

The library contract, whole and without depending on the network: the
Provider, the class vocabulary, the difference between filling and writing
text, and the height that comes from density.

A choice table for the mistakes that show up most, `Alert` versus `Toast`,
`Dialog` versus `AlertDialog`, `Select` versus `Combobox`, `Meter` versus
`Progress`. Each row says why, which is what prevents the next doubt.

The icon vocabulary (one concept, one icon, always from lucide) and the size
and accessible-name rule that goes with each one.

The four end states of a query, the two subpaths with a running example, and
the list of what never to do: literal color, numeric `z-index`, hard-coded
height, a portal mounted by hand.

And the addresses of the raw documentation, so it can fetch whatever piece is
missing.

## Why a skill, and not just the prompt

Pasting the contract into the prompt works once. In the second conversation it
is not there, and the agent goes back to guessing the API from the name, with
confidence, which is worse than failing silently.

The skill stays installed, and travels with the package: whoever updates the
library has the new skill one command away.

## Read without installing

The main file is raw markdown, at
[/skill/SKILL.md](https://ds.rivocode.com.br/skill/SKILL.md). It is worth
reading even for someone who writes by hand: it is the shortest summary of how
this library expects to be used.
