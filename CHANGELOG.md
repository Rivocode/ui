# Mudancas

## 0.8.0

A 0.7.0 saiu de manha e foi auditada a tarde: um retrato em Chrome e uma
varredura da arvore de acessibilidade acharam treze defeitos em pecas que ja
estavam no registro. Nenhum deles aparecia nos 1072 testes verdes. A maior
parte desta versao e o conserto disso.

E entra a peca que faltava do catalogo.

### `EventCalendar`: o que acontece, quando, e por quanto tempo

O `Calendar` escolhe uma data. Este mostra compromisso no tempo, em quatro
vistas: `agenda` (lista por dia), `day`, `week` e `month`.

A linha que separa ele do vizinho nao e o `Calendar`, e o `DataTable`: **se
ninguem precisa ver duracao nem choque de horario, e tabela.** Calendario so se
paga quando a resposta e geometrica.

O que ele NAO faz esta escrito: nao busca dado (so `onRangeChange`), nao
conhece fuso, nao edita, nao arrasta, nao expande recorrencia. Sao as fronteiras
que impedem a peca de virar aplicacao.

Duas decisoes que valem a leitura:

- **Nada de `role="grid"` com celula por meia hora** - seriam 336 paradas de
  tabulacao numa semana, que e o erro do `Tracker` numa forma nova. O andaime
  visual sai `aria-hidden`, e **para quem ouve toda vista e a vista `agenda`**:
  secao por dia, lista cronologica, `aria-setsize` no total real. Uma parada de
  tabulacao, com foco itinerante entre eventos.
- **A 390px a `week` some e a `month` fica.** A coluna de semana precisa
  mostrar hora e duracao em 44,8px, e nao mostra. A celula de mes precisa
  mostrar que existe alguma coisa e mais ou menos o que, em 51px, e isso
  sobrevive.

O piso de altura da tarja e a parte que assume um defeito de proposito: um
evento de cinco minutos tem 4px, e o piso vem do CSS com o calculo rodando nos
horarios reais. Dois eventos curtos que nao colidem no dado podem se empilhar
na tela; a alternativa era a grade inteira mentir sobre duracao.

O calculo de layout mora em arquivo proprio, sem DOM, porque ele vai atravessar
para o React Native - e nao ha mecanismo no repositorio para compartilhar
codigo puro entre os dois pacotes. Esse mecanismo e o que a peca vai cobrar
primeiro.

**No React Native ele entra na fila**, e a fila e por decisao de gesto, nao por
tempo: arrastar para mudar de semana, tocar e segurar para criar, e o que fazer
quando o dedo pousa sobre dois eventos sobrepostos. Nenhuma tem resposta no
web, onde sao ponteiro e teclado.

### Dois defeitos de nivel A, os dois em pecas novas

**O `Popconfirm` era armadilha de teclado enquanto a chamada corria.** O
`disabled` do Cancelar e o `loading` do Excluir tiravam os dois da ordem de
tabulacao ao mesmo tempo, e o `role="alertdialog"` ficava com ZERO focaveis.
Medido em Chrome: o foco caia no `<body>`, Esc nao fechava, e quatro Tabs
depois o cursor estava fora do painel, no fundo que o Base UI marca
`aria-hidden`. O leitor de tela nao ouvia nada. O Cancelar agora recusa por
`aria-disabled` e continua focavel, e ha regiao viva com a prop `busyLabel`
para o texto da espera. Falhava WCAG 2.1.2 e 4.1.3.

**O `VirtualList` nao tinha como ser rolado pelo teclado** em Firefox e Safari:
256 mil pixels de rolagem sem parada de tabulacao. No Chrome o salvamento
automatico do navegador cobrava o preco na medida - nome vazio e o anel AZUL
dele em vez do da casa, o unico lugar da vitrine onde o anel de foco nao era o
nosso. Agora o viewport e uma parada nomeada, com o anel da casa, e o nome
carrega o total: sem isso o leitor dizia "lista com 15 itens" antes de chegar
ao "1 de 4000". Falhava WCAG 2.1.1.

### Quebra: `aria-label` deixou de ser aceito e ignorado

Em `FilterBar`, `Tracker` e `Splitter`, o `aria-label` de quem chamava pousava
num no sem papel, ou era sobrescrito pelo espalhamento. Compilava, renderizava,
e o leitor ouvia outro nome. Agora ele **vence** e chega ao no que tem papel.

Quem escrevia `aria-label` nessas tres pecas na 0.7.0 nao muda uma linha - passa
a funcionar. Quem dependia de ele ser ignorado (ninguem, esperamos) muda.

### Os outros nove

- **`FilterBar`**: o foco caia no `<body>` a cada ficha removida - seis
  reinicios numa barra de seis. Agora vai para o xis seguinte, depois o limpar,
  depois o anterior, depois a raiz. E `disabled` deixou de CRIAR uma parada de
  tabulacao sem nome: ela so existe quando a fileira realmente transborda.
- **`TimeField`**: os botoes de passo se chamavam "Aumentar" e "Diminuir", sem
  dizer de que campo. Agora herdam o nome do rotulo, e a mudanca e anunciada.
  Duas saidas obvias foram medidas e recusadas: apontar para o input devolve o
  VALOR e nao o rotulo, e `role="spinbutton"` faz o Chrome ignorar
  `aria-valuetext` e expor `480` enquanto a tela mostra `25:99`.
- **`Table`**: `aria-selected` em `role="row"` de tabela simples e descartado
  pelo navegador - a selecao era so cor, e o JSDoc prometia o contrario. Agora
  ha marcador textual, com `labels.selected`, e `role="grid"` continua recusado
  porque exigiria navegacao por setas que a peca nao implementa.
- **`Splitter`**: a alca media 13px, e a WCAG 2.5.8 pede 24. Passou a 25, sem
  engordar o desenho. Ganhou `aria-valuetext` (o leitor dizia "50" pelado) e
  `aria-controls`.
- **`Tracker`** e **`TimePicker`**: o nome era lido duas vezes seguidas.
- **As quatro irmas** (`DataTable`, `ChartContainer`, `QueryBoundary`,
  `VirtualList`) passam a aceitar `retryLabel` e a anunciar a espera. Duas
  tinham metade disso, e meio contrato e pior que nenhum: quem traduzia a tela
  ficava com titulo em ingles e botao em portugues.

### `dir="rtl"`: quatro pecas liam o dado errado

O `Tracker` a 5% da esquerda lia "Dia 2" onde a celula era "Dia 20" -
dezessete celulas de distancia, e o balao dizia o dado errado. O `Splitter`
movia a divisoria para o lado OPOSTO ao arrasto. O `ColorPicker` andava o foco
34px para a esquerda com a seta da direita.

E o `Tree` era o pior: `paddingLeft` e propriedade fisica, entao os tres niveis
paravam no mesmo pixel. **A hierarquia era invisivel.** Trocar so a tecla teria
consertado o teclado para um desenho que continuava errado.

As quatro leem a direcao do `RivoProvider` agora, e todas foram medidas em
Chrome antes e depois.

### O peso da instalacao

As tres dependencias de fonte sairam de `dependencies` para `devDependencies`.
As faces ja viajam dentro do pacote, em `dist/files`, e o `dist/fonts.css`
aponta para la - quem instalava baixava as fontes duas vezes.

## 0.7.0

Os dez nomes que a 0.6 manteve por apelido saem. O dono da biblioteca e hoje o
unico consumidor, entao arrastar compatibilidade custaria mais do que limpar -
alias e divida que ninguem cobra e ninguem remove, e o repositorio ja pagou
essa conta uma vez na 0.3.0.

Junto vai o trabalho de um dia inteiro em cima da 0.6.1: vocabulario unico para
escolher item, posicionamento igual nos cinco paineis flutuantes, os nomes
acessiveis reunidos num objeto, dez exports que a Base UI ja entregava e
ninguem via, um token de contraste novo e dez pecas nativas a mais.

### Quebra: os dez nomes que saem

| Antes | Agora | Peca |
|---|---|---|
| `tone` | `trend` | `Sparkline` |
| `selected` | `value` | `DataTable` |
| `onSelectedChange` | `onValueChange` | `DataTable` |
| `selected` | `value` | `Tree` |
| `onSelectedChange` | `onValueChange` | `Tree` |
| `maxItems` | `max` | `Breadcrumb` |
| `wrapperClassName` | `classNames.wrapper` | `PasswordInput` |
| `removeLabel` | `labels.remove` | `TagsInput` |
| `maskDate` | `applyDateMask` | `@rivocode/ui` |
| `phoneMask` | `phonePatternFor` | `@rivocode/ui` |

Oito sao troca de palavra, e o `tsc` acha todos. Dois mudam de forma, e por
isso merecem o olho:

```tsx
<PasswordInput wrapperClassName="w-72" />              // antes
<PasswordInput classNames={{ wrapper: 'w-72' }} />     // agora

<TagsInput removeLabel={(tag) => `Tirar ${tag}`} />              // antes
<TagsInput labels={{ remove: (tag) => `Tirar ${tag}` }} />       // agora
```

O `classNames` do `PasswordInput` tem tres partes - `wrapper`, `input` e
`action` -, entao quem vestia mais de uma parte passa a escrever um objeto so.
O `labels` do `TagsInput` hoje tem uma chave, e nasceu objeto porque e assim
que o resto do catalogo batiza nome acessivel configuravel.

Duas armadilhas de busca e troca:

- **`wrapperClassName` tambem existe no `ChartTooltip`**, que e a `Tooltip` da
  Recharts reexportada, e la ele nao muda de nome. Troque so o do
  `PasswordInput`.
- **`selected` continua sendo prop do `TableRow`** - a linha marcada da
  `Table` crua - e do `Calendar`. Troque so o do `DataTable` e o da `Tree`.

O `@rivocode/ui-native` acompanha a `Sparkline`: o `tone` de la tambem virou
`trend`, para o nome nao significar coisas diferentes nos dois lados.

O resto do nativo NAO acompanha nesta versao, e isso e proposital: o
`DataList` continua com `selected`/`onSelectedChange` e o `TagsInput` nativo
com `removeLabel`. La esses nunca foram apelido - sao o unico nome que a peca
tem -, e o pacote nativo tem versao e ciclo proprios. A troca de vocabulario
deles e uma quebra do `@rivocode/ui-native`, e sai numa versao dele.

### Escolher item se chama a mesma coisa nas tres pecas

`Tree`, `TreeSelect` e `DataTable` falavam tres dialetos para a mesma ideia, e
o `TreeSelect` embrulha o `Tree`: quem passava do painel para a arvore inline
reescrevia o binding inteiro. Agora sao `value`, `defaultValue` e
`onValueChange` nas tres.

A arvore tambem deixou de exigir a escolha. Quem so queria uma arvore que abre
e fecha inventava um estado para nada, enquanto o `TreeSelect` - a mesma peca
dentro de um painel - ja aceitava tudo opcional.

### Os cinco paineis flutuantes se posicionam do mesmo jeito

`Popover`, `Tooltip`, `Menu`, `Select` e `Combobox` dividem a mesma casca e
tinham quatro contratos para dizer onde abrir: o `Popover` expunha lado,
alinhamento e folga; o `Tooltip` so o lado; os outros tres, nada.

```tsx
<MenuContent side="right" align="start" sideOffset={10} />
```

`side`, `align` e `sideOffset` valem nas cinco, com o tipo derivado do
posicionador da Base UI em vez de escrito a mao. A folga vira uma so, 6 - o
`Popover` era o unico com 8, e quem depender daquele valor escreve
`sideOffset={8}`.

No `Select` ha uma sutileza: o posicionador dele alinha o item escolhido com o
gatilho por padrao, e nesse modo descarta lado e folga. Pedir qualquer uma das
tres desliga esse alinhamento; quem nao pede nenhuma mantem o comportamento de
hoje byte por byte.

Da mesma familia: o `AlertDialogContent` ganha `classNames.backdrop`, o
`ComboboxInput` ganha `classNames` - o `className` parava na moldura e nunca
chegava ao campo -, a tarja do `Dialog` passa a animar como as das irmas e o
`DialogFooter` empilha no celular.

### Os nomes acessiveis se reunem em `labels`

Cada peca batizava do seu jeito o texto que o leitor de tela ouve. Agora o
objeto e o mesmo em todas, e cada chave tem o proprio padrao - trocar uma nao
apaga a outra:

```tsx
<PasswordInput labels={{ show: 'Revelar a senha' }} />
<Clipboard labels={{ copy: 'Copiar a chave' }} />
<TagsInput labels={{ remove: (tag) => `Tirar ${tag}` }} />
```

Quem mais ganha e a ficha do `Combobox`: o xis era um `aria-label="Remover"`
cravado, sem prop nenhuma - nao dava para traduzir nem para dizer o que se
remove, e tres fichas se anunciavam "Remover, Remover, Remover". O padrao
agora sai do proprio conteudo da ficha, e o `ComboboxChip` aceita
`labels.remove` para o resto.

### `defaultValue` nas que exigiam controle

`TagsInput` e `Editable` exigiam `value` e `onValueChange`; `Tree` e
`DataTable` exigiam o par equivalente. Um filtro de tela nao envia nada e nao
guarda nada, e pagava um `useState` so para existir. As quatro seguem o padrao
das irmas: sem controle de fora, a peca guarda a propria escolha, e
`defaultValue` diz com o que ela comeca.

### Dez exports de menu e de select

Casca sobre o que a Base UI ja entregava e nunca foi exposto:

`MenuCheckboxItem`, `MenuRadioGroup`, `MenuRadioItem`, `MenuLinkItem`,
`MenuSubmenu`, `MenuSubmenuTrigger`, `SelectGroup`, `SelectGroupLabel`,
`SelectSeparator` e `ComboboxSeparator`.

O caso concreto e a listagem: "Colunas" para escolher o que aparece e
"Ordenar por" para escolher a ordem - hoje isso so se montava com `Popover`
mais `Checkbox` na mao, perdendo o `aria-checked` e a navegacao de menu. O
checkbox e o radio nao fecham o menu ao escolher; o item de link fecha, ao
contrario da Base UI, porque com roteador de uma pagina so o menu ficava
aberto flutuando sobre a tela nova.

Uma peca existente muda de aparencia: o `ComboboxGroupLabel` era reexport cru
e o unico cabecalho de grupo sem estilo - tinha o tamanho e a cor dos itens e
lia-se como mais uma opcao.

### O grafico diz o que e, e o vazio dele aparece

O `ChartContainer` ganha `label`, o nome que o leitor de tela ouve. Sem ela,
ele monta o nome a partir dos rotulos das series; antes o nome acessivel caia
nos rotulos de eixo colados - "MarAbrMaiJunJulAgo020406080" - porque a Recharts
entrega o `<svg>` com `role="application"`.

O `empty` do grafico tinha um defeito silencioso: so aparecia com `empty` E
`data` juntos, entao quem passava `empty` e esquecia `data` nunca via o estado
vazio, sem erro nenhum - o grafico desenhava eixos sobre o nada. Agora a
moldura le os pontos do proprio filho da Recharts, `data` vira reforco para os
casos em que eles moram mais fundo, e o `action` entra no vazio, como no
`DataTable`. Quando nem um nem outro acha ponto, sai aviso em desenvolvimento.

### `titleAs` no `PageHeader`

Ele emitia `h1` sempre, e uma aplicacao que ja tem `h1` no shell ganhava o
segundo sem aviso. `titleAs` aceita `h1`, `h2` ou `h3` e baixa o nivel sem
mexer no desenho. O padrao continua `h1`: ninguem que ja usa muda.

### O token `--rc-border-disabled`

Um controle desmarcado, travado e sem rotulo - a coluna de selecao do
`DataTable` - nao tinha sinal visual nenhum, porque `surface` e
`surface-raised` sao a mesma branca no tema claro. `Checkbox`, `Radio` e
`Switch` descem a borda para ele ao travar.

E o unico par da casa com teto alem de piso: pelo menos 1,6:1 contra o fundo,
porque em 1,23 a borda some, e a fronteira viva tem que pesar 1,4x mais, senao
travado e vivo ficam iguais. Um tema de cliente que redefina os tokens precisa
declarar este tambem.

Os tres tambem alinham o respiro em `gap-2` e trocam o `opacity-60` do travado
por token - a opacidade rebaixava borda, marca e texto de uma vez, e passava
por fora do `check:contrast`.

### O React Native chega a 56 pecas

`Steps`, `DateRangePicker`, `Form`, `Tracker`, `InputGroup`, `PasswordInput`,
`TagsInput`, `Indicator`, `Item` e `RelativeTime` saem da fila. Sao 56 pecas
traduzidas e 11 esperando coisa que ainda nao existe, das 83 do web.

Nenhuma foi transposta, e a [tabela de paridade](https://ds.rivocode.com.br/react-native)
conta peca a peca o que muda. O `useWizard` atravessa e a regua nao; o
`DateRangePicker` escolhe a faixa na grade de um mes so, porque dois meses lado
a lado dao 27px de celula em 390; o `Tracker` vira um alvo unico com arraste,
porque 365 quadrados dao 4px de alvo cada.

### Onze consertos e cinco verificacoes novas

Fronteira de campo abaixo de 3:1 no `NumberField`, no `OTPField` e no
`SearchInput`; `size` do `NumberField` que mudava fonte e nao mudava altura;
`SearchInput` sem `size` nenhum; `Item` que prometia `render` no proprio JSDoc
e nao aceitava; quatro paradas de tabulacao com `outline-none` e nenhum foco
reposto; a barra indeterminada ignorando "reduzir movimento" e mentindo "20%
concluido" para quem ouve; o `TagsInput` fora do `Field.Control`, o unico
rotulo orfao do site; a paleta de comandos que nao anunciava lista vazia; e o
`data-[disabled]` que vencia `data-[checked]` por ordem alfabetica do Tailwind,
pintando de acento cheio a caixa travada em estado misto.

As guardas: `check:pecas` (o catalogo que o README e o npm anunciam),
`check:testes` (a contagem que a home exibe), `check:skill` (prop citada em
exemplo da skill tem que existir na peca), `check:chart` (a Recharts nao pode
vazar de `src/chart/`) e `test/classe-da-raiz`, que varre as 230 pecas dos tres
indices atras de quem nao aceita `className` na raiz ou aceita e nao repassa -
ela ja nasceu achando `Command` e `CalendarPanel`.

### Uma mudanca de saida que nao tem nome novo

`delta={12.5}` no `Stat` imprimia "12.5%" e passa a imprimir "alta de 13%". O
`deltaFormat` chegou com padrao `percent`, e o `percent` da casa arredonda para
zero casas. Nenhuma prop mudou de nome, o `tsc` nao acha, e a tela continua
compilando - so o numero fica diferente. Quem precisa da casa decimal escreve
`deltaFormat={(value) => percent(value, 1)}`.

E a unica quebra desta versao que se descobre olhando, e por isso esta separada
das outras dez.

### A tabela ganha o rodape de totais

`TableFooter` entra no indice, e no `DataTable` basta uma coluna declarar
`total` para o `<tfoot>` existir:

```tsx
{ key: 'amount', header: 'Valor',
  total: (rows) => currencyShort(rows.reduce((sum, row) => sum + row.amount, 0)) }
```

**O total soma o que a busca deixou, e nao a pagina.** O total de uma busca e o
total da busca, e virar de pagina nao muda quanto se deve. Antes disso, um
total morava numa `<div>` embaixo da tabela: sem largura de coluna, ele nunca
alinhava com o numero que somava.

Junto vem o `TableCaption`, para quem monta a `Table` a mao. Ele e o nome
acessivel da tabela - o instinto oposto, um `<h3>` acima dela, nao quebra nada
e custa o nome inteiro. E `<caption>` nao tem outro pai legal alem de
`<table>`: solto ao lado, o React derruba com "cannot be a child of `<div>`".

### Os quatro finais ganham texto proprio

`errorTitle` e `noResultsMessage` no `DataTable`, `errorTitle` no
`ChartContainer`. Num painel com quatro consultas, "Nao foi possivel carregar"
quatro vezes nao diz qual delas caiu.

O `Alert` acompanha com `icon` e `onDismiss`, e a base do `alertVariants`
mudou junto: o icone entrava como filho, no meio do texto, e agora tem lugar -
com `mt-0.5`, que o alinha com a maiuscula da primeira linha e nao com o centro
dela.

### Nove pecas voltam a aceitar `id`, `data-*` e `aria-*`

`Stat`, `Tree`, `ColorPicker`, `Command`, `FileUpload`, `CalendarPanel`,
`ChartDonut` e `ChartRadial` tinham tipo de objeto fechado em vez de estender
`ComponentProps`, entao um `id` ou um `aria-label` escrito de fora nao chegava
ao DOM - e nao havia erro, o atributo simplesmente sumia.

Quatro colisoes tiveram que ser omitidas do tipo herdado, e a pior e silenciosa:
o `title` do `Command` e do `CalendarPanel` e `string` dos dois lados, entao a
intersecao COMPILAVA e mandava o valor para o titulo da peca **e** para a tarja
amarela do navegador.

Onde a peca escreve um `aria-label` padrao, o espalhamento vai depois dele,
para o rotulo de quem chama vencer. Antes disso, um rotulo escrito de fora era
engolido em silencio.

### O `Tracker` deixa de montar um portal por ponto

Cada quadrado montava um `Tooltip`, e tooltip e portal: um ano de dados eram
365 portais montados para que no maximo um aparecesse. Agora a faixa inteira e
o alvo, ha um balao so, e o indice lido sai de uma regra de tres sobre o
retangulo da faixa - nao mede quadrado a quadrado, que custaria um layout por
movimento do mouse.

A acessibilidade subiu junto, e nao apenas nao regrediu: nada ali era focavel
antes, entao a leitura exata de um periodo era so de quem tem mouse. A faixa
agora e uma parada de tabulacao, as setas caminham, `Home` e `End` vao as
pontas, e um `role="status"` anuncia o periodo lido pelo teclado - calado no
ponteiro, que e o mesmo contrato do `ChartContainer`.

O quadrado continua fora da ordem de tabulacao de proposito: 365 paradas dentro
de um cartao seriam obstaculo, e a lista escondida ja entrega os 365 textos.

### Tres guardas que estavam olhando para o lado errado

- **`check:contrato` so conhecia o web.** Os quatro subcaminhos do pacote
  nativo nunca entraram nele. Na primeira vez que rodou completo, achou sete
  nomes que existiam no pacote e em texto nenhum.
- **A guarda de acento so varria `src/`.** O `DataList` nativo serviu "Nao foi
  possivel carregar a lista." por versoes, acentuada do lado web e crua no
  aparelho. A varredura agora cobre os dois pacotes - e ganhou piso de arquivo,
  porque a primeira tentativa de junta-los num padrao so varreu ZERO arquivo em
  silencio e ficou verde por nao olhar nada.
- **`check:comentarios` tinha divida declarada.** As duas ultimas linhas do
  `DEBT` foram pagas, e a lista esta vazia.

Sairam quatro scripts de `scripts/`: `acentos-previews`, `exports-ingles`,
`rodar-acentos` e `titulos-previews`. Eram mutacoes de uma vez so, ja
aplicadas, e o que faziam uma vez hoje e cobrado a cada `check`. Um deles
deixou rastro: `Apos` virou `After` dentro de uma frase em portugues na fonte da
tabela de paridade, e a palavra ficou la por versoes.

### Quebra: a fonte da marca sai do `styles.css`

As `@font-face` do Manrope, do Poppins e do JetBrains Mono estavam dentro do
`dist/styles.css` de todo mundo, e os 220 KB de `.woff2` viajavam no pacote
mesmo para quem nunca quis a marca. Elas agora tem entrada propria:

```css
@import "@rivocode/ui/styles.css";   /* pecas e tokens */
@import "@rivocode/ui/fonts.css";    /* as faces da marca - opcional */
```

**Quem importa so o `styles.css` passa a renderizar na fonte do sistema**, sem
erro e sem aviso. E uma linha para devolver. Nao ha `styles-sem-fontes.css` de
compatibilidade de proposito: arrastar os dois arquivos faria eles divergirem
em silencio, e o repositorio ja pagou essa conta.

Medida depois da mudanca: `dist/styles.css` tem zero `@font-face`,
`dist/fonts.css` tem catorze, e os 16 arquivos de fonte so sao alcancaveis por
quem importa o segundo.

### A fonte passa a ser papel de tema

Os tres tokens saem de `src/tokens/scales.css`, que e camada global, e passam a
ser declarados dentro de `[data-rc-theme="..."]`, como cor e sombra ja eram.
Isso e o que torna possivel duas marcas na mesma pagina:

```css
@import "@fontsource-variable/inter";

[data-rc-theme="cliente-acme"] {
  --rc-font-sans: "Inter Variable", system-ui, sans-serif;
  --rc-font-display: "Inter Variable", sans-serif;
  --rc-font-mono: "JetBrains Mono Variable", ui-monospace, monospace;
}
```

**Nao ha fallback no `:root`, e isso e deliberado.** Nenhum outro token de tema
tem - `--rc-bg`, `--rc-accent` e `--rc-shadow-1` tambem nao. Inventar um
`system-ui` por baixo so para fonte tornaria a falta silenciosa: um tema de
cliente que esquecesse as tres renderizaria bonito e passaria por escolha.

O `check:temas` cobra os tres agora - passou de 72 para 75 tokens -, entao tema
novo sem fonte declarada falha o gate.

### Sete pecas novas, e nenhuma delas nasce so no web

`TimeField`, `TimePicker`, `FilterBar`, `FilterChip`, `QueryBoundary`,
`Popconfirm` e `VirtualList`. O catalogo vai de 83 para 90.

- **`TimeField` / `TimePicker`** - agendamento, ponto eletronico, janela de
  entrega. Nao sao wrapper do `MaskedInput`: o molde `hora` e posicional, poe
  os dois pontos e nada mais - nao sabe que `25:99` nao existe, nao conhece
  janela e nao tem seta. `25:99` nao vira `23:59` em silencio; marca invalido e
  volta ao ultimo valido ao sair, porque ninguem confere valor que o campo
  "aceitou". O `step` governa as setas e as opcoes, nunca a validacao.
- **`FilterBar` / `FilterChip`** - a fileira de filtros que toda listagem
  remontava a mao. Rola na horizontal: quebrar linha faria a altura depender de
  quantos filtros existem, e colapsar em "+3" esconde filtro atras de contador,
  que e a origem de "sumiram meus dados". A linha fica reservada para a tela
  nao pular quando o primeiro filtro entra.
- **`QueryBoundary`** - os quatro finais como peca. Usa os MESMOS nomes de prop
  do `DataTable` e do `ChartContainer`, e nao um terceiro dialeto. O `children`
  aceita funcao, que e o que justifica a peca: ela entrega o dado ja sem
  `undefined` e mata o `!` que a tela escrevia.
- **`Popconfirm`** - confirmar sem o peso do `AlertDialog`. Aqui dispensar
  CANCELA, ao contrario do vizinho, e a razao e que o gesto distraido leva ao
  resultado seguro: fechar nao apaga nada. Prender alguem num painel de 20rem
  para ler dois botoes cobra atencao onde nao ha risco, e e assim que se treina
  a pessoa a clicar em "Confirmar" sem ler.
- **`VirtualList`** - o virtualizador ja estava pago pelo `DataTable`. Ela mede
  a altura de verdade, o que a tabela nao pode fazer: linha absoluta sai do
  algoritmo de layout de tabela e leva junto a largura das colunas. Quem ja
  passou pela tela vale medida, quem nao passou vale palpite - e o que resolve
  o item que quebra em duas linhas a 390px. Anuncia `aria-setsize` no total
  real, entao o leitor de tela ouve "3 de 4000" e nao "3 de 20".

**Cinco das sete ja nasceram tambem no React Native**, no mesmo dia. As outras
duas nao sao atraso: o `VirtualList` nao porta porque a `FlatList` ja
virtualiza de fabrica, e o `Popconfirm` vira `AlertDialog`, porque painel
ancorado nao e idioma de toque - o proprio web ja vira folha de baixo abaixo de
640px. Isso deixou de ser boa vontade e virou regra com guarda; veja o
`CLAUDE.md`.

### Quebra silenciosa: o grafico mostrava esqueleto quando devia mostrar erro

O `ChartContainer` ordenava `isLoading` antes de `isError`. Com os dois ligados
- consulta que falhou durante um refetch -, ele desenhava o esqueleto e
escondia a falha: quem olhava via carregamento eterno, sem o botao de tentar de
novo.

O `DataTable` sempre ordenou certo, e `DataTable.md` e a tabela de paridade ja
afirmavam que a regra da casa era **erro vence carregando**. A peca e que
discordava do texto, calada, nos dois pacotes. Ha teste dos dois lados agora.

### O `Tracker` lia o dado errado em `dir="rtl"`

Nao era preferencia de layout: o flex espelhava o desenho, mas a conta que
descobre qual periodo esta sob o ponteiro nao. O ponteiro a 5% da esquerda lia
"Dia 2" quando a celula ali era "Dia 20" - **dezessete celulas de distancia**,
e o balao dizia o dado errado. A conta agora mede da borda que comeca a
leitura, as setas trocam de papel e a marca usa `insetInlineStart`.

O `Splitter` tem o mesmo limite e continua tendo: em `rtl`, arrastar 120px para
a direita move a divisoria 118px para a esquerda. Esta medido e escrito na
pagina dele, porque limite que ninguem escreve vira surpresa.

### `check:scripts`, e o guarda que ninguem rodava

`scripts/regressao-visual.ts` vivia fora do gate, e por isso ficou vermelho em
silencio: tres assinaturas de retrato divergiam do comitado desde o dia em que
os cinco paineis flutuantes foram refeitos, e ninguem sabia.

Ele nao pode entrar no gate - 77 segundos e um Chrome em caminho fixo de macOS,
enquanto a CI e ubuntu. Entao a guarda nova resolve a classe: todo `scripts/*.ts`
tem que ser alcancavel a partir do `check`, ou ter uma linha declarando o que o
impede. A lista so encolhe, como o `DEBT` das outras guardas. Custo: 22ms.

### Como migrar

Busca e troca por palavra inteira resolve oito dos dez. Os dois de forma -
`wrapperClassName` e `removeLabel` - viram chave dentro de objeto, e o `tsc`
aponta cada um. Cuidado com `selected` e com `wrapperClassName`, que continuam
existindo em outras pecas: confira a peca antes de trocar.

O agent `migracao`, que viaja no pacote, faz isso com o `tsc` entre uma quebra
e a seguinte.


## 0.6.1

### O molde do telefone volta para dentro do `applyMask`

```ts
applyMask("8388112233", "telefone")  // "(83) 88112-233"
```

O fixo saia vestindo a pontuacao do celular. O `MASKS.telefone` guarda um
molde so, e quem cumpria a promessa de trocar entre fixo e celular era o
`MaskedInput`, escolhendo o molde por fora antes de chamar - qualquer outro
chamador recebia o embolado.

Contorno em quem usa e uma segunda fonte de verdade: a regra so vale onde
alguem lembrou de repeti-la. A moeda ja era decidida dentro do `applyMask`
pelo mesmo motivo, e o telefone e o outro molde que depende do que ja foi
digitado. Agora os dois moram no mesmo lugar, e o componente anda pelo mesmo
caminho que qualquer um que chame o utilitario direto.


## 0.6.0

Uma releitura do relatorio de bancada sobre a 0.5.0, e um defeito que apareceu
no caminho. O item de contraste da lista - a fronteira de `Input` e do botao
`secondary` em 1,28:1 - ja estava fechado na 0.5.0, e o verificador mede 3,54:1
no claro e 3,30:1 no escuro contra o minimo de 3.

### O nome da mascara passa a dizer a natureza do que ela devolve

As tres tinham a mesma assinatura, `(text: string) => string`, e uma devolvia
coisa de outra natureza:

```ts
applyCurrencyMask("123456")  // "1.234,56"        texto
maskDate("31122026")         // "31/12/2026"      texto
phoneMask("11987654321")     // "(99) 99999-9999" MOLDE
```

Quem chamasse `phoneMask` esperando o telefone formatado escrevia o molde
literal no campo, e o TypeScript nao tinha como acusar. Agora `applyXMask`
devolve texto pronto e `phonePatternFor` devolve molde - tipado como `Mask`,
o que o liga ao `applyMask` que o recebe.

Nada quebra: `phoneMask` e `maskDate` continuam exportados como apelido
marcado `@deprecated`.

### `<li>` dentro de `<li>` na linha com acao

O `SidebarMenuRow` ja e o `<li>` da linha, e o `SidebarMenuItem` abria um
segundo por dentro. No cliente isso nunca aparece, porque o React monta no a
no e ninguem passa pelo analisador de HTML. A conta chega no SSR: o navegador
conserta separando os dois em irmaos, e a arvore consertada nao bate com a que
o React espera na hidratacao - o caminho comum de quem monta em Next.js, e nao
o raro.

### A barra encolhida para de sair torta

O `SidebarBrand` centraliza quando a barra encolhe, e o `SidebarFooter` estava
na outra ponta da mesma barra sem esse tratamento. O rodape esta em campo em
toda tela de operacao, entao a torta aparecia sempre.

### A verificacao nova

`check:instalacao` acusa um `bun install` solto dentro de `native/`. A pasta
nao e workspace, entao a instalacao de la cria uma segunda copia do React, e o
`bun test` da raiz quebra em noventa e oito testes com "Invalid hook call" -
apontando para codigo que esta certo. A CI nunca ve, porque so instala na raiz.


## 0.5.0

Uma bancada externa auditou a biblioteca inteira - 258 exports instanciados,
118 paginas lidas, contraste medido nos dois temas, 12 telas a 390px e 93
testes de interacao em tres navegadores. Esta versao e a resposta.

O padrao dos achados vale mais que a lista: **o que era verificado estava
impecavel, e todo defeito morava numa faixa que nenhum check cobria** - fuso de
data, callback na doc, contraste nao-textual, estado indeterminado, doc que
promete peca ausente. Por isso metade do trabalho aqui e verificacao nova, e
nao conserto.

### As pecas que faltavam

`Clipboard`, `Code` e `CodeBlock`, `RelativeTime`, `Timeline`, `Indicator`,
`AvatarGroup`, `PasswordInput`, `TagsInput`, `Tracker`, `Splitter` e
`Editable`. Todas com pagina, exemplo que roda, teste e linha na skill - que e
o contrato que faltou ao `FileUpload`, publicado com a doc pronta e o
componente ausente.

### `classNames` por parte

Abaixo da raiz, cada peca era no selado: a trilha do `Progress`, o pino do
`Slider`, a marca do `Checkbox`, a linha do `DataTable`, a tarja do `Dialog`.
O unico gancho de parte da biblioteca inteira era o `labelClassName`.

```tsx
<Slider classNames={{ track: "bg-accent-subtle", thumb: "shadow-glow" }} />
<Dialog classNames={{ backdrop: "backdrop-blur-md" }} />
```

Os nomes das partes sao os mesmos da secao "Partes" de cada pagina.
`labelClassName` continua valendo.

### Forma e movimento entram no tema

Canto, duracao, curva e espacamento de letra saem da escala global para
`src/tokens/forma.css`, e um tema pode redefinir os nove:

```css
[data-rc-theme="acme"] {
  --rc-radius-md: 0px;
  --rc-duration-base: 140ms;
}
```

### Onze consertos que a auditoria achou

Fuso nos formatadores de data do grafico (todo eixo de tempo do produto estava
deslocado um dia); barra indeterminada que parecia 100%; botao carregando que
perdia a variante; molde de mascara desconhecido que virava o valor do campo;
telefone fixo mal-formatado pelo `defaultValue`; caixa misturada no cabecalho
que ordena; `ComboboxValue` exportado, que destrava as fichas; tom no `Toast`;
`Avatar` que sumia quando `surface` e `surface-raised` sao iguais; contraste do
aviso no tema claro; e o rotulo de grupo da `Sidebar` que nunca sumia quando a
barra encolhia.

Mais tres de acessibilidade que so aparecem no celular ou no teclado: campo de
texto que disparava o zoom do iOS, quatro alvos abaixo de 24px, e - dentro de
um `Field` - todo radio de um grupo herdando o rotulo do campo, com o leitor de
tela dizendo o mesmo nome para todas as opcoes.

### A fronteira dos controles passa a cumprir a WCAG 1.4.11

`--rc-border-strong` sobe para 3:1 contra a superficie, e campo, moldura com
encosto, gatilho do `Select` e busca da barra passam a veste-la. **A mudanca e
visivel**: a borda de todo controle fica mais presente nos dois temas.

### Nove guardas novas

`check:props` (as tabelas saem do compilador, e 2.234 callbacks voltaram),
`check:nomes` (idioma do codigo), `check:doc` (pagina sem codigo e peca sem
pagina), `check:grupos` (seletor de grupo morto), `check:paridade` (a tabela do
nativo contra o indice real), `check:native:types` (a fonte publicada do
nativo), contraste com alfa composto, pares nao-textuais de 1.4.11, e acento em
texto de interface. Mais o `bun run visual`, que compara os retratos por
assinatura - ele pega o que `tsc` e teste de unidade nao pegam.

### Cada prop diz em que versao apareceu

As tabelas de props - no site e nos `.md` que um agente le - ganham a coluna
"Desde". Quem tem uma versao velha instalada precisa saber se a prop que esta
lendo existe para ele, e ate aqui descobria pelo erro de tipo, ou pior, pelo
atributo solto no DOM.

O marcador nao e escrito a mao: `bun run gen:props --desde 0.5.0` carimba, no
lancamento, tudo que ainda nao tem carimbo. Durante o desenvolvimento ninguem
sabe em que versao a prop vai sair, e adivinhar produz um numero errado que a
doc publica com confianca. Prop com `-` e prop que ainda nao saiu.

### O nativo ganha camada 3: tema de cliente

`@rivocode/ui-native` aceita um tema de cliente, gerado do mesmo CSS que veste
o web:

```sh
bun run gen:native --tema tema-acme.css --saida acme.theme.ts
```

```tsx
<RivoProvider theme={acmeTheme} scheme="system">
```

Os dois temas de casa nao mudam: continuam no `light-dark()`, com troca no
mesmo frame e sem re-render. O tema de cliente entra pelo
`VariableContextProvider` do NativeWind e custa uma re-renderizacao por troca -
paga so por quem veste um cliente.

Para quem escreve peca nativa: cor lida por fora da classe agora vem de
`useRivo().colors`, e nao de `tokens.themes[...]`. Um teste falha se alguem
voltar a ler direto, porque assim a tela do cliente sairia com metade das cores
dele e metade da lima da RivoCode.

### `format` significava tres coisas, e agora significa uma

Nas pecas que escrevem numero, `format` era `Intl.NumberFormatOptions`; no
eixo do grafico, era nome de formatador ou funcao; no `ChartDonut`, so funcao.
O caminho que dava erro de tipo era o menos ruim - o que nao dava e pior:
`{ style: "percent" }` num medidor de 0 a 100 imprime 8.200% ao lado de uma
barra em 82%, e nada reclama.

| Peca | Antes | Agora |
|---|---|---|
| `Meter`, `Progress`, `Slider` | `format={{ style: "percent" }}` | `numberFormat={{ style: "percent" }}` |
| `Meter`, `Progress`, `Slider` | - | `format="percent"` ou `format={(v) => ...}` |
| `NumberField` | `format={{ ... }}` | `numberFormat={{ ... }}` |
| `ChartDonut` | so funcao | tambem nome: `format="currencyShort"` |

O `NumberField` nao aceita nome de formatador, e a razao e o campo ser
editavel: um formatador so escreve, e o que a pessoa digita precisa ser lido de
volta.

### Os adaptadores de formulario tem nome de formato, e nao de peca

`forCheckbox` sempre serviu o `Switch` sem uma linha de diferenca, e
`forSelect` serve `RadioGroup`, `ToggleGroup`, `NumberField`, `Slider` e
`OTPField`. O nome fazia a API parecer menor do que e.

| Antes | Agora | Serve |
|---|---|---|
| `forSelect` | `forValue` | Tudo que tem `value` e `onValueChange` |
| `forCheckbox` | `forChecked` | Tudo que tem `checked` e `onCheckedChange` |
| `forDatePicker` | `forDate` | Valor em `Date` |

Os nomes antigos continuam valendo e apontam para os mesmos adaptadores.
`forValue` devolve o valor com o tipo que o schema deu a ele, em vez de
`unknown`, entao controle tipado encaixa sem `as`.

Os tipos deixam o portugues: `PropsDeSelect` vira `ValueProps`,
`PropsDeCheckbox` vira `CheckedProps`, `PropsDeDatePicker` vira `DateProps`.
Os nomes antigos seguem exportados como apelido.

### O DatePicker renomeia a prop `confirmar`

Era a unica prop publica em portugues numa API em ingles. Agora e `confirm`.

```tsx
<DatePicker confirmar />   // antes
<DatePicker confirm />     // agora
```

### Os formatadores saem tambem pela raiz

`currencyShort`, `percent`, `integer`, `monthShort` e os demais continuam em
`@rivocode/ui/chart` e passam a sair de `@rivocode/ui`. Formatar dinheiro numa
celula de tabela nao e assunto de grafico.

## 0.4.0

O 0.3.0 traduziu os nomes publicos e deixou uma sobra: o tipo virou
`WizardState`, mas os campos dele continuaram em portugues. Quem chamava
`useWizard()` escrevia `wizard.passo` e `wizard.avancar()` dentro de um tipo
com nome ingles. Fechado agora, pelo mesmo motivo de antes, e de novo sem
alias.

### `useWizard()`

| Antes | Agora |
|---|---|
| `passo` | `step` |
| `atual` | `current` |
| `primeiro` | `isFirst` |
| `ultimo` | `isLast` |
| `avancar` | `next` |
| `voltar` | `back` |
| `irPara` | `goTo` |

### Telas estreitas

`useNarrowScreen()` passa a se chamar `useMobile()`, e o `useSidebar()` devolve
`isMobile` no lugar de `narrow`. O tipo `SidebarState` agora e exportado.

O nome antigo descrevia a medida; o novo descreve a pergunta que se faz. E a
barra ja resolvia o celular sozinha sem deixar a aplicacao ler a mesma
resposta, que e como as duas metades da tela acabam discordando sobre o que e
celular.

### Tokens e atributos

| Antes | Agora |
|---|---|
| `--rc-ease-folha` | `--rc-ease-sheet` |
| `--rc-duration-folha` | `--rc-duration-sheet` |
| `--rc-sidebar-icone` | `--rc-sidebar-icon` |
| `data-encolhida` | `data-collapsed` |
| `data-lado` | `data-side` |
| `data-orientacao` | `data-orientation` |
| `data-rc-sidebar="aberta\|fechada"` | `"open"\|"closed"` |

Quem estilizava a barra por `data-[encolhida]` precisa trocar o seletor.

### Correcoes

A barra lateral guardava um estado so para dois contextos diferentes, e no
celular abria sozinha ao carregar, tapando a tela. Agora a folha comeca
fechada e se fecha ao escolher um item.

Na `DataTable`, clicar num botao dentro da linha subia ate a linha: abrir o
menu de acoes trazia junto a folha de detalhes. A linha passa a ignorar
cliques que nasceram em algo interativo.

Cinco componentes prometiam `truncate` sem `min-w-0`, o que impede o item flex
de encolher: em vez de cortar o texto, ele empurrava o container para fora da
tela.

### Por dentro

Os nomes internos passaram para ingles tambem, e quatro modulos foram
renomeados (`lib/mascara`, `lib/tela`, `lib/data`, `form/adaptadores`). Nada
disso e importado direto por quem usa o pacote: as entradas publicas continuam
`@rivocode/ui`, `/form` e `/chart`.

## 0.3.0

Todo nome publico passa a ser ingles. E quebra, e vale a pena agora: o pacote
saiu no npm ha poucas horas, entao renomear custa uma versao. Daqui a algumas
semanas custaria um guia de migracao e a paciencia de quem ja usava. Sem alias
de compatibilidade, de proposito: alias e divida que ninguem cobra e ninguem
remove.

A regra e a mesma do resto do projeto: codigo em ingles, conteudo em PT-BR.

### Tipos

| Antes | Agora |
|---|---|
| `Coluna` | `Column` |
| `Passo` | `Step` |
| `EstadoDoAssistente` | `WizardState` |
| `Migalha` | `Crumb` |
| `No` | `TreeNode` |
| `Mascara` | `Mask` |
| `NomeDeMolde` | `MaskName` |
| `MovimentoDoGrafico` | `ChartMotion` |

### Funcoes e constantes

| Antes | Agora |
|---|---|
| `formatarData` | `formatDate` |
| `lerData` | `parseDate` |
| `mascararData` | `maskDate` |
| `aplicarMascara` | `applyMask` |
| `aplicarMoeda` | `applyCurrencyMask` |
| `aplicarMolde` | `applyPattern` |
| `emCentavos` | `toCents` |
| `semMascara` | `unmask` |
| `moldeDeTelefone` | `phoneMask` |
| `MOLDES` | `MASKS` |
| `folhasDe` | `leavesOf` |
| `nomeDeTecla` | `keyName` |
| `useTelaEstreita` | `useNarrowScreen` |

### Adaptadores de formulario

| Antes | Agora |
|---|---|
| `paraDatePicker` | `forDatePicker` |
| `paraSelect` | `forSelect` |
| `paraCheckbox` | `forCheckbox` |

### Como migrar

Busca e troca por palavra inteira resolve. Cuidado so com `No`, que e curto
demais para trocar as cegas: procure por `type No`, `No[]`, `: No` e `<No>`.

## 0.2.0

Primeira versao no npm publico, sob licenca MIT. O `0.1.0` saiu so no GitHub
Packages e tem API diferente desta: **nao troque um pelo outro sem ler o que
mudou de nome.**

### Quebra

Nomes que estavam em portugues no codigo passaram para ingles. O conteudo que a
pessoa le continua em PT-BR.

- `@rivocode/ui/chart`: `moeda`, `moedaCurta`, `curto`, `inteiro`,
  `porcentagem`, `mesCurto`, `diaEMes` e `formatadores` viraram `currency`,
  `currencyShort`, `compact`, `integer`, `percent`, `monthShort`, `dayMonth` e
  `formatters`. Os tipos `Formato` e `NomeDeFormato` viraram `Format` e
  `FormatName`.
- `useSidebar()` devolve `{ open, collapsed, narrow, toggle, close }`, e nao
  mais `{ aberta, encolhida, estreita, alternar, fechar }`.

### Novo

- `Kbd`, `ButtonGroup`, `AspectRatio` e `Command`, a paleta de comandos com
  busca sem acento e sem caixa.
- Na `Sidebar`: `SidebarBrand`, `SidebarInput`, `SidebarMenuSub`,
  `SidebarSeparator`, `SidebarMenuAction`, `SidebarMenuSkeleton`,
  `SidebarRail`, e `side="right"`. Encolhida, o submenu vira menu ao lado em
  vez de sumir.
- Em `@rivocode/ui/chart`: `ChartDonut` com o total no meio, `Sparkline`,
  `ChartXAxis` e `ChartYAxis` com o padrao ja certo, `useSeriesToggle` para a
  legenda esconder serie, e estados de consulta no `ChartContainer`.
- `TabList` ganha `variant="segmented"`, para trocar a forma de ver a mesma
  coisa em vez de dividir a pagina.
- `Checkbox`, `Radio` e `Switch` aceitam o texto como filho e se embrulham num
  `<label>`. Antes o filho sumia em silencio.

### Correcao

- O preset passa a pintar o fundo pelo tema. Ate aqui o `data-rc-theme` so
  definia os tokens, entao a pagina ficava no cinza padrao do navegador.
- `Combobox`: o painel vazio deixou de reservar 48px em todo painel.
- `Slider` de intervalo desenha os dois pontos. Antes o limite de cima nao
  existia.
- `Steps`: o conector encolhe em vez de truncar o rotulo.

## 0.1.0

Primeira versao, no GitHub Packages.
