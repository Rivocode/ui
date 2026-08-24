# Onde paramos

Atualizado em 24/08/2026. Leia isto antes de continuar o design system.

## O que existe hoje

| Peca | Onde | Estado |
|---|---|---|
| Biblioteca `@rivocode/ui` | `Rivocode/ui` (este repo), privado | 15 componentes, 84 testes, tudo verde |
| Sync com o claude.ai/design | projeto `RivoCode`, `ee82ac5d-bfc0-4f2f-959a-5e371dddee8b` | 52 componentes, zero avisos |
| Migracao da landing | branch `design-system/migracao-landing` no repo `rivocode.com` | Pronta, **nao publicada** |
| Site de documentacao | nao existe | Pendente |

**Catalogo atual:** Button, Card, Badge, Field, Input, Checkbox, Select, Tabs,
Table, Menu, Dialog, Tooltip, Alert, Skeleton, EmptyState, mais o
`RivoProvider` e o `useToast()`.

**Fundacao:** tokens em tres camadas, temas `rivocode-dark` e `rivocode-light`,
densidade confortavel e compacta, guarda de cor literal e guarda de contraste
com 40 pares medidos.

## O que esta travado, e em quem

**A publicacao do pacote.** O site consome por `bun link`, que funciona so na
maquina do Emanuel. Sem publicar, a migracao da landing nao pode subir e nenhum
projeto de cliente pode instalar.

Depende de um token do GitHub com `write:packages`, que so o Emanuel pode criar
em `github.com/settings/tokens`. Depois disso:

```sh
bun publish            # neste repo
# e no repo do site, trocar o bun link por dependencia de verdade
```

## O que o Emanuel pediu em seguida

Ele quer "deixar bem redondo": seletor de data, formularios com Zod e React
Hook Form, e integracao com React Query.

Abaixo esta a analise de cada um. **Nada disso foi comecado.**

### Seletor de data

**A Base UI nao tem seletor de data.** Este e o primeiro componente que precisa
de outra fundacao, e e o mais dificil do catalogo: locale, teclado, intervalo,
mascara de digitacao e fuso sao todos armadilhas conhecidas.

Recomendacao: calendario com `react-day-picker` (a opcao mais madura e a mais
usada com Tailwind), dentro do `Popover` da Base UI, com o nosso `Input` como
gatilho. Precisa cobrir: data unica, intervalo, digitacao com mascara em
`dd/mm/aaaa`, e `pt-BR` como padrao.

Falta antes: **nao temos `Popover`**, so `Tooltip` e `Menu`. Ele vem junto.

### Formularios com Zod e React Hook Form

Recomendacao: **nao embutir nos primitivos**. Sai como subcaminho
`@rivocode/ui/form`, com `react-hook-form` e `zod` como dependencias de par.
Projeto que nao usa RHF nao deve ser obrigado a carrega-lo.

Pecas: `Form` (contexto), `FormField` (liga o `Controller` do RHF ao nosso
`Field`), e a mensagem de erro lendo o estado do RHF em vez de ser passada a
mao. O `Field` da Base UI ja aceita `invalid`, `touched` e `dirty`, entao a
ponte e curta.

O resolver de Zod vem de `@hookform/resolvers/zod`.

### React Query

Aqui eu discordo em parte, e vale discutir antes de construir.

React Query e arquitetura de aplicacao, nao de design. Um design system que
depende dele obriga todo projeto de cliente a usa-lo, e amarra a biblioteca a
decisoes que nao sao dela.

O que **e** trabalho do design system e a **apresentacao dos estados** que uma
consulta produz, e isso ja existe: `Skeleton` para carregando, `Alert` para
erro, `EmptyState` para vazio. O que falta e a peca que amarra os tres:

```tsx
<DataTable
  data={query.data}
  isLoading={query.isLoading}
  isError={query.isError}
  onRetry={query.refetch}
  columns={...}
/>
```

Isso da a integracao que ele quer, sem a biblioteca conhecer o React Query.
Funciona igual com `fetch` na mao, com SWR ou com server component.

Se depois disso ele ainda quiser acoplamento direto, o lugar e um subcaminho
`@rivocode/ui/query`, opcional e com dependencia de par.

## Como retomar

```sh
cd /Users/emanuelbacalhau/projects/rivocode/ui
bun install
bun run check        # lint, guarda de cor, guarda de contraste, testes
bun run shot         # gera a vitrine em demo/dist/
```

O spec e o plano da fundacao estao em `docs/`. As notas do sync com o
claude.ai/design, incluindo quatro armadilhas que custaram tempo, estao em
`.design-sync/NOTES.md`.

## Ordem sugerida

1. Publicar o pacote e destravar a landing (depende do token)
2. `Popover`, que o seletor de data precisa
3. `DatePicker`
4. `@rivocode/ui/form` com RHF e Zod
5. `DataTable` com os estados de consulta
6. Site de documentacao
