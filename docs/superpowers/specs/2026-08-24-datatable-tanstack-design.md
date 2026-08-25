# DataTable sobre TanStack Table — design

Data: 2026-08-24. Fase 1 do esforço de modernização aprovado em conversa.

## O que muda, numa frase

O `DataTable` ganha ordenação, filtro global, paginação e seleção de linhas,
com `@tanstack/react-table` como motor interno — e a API pública continua a
mesma: colunas + três booleanos, agnóstica de biblioteca de dados.

## O que NÃO muda

- A decisão documentada de não conhecer React Query: entram `data`,
  `isLoading`, `isError`, e funciona igual com fetch na mão, SWR ou server
  component. O TanStack Table é detalhe de implementação; **nenhum tipo dele
  vaza para a API pública**.
- A ordem dos estados: erro vence carregando, vazio só vale depois que a
  consulta voltou.
- Toda a API existente (`rowKey`, `onRowClick`, `empty`, `skeletonRows`,
  `caption`, `hideOnMobile`, `align`). Zero breaking change: consumidor que
  não pedir nada novo renderiza exatamente o que renderiza hoje.

## API nova (tudo opt-in)

### Em `Column<Row>`

| Prop | Tipo | O quê |
|---|---|---|
| `sortable` | `boolean` | Cabeçalho vira botão que alterna asc → desc → sem ordem |
| `value` | `(row) => string \| number \| Date \| null \| undefined` | Valor cru para ordenar e filtrar quando `cell` é JSX ou a chave não é campo direto. Sem ele, `row[key]`. |

### Em `DataTableProps<Row>`

| Prop | Tipo | O quê |
|---|---|---|
| `pageSize` | `number` | Liga paginação client-side. Rodapé com "X–Y de Z" à esquerda e o `Pagination` da casa à direita. Sem a prop, nada de rodapé. |
| `filter` | `string` | Filtro global controlado. O app renderiza o campo de busca que quiser; a tabela só filtra. Compara texto normalizado (caixa e acento ignorados) sobre `value ?? row[key]` de cada coluna. |
| `selectable` | `boolean` | Coluna de checkbox à esquerda. Chaves vêm do `rowKey`. |
| `selected` | `string[]` | Seleção controlada. Opcional: sem ela, estado interno. |
| `onSelectedChange` | `(keys: string[]) => void` | Avisa a cada mudança de seleção. |

Ordenação é client-side e não controlada. Quem ordena no servidor ordena os
dados antes e não marca `sortable` — está documentado no `.md` da peça.

## Comportamentos

- **Cabeçalho ordenável**: `<th aria-sort>` correto; o botão ocupa o header,
  ícone `ChevronsUpDown` apagado quando sem ordem, `ArrowUp`/`ArrowDown` no
  accent quando ativa. Foco visível padrão da casa.
- **Checkbox de seleção**: o do cabeçalho seleciona/limpa a página visível
  (estado `indeterminate` quando parcial — o `Checkbox` da casa já suporta).
  `aria-label` em todos. O guard do `onRowClick` já ignora cliques em
  `input`/`label`, então linha clicável e seleção convivem.
- **Filtro sem resultado**: quando `filter` ativo zera as linhas, uma única
  linha discreta "Nenhum resultado para a busca" — o `EmptyState` de `empty`
  continua reservado para consulta que voltou vazia.
- **Filtro/ordenação resetam a página** para 1 (comportamento padrão do
  motor, mantido de propósito: a página 4 de um resultado que não existe mais
  é uma tela vazia).
- **Paginação**: o `Pagination` da casa é 1-based; o motor é 0-based; a
  conversão fica dentro do DataTable.

## Implementação

- `@tanstack/react-table@^8` entra em `dependencies` (headless, sem CSS,
  ~14 kB min+gz; tree-shakeável).
- `Column<Row>` interna vira `ColumnDef` via `accessorFn` (= `value` ??
  `row[key]`), `id` = `key`, `enableSorting` = `sortable ?? false`.
- `getRowId` = `rowKey`, então seleção sobrevive a reordenação.
- Row models: core sempre; sorted/filtered/pagination sempre presentes (o
  custo é zero quando o estado correspondente está vazio; paginação recebe
  `pageSize` gigante quando a prop não veio, para não paginar).
- Skeleton, erro e vazio continuam fora do motor: o `useReactTable` roda com
  `data ?? []` e os estados especiais retornam antes, como hoje.

## Arquivos tocados

| Arquivo | Mudança |
|---|---|
| `package.json` | dependência nova |
| `src/components/data-table.tsx` | motor + colunas de seleção + rodapé |
| `test/data-table.test.tsx` (novo) | ordenação, filtro, paginação, seleção, e os invariantes velhos |
| `.design-sync/docs/DataTable.md` | props novas, quando usar cada uma |
| `.design-sync/previews/DataTable.tsx` | histórias: Ordenável, Com busca, Com paginação, Com seleção |
| `.claude/skills/rivocode-ui/reference/components.md` | tabela de escolha ganha as capacidades novas |

## Testes

Os invariantes velhos (erro vence carregando; vazio só depois da consulta;
guard do clique na linha) já vivem em `test/onda-c.test.tsx` e continuam
valendo sem edição — prova do zero breaking change. Os novos, em TDD:

1. clicar no header ordena asc, de novo desc, de novo volta à ordem original;
2. `filter` acha com e sem acento, e some com a paginação junto;
3. `pageSize=2` com 5 linhas mostra 2 e o rodapé diz "1–2 de 5";
4. selecionar linha chama `onSelectedChange` com a chave do `rowKey`;
5. checkbox do cabeçalho seleciona a página, não o mundo;
6. coluna sem `sortable` não tem botão nem `aria-sort`.
