---
name: rivocode-ui
description: Constrói telas React com o design system @rivocode/ui da RivoCode. Use ao criar ou alterar qualquer interface deste projeto - montar layout de página, escolher entre componentes parecidos, aplicar tema, densidade ou cor de cliente, escrever formulário, tabela ou gráfico. Traz o contrato da biblioteca, as decisões de design que os tokens carregam e o endereço da documentação de cada peça.
---

# Construir UI com o @rivocode/ui

Biblioteca white-label da RivoCode, sobre a Base UI. **Nenhum componente conhece
a cor da marca**: ele pede um papel semântico e o tema responde. É isso que
deixa a mesma peça servir a RivoCode num projeto e outro cliente no seguinte.

## Onde procurar o quê

Leia o arquivo que o trabalho pedir, e só ele.

| Trabalho | Arquivo |
|---|---|
| Montar a página, decidir colunas, espaçamento, responsivo | [reference/layout.md](reference/layout.md) |
| Escolher cor, tom de texto, tipografia, profundidade, foco, ícone | [reference/design.md](reference/design.md) |
| Escolher entre duas peças parecidas | [reference/components.md](reference/components.md) |
| Nome acessível, alvo, foco, teclado, ordem de títulos | [reference/a11y.md](reference/a11y.md) |
| Formulário com validação | [reference/forms.md](reference/forms.md) |
| Gráfico e número de painel | [reference/charts.md](reference/charts.md) |
| Vestir com a cor de outro cliente | [reference/theming.md](reference/theming.md) |
| Tela React Native com o ui-native | [reference/native.md](reference/native.md) |

## Antes de escrever a primeira linha

1. **Confira se a peça já existe.** São 67, e o catálogo cobre quase tudo que
   uma tela de produto pede. Escrever um `<div>` com borda no lugar de um
   `Card`, ou um `<select>` nativo no lugar do `Select`, quebra o tema e a
   acessibilidade de uma vez. Índice em
   <https://ds.rivocode.com.br/llms.txt>.

2. **Leia o documento da peça antes de usá-la**, em
   `https://ds.rivocode.com.br/componentes/<nome-em-kebab>.md`. Traz a
   importação, exemplos que rodam, a tabela de props e as partes que a compõem.
   `ToggleGroup` mora em `/componentes/toggle-group.md`.

3. **Nunca invente prop.** Se o documento não a lista, ela não existe. Um chute
   falha no `tsc` na melhor das hipóteses, e passa despercebido como atributo
   solto no DOM na pior.

## O Provider, uma vez, na raiz

Sem ele nada tem estilo, e `Dialog`, `Menu`, `Select`, `Tooltip` e os avisos
lançam erro, porque leem o contexto dele.

```tsx
import { RivoProvider } from '@rivocode/ui'

export function App() {
  return (
    <RivoProvider theme="rivocode-dark" density="comfortable">
      <InvoiceScreen />
    </RivoProvider>
  )
}
```

- `theme`: `rivocode-dark` (padrão), `rivocode-light` ou `system`.
- `density`: `comfortable` (padrão) ou `compact`, para tela de operação.
- `scope`: `global` veste a página; `local` veste só aquela árvore e pinta o
  fundo dela. Em preview e cartão isolado use `local`, senão o conteúdo sai
  claro sobre claro.
- `toastPosition`: em qual dos seis cantos o aviso aparece. Padrão
  `bottom-right`.

O Provider já monta por dentro o provedor de dica, a fiação de aviso e um
container de portal que leva o tema junto. **Não monte nenhum deles à mão.**

O CSS entra uma vez, no arquivo de estilo do projeto:

```css
@import "tailwindcss";
@import "@rivocode/ui/preset";

@source '../node_modules/@rivocode/ui/dist';
```

A linha `@source` não é opcional: sem ela o Tailwind não varre os componentes
da biblioteca, não gera as classes que eles usam, e a tela aparece sem estilo,
sem erro e sem pista. O plugin do Tailwind também precisa estar na lista de
plugins do `vite.config.ts`, ou o resultado é o mesmo silêncio.

## O vocabulário de classes

Escreva layout com as mesmas classes que os componentes usam.

**Nunca escreva cor literal nem `z-index` numérico.** O `check` do repositório
da biblioteca falha nisso, e no seu projeto o efeito é pior: a peça para de
responder ao tema do cliente.

| Família | Classes |
|---|---|
| Superfície | `bg-bg`, `bg-surface`, `bg-surface-raised`, `bg-overlay` |
| Texto | `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-fg-disabled` |
| Acento | `bg-accent`, `text-accent-fg`, `text-accent-text`, `bg-accent-subtle` |
| Linha e foco | `border-border`, `border-border-strong`, `ring-ring` |
| Estado | `bg-success`, `text-success-text`, `bg-danger-subtle`, e o mesmo para `warning` e `info` |
| Seleção e carga | `bg-selected`, `bg-skeleton` |
| Forma | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-pill` |
| Tipografia | `text-xs` a `text-3xl`, `font-sans`, `font-display`, `font-mono` |
| Sombra | `shadow-1`, `shadow-2`, `shadow-3` |
| Empilhamento | `z-[var(--rc-z-dialog)]`, e os pares `dropdown`, `overlay`, `popover`, `toast`, `tooltip` |

**Preencher e escrever texto são tokens diferentes.** `bg-danger` preenche e
recebe `text-danger-fg` por cima; `text-danger-text` é o vermelho que se lê
sobre o fundo da página. Nenhuma cor serve para as duas funções.

**Altura de controle vem da densidade**, nunca cravada:
`h-[var(--rc-control-md)]`, com `sm` e `lg` disponíveis. Cravar `h-10` quebra a
densidade compacta.

## Estreito primeiro

Todo componente decide o comportamento estreito antes do largo, e o seu layout
deve fazer o mesmo. O `Sheet` encosta embaixo no celular, a coluna com
`hideOnMobile` some, a fila de abas rola de lado em vez de quebrar linha.

Escreva a versão estreita e acrescente `sm:` e `lg:` por cima, nunca o
contrário.

Quando a decisão não couber em classe utilitária, leia o mesmo corte que os
componentes leem, em vez de escrever `640` de novo:

```tsx
import { useMobile } from '@rivocode/ui'

const isMobile = useMobile()
```

Dentro de um `SidebarProvider`, use `useSidebar().isMobile`, que é o mesmo valor
sem um segundo assinante da media query. Os dois devolvem `false` no servidor.

Não ligue o comportamento de celular da `Sidebar` na mão: abaixo de 640px ela já
vira folha, já começa fechada e já se fecha ao escolher um item.

## Dinheiro sai abreviado

`currencyShort` em indicador, tabela, eixo, legenda e dica: `R$ 12,4K`. O
`currency`, por extenso, fica para onde o centavo é o assunto, como o valor que
a pessoa confirma antes de emitir e o comprovante depois.

Nunca digite o valor já abreviado como texto. Escrever `R$ 12,4K` na mão mostra
o resultado e esconde o mecanismo, e quebra na primeira mudança de dado.

## O que nunca fazer

- Cor literal em `className` ou em `style`. Sempre token.
- `z-index` numérico. Sempre `z-[var(--rc-z-…)]`.
- Altura cravada em controle. Sempre `var(--rc-control-…)`.
- Montar `TooltipProvider`, `ToastViewport` ou container de portal à mão. O
  Provider já fez.
- Usar `Toast` para o que precisa continuar visível, ou `Dialog` para o que não
  pode ser dispensado clicando fora.
- Inventar prop sem conferir o `.md` da peça.
- Escrever o rótulo de `Checkbox`, `Radio` ou `Switch` num `<span>` ao lado.
  Passe como filho e eles se embrulham num `<label>` sozinhos.
- Repetir o mesmo `id` de `ChartAreaGradient` em dois gráficos da mesma página:
  `id` de SVG é global, e um pinta com o gradiente do outro.
- Deixar item de grid ou de flex sem `min-w-0` quando há conteúdo largo dentro.
- `outline-none` sem repor `focus-visible:ring-2 focus-visible:ring-ring`.
- Usar `placeholder` como se fosse rótulo. Ele some ao digitar, e vários
  leitores de tela não o anunciam: o campo fica sem nome.
- Botão só com ícone sem `aria-label`.
- Texto de interface em inglês. **Código em inglês, conteúdo em PT-BR.** Termo
  do ecossistema não se traduz: é "agents", não "agentes".

## Endereços

| O quê | Onde |
|---|---|
| Índice de tudo | <https://ds.rivocode.com.br/llms.txt> |
| Contrato completo | <https://ds.rivocode.com.br/convencoes.md> |
| Uma peça | `https://ds.rivocode.com.br/componentes/<nome-em-kebab>.md` |
| Um guia | `https://ds.rivocode.com.br/<slug>.md`, como `/temas.md` |
| Um sistema inteiro, montado | <https://ds.rivocode.com.br/demonstracao> |
