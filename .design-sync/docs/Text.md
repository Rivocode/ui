---
category: Tipografia
---

# Text

Parágrafo ou trecho de texto, vestido com os papéis da casa: `size` na escala
de `xs` a `lg`, `tone` entre os papéis de texto do tema, e `weight`.

```tsx
<Text size="sm" tone="muted">Atualizado há 2 minutos.</Text>
```

Sai num `<p>`. O `render` troca o elemento sem mudar o desenho:
`render={<span />}` para o trecho dentro de uma frase, `render={<div />}` para
o bloco que contém outro bloco, que um `<p>` não pode conter.

**Sem `size`, sem `tone` e sem `weight`, o texto herda de quem o cerca.** É o
que faz o trecho funcionar: um valor em negrito dentro de uma frase `sm` fica
`sm`, e fica da cor da frase se não pedir outra. O custo é que o parágrafo
solto também herda, e o corpo da página é o do seu app; passe `size` no
parágrafo de fora.

Os tons são os papéis de texto do tema, e só eles: `neutral` é o texto
corrido, `muted` o secundário, `subtle` a legenda, `accent` o destaque da
marca, e `success`, `warning`, `danger` e `info` são os `-text` de cada
estado, os que se leem sobre o fundo da página. Os de preenchimento
(`bg-danger` e parentes) não entram, porque não têm contraste como texto.

`truncate` corta em uma linha, e `lineClamp` corta depois de 1 a 6 linhas;
quando os dois vêm, `lineClamp` vence. O texto cortado continua inteiro no
DOM: o leitor de tela ouve tudo, e quem vê precisa de um `title` ou de um
`Tooltip` para ler o resto.

## Quando não usar

- **Nome de arquivo, comando ou chave de JSON no meio da frase:** `Code`. Ele
  muda a letra para a de largura fixa e marca o trecho como código; um `Text`
  com `font-mono` parece igual e não diz o que é.
- **Uma tecla ou um atalho:** `Kbd`. Ele desenha a tecla e diz o nome dela a
  quem ouve a tela; `Text` em negrito escrito "Ctrl+K" não faz nenhuma das
  duas coisas.
- **Título de seção:** `Heading`. Texto grande não entra no esboço da página,
  e quem navega por título não o encontra.
- **Rótulo de campo:** `FieldLabel`, que se liga ao controle.

## No React Native

Traduz, e o `Text` nativo é o mesmo primitivo que as outras peças do pacote já vestem, agora com `size`, `tone`, `weight`, `truncate` e `lineClamp`, os mesmos nomes e os mesmos valores do web. `truncate` e `lineClamp` viram `numberOfLines`.

**Sem as props novas, ele herda, como no web.** Um `Text` dentro de outro `Text` leva o corpo e a cor do de fora, e é isso que faz o trecho em negrito no meio da frase funcionar. A diferença está no topo: o React Native não herda cor de `View`, então o parágrafo de fora sem `tone` sai na cor padrão do aparelho, e não na do tema. Passe `tone` no `Text` de fora.

Não há `render`: o elemento do celular é sempre `Text`, e o bloco é uma `View` em volta.
