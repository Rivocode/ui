`@rivocode/ui` is public on npm, under the MIT license. It needs no token, no
`.npmrc`, and no access to the organization.

## 1. Install

`lucide-react` goes along on the same line, and it is not decoration: the
components import icons straight from it. npm installs that peer on its own,
but pnpm and yarn do not, and without it `Sidebar`, `Pagination` and
`DatePicker` break at runtime.

```bash
npm install @rivocode/ui lucide-react
pnpm add @rivocode/ui lucide-react
yarn add @rivocode/ui lucide-react
bun add @rivocode/ui lucide-react
```

And Tailwind, as a dev dependency:

```bash
npm install -D tailwindcss @tailwindcss/vite
```

React 19, React DOM 19 and Tailwind 4 are **peer dependencies**: your project
decides the version, not the library. That avoids a duplicated React, which
breaks context and hooks in ways that are hard to diagnose.

These are optional, and only whoever uses them carries the weight:

| If you are going to use | Install alongside                                 |
| ----------------------- | ------------------------------------------------- |
| `@rivocode/ui/form`     | `react-hook-form`, `zod`, `@hookform/resolvers`   |
| `@rivocode/ui/chart`    | `recharts`                                        |
| `@rivocode/ui/dnd`      | `@dnd-kit/core`, `@dnd-kit/sortable`              |
| `@rivocode/ui/editor`   | `@tiptap/react`, `@tiptap/pm`, `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/extensions` |

## 2. Wire Tailwind into the build

Installing `@tailwindcss/vite` is not enough: it has to go into the plugins
list. Without it the build **passes with no error at all** and produces CSS
without a single library class, so the screen shows up bare and nothing in the
output explains why.

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

In Next.js the path is the PostCSS plugin, not this one.

## 3. The two lines of CSS

In the project's CSS file:

```css
@import "tailwindcss";
@import "@rivocode/ui/preset";

@source '../node_modules/@rivocode/ui/dist';
```

**The `@source` line is not optional, and it is the one that breaks most.**
Tailwind 4 only generates the classes it finds while scanning files. Without
that line it does not scan the library components, does not generate the
classes they use, and the screen shows up **with no styling at all**, no
error, no warning, no clue. Adjust the relative path to the folder where your
CSS lives.

The `preset` brings the three token layers, both themes and the brand fonts.
If your project already has its own typography, see
[Themes and customization](/temas) to import only the tokens.

## 4. The Provider, once

```tsx
import { RivoProvider } from '@rivocode/ui'
import './styles.css'

export function App() {
  return (
    <RivoProvider theme="rivocode-dark" density="comfortable">
      <YourApplication />
    </RivoProvider>
  )
}
```

Without it nothing is styled, and `Dialog`, `Menu`, `Select`, `Tooltip` and
the toasts throw, since they all read its context. The Provider already mounts
inside it the tooltip provider, the toast wiring and a portal container that
carries the theme along. **Do not mount any of them by hand.**

## 5. Teach your agent

If you program with Claude Code, Cursor or another agent that reads skills, one
command installs the one that teaches this library (the contract, the choice
between similar pieces and the icon vocabulary):

```bash
npx rivocode-ui skill
```

It goes into `.claude/skills/rivocode-ui` and the team gets it along through
Git. Details and alternatives in [Skill](/skill).

## Next.js

The components are interactive and carry `"use client"` at the source. The
Provider has to live in a client file, usually a `providers.tsx` imported by
the root layout:

```tsx
'use client'

import { RivoProvider } from '@rivocode/ui'

export function Providers({ children }: { children: React.ReactNode }) {
  return <RivoProvider theme="rivocode-dark">{children}</RivoProvider>
}
```

## When something does not show up

| Symptom                                   | Almost certain cause                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| Screen with no styling at all, not even yours | the Tailwind plugin is not in the plugins list of `vite.config.ts`   |
| Your classes apply, the library's do not  | the `@source` line is missing, or its relative path is wrong             |
| `ChevronRight is not defined` or similar  | `lucide-react` is missing: pnpm and yarn do not install peers on their own |
| Context error when opening a dialog or menu | tree outside `RivoProvider`                                            |
| Two Reacts on the page                    | React as a direct dependency of the library instead of a peer; check the lockfile |
| Floating element without the theme, loose at the end of the page | `scope="local"` without the Provider's portal container |
| Everything styled, and the whole page in the system font | client theme without `--rc-font-sans`: run `npx rivocode-ui check-theme` on your theme CSS |

The last one raises no error anywhere, and that is why it has its own command.
`rivocode-ui check-theme` reads your project's theme files and flags missing
roles, saying what happens on screen without each one. Details in
[Themes and customization](/temas).
