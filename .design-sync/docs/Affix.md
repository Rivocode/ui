---
category: Estrutura
---

# Affix

Um elemento que gruda na janela e fica parado enquanto a página rola por
baixo: a ação principal de um formulário longo, o aviso de rascunho salvo, o
botão de ajuda no canto. A peça não desenha nada, só posiciona.

```tsx
<Affix position={{ bottom: 24, right: 24 }}>
  <Button>Assinar contrato</Button>
</Affix>
```

## Posição

`position` diz a distância de cada lado da janela. Número é pixel, e texto é
qualquer medida do CSS, inclusive token: `{ bottom: 'var(--rc-pad-panel)' }`.
Lado sem valor fica solto. Sem `position`, a peça gruda embaixo à direita, a
um respiro de painel das bordas.

## Por cima do quê

O empilhamento sai de `--rc-z-*`, e nunca de número. `layer` escolhe a camada:
`sticky` (o padrão) fica junto do cabeçalho fixo e abaixo de menu, folha,
diálogo, aviso e dica, que é onde algo que gruda na página quer morar.
`dropdown` e `overlay` sobem até a camada dos menus e a do fundo de diálogo,
para o caso raro em que a peça precisa ficar por cima de um menu aberto.

A peça sai no container de portal do `RivoProvider`, fora da árvore. Isso a
livra de ancestral com `transform`, `filter` ou `overflow`, que prenderiam o
`position: fixed` dentro dele, e o container carrega o tema, então o que vai
dentro continua vestido. `withinPortal={false}` a deixa onde foi escrita.

## O foco não para atrás dela

Um elemento fixo pode cobrir o que o teclado focou: a pessoa aperta Tab, o
foco desce para o último campo da tela, e o campo está debaixo do botão
grudado. É o que o critério 2.4.11 da WCAG proíbe.

O remédio é o `scroll-padding` da página, e a peça o escreve sozinha: medida a
altura dela e a distância da borda, ela reserva esse espaço no
`scroll-padding-bottom` do elemento `html` (ou no `scroll-padding-top`, quando gruda
em cima), mais um respiro de 8 pixels. Com isso o navegador, ao rolar até o
foco, para antes da faixa coberta. Várias peças no mesmo lado valem pela maior,
e o valor que a página já tinha volta quando a última desmonta.

`reserveSpace={false}` desliga a reserva, quando a página já cuida disso no
próprio CSS:

```css
html {
  scroll-padding-bottom: 5rem;
}
```

A reserva vale para o foco que chega por rolagem. Um formulário com a ação
grudada embaixo ainda precisa de respiro no fim do conteúdo, senão o último
campo fica para sempre sob o botão: um `pb-20` no contêiner resolve.

## Numa caixa que rola

`strategy="absolute"` troca a janela pelo ancestral posicionado mais próximo.
Ponha o `relative` num embrulho em volta da caixa que rola, e não nela, senão
a peça rola junto com o conteúdo:

```tsx
<div className="relative">
  <div className="h-96 overflow-y-auto">…</div>
  <Affix strategy="absolute" position={{ bottom: 16, right: 16 }}>
    <Button>Assinar contrato</Button>
  </Affix>
</div>
```

Nesse modo não há portal nem reserva: o `scroll-padding` da página não
alcança a caixa.

## Quando não usar

- **O topo que gruda enquanto a seção rola** é `position: sticky`, ou o
  cabeçalho do `AppShell`. O `Affix` sai do fluxo e não reserva lugar na
  página; o `sticky` ocupa o lugar dele e só gruda dentro do pai.
- **Ações sobre itens selecionados** são `ActionBar`, que aparece com a seleção
  e anuncia quantos foram escolhidos.
- **Voltar ao começo** é `ScrollToTop`, que já é um `Affix` com o botão, o
  limite de rolagem e o foco resolvidos.
- **Um aviso que passa** é `Toast`, e um que fica no topo da página é `Banner`.
  O `Affix` não anuncia nada ao leitor de tela.

## No React Native

Não porta, por decisão: no React Native, grudar é o comportamento de fábrica. Não existe janela que rola; quem rola é a `ScrollView` ou a `FlatList`, e uma `View` com `position: absolute` escrita ao lado dela, e não dentro, fica parada na tela enquanto a lista corre por baixo. Não há portal a abrir nem `transform` de ancestral a escapar.

Para o título que gruda enquanto a lista rola, a lista já tem `stickyHeaderIndices` e `stickySectionHeadersEnabled`. E a ação que acompanha a tela inteira embaixo é o `ActionBar`, que traduz e já desconta a área segura por `bottomInset`.
