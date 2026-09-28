import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { indexLine, partNote } from './agent-address'
import { BLOCK_LIST, blockMarkdown } from './block-list'
import { dropLeadingHeading, firstSentence, splitFrontmatter } from './doc-text'
import { sliceSource, storyNamesOf, titleFromSource } from './example-source'
import { GUIDE_LIST } from './guide-list'
import { findParent, importPathOf } from './parts'
import type { Prop } from './prop-types'
import { renderDoc, type Part } from './render-md'
import { slugify } from './slug'

/* ---------------------------------------------------------------------------
 * What the site delivers to whoever reads with an agent
 *
 * `/llms.txt`, `/llms-full.txt`, the `.md` of each piece and each guide, the
 * conventions and the skill. Everything comes out of a single function,
 * `agentFiles`, and the three ends read from it: the build's `generateBundle`,
 * the `vite dev` middleware and the test `test/markdown-for-agents.test.ts`.
 *
 * It lives here, and not inside `vite.config.ts`, so the test can call the
 * same function the build calls without building the site first. A test that
 * reads `dist/` passes on the machine that just built and fails in CI, where
 * `check` runs before any build.
 * ------------------------------------------------------------------------- */

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

const DOCS_DIR = here('../../../.design-sync/docs')
const PREVIEWS_DIR = here('../../../.design-sync/previews')
const PROPS_FILE = here('./component-props.json')
const CONVENTIONS = here('../../../.design-sync/conventions.md')
/*
 * The skill lives where Claude Code looks, not in a folder just for the site:
 * a second copy would drift from the first the next day, and the one the site
 * delivers is precisely the one that needs to be right.
 */
const SKILL_DIR = here('../../../.claude/skills/rivocode-ui')
const AUDIT_DIR = here('../../../.claude/skills/rivocode-ui-audit')
export const AUDIT_FILES = ['SKILL.md', 'scripts/audit.mts']
const GUIDES_DIR = here('./content')
const BLOCKS_DIR = here('./blocks')

export const SITE = 'https://ds.rivocode.com.br'

/** The skill's files, in the order its body cites them. */
function skillFiles(): string[] {
  const refs = readdirSync(`${SKILL_DIR}/reference`)
    .filter((file) => file.endsWith('.md'))
    .map((file) => `reference/${file}`)

  return ['SKILL.md', ...refs]
}

export type Doc = { name: string; slug: string; family: string; body: string }

export function readDocs(): Doc[] {
  return readdirSync(DOCS_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const { family, body } = splitFrontmatter(readFileSync(`${DOCS_DIR}/${file}`, 'utf8'))
      return {
        name: file.replace(/\.md$/, ''),
        slug: slugify(file.replace(/\.md$/, '')),
        family,
        body,
      }
    })
}

/**
 * The prose guides, by slug, with the title and the lede.
 *
 * They are served raw like the piece pages. The guide is where the why lives -
 * how a theme is written, why density is a single attribute -, and that is
 * what an agent needs before the first line.
 */
export function readGuides() {
  const guides = new Map<string, { title: string; summary: string; body: string }>()

  for (const { slug, title, summary } of GUIDE_LIST) {
    try {
      guides.set(slug, { title, summary, body: readFileSync(`${GUIDES_DIR}/${slug}.md`, 'utf8') })
    } catch {
      // A guide that is listed and not yet written is simply not served.
    }
  }

  return guides
}

/**
 * The page blocks, with each one's file. It is the same `.tsx` that runs in
 * the `/blocos` preview, so the markdown never shows code that does not
 * compile.
 */
function readBlocks() {
  return BLOCK_LIST.map((block) => ({
    block,
    markdown: blockMarkdown(block, readFileSync(`${BLOCKS_DIR}/${block.file}.tsx`, 'utf8'), SITE),
  }))
}

const guideMarkdown = (guide: { title: string; body: string }) =>
  `# ${guide.title}\n\n${guide.body.trimStart()}`

function readPreviews() {
  const sources = new Map<string, string>()
  for (const file of readdirSync(PREVIEWS_DIR)) {
    if (!file.endsWith('.tsx')) continue
    sources.set(file.replace(/\.tsx$/, ''), readFileSync(`${PREVIEWS_DIR}/${file}`, 'utf8'))
  }
  return sources
}

/**
 * Each piece's props, by name, read from the file the extraction writes. It
 * comes out of the compiler in `scripts/catalog-props.ts`, and `check:props`
 * fails when the committed file drifts from the source.
 */
export type Piece = { forwardsRoot: boolean; props: Prop[] }

export function readTypes() {
  try {
    return new Map<string, Piece>(
      Object.entries(JSON.parse(readFileSync(PROPS_FILE, 'utf8')) as Record<string, Piece>),
    )
  } catch {
    // Not generated yet: the tables come out empty, and the page serves anyway.
    return new Map<string, Piece>()
  }
}

/**
 * One read per build, not one per document. Scanning the previews a hundred
 * and some times to write a hundred and some files is the waste that only
 * shows up as a slow build nobody can explain.
 */
function readAll(docs: Doc[]) {
  const previews = readPreviews()
  const types = readTypes()
  return { previews, types, names: new Set([...docs.map((item) => item.name), ...previews.keys()]) }
}

type Sources = ReturnType<typeof readAll>

/** The body of `/componentes/<slug>.md`, from the same files the page reads. */
function buildMarkdown(doc: Doc, docs: Doc[], { previews, types, names }: Sources) {
  const partOf = (name: string) => findParent(name, names)

  const partNames = [...names].filter((name) => partOf(name) === doc.name).sort()

  /*
   * The piece's examples, and those of its parts - the same rule as the page.
   * A part has no `.md` of its own, so its preview only has this address to
   * reach the reader. Without this, `RadioGroup.md` came out without a single
   * example, with two written in `Radio.tsx`.
   */
  const stories = [doc.name, ...partNames].flatMap((name) => {
    const source = previews.get(name)
    if (!source) return []
    return storyNamesOf(source)
      .map((story) => ({
        title: titleFromSource(source, story),
        code: sliceSource(source, story) ?? '',
      }))
      .filter((story) => story.code)
  })

  const parts: Part[] = partNames.map((name) => ({
    name,
    body: dropLeadingHeading(docs.find((item) => item.name === name)?.body ?? ''),
    props: types.get(name)?.props ?? [],
  }))

  const related = docs
    .filter((item) => item.family === doc.family && item.name !== doc.name && !partOf(item.name))
    .slice(0, 6)
    .map((item) => ({ name: item.name, slug: item.slug }))

  return renderDoc({
    name: doc.name,
    body: doc.body.trimStart(),
    importPath: importPathOf(doc.name),
    props: types.get(doc.name)?.props ?? [],
    forwardsRootProps: types.get(doc.name)?.forwardsRoot ?? false,
    stories,
    parts,
    related,
  })
}

/** The families in alphabetical order, each with its documents. */
function byFamily(docs: Doc[]) {
  const families = new Map<string, Doc[]>()
  for (const doc of docs) {
    const list = families.get(doc.family) ?? []
    list.push(doc)
    families.set(doc.family, list)
  }

  return [...families.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, items]) => [family, items.sort((a, b) => a.name.localeCompare(b.name))] as const)
}

const summaryLine = (pieces: number, documents: number) =>
  `The RivoCode design system: ${pieces} pieces in ${documents} documents, tokens in three layers, two themes and two densities.`

/*
 * The index the agent reads, in the llmstxt.org format: title, summary as a
 * quote, prose, and one section per subject with `- [name](address): description`.
 *
 * A part goes under the piece it composes, not beside it. Forty-five of the
 * entries here are parts - CardHeader, DialogFooter, SelectItem -, and listing
 * them at the same level makes the agent count a hundred and twenty-six
 * pieces, spend context opening CardTitle.md as if it existed on its own, and
 * miss the only thing that matters about it: that it only exists inside Card.
 */
function indexForAgents(docs: Doc[]) {
  const names = new Set(docs.map((doc) => doc.name))
  const parentOf = (name: string) => findParent(name, names)

  const pieces = docs.filter((doc) => !parentOf(doc.name)).length

  const sections = byFamily(docs)
    .map(([family, items]) => {
      const lines = items
        .map((doc) => {
          const parent = parentOf(doc.name)
          const owner = parent ? docs.find((item) => item.name === parent) : undefined
          return indexLine(
            doc.name,
            doc.slug,
            owner && { name: owner.name, slug: owner.slug },
            firstSentence(doc.body),
          )
        })
        .join('\n')
      return `## ${family}\n\n${lines}`
    })
    .join('\n\n')

  const guides = [...readGuides()]
    .map(([slug, guide]) => `- [${guide.title}](/${slug}.md): ${guide.summary}`)
    .join('\n')

  return `# @rivocode/ui

> ${summaryLine(pieces, docs.length)} Every address below delivers raw markdown, with no HTML around it, for agents to read.

Everything in a single read, without following links: [/llms-full.txt](/llms-full.txt), with the
conventions, the guides and every piece's document, concatenated.

## Start here: install the skill

If you are an agent that reads skills — Claude Code, Cursor, Codex, any that
loads a folder with \`SKILL.md\` —, **install ours before reading the rest of this
page**:

\`\`\`bash
npx rivocode-ui skill
\`\`\`

Without the library in the project, use \`npx -y @rivocode/ui skill\`. The command writes
\`.claude/skills/rivocode-ui/\` and the \`rivocode-ui\` agent in \`.claude/agents/\`, and
copies the skill from the installed version, which is the one that talks about the pieces the project has.

It brings the whole contract to disk — the method for building a screen, the shape of
the task, the interface copy, the Provider, the class vocabulary, the choice
between similar pieces, accessibility, forms, charts, theming and React Native
—, in files you open only when the work calls for them. Without it, every piece costs a search on this page and the API goes back to being
guessed from the name.

- [Skill](/skill.md): full instructions, including without a package manager
- [SKILL.md](/skill/SKILL.md): the raw skill, to read without installing
- [Audit skill](/skill-auditoria/SKILL.md): checks a finished screen against the house rules and gives a score from 0 to 100, with the script at [/skill-auditoria/scripts/audit.mts](/skill-auditoria/scripts/audit.mts)

## If you cannot install

Read [/convencoes.md](/convencoes.md): it is the library's usage contract, with the
RivoProvider, the class vocabulary and the rules that apply to every component.
Then, the document of the piece you care about, in the list below.

- [Conventions](/convencoes.md): Provider, tokens and the rules that apply to every piece

## Guides

${guides}

## Page blocks

Whole, copyable screens, built only with the pieces from here: start from one of them
instead of a blank sheet.

${BLOCK_LIST.map((block) => `- [${block.title}](/blocos/${block.slug}.md): ${block.summary}`).join('\n')}

${sections}
`
}

/**
 * The whole site in one file, for the agent that prefers a single read to
 * twenty fetches. The order is the index's: conventions, guides, and the
 * pieces by family. A part does not go in loose, because it is already whole
 * on the page of whoever composes it.
 */
function fullForAgents(docs: Doc[], pages: Map<string, string>) {
  const names = new Set(docs.map((doc) => doc.name))
  const pieces = docs.filter((doc) => !findParent(doc.name, names))

  const chunks: Array<[string, string]> = [['/convencoes.md', readFileSync(CONVENTIONS, 'utf8')]]

  for (const [slug, guide] of readGuides()) chunks.push([`/${slug}.md`, guideMarkdown(guide)])

  for (const { block, markdown } of readBlocks()) chunks.push([`/blocos/${block.slug}.md`, markdown])

  for (const [, items] of byFamily(pieces)) {
    for (const doc of items) {
      const address = `/componentes/${doc.slug}.md`
      chunks.push([address, pages.get(address.slice(1))!])
    }
  }

  const body = chunks
    .map(([address, text]) => `---\n\nAddress: ${SITE}${address}\n\n${text.trim()}`)
    .join('\n\n')

  return `# @rivocode/ui — full documentation

> ${summaryLine(pieces.length, docs.length)} This file joins the contract, the guides and every piece's document, in the order of ${SITE}/llms.txt.

${body}
`
}

/**
 * Every file the site delivers to agents, by path inside `dist`.
 *
 * A part gets no page of its own: it is already published in full - prose,
 * props and the example that assembles it - inside the page of whoever
 * composes it. The old address keeps answering, with a three-line note: an
 * agent that saved the link must not find nothing.
 */
export function agentFiles(): Map<string, string> {
  const docs = readDocs()
  const files = new Map<string, string>()

  files.set('convencoes.md', readFileSync(CONVENTIONS, 'utf8'))

  for (const file of skillFiles()) {
    files.set(`skill/${file}`, readFileSync(`${SKILL_DIR}/${file}`, 'utf8'))
  }

  for (const file of AUDIT_FILES) {
    files.set(`skill-auditoria/${file}`, readFileSync(`${AUDIT_DIR}/${file}`, 'utf8'))
  }

  for (const [slug, guide] of readGuides()) files.set(`${slug}.md`, guideMarkdown(guide))

  for (const { block, markdown } of readBlocks()) files.set(`blocos/${block.slug}.md`, markdown)

  const sources = readAll(docs)
  const names = new Set(docs.map((doc) => doc.name))

  for (const doc of docs) {
    const parent = findParent(doc.name, names)
    const owner = parent ? docs.find((item) => item.name === parent) : undefined

    files.set(
      `componentes/${doc.slug}.md`,
      owner
        ? partNote(doc.name, { name: owner.name, slug: owner.slug })
        : buildMarkdown(doc, docs, sources),
    )
  }

  files.set('llms.txt', indexForAgents(docs))
  files.set('llms-full.txt', fullForAgents(docs, files))

  return files
}
