import { Badge, Button } from '@rivocode/ui'
import { ArrowRight, Bot, Check, Copy, Layers, Palette, Ruler, Smartphone, Sparkles } from 'lucide-react'
import { Suspense, lazy, useEffect, useState } from 'react'
import { CodeRiver } from '@/components/code-river'
import { ENTRIES, FAMILIES, WITH_EXAMPLE, entriesOfFamily } from '@/catalog'
import { GUIDES } from '@/guides'
import { NATIVE_PIECES } from '@/native-parity'
import { Logo } from '@/components/logo'
import { linkTo, type Route } from '@/routes'
import { version } from '../../../../package.json'

/*
 * A vitrine chega depois do resto da capa.
 *
 * Ela monta uma tela inteira - DataTable, Select, abas e um grafico -, e o
 * Recharts sozinho passa de 250 KB. Enquanto ela era import estatico, esse peso
 * ficava entre quem abre o site e o titulo da pagina, que e o que decide se a
 * pessoa fica. O lugar dela fica reservado para a rolagem nao pular quando ela
 * chega.
 */
const Showcase = lazy(() => import('@/components/showcase').then((mod) => ({ default: mod.Showcase })))

/* ---------------------------------------------------------------------------
 * A capa
 *
 * Quem chega aqui esta decidindo se adota a biblioteca, e decide olhando, e nao
 * lendo. Por isso a tela que roda vem antes da prosa, cada uma das tres ideias
 * que fazem a biblioteca diferente ganha figura, e o catalogo fica no fim, e
 * nao no comeco.
 * ------------------------------------------------------------------------- */

/*
 * O único número desta página escrito à mão.
 *
 * Os outros três da vitrine saem do catálogo enquanto o site é construído. Este
 * não pode: a contagem só existe depois de a suíte rodar, e cobrar a suíte
 * inteira do build da Vercel (minutos, a cada push) para imprimir um dígito é
 * caro demais pelo que se ganha.
 *
 * Então ele fica versionado aqui, e quem o mantém honesto é `bun run
 * check:testes`, que recalcula em segundos e falha dizendo qual número
 * regravar. Sem essa guarda o dígito envelhece calado, como envelheceu duas
 * vezes: parado em 292, e depois em 348 enquanto a suíte chegava a 552.
 *
 * Conta a suíte da raiz inteira (`test/` e `native/test/`), que é o que o
 * rótulo ao lado promete.
 */
const TESTS = 1184

const INSTALL = 'npm install @rivocode/ui'

const SKILL_CMD = 'npx rivocode-ui skill'

const SKILL_PEEK = `| Situação                    | Peça certa    |
| --------------------------- | ------------- |
| Aviso que fica na tela      | Alert         |
| Confirmação destrutiva      | AlertDialog   |
| Poucas opções fixas         | Select        |
| Lista longa, ou do servidor | Combobox      |
| Liga agora, sem confirmar   | Switch        |

## O que nunca fazer

- Cor literal em className ou style. Sempre token.
- z-index numérico. Sempre z-[var(--rc-z-*)].
- Altura cravada em controle.`

const BOOTSTRAP = `import '@rivocode/ui/styles.css'
import { RivoProvider } from '@rivocode/ui'

export function App() {
  return (
    <RivoProvider theme="rivocode-dark" density="comfortable">
      <InvoiceScreen />
    </RivoProvider>
  )
}`

const AGENT_FILE = `# DataTable

Listagem com os quatro finais de uma
consulta: carregando, deu certo, deu
errado, veio vazia.

## Importação

import { DataTable } from '@rivocode/ui'

## Props

| Prop      | Tipo     | Obrigatória |
| --------- | -------- | ----------- |
| data      | Row[]  | sim         |
| columns   | Column[] | sim         |
| isLoading | boolean  |, |`

function CopyLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true))}
      className="group flex w-full items-center gap-3 rounded-lg border border-border bg-surface/70 px-4 py-3 text-left backdrop-blur-sm transition-colors hover:border-accent"
    >
      <span className="font-mono text-fg-subtle select-none">$</span>
      <code className="flex-1 truncate font-mono text-sm text-fg">{text}</code>
      <span className="text-fg-subtle transition-colors group-hover:text-fg">
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </span>
      <span className="sr-only">{copied ? 'Copiado' : 'Copiar'}</span>
    </button>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl text-fg">{value}</p>
      <p className="mt-1 text-sm text-fg-subtle">{label}</p>
    </div>
  )
}

function Argument({
  icon,
  eyebrow,
  title,
  children,
  figure,
  reverse,
}: {
  icon: React.ReactNode
  eyebrow: string
  title: string
  children: React.ReactNode
  figure: React.ReactNode
  reverse?: boolean
}) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      {/* `min-w-0` nas duas colunas: item de grid nao encolhe abaixo do
          proprio `min-content`, e a figura carrega um `<pre>` de codigo. Sem
          isto o `overflow-x-auto` de dentro dele nunca entra em acao, a coluna
          cresce, e a pagina inteira ganha rolagem lateral no celular. */}
      <div className={`min-w-0 ${reverse ? 'lg:order-2' : ''}`}>
        <p className="flex items-center gap-2 font-mono text-xs tracking-widest text-accent-text uppercase">
          {icon}
          {eyebrow}
        </p>
        {/* `h2`: cada bloco e uma secao da capa, e vinha logo depois do `h1`,
            pulando um nivel para quem navega por titulo. */}
        <h2 className="mt-3 font-display text-2xl text-fg sm:text-3xl">{title}</h2>
        <div className="mt-4 space-y-3 text-fg-muted">{children}</div>
      </div>

      <div className={`min-w-0 ${reverse ? 'lg:order-1' : ''}`}>{figure}</div>
    </div>
  )
}

function TokenLayers() {
  const layers = [
    { code: '--rc-p-lime-400', hint: 'a cor crua, sem opinião' },
    { code: '--color-accent', hint: 'o papel que ela cumpre' },
    { code: '[data-rc-theme]', hint: 'quem decide, por cliente' },
  ]

  return (
    <div className="space-y-2">
      {layers.map((layer, index) => (
        <div
          key={layer.code}
          className="flex items-center gap-4 rounded-lg border border-border bg-surface/70 p-4 backdrop-blur-sm"
          style={{ marginLeft: `${index * 1.5}rem` }}
        >
          <span className="font-mono text-[0.7rem] tracking-widest text-fg-subtle">
            {index + 1}
          </span>
          <div className="min-w-0">
            <code className="block truncate font-mono text-sm text-accent-text">{layer.code}</code>
            <span className="text-xs text-fg-subtle">{layer.hint}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function CodeCard({ label, children }: { label: string; children: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface/70 backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Bot size={13} className="text-fg-subtle" />
        <code className="font-mono text-xs text-fg-subtle">{label}</code>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-fg-muted">
        <code>{children}</code>
      </pre>
    </div>
  )
}

/**
 * A mesma escolha nos dois mundos, lado a lado.
 *
 * A figura existe para dizer, num golpe de vista, o que a prosa promete e o
 * que ela nao promete. O `Select` e o exemplo mais honesto que o catalogo tem:
 * as props de dado sao as mesmas nos dois - `items`, `value`, `onValueChange`
 * -, e a composicao inteira desaparece, porque no celular a lista abre numa
 * folha de baixo e nao ha gatilho para vestir. Quem le so a coluna da esquerda
 * imagina que a tela atravessa; e ela nao atravessa.
 */
function BothWorlds() {
  const worlds = [
    {
      pkg: '@rivocode/ui',
      code: `<Select items={UFS} value={uf} onValueChange={setUf}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {UFS.map((item) => (
      <SelectItem key={item.value} value={item.value}>
        {item.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>`,
    },
    {
      pkg: '@rivocode/ui-native',
      code: `<Select
  items={UFS}
  value={uf}
  onValueChange={setUf}
  label="UF"
/>`,
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {worlds.map((world) => (
        <div
          key={world.pkg}
          className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface/70 backdrop-blur-sm"
        >
          <div className="border-b border-border px-4 py-2.5">
            <code className="font-mono text-xs text-fg-subtle">{world.pkg}</code>
          </div>
          {/* `overflow-x-auto` com `min-w-0` na coluna: sem os dois o bloco
              mais largo estica o grid e a capa inteira ganha rolagem lateral
              no celular, que e o defeito que esta secao estaria justamente
              dizendo que sabemos evitar. */}
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-fg-muted">
            <code>{world.code}</code>
          </pre>
        </div>
      ))}
    </div>
  )
}

/**
 * As duas densidades ao mesmo tempo, com a altura vinda do token. Cravar um
 * valor aqui nao quebra nada: a figura continua bonita e passa a mentir, porque
 * as duas caixas ficam iguais e a secao esta justamente dizendo que mudam.
 */
function DensityFigure() {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface/70 p-6 backdrop-blur-sm">
      {(['comfortable', 'compact'] as const).map((density) => (
        <div key={density}>
          <p className="mb-2 font-mono text-xs text-fg-subtle">density="{density}"</p>
          <div
            data-rc-density={density}
            className="flex items-center gap-2 rounded-md border border-border bg-bg p-3"
          >
            <span
              className="inline-flex items-center rounded-md bg-accent px-3 font-sans text-sm text-accent-fg"
              style={{ height: 'var(--rc-control-md)' }}
            >
              Emitir nota
            </span>
            <span
              className="inline-flex items-center rounded-md border border-border px-3 font-sans text-sm text-fg"
              style={{ height: 'var(--rc-control-md)' }}
            >
              Cancelar
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function Home({ navigate }: { navigate: (route: Route) => void }) {
  const toInstall = linkTo({ kind: 'guide', slug: 'instalacao' }, navigate)
  const toDemo = linkTo({ kind: 'demo' }, navigate)

  return (
    <div className="relative">
      <CodeRiver />

      {/* O brilho atras do titulo. O rio sozinho e textura; e isto que da ao
          topo da pagina um centro de gravidade. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] opacity-70"
        style={{
          background:
            'radial-gradient(60rem 28rem at 45% -6%, color-mix(in oklab, var(--rc-accent) 16%, transparent), transparent 70%)',
        }}
      />

      <section className="relative mx-auto max-w-6xl px-6 pt-20 pb-14 sm:pt-28">
        <Logo className="h-7 w-auto text-accent" />

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Badge tone="accent">v{version} no npm</Badge>
          <span className="font-mono text-xs text-fg-subtle">
            Base UI · Tailwind 4 · React 19 · React Native
          </span>
        </div>

        <h1 className="animate-rise mt-5 max-w-4xl font-display text-4xl leading-[1.05] tracking-display text-fg sm:text-6xl">
          O design system da <span className="text-accent-text">RivoCode</span>, documentado por
          dentro.
        </h1>

        <p className="animate-rise mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted [animation-delay:80ms]">
          {ENTRIES.length} peças sobre a Base UI, com tokens em três camadas, dois temas e duas
          densidades. Nenhum componente conhece a cor da marca: ele pede um papel, e o tema
          responde.
        </p>

        <div className="animate-rise mt-8 flex flex-wrap items-center gap-3 [animation-delay:160ms]">
          {/* O único glow da página: o CTA é o que a lanterna existe para
              iluminar. Um segundo brilho já seria feira. */}
          <Button size="lg" shape="pill" className="shadow-glow" {...toInstall} render={<a />}>
            Começar a usar
            <ArrowRight size={16} />
          </Button>
          <Button size="lg" shape="pill" variant="outline" {...toDemo} render={<a />}>
            Ver um sistema pronto
          </Button>
        </div>

        <div className="animate-rise mt-8 max-w-md [animation-delay:240ms]">
          <CopyLine text={INSTALL} />
        </div>

        <div className="animate-fade mt-14 grid grid-cols-2 gap-8 sm:grid-cols-4 [animation-delay:320ms]">
          <Stat value={String(ENTRIES.length)} label="peças no catálogo" />
          <Stat value={String(WITH_EXAMPLE)} label="com exemplo que roda" />
          <Stat value={String(TESTS)} label="testes verdes, web e nativo" />
          <Stat value={String(GUIDES.length)} label="guias de uso" />
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <Suspense fallback={<div className="min-h-[34rem] rounded-lg border border-border bg-surface" />}>
          <Showcase />
        </Suspense>
      </section>

      <section className="relative mx-auto max-w-6xl space-y-24 px-6 pb-24">
        <Argument
          icon={<Palette size={14} />}
          eyebrow="Tokens"
          title="Trocar de cliente é trocar uma camada"
          figure={<TokenLayers />}
        >
          <p>
            A paleta guarda a cor crua. O papel diz para que ela serve. O tema decide qual cor
            responde a cada papel.
          </p>
          <p>
            Componente nenhum atravessa essas camadas: o{' '}
            <code className="font-mono text-accent-text">bun run check</code> falha se alguém
            escrever uma cor literal, e quarenta pares de contraste são medidos a cada commit.
          </p>
        </Argument>

        <Argument
          icon={<Ruler size={14} />}
          eyebrow="Densidade"
          title="A mesma tela em duas alturas, sem dois catálogos"
          reverse
          figure={<DensityFigure />}
        >
          <p>
            Numa tela de operação cabe mais linha na mesma altura. Num cadastro que se preenche uma
            vez por mês, não.
          </p>
          <p>
            É um atributo no Provider, e a altura de todo controle acompanha. Não existe um segundo
            catálogo de peças compactas para manter em dia.
          </p>
        </Argument>

        <Argument
          icon={<Smartphone size={14} />}
          eyebrow="React Native"
          title="A mesma peça no celular, sem um segundo catálogo"
          figure={<BothWorlds />}
        >
          <p>
            O <code className="font-mono text-accent-text">@rivocode/ui-native</code> traz{' '}
            {NATIVE_PIECES} das {ENTRIES.length} peças para o React Native, com os mesmos tokens,
            os mesmos dois temas e o mesmo vocabulário de classes: o NativeWind lê as classes que
            você já escreve aqui.
          </p>
          <p>
            O que atravessa é o vocabulário, o token e a escolha da peça.{' '}
            <strong className="font-medium text-fg">O JSX se reescreve</strong>: no toque tudo é
            controlado, a lista vem por <code className="font-mono text-accent-text">items</code> em
            vez de composição, e as peças que não portam não portam por decisão: barra lateral,
            tabela e dica de ponteiro são idioma de mesa, e o celular tem o dele.
          </p>
          <p>
            <a
              {...linkTo({ kind: 'guide', slug: 'react-native' }, navigate)}
              className="text-accent-text underline decoration-border underline-offset-4 transition-colors hover:decoration-accent"
            >
              O guia do React Native
            </a>{' '}
            traz a tabela peça a peça: o que traduz, o que está na fila e o que nunca vai portar.
          </p>
        </Argument>

        <Argument
          icon={<Bot size={14} />}
          eyebrow="Agents"
          title="A mesma documentação, em markdown cru"
          figure={<CodeCard label="/componentes/data-table.md">{AGENT_FILE}</CodeCard>}
        >
          <p>
            Boa parte do código que usa esta biblioteca hoje é escrita com um agent ao lado. Um site
            que só serve HTML obriga o agent a adivinhar a API pelo nome, e ele adivinha com
            confiança.
          </p>
          <p>
            Toda página tem o endereço cru em{' '}
            <code className="font-mono text-accent-text">.md</code>, com importação, exemplos e
            tabela de props. O índice fica em{' '}
            <a href="/llms.txt" className="text-accent-text underline underline-offset-2">
              /llms.txt
            </a>
            .
          </p>
        </Argument>

        <Argument
          icon={<Sparkles size={14} />}
          eyebrow="Skill"
          title="Um comando, e o agente aprende a biblioteca"
          figure={
            <div className="space-y-3">
              <CopyLine text={SKILL_CMD} />
              <CodeCard label=".claude/skills/rivocode-ui/SKILL.md">{SKILL_PEEK}</CodeCard>
            </div>
          }
        >
          <p>
            Colar o contrato no prompt funciona uma vez. Na segunda conversa ele não está lá, e o
            agent volta a adivinhar a API pelo nome.
          </p>
          <p>
            A skill fica instalada, e leva junto a tabela de escolha entre as peças parecidas:{' '}
            <code className="font-mono text-accent-text">Alert</code> contra{' '}
            <code className="font-mono text-accent-text">Toast</code>,{' '}
            <code className="font-mono text-accent-text">Select</code> contra{' '}
            <code className="font-mono text-accent-text">Combobox</code>, com o porquê de cada
            linha.
          </p>
        </Argument>

        <Argument
          icon={<Layers size={14} />}
          eyebrow="Base UI"
          title="O comportamento não é nosso, e essa é a vantagem"
          reverse
          figure={
            <div className="overflow-hidden rounded-lg border border-border bg-surface/70 backdrop-blur-sm">
              <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-fg">
                <code>{BOOTSTRAP}</code>
              </pre>
            </div>
          }
        >
          <p>
            Foco, teclado, portal, leitor de tela e os casos de borda vêm da Base UI, que trata
            disso em tempo integral.
          </p>
          <p>
            O que a biblioteca acrescenta é o desenho, e a decisão de quando cada peça serve. Duas
            linhas de CSS e um Provider, e a tela começa.
          </p>
        </Argument>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-28">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl text-fg">O catálogo</h2>
          <p className="text-fg-muted">Por família, na ordem de quem monta uma tela.</p>
        </div>

        <div className="mt-8 space-y-8">
          {FAMILIES.map((family) => (
            <div key={family}>
              <h3 className="flex items-baseline gap-2 font-mono text-xs tracking-widest text-fg-subtle uppercase">
                {family}
                <span className="text-fg-subtle">{entriesOfFamily(family).length}</span>
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {entriesOfFamily(family).map((entry) => (
                  <li key={entry.name}>
                    <a
                      {...linkTo({ kind: 'component', slug: entry.slug }, navigate)}
                      className="inline-flex rounded-md border border-border bg-surface/70 px-3 py-1.5 font-mono text-sm text-fg-muted backdrop-blur-sm transition-colors hover:border-accent hover:text-fg"
                    >
                      {entry.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-28">
        <div className="rounded-xl border border-border bg-surface/70 p-8 text-center backdrop-blur-sm sm:p-12">
          <h2 className="font-display text-3xl text-fg">Comece pela instalação</h2>
          <p className="mx-auto mt-3 max-w-xl text-fg-muted">
            Um comando, as duas linhas de CSS e o Provider. Depois disso é escrever tela.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button size="lg" shape="pill" {...toInstall} render={<a />}>
              Instalação
              <ArrowRight size={16} />
            </Button>
            <Button size="lg" shape="pill" variant="outline" {...toDemo} render={<a />}>
              Demonstração
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
