---
category: Sobreposição
---

# ImageViewer

Uma grade de miniaturas que abre a foto em tela cheia: fotos de um imóvel,
comprovantes anexados a uma despesa, a vistoria de um veículo. Na tela cheia a
pessoa navega entre as imagens, aproxima para ler o detalhe e fecha voltando
exatamente para onde estava.

```tsx
<ImageViewer
  images={[
    { src: '/fotos/fachada.jpg', alt: 'Fachada do prédio comercial' },
    { src: '/fotos/recepcao.jpg', alt: 'Recepção com balcão de madeira' },
  ]}
/>
```

É montada sobre o `Dialog` da casa: o foco fica preso dentro, `Esc` fecha, o
fundo fica inerte para o leitor de tela e o tema acompanha o portal.

## O palco é sempre escuro

A tela cheia abre num palco escuro nos dois temas, como a galeria do celular e
os visualizadores de foto de mercado: fundo claro em volta da foto briga com
ela e estoura o brilho. O fundo, a legenda, o contador e os controles (fechar,
setas e zoom) leem os papéis fixos `media-*` (`bg-media-stage`,
`bg-media-control`, `text-media-fg`, `text-media-fg-muted`,
`border-media-border` e `media-disabled` para o controle desabilitado), e não
os papéis do tema.

Eles moram em `scales.css`, fora dos temas, pelo mesmo motivo do par do
`QRCode`: o palco continua escuro no tema claro e em todo tema de cliente, sem
o cliente declarar nada. O `check:contrast` mede os pares: o palco escuro,
legenda e contador a 4,5:1, ícone, contorno e anel de foco a 3:1, e o controle
desabilitado visível e mais fraco que o vivo. A grade de miniaturas continua na
página, e com as cores do tema.

O tema não declara `--rc-media-*`. Para mudar o palco num produto, vista as
partes pelo `classNames` (`viewer`, `counter`, `caption`), com token.

## As imagens

`images` é a lista, na ordem da navegação. Cada imagem tem `src`, `alt`
obrigatório, `caption` opcional e `thumbnail`, a versão pequena que a grade usa
(sem ela, a grade carrega o `src`).

**O `alt` é obrigatório no tipo**, e não por capricho: ele é o nome do botão da
miniatura, e é o que o leitor de tela ouve a cada troca de imagem, junto com a
posição ("3 de 8: Recepção com balcão de madeira"). Uma galeria sem `alt` é,
para quem não enxerga, uma fileira de botões sem nome.

A `caption` aparece embaixo da imagem aberta, e vale para o que o `alt` não
diz: quando foi tirada, quem enviou, o que a pessoa deve reparar.

## Navegar

As setas na lateral, as setas do teclado, `PageUp` e `PageDown` e o deslizar de
lado passam de imagem. O contador "3 de 8" fica no alto, à esquerda. Na primeira
e na última, a seta daquele lado desabilita; com `loop`, a navegação dá a volta.

Se a seta desabilita com o foco nela, o foco desce para a área da imagem, e não
se perde na página: as teclas do visualizador continuam valendo. O mesmo vale
para o mais e o menos do zoom, no máximo e no tamanho que cabe.

A vizinha de cada lado é carregada antes de a pessoa pedir, então a troca de
imagem não espera a rede. Enquanto a imagem aberta carrega, um giro ocupa o
lugar dela; se ela não carrega, a tela diz isso em vez de girar para sempre.

## Zoom

Os botões de mais e menos aproximam de uma vez e meia em uma vez e meia, até
`maxZoom` (4 por padrão). O duplo clique dobra o zoom no ponto clicado, e o
segundo volta ao tamanho que cabe. A roda do mouse aproxima com `Ctrl` apertado,
que é o mesmo evento que o gesto de pinça do trackpad manda; no toque, a pinça
de dois dedos aproxima direto.

Aproximada, a imagem se arrasta para ver o resto, e o deslizar deixa de trocar
de imagem: o dedo que arrasta a foto aproximada não pode, de repente, mudar de
foto. No teclado, `+` e `-` aproximam e afastam, e `0` volta ao tamanho que
cabe.

**Com zoom, as quatro setas percorrem a foto**, de 40 em 40 pixels, sem passar
da borda, e são o arrastar de quem não usa ponteiro. A troca de imagem fica com
`PageUp`, `PageDown` e os botões da lateral. Trocar de imagem sempre volta o
zoom ao começo.

## Fechar e voltar

`Esc`, o xis no alto ou o `onIndexChange(null)` fecham. **O foco volta para a
miniatura da imagem que estava aberta**, e não necessariamente para a que abriu:
quem abriu a segunda foto, andou até a quinta e fechou, continua a partir da
quinta na grade, com a página rolada até ela.

## Controlado

`index` e `onIndexChange`: o índice da imagem aberta, contando de zero, ou
`null` com o visualizador fechado. Com `thumbnails={false}` a grade some, e quem
abre é o `index`, a partir de qualquer botão da tela:

```tsx
const [index, setIndex] = useState<number | null>(null)

<Button onClick={() => setIndex(0)}>Ver as fotos</Button>
<ImageViewer images={fotos} thumbnails={false} index={index} onIndexChange={setIndex} />
```

## Partes

`classNames` alcança cada nó pelo nome: `thumbnails` (a grade), `thumbnail`
(cada botão da grade), `viewer` (a tela cheia), `toolbar` (a barra do alto),
`counter`, `stage` (a área da imagem), `image` e `caption`.

`labels` troca os textos: `title` (o nome do diálogo, só para o leitor de tela),
`counter` (função da posição e do total), `previous`, `next`, `close`, `zoomIn`,
`zoomOut`, `loading` e `error`.

## Quando não usar

- **Conteúdo que não é imagem** é `Dialog`. O visualizador existe para a foto
  ocupar a tela inteira; um formulário ou um texto dentro dele perde o que o
  `Dialog` dá (o título visível, o rodapé de ações, o tamanho que cabe no
  conteúdo).
- **Imagem que só precisa de moldura na página** é `AspectRatio`. Se a pessoa
  não precisa ampliar nem navegar, a foto fica no próprio card, com a proporção
  reservada antes de carregar, e nada abre por cima.
- **Fileira de imagens que se percorre sem ampliar** é `Carousel`. Os dois
  combinam: o carrossel mostra, e o visualizador amplia quando a pessoa pede.

## No React Native

Traduz sobre o `Modal` do core, com as imagens numa `FlatList` horizontal com `pagingEnabled`: deslizar troca de imagem, e o voltar do Android fecha. A grade de miniaturas é a mesma, montada no `Grid` nativo, e cada miniatura é um `imagebutton` com o `alt` como nome. O `index` é controlado, como em todo o pacote nativo: `onIndexChange` recebe o índice ao abrir e ao navegar, e `null` ao fechar.

**A pinça sai do `PanResponder` do core, e não do react-native-gesture-handler.** O pacote já exige o reanimated, mas não o gesture-handler, e um visualizador de imagem não justifica um peer obrigatório a mais para todo app. Dois dedos aproximam até `maxZoom`, um dedo arrasta a foto aproximada, e o toque duplo dobra e desfaz o zoom. Com zoom, a fileira para de rolar: o dedo que arrasta a foto não troca de foto. Os botões de mais, menos, anterior e próximo continuam lá, porque o leitor de tela não faz pinça.

`caption` é `string`, a vizinha de cada lado é pedida antes por `Image.prefetch`, e o contador "3 de 8" fica numa região viva que diz também o `alt` da imagem nova.

O palco é escuro nos dois esquemas, como no web: as cores saem de `tokens.media`, e não do tema, então o `Modal` não clareia no tema claro nem no tema de cliente. O controle desabilitado segue a regra do pacote, a camada inteira a 50%.

As partes vestem pelo mesmo `classNames` do web, as oito: `thumbnails`, `thumbnail`, `viewer`, `toolbar`, `counter`, `stage`, `image` e `caption`. O `className` veste a grade de miniaturas, o mesmo nó de `thumbnails`, porque a peça não tem raiz: a grade e o `Modal` são irmãos.
