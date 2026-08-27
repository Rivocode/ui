# EventCalendar no React Native: desenho

## A decisao, tomada depois deste documento: NAO

Data da decisao: 2026-08-27, o mesmo dia. **O `EventCalendar` nao vai existir no
React Native**, e a linha de paridade dele passou de `fila` para `nao`. Com
isso a `FILA_DECLARADA` ficou VAZIA.

O que decidiu foi a conta que este documento faz, e nao uma mudanca de ideia
sobre o caso de uso. Ela esta na secao 8, e diz o seguinte: as vistas nao
custam a mesma coisa. A `agenda` e o `month` sao baratos e ja tem resposta no
pacote - uma e lista, a outra e o `Calendar`, que pinta por dia pelo
`DayPaint`. A `day` e a `week` sao a peca inteira: o desenhador de tempo, o
alvo de 44 pontos sobre tarja de 12, o conflito de gesto, e a maior parte das
mil e duzentas linhas. Elas custam de 15 a 18% do pacote no aplicativo de quem
importa um `Button`, porque o nativo publica FONTE e o metro compila tudo.

E o que elas comprariam nao cabe na tela. Grade de tempo responde "o que choca
com o que", e essa pergunta se faz com o olho passeando - nao com o dedo
cobrindo o que ele toca.

**Este documento continua valendo**, e nao como historico: ele e o registro do
que foi MEDIDO para chegar aqui. Os 44,8px de coluna, os 24,15px por hora da
proposta de trocar o eixo, os pares de contraste que a peca criaria, a
armadilha de RTL do `month`, e o achado de que o `event-layout` e
compartilhavel - tudo isso e verdade, e volta a valer no dia em que alguem
propuser a peca de novo. Sem ele, a proposta voltaria como intuicao.

As oito perguntas da ultima secao ficaram sem resposta de proposito. Cinco
delas - 1, 3, 4, 5 e 6 - eram sobre a metade cara, e a decisao de nao
constru-la as responde de uma vez. As outras tres continuam abertas para o
pacote, e nao para esta peca: o anunciador que o iOS exige (pergunta 2) e a
divida numero 1 do `ESTADO.md`, e ela nao sai daqui.

O que se perde, dito na cara: quem quiser agenda de trabalho no celular nao vai
ter isso do design system. A resposta honesta para essa pessoa e que a tela
dela e a lista por dia, montada com as pecas que ja existem.

---

Data: 2026-08-27. O `EventCalendar` e a unica peca do catalogo em
`FILA_DECLARADA`, e a fila era por DESENHO DE GESTO, nao por tempo. A decisao
de gesto acabou de ser tomada pelo dono, e este documento existe para ser
discutido antes de qualquer linha de codigo, como o desenho do web foi.

A decisao, escrita como ela chegou:

> O caso de uso e **os dois** - agenda de trabalho E vencimento de nota. O
> nativo nasce com as quatro vistas (`agenda`, `day`, `week`, `month`), e o
> gesto se adapta a vista ativa.

Isso responde a terceira das nove perguntas humanas do
`2026-08-27-calendar-de-agenda-design.md` ("qual e o caso real"), que era a
que travava tudo: ela decidia se a peca e uma grade de tempo com `month` de
enfeite, ou um mapa de densidade com grade de enfeite. A resposta e que e as
duas coisas, e a peca tem que sustentar as duas em 358 pixels de largura.

Este documento comeca pelo risco que essa resposta cria, porque contorna-lo
seria entregar duas coisas pela metade.

## 1. As quatro vistas portam? Uma a uma, com a conta

A largura util da casa a 390px e **358px**. E a mesma conta que o `Tracker`
usa para os 90 quadrados e a mesma que fez o `DateRangePicker` nativo cair
para um mes. No web, 390px e uma largura entre outras. Aqui e a unica.

### `agenda`: porta inteira, e e a base

Uma lista agrupada por dia nao tem geometria para perder. Ela cabe em qualquer
largura, e no nativo ela ganha em vez de perder: a `SectionList` da plataforma
entrega virtualizacao e cabecalho grudado de fabrica, que e exatamente o
argumento que tirou a `VirtualList` do catalogo nativo. E o mesmo movimento,
na direcao contraria: la a plataforma tornou a peca desnecessaria, aqui ela
torna a vista mais barata do que no web.

Vale registrar que hoje **nao ha uma `SectionList` nem uma `FlatList` em
`native/src`**. Todas as listas do pacote sao `map` dentro de `ScrollView`.
Esta seria a primeira, e e um bom lugar para ela nascer, porque um mes de
agenda de equipe sao centenas de linhas.

### `day`: porta inteira, e e a grade que cabe

358 menos 44 da calha das horas dao **314px de coluna unica**. Isso e uma
coluna de verdade: cabe titulo, cabe hora, e a sobreposicao aparece como
sobreposicao. De 7h as 20h a 48px por hora dao 624pt de altura, uma tela de
rolagem. E a unica grade de tempo que existe no telefone, e ela e a resposta
para a metade "agenda de trabalho" do caso.

### `month`: porta, e serve a outra metade do caso

358 dividido por sete dao **51px por celula**. A celula do mes nao precisa
mostrar hora nem duracao - ela precisa mostrar que existe alguma coisa e mais
ou menos o que -, e isso sobrevive ao corte: a tarja continua legivel pelas
primeiras palavras, a contagem do dia continua exata, e o `+N mais` abre a
lista do dia numa folha de baixo. A pagina do web ja escreveu essa defesa, e
ela vale igual no aparelho.

E e a `month` que serve o vencimento de nota, que e a metade nova do caso.
Dezenas de titulos por dia, sem hora e sem duracao, sao exatamente o dado que
a grade de tempo desperdica e que o mapa de densidade responde.

### `week`: NAO porta como grade de tempo, e essa e a parte dificil

314 divididos por sete dao **44,8px por coluna**. A coluna alcanca o alvo de
toque, e e so isso que ela alcanca. Em 44,8px cabem umas cinco letras:
"Reuniao com o contador" vira "Reun...". Sete colunas dessas sao uma tela sem
informacao nenhuma com um alvo de toque valido em cima de cada uma, que e a
pior combinacao possivel: parece usavel e nao e.

O web ja tinha chegado a essa conta e resolvido dela: abaixo de 640px a `week`
some do seletor e `view="week"` resolve para `agenda`, calado. A linha da
paridade de hoje diz a mesma coisa com todas as letras.

**Entao a resposta honesta e: tres vistas portam desenhadas como estao, e a
quarta tem que virar outra coisa.** O que segue e a proposta do que ela vira,
e ela e a decisao mais cara deste documento.

### A `week` do telefone e a semana em SETE LINHAS, com o tempo na horizontal

O que torna a `week` impossivel no telefone nao e a semana, e o eixo. Sete dias
em colunas obrigam a dividir a largura por sete. Sete dias em **linhas** nao
dividem nada: cada dia recebe a largura inteira, e o que se divide e a altura,
que e o eixo barato numa tela de telefone.

Cada linha e um dia, com 44pt de altura - o alvo de toque, que aqui e tambem a
unidade de desenho. Dentro dela, uma **calha de tempo horizontal**: 358 menos
44 do rotulo do dia dao 314px para a janela de 13 horas, o que da **24,15px
por hora**. Um compromisso de uma hora vira uma barra de 24px. Um de meia hora,
12px. Um de quinze minutos, 6px.

Sete linhas de 44pt dao 308pt, mais o cabecalho: a semana inteira cabe sem
rolar.

O que essa vista responde, e responde bem: **qual dia esta lotado e qual esta
vazio**, que e a frase com que o desenho do web justificou a existencia da
`week` ("ver que a quinta esta lotada e a sexta esta vazia"). Duas barras
encavaladas na mesma linha continuam sendo choque de horario visivel, porque a
sobreposicao vira duas faixas empilhadas dentro dos 44pt.

O que ela nao responde, e precisa estar escrito: **nao se le titulo e nao se le
hora exata na `week` do telefone.** Uma barra de 24px nao cabe texto. Quem quer
saber o que e toca a linha e cai na `day` daquele dia. Quem quer saber a hora
exata faz a mesma coisa. A `week` do telefone e o indice, e a `day` e o texto.

Tres coisas fazem essa proposta valer mais do que parece:

- **A conta pura nao muda.** `layoutDay` devolve `column`, `span` e `columns`;
  `segmentBox` devolve `top` e `height` no eixo do tempo. Girado, `top` vira
  `left` e `height` vira `width`, e `column` vira faixa empilhada dentro dos
  44pt. E a mesma funcao, lida com os eixos trocados, e nao uma segunda
  matematica. O custo e um desenhador, e nao um calculo.
- **Ela ocupa o lugar da faixa de dias que o desenho do web ja tinha
  proposto** ("uma faixa horizontal de dias no topo, que e orientacao e
  atalho"). Em vez de uma faixa de orientacao ao lado de uma vista, a
  orientacao vira a vista. Um desenhador a menos.
- **Ela e barata em RTL**, e a secao 7 explica por que: o eixo dos dias fica
  vertical, e eixo vertical nao espelha.

O que ela custa, dito sem enfeite:

- E um quarto motor de desenho que **o web nao tem**. A paridade deixa de ser
  "traduz" e passa a ser "traduz com outro desenho", como o `DataTable` ja e
  ao virar `DataList`.
- Ela e fina em relacao a `day`: a diferenca entre "semana em linhas" e "dia
  com um trilho de sete dias em cima" e o periodo que a peca carrega e busca,
  nao o desenho. Se essa diferenca nao convencer, a resposta certa e menos
  trabalho, nao mais: a `week` nao porta, o seletor mostra tres, e `view="week"`
  resolve para `day`, do jeito que o web ja resolve para `agenda`. Isso esta na
  lista do dono.

## 2. O gesto de cada vista

### O que a casa pode usar, e o que isso ja elimina

O `@rivocode/ui-native` **nao tem** `react-native-gesture-handler` nem
`react-native-reanimated` entre os peers, e nao tem uma unica linha de
`Animated` em `native/src`. O que existe e o nucleo: `Pressable` com
`onPress` e `onLongPress`, `ScrollView`, `FlatList`, `SectionList` e
`PanResponder` - este ultimo ja usado pelo `Slider` e pelo `Tracker`.

Trazer um peer novo por causa desta peca briga com a regra escrita: **um
subcaminho por peer, e nao um por assunto**. Um peer de gesto empurraria o
calendario para `@rivocode/ui-native/calendar`, e ele nao e peca de
subcaminho, e peca de raiz. Entao a regra e simples e decide sozinha varias
perguntas abaixo: **o gesto sai do nucleo do React Native, ou nao existe.**

### O que existe, vista a vista

| Vista | Vertical | Horizontal | Toque | Toque longo |
|---|---|---|---|---|
| `agenda` | rolagem da `SectionList` | deslize troca de mes | abre o compromisso | nada |
| `day` | rolagem da grade | deslize troca de dia | abre o compromisso | cria meia hora sob o dedo |
| `week` | nada, a semana cabe | deslize troca de semana | abre a `day` daquele dia | nada |
| `month` | rolagem quando as seis linhas nao cabem | deslize troca de mes | abre o compromisso, a celula ou o `+N` | nada |

E uma regra so, e ela e o resumo do desenho de gesto desta peca: **em cada
vista existe UM gesto horizontal, e ele significa sempre a mesma coisa -
trocar de periodo.** Todo o resto do vocabulario e toque, e toque longo onde
ha geometria de tempo para criar.

### O que NAO existe, e por que

- **Arrastar para criar.** Um arrasto vertical na `day` para definir inicio e
  fim disputa o mesmo dedo com a rolagem da grade, que e o gesto principal da
  vista. A traducao do clique no vazio do web e o **toque longo**, que devolve
  a meia hora sob o dedo, e o app pergunta o fim numa folha com o `TimePicker`
  que ja existe. E o mesmo movimento do `FileUpload` nativo: a area de soltar
  virou um botao, porque no celular nao ha soltar.
- **Segurar para mover, e esticar para redimensionar.** O web declara em letra
  grande que a peca **nao edita**, e nao ha razao para o nativo editar antes
  dele. Se o nativo movesse eventos, a linha da paridade teria que dizer
  "traduz e faz mais", que e a divergencia mais cara de todas: a doc do web
  passa a mentir por omissao. E, alem disso, mover por arrasto horizontal e
  precisamente o gesto que disputaria com trocar de semana.
- **Pincar para mudar de escala.** O `PanResponder` le duas pontas de toque e
  daria para calcular a distancia, mas a escala teria que ser recalculada e
  redesenhada quadro a quadro em JS, num pacote que nao tem animacao nenhuma e
  publica fonte. Pior que o custo: pincar **nao tem equivalente para quem nao
  ve**, e a secao 5 estabelece que todo gesto desta peca precisa de um
  equivalente alcancavel. `hourHeight` continua sendo prop, e mudar de escala
  e mudar de vista: quem quer ver mais tempo vai para a `week`, quem quer ver
  menos vai para a `day`.

### O conflito mais dificil, e como ele se resolve

O conflito obvio - deslizar na horizontal para trocar de semana contra
arrastar na horizontal para mover um evento - se dissolve sozinho, porque
mover nao existe. Ele nunca chega a ser um problema.

O dificil nasceu do proprio desenho da `week` em linhas, e ele e este: a linha
de um dia com uma calha de tempo horizontal **pede** o gesto do `Tracker` - a
faixa inteira e um alvo so, o dedo arrasta ao longo dela e o que esta debaixo
do dedo aparece escrito na linha de baixo. Seria a forma de ler um evento sem
sair da `week`, e ela e boa: e um idioma que a casa ja tem, ja testou e ja
documentou.

E ela ocupa exatamente os mesmos pixels e a mesma direcao do deslize que troca
de semana. Nao ha desempate por geometria (e a mesma area), nem por direcao (e
o mesmo eixo). O desempate teria que ser por tempo - segurar antes de arrastar
-, que e invisivel para quem nao leu a documentacao, e por isso nao e desempate,
e uma armadilha.

**A resolucao e tirar um dos dois, e o que sai e a leitura por arrasto.** A
linha da `week` passa a ser um alvo unico de toque simples, que abre a `day`
daquele dia. Perde-se ler o evento sem trocar de vista; ganha-se que o unico
gesto horizontal da tela tem um significado so. E a mesma frase que a pagina do
web ja escreve sobre rolagem horizontal na semana: duas direcoes de gesto
disputando o mesmo dedo, e o dedo perde.

Fica a regra que generaliza, e ela e o que sobra deste documento se tudo o
mais mudar: **numa vista, um gesto horizontal.** Foi ela que matou a leitura
por arrasto na `week`, e e ela que proibe uma faixa de dias rolavel dentro de
uma tela que ja desliza - motivo a mais para a `week` em linhas ter substituido
a faixa de orientacao em vez de conviver com ela.

### Dois detalhes de implementacao que decidem se o gesto funciona

- **A trava de direcao.** O `PanResponder` do deslize so pode reivindicar o
  toque quando o movimento e claramente horizontal, e nunca depois que a
  rolagem vertical comecou: `onMoveShouldSetPanResponder` verdadeiro apenas
  com `|dx| > 12` e `|dx| > 2 * |dy|`. Sem isso, a grade da `day` fica dificil
  de rolar, que e o defeito que mata a vista principal.
- **O deslize nao acompanha o dedo.** Sem `Animated` no pacote, o periodo troca
  na soltura, sem a tela deslizar junto. E mais pobre do que o padrao da
  plataforma, e e honesto: a alternativa e introduzir animacao num pacote que
  nao tem nenhuma. Esta na lista do dono.

## 3. O alvo de toque, e o compromisso de quinze minutos

A casa recusou densidade compacta no nativo com um argumento que esta escrito
em tres lugares: alvo nao encolhe abaixo de 44pt, `comfortable` e a unica
altura, e a prop `density` foi removida por isso. Um compromisso de quinze
minutos na `day`, a 48px por hora, e desenhado com **12pt**. Um de cinco
minutos, com 4pt.

O web resolveu isso pisando a **altura desenhada** em 44px no celular, e
deixando o calculo de sobreposicao rodar nos horarios reais. No aparelho essa
saida e pior do que la, e vale medir por que: pisar em 44pt um evento de quinze
minutos faz a tarja cobrir **cinquenta e cinco minutos** de grade. Dois eventos
de quinze minutos as 9h e as 9h30 passam a se cobrir na tela sem se cobrerem no
dado. Numa manha com quatro consultas curtas, a grade inteira vira uma coluna
solida, e a grade e o unico motivo de a vista existir.

**A proposta e separar o alvo do desenho, que e o que a `FilterChip` nativa ja
fez**: a faixa de toque tem 44pt e a pilula pintada continua com 28. Aqui:

- **O desenho mantem a geometria verdadeira.** Quinze minutos sao 12pt, cinco
  minutos sao 4pt, com um piso de 4pt so para a marca nao sumir. A grade
  continua contando a verdade sobre duracao.
- **O alvo e uma faixa de 44pt centrada na tarja**, um `Pressable` posicionado
  em absoluto por cima, com `hitSlop` quando a faixa esbarrar na borda da
  coluna. O alvo pode transbordar a tarja; ele nao pinta nada.
- **Quando dois alvos se cobrem, a peca para de adivinhar.** Enquanto dois
  compromissos do mesmo agrupamento tiverem centros desenhados a menos de 44pt
  um do outro, os alvos individuais deles sao substituidos por **um** alvo, com
  o rotulo "3 compromissos entre 9h e 9h45", que abre a folha do dia ja rolada
  ate ali. Nao e mecanismo novo: e o `+N mais` que a peca ja tem, disparado por
  falta de resolucao do dedo em vez de por falta de coluna.

O que se perde: numa manha densa, abrir um compromisso especifico custa dois
toques em vez de um. O que se ganha: nao existe toque que abra o compromisso
errado, e a grade nao mente sobre duracao. A alternativa - herdar o piso de
44pt do web - troca um toque a mais por uma coluna que passa a mentir, e mentir
e mais caro.

Nas outras vistas o alvo se resolve sozinho: a linha da `agenda`, a linha da
`week` e a celula do `month` ja tem 44pt ou mais por construcao. A tarja dentro
da celula do mes nao tem, e por isso **a tarja do mes nao e um alvo**: o alvo e
a celula, e ela abre a folha do dia. E a mesma decisao do `Tracker`, onde a
faixa inteira e um alvo so porque um quadrado nao e.

## 4. O que nao porta, e por que

- **A `week` como grade de sete colunas de tempo.** A conta esta na secao 1.
  Ela nao porta, e o que porta com o nome dela e outro desenho.
- **A navegacao por teclado inteira.** As oito teclas da tabela do web nao tem
  para onde ir. O que sobrevive delas nao e a tecla, e a ideia: uma parada por
  compromisso, em ordem cronologica. Isso vira leitor de tela, na secao 5.
- **O foco itinerante, e com ele o `Esc`.** Nao ha foco de teclado no toque, e
  a classe `ring` nao aparece em `native/src` uma vez sequer.
- **`classNames` por parte.** Nao ha `classNames` em peca nenhuma do pacote
  nativo, e o `QueryBoundary` ja escreve isso na linha de paridade dele. Quem
  precisa trocar o miolo da tarja usa `renderEvent`, que porta.
- **Pincar, arrastar para criar, arrastar para mover.** Secao 2.
- **O painel ancorado do `+N mais` e do "ir para a data".** `Popover` nao porta
  no catalogo inteiro, pela razao de sempre: o dedo cobre o painel. Os dois
  viram `Sheet`, que e a decisao da casa para painel no celular, e o "ir para a
  data" vira o `Calendar` nativo dentro dela - a mesma composicao que o
  `DatePicker` nativo ja faz.
- **A tarja de evento como alvo dentro da celula do mes.** Secao 3.

Nada disso e atraso. Cada linha e um idioma de mesa, ou uma coisa que a
plataforma resolve de outro jeito, e as duas sao respostas de `traduz` com nota,
nunca de `fila`.

## 5. Acessibilidade

**Para quem ouve, toda vista continua sendo a `agenda`.** E a mesma decisao do
web, e ela e ainda mais necessaria aqui, porque no React Native a ordem de
leitura segue a ordem dos filhos e nao a posicao na tela: numa grade de
posicionamento absoluto, quem emite os filhos fora de ordem entrega uma leitura
embaralhada sem que nada apareca na tela. Os filhos de cada coluna saem em
ordem cronologica, como o web ja os ordena.

**O andaime some, e some duas vezes.** Nao existe `aria-hidden` aqui: a calha
das horas, as linhas de hora, os nomes dos dias da semana, a linha do agora e
as barras da `week` recebem `accessibilityElementsHidden` (iOS) **e**
`importantForAccessibility="no-hide-descendants"` (Android). Escrever so um dos
dois deixa metade dos aparelhos com o andaime falando.

**Cada compromisso e uma parada so, com a frase inteira**, no molde que o
`Timeline` nativo ja escolheu, porque nao existe papel de item de lista no React
Native e nao existem `aria-setsize`/`aria-posinset`: a posicao entra no texto.

> "3 de 8: Reuniao com o contador, das 14h as 15h30, continua no dia seguinte"

**O cabecalho de cada dia e a parada anterior**, com a contagem real, somando o
que esta escondido atras de um `+N`:

> "Quinta-feira, 19 de marco, hoje, 6 compromissos"

**Na `week`, a parada e a linha, e nao a barra.** As barras sao andaime; a linha
diz "Quinta-feira, 19 de marco, 6 compromissos, 2 o dia todo", com dica de que
tocar duas vezes abre o dia. E coerente com o desenho: se a barra nao e legivel
para quem ve, ela nao e informacao para quem ouve.

**Como se navega entre eventos sem visao:** varrendo, e a varredura e a ordem
cronologica que o paragrafo de cima garante. Nao ha equivalente de seta para
"mesmo horario, dia seguinte", e nao deve haver: seria uma acao de
acessibilidade custom que so quem leu a documentacao descobre. A navegacao
entre dias e a mesma de todo mundo: os botoes da barra.

**E dai sai a regra que amarra a secao 2 a esta:** todo gesto desta peca tem um
botao equivalente na barra de ferramentas. Deslizar troca de periodo, e os
botoes "anterior", "proximo" e "hoje" fazem o mesmo. Nenhuma capacidade da peca
existe so no gesto, porque o leitor de tela captura o deslize e quem depende
dele nunca o executaria.

**A troca de periodo e o buraco, e esta peca nao consegue passar por cima
dele.** Trocar de periodo troca a tela inteira sem mover o foco, e o
`accessibilityLiveRegion` que a `FilterBar`, o `DateRangePicker` e o `toast`
usam **e do Android**. E a divida numero 1 do `ESTADO.md`. Nas tres pecas que a
tem hoje o silencio do iOS e recuperavel, porque a pessoa acabou de apertar
alguma coisa e sabe o que fez. Aqui nao: a navegacao principal da peca troca o
conteudo inteiro. Entao esta peca precisa de um anunciador que fale nos dois
sistemas - `AccessibilityInfo.announceForAccessibility` no iOS -, e **onde ele
mora e decisao do dono**, porque ele nao deveria nascer dentro de um calendario
e sim ser retrofitado nas tres que ja anunciam.

**Criar sem ver.** O toque longo devolve a meia hora sob o dedo, e essa
precisao nao existe para quem varre. A proposta e uma acao de acessibilidade na
coluna do dia, "Novo compromisso neste dia", que dispara `onSlotSelect` com o
dia inteiro; o app pergunta a hora na folha, com o `TimePicker`. E a mesma
divisao de sempre: a peca entrega o dia, o app pergunta o resto.

**A linha do agora nao pode ser um `setInterval` solto.** No web ela se refaz a
cada minuto e ninguem paga por isso. No aparelho, um temporizador que continua
correndo com o app no fundo gasta bateria e volta atrasado. O `RelativeTime`
nativo ja resolveu isso: um `setTimeout` para o proximo passo mais um
`AppState.addEventListener` que refaz ao voltar para o primeiro plano. A linha
do agora copia esse padrao, e ele e o unico jeito de ela estar certa depois de
o telefone passar a noite no bolso.

## 6. Contraste: os pares que a peca cria

A guarda nativa mede 45 papeis com a tabela de pares do toque, e ela ja cobre o
que a tarja usa em repouso: `{tom}-text` sobre `{tom}-subtle` sobre `bg`,
`surface` e `surface-raised`, para `accent`, `success`, `warning`, `danger` e
`info`, mais `fg-muted` sobre `surface-raised` para o `neutral`.

O que a peca cria de novo sai todo do mesmo lugar: **a coluna de hoje e pintada
com `selected`, e `selected` tem alfa** (`rgb(212 243 74 / 0.16)` no claro,
`/ 0.05` no escuro). Uma tarja de alfa sobre uma coluna de alfa sobre a
superficie e uma pilha de tres camadas, e a tabela nao tem nenhuma assim para
tom de evento.

- **Cinco pares compostos novos:** `{tom}-text` sobre
  `[{tom}-subtle, selected, surface]`, para `accent`, `success`, `warning`,
  `danger` e `info`. O `neutral` escapa, e escapa por medida e nao por sorte:
  ele pinta `surface-raised`, que e opaco, entao ele cobre o `selected` inteiro
  e recai num par que ja existe.
- **Um limite novo:** `danger` sobre `[selected, surface]`, a 3:1. E a linha do
  agora, que so aparece na coluna de hoje, que e justamente a unica coluna
  pintada. Hoje a tabela mede `danger` sobre `bg` e sobre `surface`, e nunca
  sobre `selected`.
- **Nenhum par novo para a borda de hoje:** `border-strong` sobre
  `[selected, surface]` ja esta na tabela, com a nota "hoje dentro do
  intervalo". A peca reusa.
- **Seis pares de camada, se o estado pressionado for opacidade.** Se a tarja
  usar `active:opacity-90`, como o botao destrutivo ja usa, sao seis entradas
  novas em `MAP_LAYER_PAIRS`, uma por tom, no formato que ja existe la.
- **Nenhum par novo para a contagem da linha da `week`, se ela for escrita com
  `accent-text`.** Vale escrever porque a tentacao e a outra: uma bolinha em
  `accent` seria um par novo, porque `accent` **nao esta** entre os limites
  medidos - la estao `border-strong`, os quatro estados e a serie do grafico.
  `accent-text` ja e medido como texto, entao passa folgado em 3:1. E uma marca
  de graca.

**E a serie `chart-1..8`, que e onde a pergunta interessante mora.** Ela e
medida **so como limite nao textual**, a 3:1, e **so sobre `bg` e `surface`** -
o laco que a gera pula `surface-raised` de proposito. Duas consequencias, e as
duas sao respostas para a quarta pergunta humana do desenho do web ("cor por
calendario"):

1. **A serie nao serve de fundo de tarja com titulo em cima.** Isso pediria oito
   pares de TEXTO a 4,5:1 que a paleta nunca prometeu, porque ela foi construida
   para separar fatias de rosca umas das outras, e nao para carregar texto.
2. **Se cor por calendario entrar, ela entra como listra**, uns 3pt na borda que
   comeca a leitura, dentro de uma tarja que continua com o fundo do `tone`. E
   ainda assim sao **oito pares novos**, porque a listra pousa sobre
   `{tom}-subtle` composto, e sobre `surface-raised` no tom neutro, que e
   exatamente o fundo que o laco de hoje pula.

A proposta e que a v1 nativa nasca so com `tone`, igual ao web, e que a listra
seja discutida depois com esses oito pares na mesa. Esta na lista do dono.

## 7. RTL: o que espelha e o que nao

Quatro pecas do web tiveram defeito de RTL este mes, e o do `Tree` foi o pior
porque `paddingLeft` e fisico: os tres niveis paravam no mesmo pixel e a
hierarquia era invisivel. Uma grade de tempo tem eixo horizontal, entao ela
esta na mesma familia de risco. E aqui e pior que no web em um ponto especifico:
**os atalhos logicos nao funcionam no compilador nativo.** A propria lista do
"nunca faca" do pacote diz que `border-x` gera `border-inline`, que nao existe
la. Nao ha `ps-`, nao ha `pe-`, nao ha `start-0`. Sobra `I18nManager.isRTL`
calculado a mao, que e o que a `FilterBar` nativa ja faz para saber de que lado
sobrou conteudo escondido.

**Espelha:**

- **A calha das horas**, que fica na borda que comeca a leitura. E `pl-` contra
  `pr-` decidido pela direcao, nao uma propriedade logica.
- **A ordem das sete colunas do `month`.** O `flexDirection: row` inverte
  sozinho quando o aplicativo esta em RTL, entao a fileira sai de graca.
- **A barra de varios dias dentro da semana do `month`, que NAO sai de graca.**
  Ela e posicionada em absoluto por porcentagem, e posicao absoluta nao inverte
  junto com o `flexDirection`. E o mesmo par de armadilhas do `Tree` numa forma
  nova: metade do desenho espelha sozinha e a outra metade nao, o que e pior do
  que nenhuma metade espelhar, porque o resultado parece quase certo.
- **O eixo do tempo dentro da linha da `week`.** Este e o unico lugar da peca em
  que o tempo e horizontal, e portanto o unico em que o tempo espelha: as 7h
  comecam na borda que comeca a leitura. Se nao espelhasse, a linha se leria de
  tras para a frente.
- **O sinal do deslize.** Deslizar para o proximo periodo e deslizar na direcao
  em que a leitura avanca, e em RTL isso e o oposto. E a mesma conta que a
  `FilterBar` faz para saber quanto ja passou, e e a licao que o `Tracker`
  pagou com defeito real: espelhar o desenho sem espelhar a conta.
- **As setas da barra de ferramentas**, como o web ja as espelha.

**Nao espelha:**

- **O eixo do tempo na `day` e a altura da tarja.** Ele e vertical, e o vertical
  nao tem lado. Sete horas ficam acima de oito horas em qualquer direcao.
- **A ordem cronologica da `agenda`** e a ordem das secoes. Tempo nao inverte.
- **A ordem das sete linhas da `week`.** Segunda continua em cima de terca, e e
  por isso que a `week` em linhas e mais barata em RTL do que a `week` em
  colunas seria: o eixo dos dias sai do eixo que espelha.
- **A linha do agora na `day`**, que atravessa a largura inteira e nao tem
  ponta.

## 8. O tamanho, e como a peca se divide

A peca do web tem **1446 linhas**, e e o maior arquivo do repositorio. O maior
arquivo de `native/src` hoje tem **304** (`filter-bar.tsx`), e o pacote inteiro
tem cerca de 5.600 linhas. A versao nativa, com quatro vistas, vai ficar entre
mil e mil e duzentas linhas mesmo com o teclado e o `classNames` de fora: sao
quatro desenhadores, a barra, a tarja com alvo separado, e a montagem das
frases faladas.

Isso significa que esta peca sozinha aumenta o pacote em cerca de **um quinto**.
E o pacote publica FONTE: o metro compila tudo dentro do aplicativo de terceiro.

**Um arquivo so esta fora de questao**, e nao pelo tamanho em si: o arquivo de
mil linhas com quatro desenhadores dentro e o arquivo em que ninguem consegue
revisar um diff. A proposta e a pasta:

```
native/src/event-calendar/
  index.tsx      a peca, o estado, o gesto e a montagem
  toolbar.tsx    navegacao, "ir para a data" e seletor de vista
  agenda.tsx     a SectionList
  day.tsx        a grade de tempo
  week.tsx       as sete linhas
  month.tsx      a grade de celulas
  event.tsx      a tarja nas tres formas, e o alvo de 44pt
  speech.ts      as frases que o leitor de tela ouve
```

Duas observacoes que precisam estar escritas:

- **Seria a primeira pasta de `native/src` que nao e subcaminho.** Hoje
  existem `chart/`, `form/`, `clipboard/` e `file-upload/`, e as quatro sao
  pastas porque sao subcaminhos com peer proprio. Uma pasta que existe so para
  organizar arquivo e novidade. O `native/src/index.ts` continua com uma linha
  so, e nada da superficie publica muda.
- **Dividir em arquivos nao economiza um byte no aparelho.** O `files` do pacote
  leva `src` inteira, e o barril da raiz importa tudo, entao o calendario e
  compilado no aplicativo de quem so usa `Button`. Isso ja e verdade hoje para
  todas as pecas; a diferenca e que nenhuma delas custava um quinto do pacote.
  A saida obvia - subcaminho `@rivocode/ui-native/calendar` - contraria a regra
  escrita "um subcaminho por peer, e nao um por assunto". **A regra ganha, e a
  excecao e decisao do dono**, com o numero medido nesta secao na mesa.

## 9. O `event-layout` e compartilhavel, e a ordem importa

**Ele e puro pelo criterio inteiro.** `src/lib/event-layout.ts` e `.ts`, tem
**zero imports**, nao menciona `document`, `window`, `navigator`, `process` nem
`HTMLElement`, e vive de `Date` e `Math`. Passa na Regra 1 do
`check:compartilhado` sem ressalva. Nao tem sequer o asterisco que o `applyMask`
tem (o `console.warn` de desenvolvimento) nem o do `format.ts` (o `Intl`).

**E ele passa tambem na segunda metade do criterio, que e a que recusa gaveta
de tralha.** O documento do codigo puro exige que a coisa **ja esteja
duplicada**, e recusa byte morto no aparelho. As duas exigencias se resolvem
aqui:

- A duplicacao nao existe hoje porque nao existe calendario nativo, e passa a
  existir no minuto em que ele for escrito. O proprio documento de 27/08 ja
  nomeia `src/lib/event-layout.ts` na fila e diz que ele e "o que o
  `EventCalendar` nativo vai pedir primeiro".
- Nao ha byte morto: a peca nativa alcanca o arquivo inteiro. `visibleDays`
  chama `startOfWeek`, `monthDays`, `eachDay`, `startOfMonth`, `endOfMonth` e
  `daysBetween`; a `agenda` e a `day` chamam `splitEvents` e `touchesDay`; a
  faixa de dia inteiro e o `month` chamam `toBars` e `packBars`; a `day` e a
  `week` chamam `layoutDay`, `segmentBox` e `minutesOfDay`; a triagem chama
  `spansFullWindow`. Nenhuma funcao viaja sem ser chamada.

**O mecanismo ja existe, e isso muda a ordem de "boa pratica" para
"obrigatoria".** `src/shared/` esta no disco com `time.ts` e `settled.ts`,
espelhados em `native/src/shared/`, e o `check:compartilhado` roda no gate
entre o `check:tema:nativo` e o `check:paridade`. A Regra 3 dele quebra as duas
arvores em declaracoes de primeiro nivel e acusa toda que aparecer nas duas.

Entao: **o `event-layout.ts` migra ANTES de a peca nativa ser escrita.** Nao e
higiene, e o gate. Escrever a peca primeiro faz `splitEvents`, `layoutDay`,
`packBars`, `segmentBox` e o resto aparecerem como copias nao declaradas, e o
`check` fica vermelho ate alguem ou migrar o arquivo, ou escrever uma linha por
funcao em `COPIA_DECLARADA` - numa lista de catorze entradas cujo acordo e so
encolher, para copias que nunca precisaram existir.

Duas consequencias de fora desta frente, ja registradas para quem for executar:

- Migrar significa tocar uma linha de import em
  `src/components/event-calendar.tsx`, e re-exportar do lugar antigo para a API
  publica nao mudar. O documento do codigo puro ja registra isso como o item 5
  das decisoes dele, e a propria mensagem de erro da guarda manda fazer assim.
- A nota do `EventCalendar` em `scripts/paridade-nativo.ts` ainda diz que "nao
  ha mecanismo no repositorio para compartilhar codigo puro entre os dois
  pacotes". **Essa frase ja e falsa hoje**, e ela alimenta a secao "No React
  Native" da pagina publicada. Corrigi-la e trabalho de quem mexer na paridade,
  e nao deste documento.

## 10. As oito perguntas que sobraram do desenho do web

A terceira foi respondida pelo dono. As outras oito, com o que este documento
propoe para o lado nativo:

1. **O nome.** Fechado pelo web, e o nativo nao pode escolher outro:
   `EventCalendar`, com os mesmos quatro valores de `view`. A `week` do telefone
   guarda o nome porque o periodo que ela carrega e busca continua sendo a
   semana; o que muda e o desenho.
2. **`month` na v1.** Sim, e agora com motivo forte: ela e a vista que serve o
   vencimento de nota, que e a metade nova do caso de uso.
4. **Cor por calendario.** Fora da v1 nativa, e agora com medida em vez de
   opiniao: a serie do grafico e medida a 3:1 e so sobre `bg` e `surface`. Se
   entrar, entra como listra, e custa oito pares novos.
5. **Horario de verao.** O nativo herda a decisao do web: desenha pelo relogio
   de parede, o erro fica num bloco e nao na grade. O que o nativo acrescenta e
   a linha do agora saindo do `AppState` e nao de um temporizador solto, o que
   tambem conserta o caso de o telefone atravessar a virada no bolso.
6. **Criacao por teclado.** Nao ha teclado; ha leitor de tela. A traducao e uma
   acao de acessibilidade na coluna do dia que devolve o dia inteiro, e a hora
   e perguntada pelo app.
7. **Codigo puro compartilhado.** Respondido pelo documento de 27/08. Aqui
   sobra a ordem, na secao 9.
8. **`hourHeight` e densidade.** Densidade nao existe no nativo, entao sobra o
   `hourHeight`. A proposta e manter 48: 13 horas dao 624pt, uma tela de
   rolagem, e meia hora da 24pt, que cabe uma linha de texto pequeno com folga.
   O problema dos quinze minutos nao se resolve por escala (para 44pt seria
   preciso 176px por hora) e sim pelo alvo, que e a secao 3.
9. **Nada disso foi medido em tela.** Continua verdade, e no nativo pesa mais:
   `demo/` e a vitrine do web, o `check:demo` nao alcanca o pacote nativo, e a
   unica bancada e o `examples/native` num simulador. Os 24,15px por hora da
   `week` em linhas sao aritmetica, como os 44,8px eram. Vale um esqueleto com
   dado falso antes da peca, e o `Editable` nativo ja esta listado no `ESTADO`
   como a peca que mereceu prototipo e nao teve.

## Decisoes que sao do dono

Em ordem de quanto travam o comeco do codigo.

1. **A `week` do telefone vira sete linhas com o tempo na horizontal?** E a
   decisao mais cara deste documento: um quarto desenhador, que o web nao tem,
   para uma vista que no telefone nao le titulo nem hora. As duas alternativas,
   com o custo de cada uma: (a) a `week` nao porta, o seletor mostra tres e
   `view="week"` resolve para `day` - e menos trabalho e contraria a decisao
   das quatro vistas; (b) a `week` vira a `day` com um trilho de sete dias em
   cima - parece a mesma coisa que (a) com um enfeite, porque a unica diferenca
   e o periodo que a peca busca.
2. **Onde mora o anunciador que o iOS exige?** `accessibilityLiveRegion` e do
   Android, e a navegacao principal desta peca troca a tela sem mover o foco.
   Ela nao consegue passar por cima da divida numero 1 do `ESTADO.md`, e tambem
   nao deveria resolve-la sozinha dentro de um calendario. Quem paga o retrofit
   das tres pecas que hoje anunciam so no Android?
3. **O calendario fica no barril da raiz?** Ele custa cerca de um quinto do
   pacote a todo aplicativo que importar qualquer coisa, inclusive quem nunca
   desenha calendario. A regra "um subcaminho por peer, e nao um por assunto"
   manda ficar. E a primeira vez que o preco dela e medido.
4. **A pasta `native/src/event-calendar/` pode existir?** Seria a primeira pasta
   do pacote que nao e subcaminho. A alternativa e sete arquivos irmaos com
   prefixo no nome, que e mais feio e nao muda nada mais.
5. **O deslize pode trocar de periodo sem acompanhar o dedo?** Nao ha uma linha
   de `Animated` em `native/src`, e faze-lo acompanhar significa estrear
   animacao no pacote por causa desta peca.
6. **O toque longo no vazio cria?** E o unico gesto que o nativo teria e o web
   nao - la e um clique. Se a resposta for nao, o nativo nao cria por gesto
   nenhum e `onSlotSelect` so dispara na celula do mes, que ja e um toque
   simples.
7. **Cor por calendario entra como listra, com os oito pares novos?** A conta
   esta na secao 6. A proposta e nao na v1.
8. **Quanto vale um esqueleto no `examples/native` antes da peca?** Os 24,15px
   por hora da `week` em linhas e os 44pt de alvo sobre tarjas de 12pt sao
   aritmetica, e a nona pergunta do desenho do web continua sem resposta: nada
   disso foi visto numa tela.
