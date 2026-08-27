# Calendar de agenda: design

Data: 2026-08-27. O último item da auditoria, e o único que não se apoia em
nada pronto. Este documento existe para ser discutido antes de qualquer linha
de código, como `Tree`, `TreeSelect` e `Editable` foram.

## O nome, que é a primeira decisão

`Calendar` está ocupado, e a peça ocupante está certa em ocupá-lo. A proposta é
**`EventCalendar`**, com as partes `EventCalendarToolbar`, `EventCalendarGrid`
e `EventCalendarEvent`.

`Agenda` foi considerado e descartado: é a palavra que a gente usa em português
para a coisa toda, então ela viraria também o nome da vista de lista, e a peça
teria uma vista chamada como ela mesma. `Scheduler` foi descartado porque
promete alocar, e esta peça não aloca (ver "O que ela não faz"). **É decisão
humana**, e é a que menos custa mudar agora e mais custa mudar depois: o nome
vaza para o `.d.ts`, para o site, para a tabela de paridade e para a skill.

## O problema, e a fronteira com o `Calendar` de hoje

O `Calendar` de hoje responde **"que dia?"**. Ele é a `react-day-picker`
vestida pelos tokens, o mês cru, e o que ele desenha é um mês de números onde
um deles fica pintado. O dado que ele carrega é uma data, ou duas.

O `EventCalendar` responde **"o que acontece, quando, e por quanto tempo?"**.
O dado que ele carrega é uma lista de compromissos com começo e fim, e o
desenho existe para mostrar duas coisas que uma lista de texto não mostra:
**quanto tempo cada um ocupa** e **quais se atropelam**.

A fronteira, escrita para a seção "quando não usar":

- **Se a pergunta é "que dia?", use `Calendar`, `DatePicker` ou
  `DateRangePicker`.** Escolher um vencimento não é ver uma agenda, e um
  `EventCalendar` para isso é uma grade de 24 horas onde a pessoa queria sete
  números.
- **Se a pergunta é "o que aconteceu com esta coisa?", use `Timeline`.** Ela
  olha para trás, é sobre um objeto só (uma nota fiscal, um contrato), e os
  eventos dela são instantes sem duração. Um `EventCalendar` de uma nota fiscal
  desenharia cinco carimbos de zero minuto espalhados por três meses de grade
  vazia.
- **Se a pergunta é "quantos, por período?", use `Tracker`.** Ele conta
  ocorrências discretas e não tem hora.
- **E a mais importante: se ninguém precisa ver duração nem choque de horário,
  use `DataTable`.** Uma listagem de agendamentos com coluna de cliente, hora,
  status, ordenação e filtro é uma tabela, e a tabela já faz tudo isso melhor.
  O `EventCalendar` só se paga quando a resposta que se procura é geométrica:
  "esse bloco é grande demais", "esses dois batem". Fora disso ele é uma tabela
  cara com menos recursos.

## As vistas

A pergunta não é quantas vistas cabem, é quantos motores de desenho a peça
compra. São três motores diferentes, e não quatro vistas:

| Motor | Serve | Custo |
|---|---|---|
| **Lista por seção** | `agenda` | baixo. É uma lista agrupada por dia. Herda a virtualização que já está paga. |
| **Grade de tempo** | `day` e `week` | alto. É onde moram o empilhamento, a sobreposição e a linha do agora. Um motor, duas vistas: `day` é `week` com uma coluna. |
| **Grade de célula** | `month` | médio, e é o que menos entrega. |

### O que ship na v1: `agenda`, `day`, `week`

`agenda` é a base, e não a sobra: é a única que funciona em qualquer largura, é
a que o leitor de tela ouve em todas as vistas (ver "Acessibilidade"), e é a
que responde "o que tenho pela frente" sem nenhuma geometria.

`week` é a razão de a peça existir. Sete colunas de tempo lado a lado é a única
forma de ver que a quinta está lotada e a sexta está vazia.

`day` sai de graça: é a mesma grade com `days = 1`. E ela ganha valor próprio
por ser a única grade de tempo que cabe em 390px.

### `month` fica fora da v1, e o motivo é o que ele não mostra

`month` é a vista que as pessoas pedem pelo nome e a que menos responde à
pergunta da peça. Numa célula de mês não cabe duração (todo compromisso vira
uma tarja de mesma altura) nem sobreposição (dois eventos às 14h ficam um
embaixo do outro, exatamente como dois eventos às 9h e às 17h). Ela é um mapa
de densidade: "esse dia tem cinco coisas". Isso é próximo do que o `Tracker` já
faz, e caro para reconstruir.

Some-se o transbordo: numa célula cabem três tarjas, e o resto vira "+4 mais",
que é um botão que abre uma lista, que é a vista `agenda` daquele dia. Ou seja,
a `month` completa depende da `agenda` para existir.

**Proposta: `month` entra na v2, e a v1 é desenhada para não fechar a porta.**
Se a discussão decidir que `month` é obrigatória de saída, o custo é real e
está aqui: mais um motor, mais uma regra de transbordo, mais uma regra de
teclado, e nenhuma delas serve em celular.

## Mobile primeiro: o que acontece a 390px

Antes do desktop, os números. A largura útil da casa a 390px é **358px** (é a
mesma conta que o `Tracker` usa para os 90 quadrados, e a mesma que fez o
`DateRangePicker` nativo cair para um mês).

- **`week` a 390px:** 358 menos 44 da calha das horas dá 314px, dividido por
  sete dá **44,8px por dia**. A coluna atinge o alvo de toque, e é só isso que
  ela atinge: numa tarja de 44px de largura cabem umas cinco letras. "Reunião
  com o contador" vira "Reun…", e sete colunas dessas são uma tela sem
  informação nenhuma, com um alvo de toque válido em cima de cada uma.
- **`month` a 390px:** 358 dividido por sete dá **51px por célula**, e a célula
  ainda precisa do número do dia mais as tarjas. É o caso ruim clássico, e é
  clássico porque a conta não tem saída: sete colunas não cabem com texto.
- **`day` a 390px:** 358 menos a calha dá **314px de coluna única**. Isso é uma
  coluna de verdade, com texto legível e sobreposição visível.

**A decisão:** abaixo de `sm` (639px, o mesmo `useMobile()` que o `Calendar` já
usa para cair para um mês) as vistas disponíveis são **`agenda` e `day`**.
`week` e `month` não são desabilitadas com aviso: elas **somem do seletor**, e
`view="week"` recebido por prop resolve para `agenda`, calado, do mesmo jeito
que o `Calendar` de hoje ignora `numberOfMonths` no celular e o `Dialog` vira
`Sheet`. Precedente da casa em três lugares.

O que não se faz, e vale escrever porque é a saída que todo mundo tenta
primeiro: **rolagem horizontal na semana.** Uma grade de tempo já rola na
vertical; somar rolagem horizontal cria duas direções de gesto disputando o
mesmo dedo, e o dedo perde. A `week` num celular deitado (landscape, acima de
639px) volta a aparecer sozinha, e isso basta.

## O evento que atravessa dias

Um compromisso de 14/03 às 22h a 16/03 às 9h não é um retângulo. São três
pedaços em três colunas, e o dado é um só.

**A peça não guarda evento partido: ela o parte na apresentação.** A camada de
layout produz **segmentos** a partir de cada evento, um por dia visível que ele
toca, e cada segmento carrega `continuesBefore` e `continuesAfter`. O desenho
usa isso para tirar o arredondamento da beirada e pôr a seta, e o texto
acessível usa isso para dizer "continua do dia anterior". Sem esses dois
sinalizadores, um evento de três dias vira três compromissos idênticos, e
ninguém consegue saber se são três reuniões ou uma.

São dois tipos, e eles vão para lugares diferentes da tela:

1. **Dia inteiro e multi-dia** (`allDay`, ou duração maior que o dia visível):
   vão para uma **faixa de dia inteiro** acima da grade, desenhados como barras
   horizontais que atravessam colunas. A faixa tem faixas internas (lanes):
   ordena por começo e, empatado, por duração decrescente, e põe cada barra na
   primeira faixa livre. A faixa tem altura máxima (proposta: três lanes) e o
   resto vira "+N", que abre a lista do dia.
2. **Evento com hora que cruza a meia-noite** (22h às 9h): é partido em dois
   segmentos, um terminando em 24:00 e outro começando em 00:00. Ele **não** vai
   para a faixa de dia inteiro, porque a hora dele é informação: 22h é tarde da
   noite e a faixa de cima diria só "quarta e quinta".

O que essa escolha custa, e precisa estar escrito na página: **onde o evento se
parte depende do início da semana e do fuso do navegador.** Um evento que cruza
a meia-noite se parte em dois; o mesmo evento visto de outro fuso pode não
cruzar, e então não se parte. Isso é consequência direta de a peça não conhecer
fuso (abaixo), e é comportamento, não defeito.

## O evento que se sobrepõe a outro

O algoritmo é conhecido e pequeno, e é o mesmo do Google Agenda. Vale escrever
porque o erro é sempre o mesmo: quem tenta resolver evento a evento produz
larguras que não fecham.

1. **Agrupar em conjuntos.** Um conjunto é um grupo de eventos ligados por
   sobreposição transitiva: A bate em B, B bate em C, então A, B e C são um
   conjunto, mesmo que A e C não se toquem. A largura se divide por conjunto,
   nunca por par.
2. **Colunas dentro do conjunto.** Percorre em ordem de começo e põe cada
   evento na primeira coluna onde ele não bate em nada.
3. **Expandir para a direita.** Um evento que tem espaço livre à direita cresce
   até esbarrar. É o que impede a tela de virar quatro tirinhas finas quando só
   dois horários realmente colidem.

Dois limites, e os dois são decisão:

- **Piso de altura desenhada.** A 48px por hora, um compromisso de 15 minutos
  tem 12px e um de 5 minutos tem 4px. Nenhum dos dois é alvo de toque nem cabe
  texto. **A proposta é pisar a altura desenhada em 44px no celular e no alvo
  de controle (`--rc-control-md`, 40px confortável / 32px compacto) no
  desktop.** E aí vem a parte honesta: **o piso é só do desenho, o cálculo de
  sobreposição roda nos horários reais.** Consequência: dois compromissos de 10
  minutos separados por 15 minutos não se sobrepõem no dado e se sobrepõem na
  tela. Eles se desenham empilhados com sombra, e não roubam coluna um do
  outro, porque roubar coluna seria a tela mentindo sobre o dado. É um defeito
  visual assumido, e a alternativa (deixar o layout usar as alturas pisadas)
  faz a grade inteira mentir.
- **Teto de colunas.** Além de `maxColumns` (proposta: 3), o resto do conjunto
  vira um chip "+N" que abre a lista daquele dia. A 314px de coluna única no
  celular, três colunas dão 104px cada, que ainda tem texto. A quarta não teria.

## Acessibilidade

Uma grade de calendário é duas coisas incompatíveis: uma tabela bidimensional
para quem navega por teclado, e uma lista cronológica para quem ouve. A casa já
tomou as duas decisões que resolvem isso, em outras peças.

**Para quem ouve, toda vista é a vista `agenda`.** O andaime visual (as linhas
de hora, a calha, os cabeçalhos de coluna) sai `aria-hidden`. O que se expõe é,
por dia, uma seção com nome acessível ("Terça, 17 de março, 3 compromissos") e
dentro dela uma lista em ordem cronológica, com `aria-setsize` e `aria-posinset`
por evento. É o mesmo par que a `VirtualList` escolheu, e pelo mesmo motivo: a
contagem tem que ser a real, não a desenhada.

**O que NÃO se faz:** `role="grid"` com uma célula por meia hora. Uma semana de
24 horas em blocos de 30 minutos dá 336 células, quase todas vazias, e cada uma
é uma parada. É o erro do `Tracker` (365 dicas montadas para uma aparecer) numa
forma nova, e o erro que a maioria das bibliotecas de calendário comete.

**Para o teclado, uma parada de tabulação para a grade inteira**, com foco
itinerante entre **eventos**, não entre células. Precedente direto do `Tracker`,
que é uma parada só para 365 quadrados.

| Tecla | O que faz |
|---|---|
| `↑` `↓` | evento anterior / próximo dentro do dia, em ordem de hora |
| `←` `→` | o evento mais próximo em hora, no dia anterior / seguinte |
| `Home` `End` | primeiro e último evento do período visível |
| `PageUp` `PageDown` | período anterior / seguinte |
| `Enter` `Espaço` | `onEventSelect` |
| `Esc` | devolve o foco à barra de ferramentas |

`←` e `→` seguem a direção da escrita, e `Home`/`End` continuam lógicos. É
literalmente a regra que o `Tracker` já escreveu, e ela entra **na v1, não
depois**: o `Tracker` custou um defeito real por ter espelhado o desenho sem
espelhar a conta, e o `Splitter` ainda o tem. A direção vem do `RivoProvider`.

Mais três coisas:

- **Troca de período anuncia em região viva:** "Semana de 16 a 22 de março, 7
  compromissos". Desenho não chega a quem ouve, e a paginação da grade é a
  única mudança grande que não move o foco.
- **`aria-current="date"`** no cabeçalho da coluna de hoje, e a linha do agora
  é decorativa (`aria-hidden`): ela não é dado, é um relógio.
- **Cor nunca é o dado.** `tone` pinta, e o texto do evento diz o que ele é. Um
  calendário onde vermelho significa "cancelado" e nada escreve "cancelado" não
  existe para metade das pessoas.

**O buraco conhecido:** uma grade vazia não tem evento nenhum para focar, e
"criar às 14h30" precisa de foco em célula. Como a v1 não cria (abaixo), não há
célula focável e o problema não existe. **Se a criação por teclado entrar, o
modelo de foco tem que ser redesenhado, e não estendido.** Está na lista de
decisões humanas.

## O que ela não faz

É a seção que impede a peça de virar aplicação, e cada linha é uma porta que
alguém vai tentar abrir.

1. **Não busca dado.** Entram `events`, `isLoading`, `isError`, `onRetry`,
   `empty`, na ordem da casa: erro vence carregando, vazio só depois que a
   consulta voltou. Sai `onRangeChange({ start, end })` quando o período visível
   muda, que é o gancho para o app buscar. Mesma divisão do `DataTable`, da
   `VirtualList` e do `QueryBoundary`.
2. **Não conhece fuso de servidor.** Tudo é `Date`, na hora local do navegador,
   como o `DatePicker` já decidiu ("a pessoa escolheu 3 de março no calendário
   da tela dela"). Um compromisso gravado em `America/Sao_Paulo` e visto de
   Lisboa aparece na hora de Lisboa. Se não é isso que se quer, converte-se
   antes de entregar. **Uma peça que conhecesse fuso precisaria de banco de
   fusos, e banco de fusos é o começo de uma biblioteca de datas.**
3. **Não edita.** Sem arrastar para mover, sem esticar para redimensionar, sem
   arrastar no vazio para criar. Ela emite `onEventSelect` e `onSlotSelect`
   (clique no vazio devolve `{ start, end }` do intervalo clicado) e o app abre
   o `Dialog` que quiser. Arrastar num touch disputa com a rolagem, a casa não
   tem primitiva de arrastar além do `Splitter` (que está quebrado em RTL), e é
   a linha exata onde um componente vira aplicação.
4. **Não expande recorrência.** Sem RRULE, sem exceção de série. O app expande
   em instâncias antes de entregar. Recorrência mais exceção mais fuso é motor
   de calendário, e seria o primeiro lugar onde a peça precisaria saber de fuso.
5. **Não faz recurso** (colunas por sala, por profissional, em vez de por dia).
   É necessidade real (clínica, barbearia, sala de reunião), é o mesmo motor com
   outro eixo, e por isso o motor da grade não deve gravar "coluna = dia" na
   assinatura. Fica para depois, com a porta aberta.
6. **Não imprime**, não exporta `.ics`, não sincroniza com nada.

## Em que ela se apoia

**Nada de biblioteca de calendário, e o motivo é a regra que a casa já tem.**

A regra não é "sem terceiros": a Recharts e a TanStack entraram. A regra é
**motor interno, nunca superfície**, e é ela que reprova as candidatas. A
TanStack Table pôde entrar porque é *headless*: não tem DOM, não tem CSS, e
nenhum tipo dela vaza para a assinatura. FullCalendar, `react-big-calendar` e
`@schedule-x` são o oposto: eles **são** o DOM e o CSS. Configura-se cada um com
os objetos de vista e de plugin dele, o desenho sai com as classes dele, e
vesti-los com os tokens da casa é reescrever a folha de estilo deles por cima.
Ou seja: o terceiro viraria a superfície, que é exatamente o que a decisão de
24/08 protegeu. Some-se que a acessibilidade da maioria é o `role="table"` de
336 células recusado acima, e não dá para consertar de fora.

Do outro lado, o que se compra de graça:

- **`@tanstack/react-virtual`**, já paga (o `DataTable` e a `VirtualList` a
  usam), para a vista `agenda`. Um ano de compromissos são milhares de linhas, e
  esse é o problema que a virtualização resolve. **Não** para a grade de tempo:
  uma semana tem sete colunas de altura limitada, virtualizar não compra nada e
  briga com o posicionamento absoluto que a sobreposição exige.
- **`react-day-picker`**, já paga, para o seletor de "ir para a data" da barra
  de ferramentas. É o `Calendar` da casa dentro de um `Popover`, e não um
  mini-mês desenhado à mão pela segunda vez.
- **Nenhuma biblioteca de datas nova.** O que falta são umas dez funções sobre
  `Date` (início da semana, somar dias, mesmo dia, cortar na meia-noite), e a
  casa já tem `formatDate`, `parseDate` e `applyDateMask`. Puxar `date-fns` para
  isso abre a porta do fuso no dia seguinte.
- **Nenhum peer novo, portanto nenhum subcaminho novo.** A regra é "um
  subcaminho por peer, e não um por assunto": sem peer, a peça entra no
  `@rivocode/ui` principal.

O que é do zero é o cálculo de layout, e ele é pequeno: agrupar em conjuntos,
distribuir em colunas, expandir, empacotar as faixas de dia inteiro. Cabe em
menos de duzentas linhas de função pura sobre datas, sem DOM, e é testável sem
renderizar nada.

## Esboço de API

```tsx
<EventCalendar
  view="week"                    // "agenda" | "day" | "week"
  onViewChange={setView}
  date={anchor}                  // a data âncora do período visível
  onDateChange={setAnchor}
  onRangeChange={({ start, end }) => carregar(start, end)}

  events={events}
  isLoading={carregando}
  isError={falhou}
  onRetry={recarregar}
  empty={{ title: "Nada marcado", description: "Nenhum compromisso nesta semana." }}

  onEventSelect={(event) => abrir(event.id)}
  onSlotSelect={({ start, end }) => novo(start, end)}

  weekStartsOn={1}               // 0 domingo, 1 segunda (padrão pt-BR)
  dayStart={7}
  dayEnd={20}                    // 13 horas visíveis; o resto rola
  hourHeight={48}
  maxColumns={3}
  label="Agenda da equipe"
  classNames={{ event: "…" }}
/>
```

```ts
type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  /** O vocabulário fechado da casa, o mesmo do Badge e da Timeline. */
  tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "info";
};
```

**`tone`, e não `color`.** É a primeira tentação de um calendário: um hexa por
evento. Cor literal fora de `src/tokens` é reprovada pelo `check:colors`, e um
hexa vindo do app não tem par de contraste medido. O escape para quem precisa de
mais é `renderEvent` e `classNames.event`, com classes da casa.

`dayStart`/`dayEnd` existem porque 24 horas a 48px são 1152px de altura, e
ninguém tem expediente à meia-noite. De 7h às 20h dá 624px, que cabe numa tela.
Evento fora da janela não some: ele aparece como marca nas beiradas da calha,
e continua na `agenda`.

## O lado nativo, que é o nono artefato

**Porta, e porta como `agenda` mais `day`.** Não é fila e não é atraso: é a
mesma conta do celular no web, levada ao fim. No web, 390px é uma largura entre
outras; no aparelho é a única.

O que o `@rivocode/ui-native` exporta:

- **A `agenda` sobre `SectionList`**, uma seção por dia, cabeçalho de dia
  grudado ao rolar. É a mesma decisão da `VirtualList`, que não porta porque a
  `FlatList` já virtualiza de fábrica: aqui a plataforma entrega virtualização e
  cabeçalho de seção juntos, e reimplementar seria embrulho de embrulho.
- **Uma faixa horizontal de dias** no topo (sete a catorze dias, com marca de
  quantidade por dia), que é orientação e atalho, e ocupa o lugar que a `month`
  ocuparia. Um mês inteiro de sete colunas com texto não existe em 358px, e o
  `DateRangePicker` nativo já pagou por descobrir isso.
- **A `day`**, a grade de tempo de coluna única, com a mesma sobreposição. É
  onde o dedo vê o choque de horário, e é a única grade que cabe.
- **`week` e `month` não portam**, e o motivo vai escrito na linha de
  `scripts/paridade-nativo.ts`, com a conta dos 44,8px.
- **Lista por `items`, não por composição**, como o `Timeline`, o `Select` e o
  `RadioGroup` já fazem do lado de lá.
- **Cada evento é uma parada só de leitor de tela**, com a frase inteira: "3 de
  5: Reunião com o contador, terça 17 de março, das 14h às 15h30, continua no
  dia seguinte". Não existe papel de item de lista no React Native, e o
  `Timeline` nativo já escolheu esse caminho.
- **A troca de período anuncia**, e aqui esbarra numa dívida já registrada no
  `ESTADO.md`: `accessibilityLiveRegion` é do Android, e o iOS precisa de
  `announceForAccessibility`, que nenhuma peça do catálogo usa hoje. Esta peça
  não deveria ser a primeira a resolver isso sozinha.

**E um achado que vale mais que a peça:** o cálculo de layout (conjuntos,
colunas, segmentos, faixas) é função pura sobre `Date`, idêntica nos dois lados,
e **os dois pacotes não têm nenhum mecanismo de compartilhar código hoje**. O
nativo é publicado como fonte, em árvore separada. Ou o arquivo é duplicado
(e as duas cópias divergem, que é a história do `DataList` servindo texto sem
acento por versões), ou alguém decide como código puro atravessa. É a primeira
vez que o catálogo tem lógica não trivial que quer viver nos dois.

## Os nove artefatos

| Artefato | Onde |
|---|---|
| Peça | `src/components/event-calendar.tsx` mais o layout em `src/lib/` |
| Índice | `src/index.ts` |
| Preview | `.design-sync/previews/EventCalendar.tsx` |
| Página | `.design-sync/docs/EventCalendar.md`, categoria Dados, com "quando não usar" nomeando `Calendar`, `Timeline` e `DataTable` |
| Teste | `test/event-calendar.test.tsx` mais `test/layout-calendario.test.ts` |
| `gen:props` | `apps/docs/src/component-props.json` |
| Contraste | pares novos de `tone` sobre a grade |
| Skill | linha em `.claude/skills/rivocode-ui/reference/components.md` |
| Nativo | `native/src/event-calendar.tsx`, linha em `scripts/paridade-nativo.ts` |

O teste do layout é o que importa mais e o que custa menos: são funções puras,
e os casos são conhecidos. Conjunto transitivo (A bate em B, B em C, A não bate
em C, os três dividem largura); expansão para a direita; evento cruzando a
meia-noite virando dois segmentos com os sinalizadores certos; empacotamento das
faixas de dia inteiro com três barras que não cabem em duas lanes; piso de
altura não alterando o cálculo de colunas.

## O que eu não sei, e o que precisa de decisão humana

Em ordem de quanto trava o começo do código.

1. **O nome.** `EventCalendar`, `Agenda` ou `Scheduler`. Vaza para tudo.
2. **`month` entra na v1?** A proposta é não. Se entrar, é mais um motor e mais
   um conjunto de regras que não servem em celular.
3. **Qual é o caso real.** Este documento supõe agenda de trabalho (compromisso
   com hora, poucos por dia, sobreposição rara mas fatal quando acontece). Se o
   caso for **vencimento de nota** (dezenas por dia, sem hora, sem duração), a
   `week` inteira é desperdício e a peça certa é `month` mais `agenda`, que é
   quase o desenho oposto. **Não sei qual é**, e essa resposta muda a v1.
4. **Cor por calendário.** O caso "cinco calendários, cinco cores" (equipe A,
   equipe B, férias) não tem resposta no sistema de tokens: `tone` são seis
   papéis semânticos, não uma paleta categórica. Ou se inventa uma escala
   categórica nos tokens (com pares de contraste medidos, e o `check:contrast`
   vai cobrar), ou se diz que isso não existe e o app usa `renderEvent`.
   **Decisão humana, e é a que mais gente vai pedir.**
5. **Horário de verão.** O Brasil não tem hoje, mas a peça pode servir a fuso
   que tem, e num dia de transição a coluna tem 23 ou 25 horas. Se as linhas de
   hora forem desenhadas como `topo = hora * altura`, o dia da virada sai uma
   hora deslocado inteiro. Dá para desenhar a partir dos limites de hora reais e
   acertar, e dá para declarar que não se suporta. **Não sei o que a casa quer**,
   e sei que declarar é mais barato.
6. **Criação por teclado.** Se um dia se cria compromisso arrastando ou pelo
   teclado, o modelo de foco por evento não estende: precisa de foco em célula
   vazia, e aí volta o problema das 336 paradas. Vale saber agora se isso está
   no horizonte.
7. **Código puro compartilhado entre os dois pacotes.** Não existe mecanismo, e
   esta peça é a primeira que realmente quer um.
8. **O `hourHeight` e a densidade.** 48px por hora é palpite, não medida. A
   densidade compacta deveria encolhê-lo (o `--rc-day` já cai de 36 para 32), mas
   encolher a hora aproxima o piso de altura do tamanho do texto. Precisa de
   olho numa tela, não de argumento.
9. **Nada disso foi medido em tela.** Os 44,8px e os 51px são aritmética a
   partir dos 358px úteis da casa. Antes do código, vale um esqueleto no `demo/`
   com dado falso, só para olhar nos dois temas e nas duas densidades. O
   `Editable` nativo já está listado no `ESTADO.md` como peça que merecia
   protótipo antes de alguém construir tela em cima, e esta é maior.
