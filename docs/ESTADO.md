# Onde paramos

Atualizado em 24/08/2026. Leia isto antes de continuar o design system.

## O que existe hoje

| Peca | Onde | Estado |
|---|---|---|
| Biblioteca `@rivocode/ui` | `Rivocode/ui` (este repo), privado | 19 componentes, 108 testes, tudo verde |
| Sync com o claude.ai/design | projeto `RivoCode`, `ee82ac5d-bfc0-4f2f-959a-5e371dddee8b` | 52 componentes, **atras dos 4 novos** |
| Migracao da landing | branch `design-system/migracao-landing` no repo `rivocode.com` | Pronta, **nao publicada** |
| Site de documentacao | nao existe | Pendente |

**Catalogo atual:** Button, Card, Badge, Field, Input, Checkbox, Select, Tabs,
Table, Menu, Dialog, Popover, Tooltip, Alert, Skeleton, EmptyState, Calendar,
DatePicker, DateRangePicker, mais o `RivoProvider` e o `useToast()`.

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

Abaixo esta a analise de cada um.

### Seletor de data — **feito**

**A Base UI nao tem seletor de data.** Este e o primeiro componente que precisa
de outra fundacao, e e o mais dificil do catalogo: locale, teclado, intervalo,
mascara de digitacao e fuso sao todos armadilhas conhecidas.

Saiu assim: `Popover` primeiro, depois `Calendar` sobre a `react-day-picker`
10, e sobre ele o `DatePicker` e o `DateRangePicker`.

Nenhuma folha de estilo da react-day-picker e importada: o desenho todo vem
dos nossos tokens pelo `classNames`. Ela entra so como motor, e trocar de
motor um dia nao mexe no visual.

O `DatePicker` digita e escolhe: mascara `dd/mm/aaaa`, texto pela metade nao
vira data, e ao sair do campo o que nao virou data volta para a ultima valida.
Com `name`, sai um campo escondido em `aaaa-mm-dd` para o formulario nativo.

O `DateRangePicker` nao digita, so escolhe, e o gatilho mostra
`03/03/2026 – 12/03/2026`. Mascara de intervalo pede duas datas num campo so,
e o custo de acertar teclado, colagem e ordem invertida nao se paga.

O formato mora em `src/lib/data.ts`, com `formatarData`, `lerData` e
`mascararData` exportados. Sao 30 linhas no lugar de uma dependencia de data
na API publica.

**Falta:** o `DatePicker` ainda nao conversa com o nosso `Field`, entao label,
descricao e erro nao se ligam sozinhos. Isso entra junto com a onda de
formularios, que e onde o assunto vive.

### Formularios com Zod e React Hook Form — **nao comecado**

Recomendacao: **nao embutir nos primitivos**. Sai como subcaminho
`@rivocode/ui/form`, com `react-hook-form` e `zod` como dependencias de par.
Projeto que nao usa RHF nao deve ser obrigado a carrega-lo.

Pecas: `Form` (contexto), `FormField` (liga o `Controller` do RHF ao nosso
`Field`), e a mensagem de erro lendo o estado do RHF em vez de ser passada a
mao. O `Field` da Base UI ja aceita `invalid`, `touched` e `dirty`, entao a
ponte e curta.

O resolver de Zod vem de `@hookform/resolvers/zod`.

### React Query — **nao comecado**

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
2. ~~`Popover`~~ feito
3. ~~`Calendar`, `DatePicker` e `DateRangePicker`~~ feito
4. `@rivocode/ui/form` com RHF e Zod, e a ponte do `DatePicker` com o `Field`
5. `DataTable` com os estados de consulta
6. Site de documentacao
