---
category: Dados
---

# EventCalendar

O calendário de compromissos: o que acontece, quando, e por quanto tempo.

O `Calendar` da casa responde "que dia?". O dado que ele carrega é uma data, ou
duas, e o desenho dele é um mês de números com um deles pintado. O
`EventCalendar` carrega uma lista de compromissos com começo e fim, e existe
para mostrar as duas coisas que uma lista de texto não mostra: **quanto tempo
cada um ocupa** e **quais se atropelam**.

```tsx
<EventCalendar
  defaultView="week"
  defaultDate={anchor}
  events={events}
  label="Agenda da equipe"
  onRangeChange={({ start, end }) => carregar(start, end)}
  onEventSelect={(event) => abrir(event.id)}
  onSlotSelect={({ start, end }) => novo(start, end)}
/>
```

Um compromisso é um objeto pequeno, e o vocabulário de cor é o fechado da casa:

```ts
type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
}
```

**`tone`, e não `color`.** É a primeira tentação de um calendário, um hexa por
evento, e ela não tem como dar certo aqui: cor literal fora de `src/tokens` é
reprovada pela guarda, e um hexa vindo do app não tem par de contraste medido.
Quem precisa de mais tem `renderEvent` e `classNames.event`, com as classes da
casa. E cor nunca é o dado: se vermelho significa "cancelado", alguma coisa
precisa escrever "cancelado", ou a informação não existe para metade das
pessoas.

## As quatro vistas, e os três motores

São quatro vistas e três motores de desenho, porque `day` é `week` com uma
coluna só.

- **`agenda`** é uma lista agrupada por dia. Funciona em qualquer largura, é a
  única que não pede geometria nenhuma, e é o que o leitor de tela ouve em
  todas as outras (ver "Acessibilidade").
- **`week`** é a razão de a peça existir. Sete colunas de tempo lado a lado é a
  única forma de ver que a quinta está lotada e a sexta está vazia.
- **`day`** é a mesma grade com uma coluna, e ganha valor próprio por ser a
  única grade de tempo que cabe em 390px.
- **`month`** é o mapa de densidade: quantas coisas em cada dia, e em que
  ordem. É a vista que responde "quando vence" melhor do que qualquer outra.

### O que a `month` não mostra, e é preciso saber antes de escolhê-la

Numa célula de mês **não cabe duração** e **não cabe sobreposição**. Todo
compromisso vira uma tarja da mesma altura: uma reunião de quinze minutos e um
treinamento de oito horas ficam idênticos. E dois eventos às 14h ficam um
embaixo do outro exatamente como dois eventos às 9h e às 17h, então a tela não
diz que eles batem.

**Quem precisa ver choque de horário usa `day` ou `week`.** A `month` serve
para a pergunta anterior a essa: em que dia isso cai, e esse dia já está cheio?
Dentro da célula a ordem é cronológica, o que passa de `maxLanes` (três, de
saída) vira um `+N mais`, e esse botão abre a lista daquele dia, que é a vista
`agenda` de um dia só.

## O que acontece a 390px

A largura útil da casa a 390px é 358px, e a partir daí a aritmética decide
sozinha:

- **`week`**: 358 menos 44 da calha das horas dá 314px, dividido por sete dá
  **44,8px por coluna**. A coluna atinge o alvo de toque e é só isso que ela
  atinge: em 44px cabem umas cinco letras, e "Reunião com o contador" vira
  "Reun…". Sete colunas dessas são uma tela sem informação nenhuma.
- **`day`**: 314px de coluna única, com texto legível e sobreposição visível.
- **`month`**: 358 dividido por sete dá **51px por célula**.

**A decisão:** abaixo de 640px a `week` some do seletor, e `view="week"` recebido
por prop resolve para `agenda`, calado, do mesmo jeito que o `Calendar` ignora
`numberOfMonths` no celular e que o `Dialog` vira `Sheet`. É precedente da casa
em três lugares.

**A `month` fica**, e o motivo é que ela não é a `week` com outro nome. Uma
coluna de `week` precisa mostrar *hora e duração* em 44px, e não mostra; uma
célula de `month` precisa mostrar *que existe alguma coisa, e mais ou menos o
quê*, em 51px, e isso sobrevive ao corte: a tarja continua legível pelas
primeiras palavras, a contagem do dia continua exata, e o `+N mais` abre a
lista completa numa folha de baixo. No celular, quem procura duração vai para a
`day`; quem procura "que dia" fica na `month`.

**O que não se faz, e é a saída que todo mundo tenta primeiro: rolagem
horizontal na semana.** A grade de tempo já rola na vertical, e somar rolagem
horizontal cria duas direções de gesto disputando o mesmo dedo. O dedo perde.

## O compromisso que atravessa dias

Um compromisso de 14/03 às 22h a 16/03 às 9h não é um retângulo, são três
pedaços em três colunas, e o dado é um só. **A peça não guarda evento partido:
ela o parte na apresentação.** Cada segmento carrega `continuesBefore` e
`continuesAfter`, e é isso que tira o arredondamento da beirada e que faz o
texto acessível dizer "continua do dia anterior". Sem esses dois sinalizadores,
um evento de três dias vira três compromissos idênticos e ninguém sabe se são
três reuniões ou uma.

São dois casos, e eles vão para lugares diferentes da tela:

1. **Dia inteiro e multi-dia** (`allDay`, ou duração maior que a janela de horas
   visível) vão para a **faixa de dia inteiro**, acima da grade, como barras que
   atravessam colunas. A faixa empilha em lanes (ordena por começo e, empatado,
   por duração decrescente, e põe cada barra na primeira lane livre), tem teto
   de `maxLanes`, e o resto vira `+N`.
2. **A noite que cruza a meia-noite** (22h às 9h) é partida em dois segmentos e
   **não** sobe para a faixa, porque a hora dela é informação: 22h é tarde da
   noite, e a faixa de cima diria só "quarta e quinta".

Onde o evento se parte depende do fuso do navegador. O mesmo compromisso visto
de outro fuso pode não cruzar a meia-noite, e então não se parte. É consequência
direta de a peça não conhecer fuso, e é comportamento, não defeito.

## O compromisso que se sobrepõe a outro

O algoritmo é o mesmo do Google Agenda, e vale escrever porque o erro é sempre o
mesmo: quem tenta resolver evento a evento produz larguras que não fecham.

1. **Agrupar em conjuntos.** Um conjunto é um grupo ligado por sobreposição
   transitiva: A bate em B, B bate em C, então A, B e C são um conjunto, mesmo
   que A e C não se toquem. A largura se divide por conjunto, nunca por par.
2. **Colunas dentro do conjunto.** Percorre em ordem de começo e põe cada evento
   na primeira coluna onde ele não bate em nada.
3. **Expandir para a direita.** Quem tem espaço livre à direita cresce até
   esbarrar. É o que impede a tela de virar quatro tirinhas finas quando só dois
   horários realmente colidem.

`maxColumns` (três, de saída) é o teto. O que passa dele vira um `+N mais` na
última coluna, que abre a lista do dia. A 314px de coluna única no celular, três
colunas dão 104px cada, que ainda têm texto; a quarta não teria.

## O piso de altura, e o que ele custa

A 48px por hora, um compromisso de quinze minutos tem 12px e um de cinco minutos
tem 4px. Nenhum dos dois é alvo de toque, e em nenhum dos dois cabe texto. A
tarja tem então um **piso de altura desenhada**: `--rc-control-md` na mesa (40px
confortável, 32px compacto, portanto sensível à densidade) e 44px no celular.

**O piso é só do desenho. O cálculo de sobreposição roda nos horários reais**, e
essa separação é a decisão inteira. A consequência precisa estar escrita, porque
ela aparece na tela: dois compromissos de dez minutos separados por quinze
minutos não se sobrepõem no dado e **se sobrepõem na tela**. Eles se desenham
empilhados, com sombra, e não roubam coluna um do outro.

É um defeito visual assumido, e a alternativa é pior: deixar o layout usar as
alturas pisadas faz a grade inteira mentir, porque aí a largura de todo mundo
passa a depender de um número que não é o horário. Um erro fica na beirada de
dois eventos curtos; o outro se espalha pelo dia.

A área que rola tem `maxHeight` (560px de saída) na `agenda`, na `day` e na
`week`; a `month` cresce com o número de linhas e rola junto com a página,
porque uma célula de mês só serve inteira.

Pelo mesmo motivo, quem cai fora da janela de `dayStart`/`dayEnd` não some:
encosta na beirada da calha, com o piso de altura, e continua na `agenda` e na
`month`. `dayStart`/`dayEnd` existem porque 24 horas a 48px são 1152px de
altura, e ninguém tem expediente à meia-noite: de 7h às 20h dá 624px, que cabe
numa tela.

**Horário de verão.** A peça desenha pelo relógio de parede: a linha das 14h
fica em `14 * hourHeight`, sempre. Num dia de virada, o bloco que atravessa a
mudança sai uma hora maior ou menor do que a duração real, e nenhuma linha de
hora se desloca. É a troca escolhida: o erro fica num bloco, e não na grade
inteira.

## Acessibilidade

Uma grade de calendário é duas coisas incompatíveis: uma tabela bidimensional
para quem navega por teclado, e uma lista cronológica para quem ouve.

**Para quem ouve, toda vista é a vista `agenda`.** O andaime visual (as linhas
de hora, a calha, os cabeçalhos de coluna, os nomes dos dias da semana no mês)
sai `aria-hidden`. O que se expõe é, por dia, um grupo com nome acessível
("Terça-feira, 17 de março, 3 compromissos") e, dentro dele, uma lista em ordem
cronológica com `aria-setsize` e `aria-posinset` por evento. É o mesmo par que a
`VirtualList` escolheu, e pelo mesmo motivo: a contagem tem que ser a real, e
não a desenhada, porque o que está escondido atrás de um `+N mais` continua
existindo.

A faixa de dia inteiro é um grupo à parte, chamado "Dia inteiro", com a própria
lista e a própria contagem. O nome do grupo de cada dia continua somando tudo o
que cai naquele dia, a faixa inclusive: é a resposta certa para "quão cheia está
a terça".

**O que não se faz:** `role="grid"` com uma célula por meia hora. Uma semana de
24 horas em blocos de trinta minutos dá 336 células, quase todas vazias, e cada
uma é uma parada. É o erro que a maioria das bibliotecas de calendário comete, e
é o mesmo erro do `Tracker` numa forma nova.

**Para o teclado, uma parada de tabulação para a peça inteira**, com foco
itinerante entre **eventos**, e não entre células. Precedente direto do
`Tracker`, que é uma parada só para 365 quadrados.

| Tecla | O que faz |
|---|---|
| `↑` `↓` | evento anterior e próximo dentro do dia, em ordem de hora |
| `↑` `↓` na `month` | no primeiro e no último do dia, pula para a mesma coluna da semana de cima ou de baixo |
| `↑` `↓` na `agenda` | anterior e próximo da lista, atravessando os dias |
| `←` `→` | o evento mais próximo em hora, no dia anterior ou seguinte |
| `Home` `End` | primeiro e último evento do período visível |
| `PageUp` `PageDown` | período anterior e seguinte |
| `Enter` `Espaço` | dispara `onEventSelect`, ou abre o `+N mais` |
| `Esc` | devolve o foco à barra de ferramentas |

`←` e `→` seguem a direção da escrita: em RTL, `←` anda para o dia seguinte. A
direção vem do `RivoProvider`, e isso entrou na v1 e não depois, porque espelhar
o desenho sem espelhar a conta já custou defeito real em quatro peças da casa.

Mais três coisas:

- **A troca de período se anuncia** numa região viva: "16 a 22 de março de 2026,
  7 compromissos". Desenho não chega a quem ouve, e a paginação é a única
  mudança grande que não move o foco.
- **`aria-current="date"` viaja com o grupo do dia**, e não com o cabeçalho da
  coluna. O cabeçalho é andaime e sai `aria-hidden`, então um `aria-current`
  nele não seria lido por ninguém; o grupo de hoje ainda diz "hoje" no nome.
- **A linha do agora é decorativa** (`aria-hidden`). Ela não é dado, é um
  relógio, e quem ouve tem o relógio do próprio aparelho.

## Os quatro finais, e onde o vazio aparece

Os mesmos do `DataTable` e da `VirtualList`, na mesma ordem e com os mesmos
nomes de prop: **erro vence carregando, e vazio só vale depois que a consulta
voltou**. `isLoading` e `events === undefined` são a mesma coisa. `errorTitle`,
`errorMessage`, `onRetry` e `retryLabel` são o conjunto do erro. A espera se
anuncia em voz alta na mesma região viva das irmãs.

O vazio tem uma diferença que é decisão desta peça: **na `agenda` ele ocupa o
lugar da lista; nas grades ele fica por cima, e a grade continua desenhada**.
Uma grade é também a superfície onde se clica para criar, e esconder a semana
quando a semana está livre é esconder exatamente o horário vago que a pessoa
procurava.

## O que sai quando o período muda

`onRangeChange` avisa que o período visível mudou, e é o gancho para o app
buscar. **O fim é exclusivo**: é a meia-noite do dia seguinte ao último dia
mostrado, o que faz a comparação no servidor ser `start <= x < end` sem
milissegundo de sobra. A `agenda` e a `month` compartilham o mês como período,
com uma diferença: a `month` desenha semanas inteiras, então ela mostra os dias
vizinhos que completam a primeira e a última linha, e o intervalo emitido inclui
esses dias.

## Partes

`classNames` veste cada parte sem ninguém alcançar o nó interno por `[&>div>div]`:

- **`toolbar`**: a barra com navegação, "ir para a data" e seletor de vista.
- **`body`**: a moldura que envolve a vista.
- **`header`**: a linha de cabeçalho de dia, na grade e no mês.
- **`gutter`**: a calha das horas.
- **`column`**: a coluna de um dia na grade de tempo.
- **`cell`**: a célula de um dia no mês.
- **`band`**: a faixa de dia inteiro.
- **`section`**: o bloco de um dia na agenda.
- **`event`**: a caixa de cada compromisso, nas três formas.

`renderEvent` troca só o miolo da tarja. A caixa, o foco, o posicionamento e o
rótulo acessível continuam da peça, porque são eles que sustentam a navegação
por teclado.

## O que ela não faz

Cada linha aqui é uma porta que alguém vai tentar abrir, e é o que impede a peça
de virar aplicação.

1. **Não busca dado.** Entram `events`, `isLoading`, `isError`, `onRetry` e
   `empty`; sai `onRangeChange`. Mesma divisão do `DataTable`, da `VirtualList` e
   do `QueryBoundary`.
2. **Não conhece fuso de servidor.** Tudo é `Date`, na hora local do navegador,
   como o `DatePicker` já decidiu. Um compromisso gravado em `America/Sao_Paulo`
   e visto de Lisboa aparece na hora de Lisboa; se não é isso que se quer,
   converta antes de entregar. Uma peça que conhecesse fuso precisaria de banco
   de fusos, e banco de fusos é o começo de uma biblioteca de datas.
3. **Não edita.** Sem arrastar para mover, sem esticar para redimensionar. Ela
   emite `onEventSelect` e `onSlotSelect` (o clique no vazio devolve o intervalo
   de meia hora que foi clicado, ou o dia inteiro no mês) e o app abre o
   `Dialog` que quiser. Arrastar num touch disputa com a rolagem, e é a linha
   exata onde um componente vira aplicação.
4. **Não expande recorrência.** Sem RRULE, sem exceção de série: o app entrega
   as instâncias já expandidas.
5. **Não faz recurso.** Colunas por sala ou por profissional, em vez de por dia,
   é o mesmo motor com outro eixo, e é necessidade real de clínica e de
   barbearia. Fica para depois, e a porta está aberta.
6. **Não imprime**, não exporta `.ics`, não sincroniza com nada.

## Duas escolhas de construção que se veem de fora

**A `agenda` não é virtualizada, de propósito.** A estrutura que a
acessibilidade exige aqui (um grupo por dia, com a lista dele dentro, e
`aria-setsize` por evento) é aninhada, e uma janela virtual é uma lista plana:
não dá para expressar as duas ao mesmo tempo sem mentir na contagem. Some-se que
o foco itinerante precisa que o elemento exista no DOM para receber foco, e o
período visível é no máximo um mês, o que limita a lista a algumas dezenas de
seções. Para um ano inteiro numa rolagem só, o caminho é a `VirtualList` com o
`renderItem` que você já tem.

**No mês, o compromisso de vários dias é desenhado por dia**, e não como uma
barra única atravessando a linha. Todos os pedaços ficam na mesma lane, então a
leitura continua sendo de uma faixa contínua, e as beiradas de continuação
perdem o arredondamento. O que se ganha com isso é o grupo do dia: cada célula
contém os compromissos daquele dia, que é o que o leitor de tela precisa ouvir.

## Quando não usar

**Se ninguém precisa ver duração nem choque de horário, use `DataTable`.** Esta
é a mais importante, e é a que mais se erra. Uma listagem de agendamentos com
coluna de cliente, hora, status, ordenação e filtro é uma tabela, e a tabela já
faz tudo isso melhor. O `EventCalendar` só se paga quando a resposta que se
procura é geométrica: "esse bloco é grande demais", "esses dois batem". Fora
disso ele é uma tabela cara e com menos recursos.

**Se a pergunta é "que dia?", use `Calendar`, `DatePicker` ou
`DateRangePicker`.** Escolher um vencimento não é ver uma agenda, e um
`EventCalendar` para isso é uma grade de 24 horas onde a pessoa queria sete
números.

**Se a pergunta é "o que aconteceu com esta coisa?", use `Timeline`.** Ela olha
para trás, é sobre um objeto só (uma nota fiscal, um contrato) e os eventos dela
são instantes sem duração. Um `EventCalendar` de uma nota fiscal desenharia
cinco carimbos de zero minuto espalhados por três meses de grade vazia.

**Se a pergunta é "quantos, por período?", use `Tracker`.** Ele conta
ocorrências discretas, não tem hora e cabe dentro de um `Stat`.

## No React Native

Na fila, e a fila e por DESENHO de gesto, nao por tempo. Tres das quatro vistas portam: a `agenda` vira `SectionList` (virtualizacao de fabrica, o mesmo argumento que tirou a `VirtualList` do catalogo nativo), a `day` e uma coluna unica de 314px, que e coluna de verdade, e a `month` sobrevive aos 51px por celula porque a celula so precisa mostrar que existe alguma coisa e mais ou menos o que.

**A `week` nao porta.** Sete colunas em 358px dao 44,8px cada, e a coluna de semana existe para mostrar hora e duracao. Em 44,8px ela mostra um retangulo colorido, que e o que a `month` ja faz melhor e mais barato. O web tomou a mesma decisao para a propria tela estreita: abaixo de `sm` a `week` some do seletor e `view="week"` resolve para `agenda`.

O que falta e decisao de gesto, e por isso a linha esta em `FILA_DECLARADA`: o que o dedo faz para trocar de periodo, o que ele faz quando pousa em cima de dois eventos que se sobrepoem, e se toque longo cria. Nenhuma dessas tem resposta no web, porque no web sao ponteiro e teclado. O desenho esta escrito em `docs/2026-08-27-event-calendar-nativo-desenho.md`, e as perguntas que sobraram estao listadas la.

O calculo de layout ja nasceu pronto para atravessar: `src/lib/event-layout.ts` e funcao pura sem DOM, sem import e sem global de plataforma. O mecanismo para compartilhar codigo puro entre os dois pacotes passou a existir em 27/08/2026 - `src/shared/`, o espelho em `native/src/shared/` e o `check:compartilhado` no gate -, entao a peca nativa nao pode copiar essas funcoes: copia nao declarada deixa a guarda vermelha.
