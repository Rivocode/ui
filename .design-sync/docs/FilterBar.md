---
category: Estrutura
---

# FilterBar

A fileira dos filtros aplicados, o botão de limpar e a contagem — as três
coisas que toda listagem remonta à mão em volta do `DataTable`.

Ela **não gerencia consulta**. Não sabe o que é uma página, um `queryKey` nem
um `refetch`, pela mesma razão que o `DataTable` não conhece React Query:
estado de consulta é arquitetura de aplicação, e a casa decidiu deixá-lo de
fora. A peça recebe `filters`, apresenta o que recebeu e avisa quando alguma
coisa saiu.

```tsx
const [filters, setFilters] = useState<AppliedFilter[]>([
  { id: 'status', label: 'Situação', value: 'Em aberto' },
  { id: 'customer', label: 'Cliente', value: 'Clínica São Lucas' },
])

<FilterBar filters={filters} onFiltersChange={setFilters} />
```

`onFiltersChange` recebe **o que sobrou**, no xis e no limpar — é o mesmo par
do `onValueChange` do `TagsInput`, e sozinho ele já basta. `onRemove` existe
ao lado dele para quem precisa saber *qual* filtro saiu, e recebe o objeto
inteiro; `onClear` dispara antes do `onFiltersChange([])`, para a telemetria
que conta "quantas vezes alguém desiste de tudo".

Cada filtro é `{ id, label, value }`. O `id` é a chave estável — é por ele que
a peça remove, e não por índice. O `label` é o campo (`Cliente`) e o `value` é
o escolhido (`Clínica São Lucas`); os dois juntos são o que o leitor de tela
ouve no xis, porque "Remover" repetido quatro vezes não distingue nada.

## A linha fica, mesmo vazia

Sem filtro nenhum a barra **continua ocupando a linha**, com "Nenhum filtro
aplicado" em texto apagado. A tela que pula quando o primeiro filtro entra é um
defeito conhecido, e o `Tracker` do React Native já pagou por ele: lá a linha
de leitura existe desde o primeiro quadro justamente para o espaço ficar
reservado e nada saltar no primeiro toque. Aqui é a mesma conta, e ela custa
uma altura de controle (`--rc-control-sm`) — a mesma da densidade escolhida no
provider, e não um número cravado.

Quem realmente não pode gastar a linha passa `reserve={false}`. **O aviso ao
leitor de tela continua montado mesmo assim**: uma região viva precisa existir
*antes* da mudança para anunciá-la, e uma barra que se desmonta ao perder o
último filtro anunciaria o silêncio.

## Quando os filtros não cabem

A 390px, três filtros não cabem. A barra **rola na horizontal dentro da própria
moldura**, com o "limpar" ancorado fora do trecho que rola.

Não quebra linha porque a altura da barra passaria a depender de quantos
filtros existem: quatro fichas de "Cliente: Clínica São Lucas" viram quatro
linhas, e a listagem — que é o conteúdo — desce para fora da dobra. A barra é
moldura, e moldura que cresce até metade da tela deixou de ser moldura.

Não colapsa em "+3" porque a barra existe justamente para dizer que o resultado
está filtrado. Filtro escondido atrás de um contador é a origem do chamado
"sumiram meus dados", e desdobrá-lo pediria uma segunda superfície flutuante
para uma fileira de fichas.

Cada ficha corta o valor com reticências em 10rem, então um valor comprido
encolhe a si mesmo em vez de empurrar os vizinhos para fora do alcance. O
teclado chega a todos: o navegador rola até o xis que recebe foco. Quando
**nenhuma** ficha tem xis — barra só de filtros travados —, o trecho que rola
vira uma parada de tabulação, senão o teclado não teria como chegar ao que está
fora da vista.

## O limpar aparece a partir de dois

Com um filtro só, o xis da própria ficha faz exatamente o mesmo, à mesma
distância do dedo: um segundo controle para o mesmo efeito não ensina nada e
ainda come 110px de uma linha de 390px. O botão passa a valer quando "tirar um
por um" vira trabalho.

Ele mostra a contagem — "Limpar 3 filtros" — e é lá que a contagem visível
mora. Um contador separado disputaria a largura escassa com as fichas, que são
a contagem já visível; no botão ele dobra de função e diz o tamanho do estrago
antes do toque. Para outra régua, `clearFrom={1}` deixa o botão sempre, e
`clearFrom={Infinity}` tira-o de vez.

## Filtro que o app trava

`removable: false` mostra o filtro sem xis. É o escopo que a aplicação impõe —
a filial da pessoa, o tenant, o ano fiscal aberto: ele **precisa** aparecer,
porque explica o resultado, e sair dele não é escolha de quem lê. Hoje esse
filtro costuma ser simplesmente omitido, e aí a lista mente sobre o próprio
recorte.

## Enquanto a consulta refaz

`disabled` trava todos os xis e o limpar de uma vez. É o estado em que a lista
já foi pedida de novo e ainda não voltou: sem ele, o segundo toque dispara uma
consulta que a primeira ainda vai sobrescrever.

## As partes

`classNames` veste cada nó pelo nome: `list` é o trecho que rola, `item` é o
`<li>` de cada filtro, `chip` é a raiz da ficha, `clear` é o botão de limpar e
`empty` é o texto da linha guardada. Sem eles a única saída seria `[&_li]`, que
amarra a sua tela à árvore interna da peça.

A fileira sai como `<ul>` com `role="list"` explícito — o `list-style: none` do
preflight tira a semântica de lista no Safari, e é ela que faz o leitor de tela
anunciar "3 itens" sem que ninguém conte nada.

## Quando não usar

Quando as opções são poucas, fixas e cabem à vista, use `ToggleGroup`: escolher
e desescolher acontece no mesmo lugar, num toque, e não há o que resumir depois.
A `FilterBar` é para o caso oposto — o filtro foi escolhido em outro lugar
(um `Combobox`, um `DateRangePicker`, uma folha inteira de filtros) e a
listagem precisa dizer o que sobrou valendo.

Quando o filtro é o próprio texto que a pessoa digita, use `TagsInput`: lá a
lista nasce do campo e o campo é a peça. Aqui a peça não tem campo nenhum, de
propósito.

## No React Native

Traduz, e é onde a peça vale mais: listagem no celular é onde filtro dói. As decisões de desenho já tinham sido tomadas pensando em 390px, então quase tudo atravessa — rola na horizontal, não quebra linha e não colapsa em `+3`.

**O limpar fica FORA do que rola.** Se ele rolasse junto, o controle que existe para desfazer tudo seria o único que exige rolar até o fim para achar. Ele ancora à direita da fileira, e o `size="sm"` do `Button` nativo já entrega o alvo de 44pt sozinho.

**A linha reservada passa a ser medida em dedo.** No web ela guarda a altura de `--rc-control-sm`; aqui guarda 44pt, que é uma altura de alvo de toque — não há token de controle do lado de cá. A fileira tem a mesma altura vazia e cheia, pelo mesmo motivo do `Tracker`: a tela não pode pular quando o primeiro filtro entra.

A região viva é um `Text` único que acumula as duas funções, em vez dos dois nós do web — duplicar abriria um `gap` morto na fileira. **Limite de plataforma declarado:** `accessibilityLiveRegion` é do Android; no iOS o anúncio automático não existe sem `announceForAccessibility`, que nenhuma peça do catálogo usa hoje.

Caem `classNames` por parte (não há `[&_li]` de que fugir sem DOM) e a parada de tabulação do web, porque não há foco de teclado aqui.
