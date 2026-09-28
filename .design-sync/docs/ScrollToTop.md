---
category: Ações
---

# ScrollToTop

O botão flutuante "Voltar ao topo". Ele só existe depois que a pessoa desce
além de um limite, fica no canto da janela, e leva de volta ao começo de uma
página longa: uma listagem de muitas linhas, um relatório, um termo.

```tsx
<ScrollToTop />
```

É o `IconButton` da casa, em pílula e com sombra, com a seta para cima e o nome
"Voltar ao topo", preso ao canto de baixo à direita por um `Affix`.

## Quando aparece

`threshold` é quantos pixels a pessoa precisa descer: 400 por padrão. Acima
disso o botão **não existe**, e não só fica invisível: ele não entra no Tab nem
na lista de botões do leitor de tela. Ele entra com a animação curta de
aparecer, que desliga sozinha quando o sistema pede para reduzir movimento.

## O que o clique faz

Rola até o topo, suave, ou **num salto** quando o sistema pede para reduzir
movimento. E **leva o foco para o começo da página**: o `<main>`, ou o `<body>`
quando não há `<main>`. Sem isso o foco ficaria no botão, que some assim que a
página chega ao topo, e quem navega por teclado voltaria ao fim da página no
próximo Tab. O destino ganha `tabindex="-1"` só enquanto tem o foco.

`focusTarget` escolhe outro destino, como o `<h1>` da tela. `onScrollToTop` é
chamado depois que a subida começou.

## Numa caixa que rola

`target` troca a janela por uma caixa com rolagem própria: é nela que a
distância é medida, é ela que sobe, e é para ela que o foco vai. Com
`strategy="absolute"`, o botão gruda no canto do ancestral posicionado em vez
do canto da janela.

```tsx
const [caixa, setCaixa] = useState<HTMLDivElement | null>(null)

<div className="relative">
  <div ref={setCaixa} className="h-96 overflow-y-auto">…</div>
  <ScrollToTop target={caixa} strategy="absolute" position={{ bottom: 16, right: 16 }} />
</div>
```

Passe o elemento, guardado num estado, e não o `ref`: o botão precisa saber
quando a caixa chegou para começar a medir.

## Posição e aparência

`position`, `strategy`, `layer`, `withinPortal` e `reserveSpace` são os do
`Affix` e passam direto para ele. `label` troca o nome, `icon` troca a seta,
`tooltip` mostra o nome numa dica, e `size` e `variant` são os do
`IconButton`. `className` veste a camada que gruda e `classNames.button`, o
botão.

O botão reserva a própria altura no `scroll-padding-bottom` da página, então o
foco do teclado não para escondido atrás dele. A explicação está no `Affix`.

## Quando não usar

- **Página curta**, que cabe em duas telas, não precisa dele: a pessoa volta
  rolando, e o botão só ocupa o canto.
- **Pular para uma seção** é `TableOfContents`. O botão só conhece o topo; o
  índice conhece o caminho inteiro.
- **Outra ação que acompanha a rolagem** (assinar, salvar, emitir) é `Affix`
  com o `Button` dentro. O `ScrollToTop` é só a subida.
- **Ações sobre linhas selecionadas** são `ActionBar`, que aparece pela
  seleção, e não pela rolagem.

## No React Native

Não porta, por decisão: o celular já sobe a lista de fábrica. No iOS, tocar na barra de status leva ao topo a `ScrollView` e a `FlatList` da tela (é o `scrollsToTop`, ligado por padrão), e no Expo Router e no React Navigation tocar de novo na aba em que a pessoa já está faz o mesmo, com o `useScrollToTop(ref)` na lista. Um botão flutuante por cima disso seria um terceiro caminho para o mesmo gesto, cobrindo o canto onde mora a ação principal da tela.

Não há foco a devolver: a navegação por toque não tem um Tab que continue do fim da página.
