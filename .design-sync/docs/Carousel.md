---
category: Estrutura
---

# Carousel

Uma fileira de slides que a pessoa percorre de lado: planos lado a lado,
novidades da semana, fotos de um imóvel. A rolagem é a do próprio navegador,
com _scroll-snap_ do CSS: o arrasto no toque, a roda do mouse na horizontal e o
trackpad já funcionam sem biblioteca nenhuma, e cada slide assenta na borda.

```tsx
<Carousel label="Planos" indicators>
  <Card>Básico</Card>
  <Card>Profissional</Card>
  <Card>Empresa</Card>
</Carousel>
```

Cada filho vira um slide. O `label` é obrigatório: ele dá nome à região, que o
leitor de tela anuncia como "carrossel", e cada slide sai como um grupo "slide"
com o rótulo "Slide 2 de 5". É o padrão de carrossel da APG, com os termos em
português.

## Quantos por vez

`slidesPerView` diz quantos slides cabem lado a lado. Um número fixa a conta; um
objeto muda com a largura da tela, com os mesmos pontos do Tailwind (`sm`, `md`,
`lg`, `xl`), e o ponto que falta herda do menor:

```tsx
<Carousel label="Planos" slidesPerView={{ base: 1, sm: 2, lg: 3 }}>
  {planos.map((plano) => (
    <Card key={plano.id}>{plano.nome}</Card>
  ))}
</Carousel>
```

Com `slidesPerView="auto"`, quem decide a largura é a classe do slide, por
`classNames.slide` ou pelo próprio filho. É o caso da fileira de cartões de
largura fixa que mostra a ponta do próximo, e a ponta é o convite para arrastar:

```tsx
<Carousel label="Planos" slidesPerView="auto" classNames={{ slide: 'w-56' }}>
  {planos.map((plano) => (
    <Card key={plano.id}>{plano.nome}</Card>
  ))}
</Carousel>
```

`gap` é o vão entre os slides, lido de `--rc-gap-*`: encolhe na densidade
compacta.

## Navegar

Os botões anterior e próximo vêm ligados, embaixo da fileira, e são o
`IconButton` da casa. No primeiro slide o anterior desabilita, e no último o
próximo; com `loop`, o próximo do último volta ao primeiro. `controls={false}`
tira os dois, para quando só o arrasto basta.

`indicators` liga um ponto por posição. O ponto do slide da frente fica mais
largo e na cor de destaque, e cada ponto é um botão que leva até a posição, com
o rótulo "Ir para o slide 3 de 5". Com vários por vez, as posições são as que
a rolagem alcança: cinco slides de três em três dão três pontos.

Com o foco no carrossel, as setas andam um slide, e `Home` e `End` vão às
pontas. Dentro de um campo do slide, a seta continua sendo do campo.

Quando o slide da frente muda, uma região viva educada diz "Slide 3 de 5". Ela
fica calada enquanto a rotação automática anda, para o leitor de tela não
narrar sozinho.

## Controlado

`index` e `onIndexChange`, contando de zero. `onIndexChange` é chamado pelos
botões, pelo teclado, pelos pontos e pelo arrasto, quando a rolagem assenta:

```tsx
const [index, setIndex] = useState(0)

<Carousel label="Planos" index={index} onIndexChange={setIndex}>
  {slides}
</Carousel>
```

## Rotação automática

**Desligada por padrão, e é para continuar assim.** Conteúdo que anda sozinho
disputa a atenção com o que a pessoa está lendo, e texto que some antes de
terminar de ser lido é a falha mais comum desta peça.

Quando a rotação é mesmo a intenção, `autoplay` liga: `true` a cada 5 segundos,
ou o intervalo em milissegundos. A peça cumpre a 2.2.2 da WCAG sozinha:

- o botão de pausa aparece junto dos controles, e é ele que diz "Pausar a
  rotação" ou "Retomar a rotação";
- a rotação para com o ponteiro em cima e com o foco em qualquer ponto do
  carrossel, e volta quando os dois saem;
- quando o sistema pede para reduzir movimento, ela não começa: o botão nasce
  oferecendo retomar, e só anda se a pessoa pedir. O pedido dela vence a
  preferência do sistema, que continua valendo no resto: o slide troca sem
  deslizar.

Com `defaultIndex`, o carrossel já monta no slide pedido, sem deslizar desde o
primeiro.

## Partes

`classNames` alcança cada nó pelo nome: `viewport` (a fileira que rola), `slide`
(cada slide), `footer` (a linha dos controles), `previous`, `next`, `pause`,
`indicators` (o grupo dos pontos) e `indicator` (cada ponto).

`labels` troca os textos que o leitor de tela ouve: `slide` e `indicator` são
funções da posição e do total; `previous`, `next`, `pause` e `play` são texto.

## Quando não usar

- **Conteúdo que a pessoa compara** é `Tabs`, ou tudo à vista. O carrossel
  mostra uma parte por vez, e quem compara o plano Profissional com o Empresa
  precisa dos dois na tela ao mesmo tempo; nas `Tabs`, ao menos o nome de cada
  opção fica à vista o tempo todo.
- **Quando tudo cabe na tela** é `Grid`. Esconder atrás de uma seta o que
  caberia numa grade de três colunas só custa um clique a quem quer ver.
- **Para a informação que importa.** Os slides depois do primeiro são pouco
  vistos: aviso que a pessoa precisa ler é `Banner` ou `Alert`, e não o terceiro
  slide de uma rotação.

## No React Native

Traduz sobre a `FlatList` horizontal do core: com um slide por vez ela pagina pela largura inteira (`pagingEnabled`), e com mais de um assenta de slide em slide (`snapToInterval`). O arrasto é o do próprio sistema, e `onIndexChange` chega quando a rolagem assenta.

**A lista vem por `items` e `renderItem`, e o `index` é controlado**, como em todo o pacote nativo. `slidesPerView` é um número só: a largura do telefone não muda no meio da tela, e o objeto por largura e o `"auto"` do web não atravessam.

**Não há `autoplay`.** No toque, a fileira que anda sozinha briga com o dedo que está prestes a arrastar, e o botão de pausa ficaria a um polegar de distância do conteúdo que se move. Sem os pontos, um contador "2 de 5" fica entre os botões, numa região viva educada que diz o slide novo ao leitor de tela.

```tsx
<Carousel
  label="Planos"
  items={planos}
  index={index}
  onIndexChange={setIndex}
  renderItem={(plano) => <Card>{plano.nome}</Card>}
/>
```

As partes vestem pelo mesmo `classNames` do web: `viewport`, `slide`, `footer`, `previous`, `next`, `indicators` e `indicator`. `pause` não existe aqui, porque não há `autoplay`.
