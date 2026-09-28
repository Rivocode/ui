---
category: Estrutura
---

# ResizablePanelGroup

Áreas lado a lado, ou empilhadas, com divisórias que se arrastam: a árvore, o
editor e o inspetor de uma ferramenta; as pastas, a nota e os eventos dela.
Quantos painéis a tela pedir, e um grupo dentro do painel de outro quando uma
das áreas também se divide.

A família tem três peças. O `ResizablePanelGroup` é a moldura e decide a
direção por `orientation`; o `ResizablePanel` é cada área; o `ResizableHandle`
é a divisória entre duas delas.

```tsx
<ResizablePanelGroup autoSaveId="notas">
  <ResizablePanel defaultSize={25} minSize={15} collapsible>
    <nav>Pastas</nav>
  </ResizablePanel>
  <ResizableHandle withHandle aria-label="Entre pastas e nota" />
  <ResizablePanel defaultSize={50}>
    <ResizablePanelGroup orientation="vertical">
      <ResizablePanel defaultSize={70}>
        <article>Nota</article>
      </ResizablePanel>
      <ResizableHandle aria-label="Entre nota e eventos" />
      <ResizablePanel>
        <section>Eventos</section>
      </ResizablePanel>
    </ResizablePanelGroup>
  </ResizablePanel>
  <ResizableHandle aria-label="Entre nota e inspetor" />
  <ResizablePanel minSize={15}>
    <aside>Inspetor</aside>
  </ResizablePanel>
</ResizablePanelGroup>
```

Toda medida é **porcentagem do grupo**: `defaultSize`, `minSize`, `maxSize` e
`collapsedSize` do painel, o `layout` controlado e o que o `onLayoutChange`
devolve. O painel sem `defaultSize` divide com os outros sem medida o que
sobrou. O grupo ocupa a altura e a largura de quem o contém, então a moldura de
fora precisa ter altura para o `vertical` ter o que dividir.

## A divisória

Cada `ResizableHandle` é um `separator` de verdade, e as decisões são as mesmas
do `Splitter`, que hoje é montado por cima desta família:

- **O valor diz a medida com unidade.** `aria-valuenow` é a medida do painel
  ANTES da divisória, e o `aria-valuetext` diz "40%", porque o número pelado
  não é medida de coisa nenhuma. `aria-valuemin` e `aria-valuemax` são os
  extremos que ela alcança de verdade com os vizinhos de agora, e não o
  `minSize` e o `maxSize` crus.
- **Ela aponta para o painel que mede**, por `aria-controls`. Sem a referência,
  o leitor de tela não tem como saber qual dos dois lados o valor descreve.
- **O nome mora nela.** O `aria-label` que você escreve cai no nó que tem o
  papel. Sem nenhum, ela se chama "Redimensionar painéis", que é melhor que
  silêncio e pior que dizer quais áreas ela separa: com mais de uma divisória
  na tela, nomeie cada uma.
- **O alvo tem 25px e a linha desenha 1.** A WCAG 2.5.8 pede 24, e um `::after`
  transparente estica 12px para cada lado sem o desenho engordar. O
  `withHandle` põe a pegadinha no meio da linha, para quem precisa ver onde
  pegar; o alvo é o mesmo com ou sem ela.
- **A linha pinta em `border-strong`, e não em `border`.** Ela é o único
  desenho de um controle que recebe foco, e a WCAG 1.4.11 pede 3:1 contra o
  fundo: `border` mede 1,23:1 e sumiria, `border-strong` passa nos dois temas.

O teclado é o do padrão de divisória de janela da WAI-ARIA:

| Tecla | O que faz |
| --- | --- |
| `←` `→` (em pé) ou `↑` `↓` (deitada) | move 2%, e os dois vizinhos trocam a medida |
| `Home` | leva o painel de antes ao menor tamanho que ele alcança; se ele recolhe, recolhe |
| `End` | leva o painel de antes ao maior tamanho que os vizinhos deixam |
| `Enter` | recolhe o painel colapsável vizinho, ou o devolve à medida de antes |

A seta que passaria do mínimo para no mínimo; no mínimo, a próxima recolhe o
painel colapsável. Com o mouse o recolher é pela metade: arrastado abaixo da
metade do caminho entre `collapsedSize` e `minSize`, o painel recolhe, e acima
dela fica no mínimo. Nenhum painel para num tamanho que ele não aceita.

## Recolher

`collapsible` deixa o painel encolher até o `collapsedSize` (0 por padrão).
Recolhido em 0, ele sai da tela **e do `Tab`**: o conteúdo fica `inert`, e
ninguém tabula para dentro de uma coluna que não aparece. Com `collapsedSize`
acima de 0, a faixa que sobra continua alcançável, para a coluna de ícones.

`onCollapse` e `onExpand` avisam a passagem, e o `ref` do painel dá a API
imperativa, para o botão de mostrar e esconder que mora fora do grupo:

```tsx
const filtros = useRef<ResizablePanelHandle>(null)

<Button onClick={() => filtros.current?.collapse()}>Esconder filtros</Button>
<ResizablePanel ref={filtros} collapsible minSize={20}>
  <form>Filtros</form>
</ResizablePanel>
```

São cinco: `collapse()`, `expand()` (volta à medida de antes de recolher),
`resize(size)`, `getSize()` e `isCollapsed()`.

## Guardar o layout

`autoSaveId` guarda o layout no `localStorage` sob essa chave e o devolve na
próxima montagem. A leitura e a escrita estão em `try`: modo privado que lança
ao tocar no `localStorage`, cota cheia ou valor corrompido não derrubam a tela,
e o grupo volta ao `defaultSize`. Layout guardado que não cabe mais nos painéis
de hoje (outra quantidade, medida fora do novo mínimo) também é descartado.

`storage` troca o lugar: `sessionStorage`, ou um objeto seu com `getItem` e
`setItem` que grava no perfil da pessoa. Para ter o layout nas mãos, use
`layout` controlado com `onLayoutChange`.

## Sentido da escrita

Em `dir="rtl"` o primeiro painel fica à direita, o arraste mede a partir da
borda onde a leitura começa e as setas andam para o lado que a pessoa vê. A
direção vem do `RivoProvider`, como no resto do catálogo. `Home` e `End`
continuam lógicos: o mínimo e o máximo do painel de antes.

## No celular

O grupo não empilha sozinho, de propósito: se três colunas viram uma pilha ou
uma tela por vez é decisão da sua tela, e não da moldura. A orientação é prop,
então o `useTelaEstreita()` trocando `orientation` resolve o caso comum. Quando
o caso é exatamente lista e detalhe, o `Splitter` já faz isso por você.

## Quando não usar

Para **duas áreas**, lista e detalhe, sem recolher nem guardar, use o
`Splitter`: é uma linha, empilha sozinho no celular e tira a divisória de onde
ela não teria função. O `ResizablePanelGroup` é para quando a tela precisa de
mais de duas áreas, de grupo dentro de grupo, de painel que recolhe ou de
layout que volta igual amanhã.

Para esconder e mostrar uma área inteira sem proporção a negociar, use a
`Sidebar` ou o `Collapsible`.

## No React Native

Não porta, pela mesma razão do `Splitter`, que no web é montado por cima desta família. Três colunas que se redimensionam pedem uma tela larga e um ponteiro fino: no celular em pé não há largura para dividir, e arrastar uma linha de 1px com o dedo não é gesto que exista. As áreas viram telas do router (Expo Router, React Navigation), e o painel que recolhe vira `Sheet`. O layout guardado por `autoSaveId` não tem o que guardar lá.
