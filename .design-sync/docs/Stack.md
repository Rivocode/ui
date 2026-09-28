---
category: Estrutura
---

# Stack

Empilha os filhos numa direção, com o vão entre eles saído da escala da casa.

```tsx
<Stack gap="lg">
  <Field name="razao">…</Field>
  <Field name="cnpj">…</Field>
  <Stack direction="row" gap="sm" justify="end">
    <Button variant="secondary">Cancelar</Button>
    <Button>Salvar</Button>
  </Stack>
</Stack>
```

`direction` escolhe o eixo: `column`, o padrão, põe um embaixo do outro; `row`
põe lado a lado. `align` alinha no eixo cruzado e `justify` distribui no eixo
principal, com `between` empurrando o primeiro e o último para as pontas. `wrap`
deixa a linha quebrar quando os filhos não cabem, que é o caso de uma fileira
de selos ou de fichas.

## O vão é uma escala, e ela acompanha a densidade

`gap` não aceita pixel. São cinco passos, e mais `none`:

| Passo | Confortável | Compacta |
| ----- | ----------- | -------- |
| `xs`  | 4px         | 4px      |
| `sm`  | 8px         | 6px      |
| `md`  | 12px        | 8px      |
| `lg`  | 16px        | 12px     |
| `xl`  | 24px        | 16px     |

O padrão é `md`. Os passos saem dos tokens `--rc-gap-*`, que a densidade
reescreve junto com a altura de controle: a tela que passa para
`density="compact"` aperta também o vão entre os blocos, e não só os controles
dentro deles. Um `gap-3` escrito à mão fica com 12px nas duas.

`xs` não encolhe. Abaixo de 4px, selo encostado em selo vira uma palavra só.

## Outro elemento

`render` troca o elemento sem mudar o arranjo. Uma lista continua lista para o
leitor de tela, que anuncia quantos itens ela tem:

```tsx
<Stack render={<ul />} gap="sm">
  <li>Nota 4813, autorizada</li>
  <li>Nota 4814, autorizada</li>
</Stack>
```

## Quando não usar

- **Quando uma `div` com classe basta.** Dois elementos que se alinham uma vez,
  num lugar só, não pedem peça: `flex items-center gap-2` diz a mesma coisa. O
  `Stack` se paga onde o vão precisa seguir a densidade, ou onde a mesma
  arrumação se repete tela a tela e cada uma escolheria um número diferente.
- **Grade em duas dimensões.** Cartões que se arrumam em colunas e linhas são
  `Grid`, com `columns` ou `minItemWidth`. Um `Stack` com `wrap` quebra a linha,
  mas não alinha as colunas de uma linha com as da outra.
- **Moldura e respiro interno.** O `Stack` não desenha borda nem fundo. O bloco
  com moldura é o `Card`, e o topo da tela, com título e ações, é o
  `PageHeader`.
- **Duas áreas que a pessoa redimensiona.** Lista e detalhe com divisória que se
  arrasta são o `Splitter`.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Stack` - mesmas props, menos `render`; o vão é a escala confortável, porque no toque não há densidade compacta. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
