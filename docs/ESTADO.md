# Onde paramos

Atualizado em 27/08/2026, no fim da tarde. Este arquivo e o "onde paramos" do
repositorio: serve a quem chega frio, humano ou agente, e responde tres coisas:
o que existe, o que falta de verdade, e o que esta parado esperando uma pessoa.

Todo numero aqui foi medido com comando, nesta arvore, hoje. A secao **Como
conferir cada numero** no fim diz qual comando produziu cada um, para que a
proxima pessoa nao precise acreditar em nada: mede de novo.

Isso nao e cerimonia. Hoje duas versoes deste pacote sairam para o npm **sem
procedencia** porque alguem confiou num relato em vez de abrir o arquivo, e
publicacao no npm nao se desfaz. O indice de trabalho que originou esta
reescrita tinha erros de numero em tres pontos, e eles estao apontados abaixo,
no lugar onde a medida discordou.

O estado do repositorio mora aqui. A REGRA mora em `CLAUDE.md`, o contrato de
quem consome mora em `.design-sync/conventions.md` e em
`.claude/skills/rivocode-ui/SKILL.md`.

## O que existe hoje

| Peca                        | Onde                                        | Estado                                                              |
| --------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `@rivocode/ui`              | este repo, `src/`                           | **0.9.1** comitada; 0.9.0 no npm, falta a tag                        |
| `@rivocode/ui-native`       | este repo, `native/`                        | **0.4.1** comitada; 0.4.0 no npm, falta a tag                        |
| Site de documentacao        | `apps/docs/`, no ar em `ds.rivocode.com.br` | No ar e em dia com a `main`                                          |
| Landing                     | repo `rivocode.com`, na `main`              | No ar, no `^0.7.0`, com o `fonts.css` importado e o lock decidido    |
| Sync com o claude.ai/design | projeto `RivoCode`                          | Parado desde 24/08, e provavelmente nao vale mais retomar            |

A arvore esta **limpa**: `git status --short` devolve zero linhas. Foram **19
commits hoje**, e **dez deles ainda nao foram empurrados** - `origin/main` esta
em `9f3d897` e o `HEAD` em `3f6b693`. Isso importa mais do que parece, e esta
explicado em "O que esta bloqueado esperando acao humana": push na `main`
publica o site, e enquanto ninguem empurra, `ds.rivocode.com.br` descreve a
biblioteca de onze e meia da manha.

O gate esta verde. `bun run check` roda **trinta verificacoes** mais a suite e
sai com codigo zero; a suite tem **1285 testes em 108 arquivos**, com 3349
chamadas de `expect`. O `bun run build` rodou depois do ultimo commit
(`dist/index.js` e `dist/cli.js` sao de 13:04, e o commit mais novo e de 13:03).

### O catalogo, por familia

Sao **91 pecas** e **177 documentos** em `.design-sync/docs/`. Os dois numeros
sao diferentes de proposito, e a diferenca e a coisa mais facil de errar aqui:
**parte nao e peca**. `CardHeader`, `DialogFooter` e `SelectItem` so existem
dentro de outra coisa, e as **86 partes** moram na pagina de quem as monta, com
ancora propria. Quem conta os 177 arquivos como catalogo passa a gastar contexto
abrindo `CardTitle.md` como se fosse componente independente. A regra esta em
`apps/docs/src/parts.ts` e a guarda que a segura em `test/indice.test.ts`.

| Familia      | Quais                                                                                                                                                                                                                                                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formulario   | Autocomplete, Calendar, Checkbox, CheckboxGroup, ColorPicker, Combobox, DatePicker, DateRangePicker, Editable, Field, Fieldset, FileUpload, Form, Input, InputGroup, MaskedInput, NumberField, OTPField, PasswordInput, RadioGroup, SearchInput, Select, Slider, Switch, TagsInput, Textarea, TimeField, TimePicker, Tree, TreeSelect |
| Estrutura    | Accordion, AspectRatio, Avatar, Card, Collapsible, DataTable, DescriptionList, FilterBar, FilterChip, Item, PageHeader, ScrollArea, Separator, Splitter, Stat, Table, VirtualList                                                                                                                                                   |
| Feedback     | Alert, Badge, EmptyState, Indicator, Kbd, Meter, Progress, QueryBoundary, Skeleton, Spinner, ToastViewport                                                                                                                                                                                                                          |
| Navegacao    | Breadcrumb, Command, Menu, Menubar, NavigationMenu, Pagination, Sidebar, Steps, Tabs                                                                                                                                                                                                                                                |
| Sobreposicao | AlertDialog, ContextMenu, Dialog, Popconfirm, Popover, PreviewCard, Sheet, Tooltip                                                                                                                                                                                                                                                  |
| Acoes        | Button, ButtonGroup, Clipboard, Toggle, ToggleGroup, Toolbar                                                                                                                                                                                                                                                                        |
| Grafico      | ChartContainer, ChartDonut, ChartRadial, Sparkline                                                                                                                                                                                                                                                                                 |
| Dados        | Code, EventCalendar, RelativeTime, Timeline, Tracker                                                                                                                                                                                                                                                                               |
| Fundacao     | RivoProvider                                                                                                                                                                                                                                                                                                                       |

Os nomes de familia saem do `category` do proprio documento, e o site os escreve
com acento. Nenhuma peca esta sem documento, e nenhum documento esta sem codigo
por tras: `check:doc` confere os dois sentidos sobre as 177 paginas.

Fora do `@rivocode/ui` principal ficam dois subcaminhos, `@rivocode/ui/form` e
`@rivocode/ui/chart`, cada um com dependencia de par opcional. Mais os
utilitarios: `useZodForm`, `useWizard`, `useSidebar`, `useTelaEstreita`,
`formatDate` e `applyMask`. Contando o lado nativo sao **seis subcaminhos de
codigo**, e `check:contrato` cobra que cada export deles apareca no
`conventions.md` E na skill.

**Fundacao:** tokens em tres camadas, temas `rivocode-dark` e `rivocode-light`,
densidade confortavel e compacta no web, guarda de cor literal sobre 96
arquivos, e duas guardas de contraste - uma por pacote.

## O React Native

A fila continua com **uma** peca, e ela e a mesma de ontem: o `EventCalendar`.
Das 91 pecas do web, **73 tem par no celular**.

| No React Native    | Quantas | O que significa                                                                              |
| ------------------ | ------: | -------------------------------------------------------------------------------------------- |
| Traduz, mesmo nome |      69 | mesma peca, mesmo nome de prop: a assinatura muda, veja abaixo                               |
| Traduz, outro nome |       4 | `Autocomplete` vira `Combobox`, `DataTable` vira `DataList`, `ToastViewport` vira `useToast` |
| `○ na fila`        |       1 | `EventCalendar`, e a linha dele esta em `FILA_DECLARADA`                                     |
| `✕ nao porta`      |      17 | decisao, nao atraso: idioma de mesa que nao tem sentido no toque                              |

O `EventCalendar` merece o paragrafo, porque ele e o teste do acordo do nono
artefato. Ele esta na fila por **decisao de gesto** e nao por falta de tempo:
arrastar para mudar de semana, tocar e segurar para criar, e o que fazer quando
o dedo pousa sobre dois eventos que se sobrepoem. Nenhuma dessas tem resposta no
web, onde sao ponteiro e teclado. `check:paridade` recusaria a fila sem essa
linha escrita, e a lista so encolhe.

Uma coisa que ele cobrava ja foi paga: o calculo de layout dele e funcao pura
sem DOM, e nao havia mecanismo para compartilhar codigo puro entre os dois
pacotes. Hoje ha - `src/shared/` espelhado em `native/src/shared/`, com
`check:compartilhado` conferindo que o espelho nao tem import nem global de
plataforma. Sao **dois arquivos** atravessando por enquanto, `settled.ts` e
`time.ts`, e o `settled.ts` e a espera de 200ms que os dois `ChartContainer`
usam para nao acusar um pai que mede em dois passes.

**Aviso que vale mais que a tabela:** nome igual nao e API igual. No nativo tudo
e controlado (sem `defaultValue`) e a lista vem por `items`, nao por composicao.
Nunca prometa que a tela do web vai rodar no celular: o que se reaproveita e o
vocabulario de classes, o token e a escolha da peca. O JSX se reescreve.

O pacote tem quatro subcaminhos de codigo (`form`, `chart`, `clipboard` e
`file-upload`), e a regra que os separa e **um subcaminho por peer, e nao um por
assunto**. No celular peer nao e byte: modulo do Expo custa build. Um `/expo`
comum cobraria o seletor de documentos de quem so quer copiar uma chave de
acesso. Entram agora `./tokens`, `./contrast` e `./theme.css`, que nao carregam
peer nenhum, e **dois binarios**: `rivocode-ui-native-css` e
`rivocode-ui-native-theme`.

## O dia: o consumidor mediu, e a biblioteca respondeu

O dia nao comecou com uma lista de desejos. Um consumidor real instalou
`@rivocode/ui@0.8.0` e `@rivocode/ui-native@0.3.1` num app Expo e num app web, e
voltou com achados medidos com comando. O tema das duas versoes fechadas hoje e
um so: **a biblioteca passa a cobrar no consumidor o que ela ja cobrava em
casa.**

### O tema de cliente no nativo nunca vestiu a tela inteira

O sintoma era donut de um tema e botao de outro, lado a lado. A causa estava
abaixo da biblioteca: o compilador do `react-native-css@3.0.7` crava o
hexadecimal dentro da regra, e no CSS compilado nao sobra **uma ocorrencia** de
`--`. O `VariableContextProvider` entregava os papeis a ninguem, porque classe
nenhuma lia variavel. O que o mapa alcancava era so quem le cor por JS.

Manter variavel viva no CSS explode a compilacao pelas cinco formas testadas, e
`3.0.7` e a ultima versao publicada. A saida foi pelo outro lado: as pecas param
de precisar do mapa. O `RivoProvider` resolve os **45 papeis** do proprio CSS
compilado em runtime, via `useCssElement`, e publica pelo `RivoContext` que ja
existia. Os **14 arquivos** que leem `useRivo()` fora do provider nao mudaram uma
linha. O mapa de tema por objeto levou `@deprecated`, ficou inerte, e em
28/08/2026 saiu de vez do pacote: nao ha mais tipo, nem membro na uniao da prop
`theme`, nem aviso em `__DEV__`. A prop `scheme` saiu junto - sem o mapa, era
ela quem escolhia o esquema dele, e ninguem mais a lia.

Faltavam classes para isso funcionar, e faltavam justo as dos graficos: agora
`native/theme.css` emite `bg-` para os 45 papeis, e o app de exemplo tem as 45
regras `.bg-*` no CSS gerado. **O crescimento de 8,3% que o CHANGELOG cita nao
se reproduz nesta arvore.** O que se mede e `native/theme.css` indo de 3419 para
4267 bytes no commit do tema, ou seja +24,8%, e o `examples/native/generated.css`
crescendo 14,5% em regras ao longo do dia - e nada nele mudou naquele commit. Se
os 8,3% foram medidos, foi no CSS compilado do projeto de quem reportou, que
daqui nao se alcanca.

Duas coisas que valem entrar no contrato de quem usa: cor de classe no nativo so
muda em **build**, e `light-dark()` tem duas vagas, entao sao **dois temas por
build, no maximo**.

### O pacote nativo nao subia no react-native-web

`Appearance.setColorScheme` nao existe no `react-native-web`, e o `RivoProvider`
chamava sem guarda. Como ele embrulha o app inteiro, o app inteiro nao
renderizava: tela em branco. A chamada virou condicional, e dois vizinhos
sairam na mesma varredura, `I18nManager.isRTL` e `AppState.addEventListener`.
Isso vale mais que um alvo a mais: o web e a unica bancada onde se inspeciona
arvore renderizada e se tira retrato sem simulador.

### A prop `density` do nativo saiu, e e quebra

`<RivoProvider density>` e `RivoDensity` nao existem mais - zero ocorrencias em
`native/src/` e em `native/tokens.ts`. A prop era aceita, a escala `compact` era
gerada, e nenhuma peca lia nenhuma das duas: a API prometia uma densidade que a
biblioteca nunca entregou. Ela nao vai ser implementada, porque a escala compacta
levaria o controle medio de 40 para 32 pontos, abaixo dos 44 que um dedo pede.

### Duas guardas sairam do repositorio e passaram a rodar no consumidor

A quebra mais cara da 0.7.0 foi silenciosa: os `--rc-font-*` viraram papel de
tema, dois temas de cliente escritos na 0.6.1 nao os declaravam, e a galeria
perdeu familia de fonte. O `tsc` compilou, o Vite construiu, e a unica coisa
errada era a tela. A guarda que pegaria isso existia, e rodava aqui.

Agora ha `rivocode-ui check-theme` no CLI do web. Ele cobra **55 papeis
obrigatorios** e mede o contraste de cada par, nessa ordem - papel faltando
primeiro, porque medir o que nao existe cai no valor herdado e devolve numero
bonito por acidente. Aceita `.css` e `.theme.ts`, e tem `--json` para CI. **O
indice que originou esta reescrita diz 45 papeis, e 45 e o numero do NATIVO**;
no web sao 55 obrigatorios de 58 catalogados, com tres opcionais
(`--rc-accent-image`, `--rc-accent-shadow`, `--rc-overlay-filter`).

E ha `rivocode-ui-native-theme` como binario do nativo: **8 sementes por
esquema, 37 papeis derivados, 45 no `@theme`**. A regra e uma so, o gerador
nunca inventa matiz nova; e ele nao escreve tema que reprova no contraste. O app
que reportou tudo isso precisou escrever 220 linhas para vestir um cliente, e a
copia da conta que ele portou devolvia `NaN` em 12 dos 45 papeis.

### A conta de contraste mudou de casa e aprendeu cor moderna

Ela morava em `scripts/`, que nao e publicado. Hoje mora em `src/lib/contrast.ts`
(919 linhas), viaja em `dist/cli.js` e **nao** em `dist/index.js` - medido:
zero ocorrencias de `contrastRatio` ou `oklch` no bundle da biblioteca, contra
51 KB de `cli.js`. O pacote nativo publica FONTE e nao alcanca o `src/` do web,
entao ha um espelho gerado, `native/scripts/contrast.mjs`, exportado como
`@rivocode/ui-native/contrast`, e `check:native:contrast` confere as **180
linhas** do espelho E que ele mede igual.

A conta lia so sRGB. Hoje le hexadecimal de 3, 4, 6 e 8 digitos, `rgb`, `hsl`,
`hwb`, `lab`, `lch`, `oklab`, `oklch` e `color()` em todos os espacos
predefinidos - e a conversao foi provada contra o navegador, e nao contra si
mesma. Cor que nao se mede continua reprovando em vez de ficar verde.

### Quatro pecas tinham o mesmo defeito de contraste no tema claro

`Switch`, `Checkbox`, `Radio` e `Slider`. Nas tres primeiras o defeito era do
tipo invertido: o estado ativo ficava MENOS visivel que o inativo. O trilho
ligado pintava `accent` e media 1,21:1 sobre a pagina, contra 3,33:1 do
desligado; a WCAG 1.4.11 pede 3:1. No `Slider`, nenhum par alcancava 3:1 - nem
"quanto ja foi" se lia por cor.

Todos pintam `accent-text` com a marca em `surface-raised` agora, e no tema
escuro os dois papeis apontam para o mesmo valor. Cinco pares entraram nas duas
guardas de contraste, com piso E comparacao: o marcado tem que passar dos 3:1 e
nao pode pesar menos que o desmarcado. Hoje o web mede **152 pares, 76 por
tema**, e o nativo mede 52 pares de texto, 33 de 1.4.11, 1 de camada e 3 do
controle marcado por esquema, com sete papeis declarados sem par.

### Duas pecas param de aceitar uso errado em silencio

`ChartContainer` com altura zero recebia `height: 0` na funcao de desenho e o
cartao ficava vazio, sem erro e sem pista. `Indicator` embrulhando conteudo
largo cobria texto, sempre. Os dois avisam agora, nos dois pacotes, com os
mesmos numeros: 200ms depois do primeiro layout no primeiro caso, e 48 pontos de
teto no segundo.

### O retrato ganhou moldura de secao, e parou de comparar build velho

Entrou `demo/secao.html`, que monta uma secao isolada dentro de uma moldura
magenta que o script apara, e entrou `check:retratos` no gate - guarda que roda
em milissegundos e sem navegador, cobrando que secao declarada tenha marcador na
vitrine e assinatura comitada. Hoje sao **44 assinaturas: 32 da vitrine e 12 de
secao**, sobre 6 areas em dois temas, com 22200 quadrados guardados e 47
marcadores disponiveis no demo.

E `bun run visual` passou a RECUSAR retrato que nao seja do build atual: cada
PNG carrega a marca do build que o gerou, num pedaco `tEXt` chamado `rc-build`
com o resumo de conteudo de cada arquivo que o navegador carregou. Custa de 122
a 166 bytes por PNG, contra os 77s de Chrome de cada `bun run shot`.

### `check:classes`: classe usada e nao gerada falha o gate

Nasceu do `shadow-1` do polegar do `Slider` nativo, que nunca gerou um byte:
`shadow` nao existe no CSS nativo, o `tsc` passava, o build passava, e o polegar
ficou sem sombra desde que nasceu. A guarda pergunta ao proprio compilador do
Tailwind em vez de consultar lista, entao variante, valor arbitrario e
modificador de opacidade passam pelo caminho do build. Cobre **193 arquivos**
nas duas arvores, e **nao tem lista de excecao** - o acordo e que continue sem.

### Duas coisas menores, e as duas eram funcao perdida

`demo/folhas.tsx` e `demo/dialog.tsx` viraram quatro quadros em iframe cada,
porque tarja `fixed inset-0` e escopada pela JANELA e envenenava os dois temas
da mesma pagina. E o `build:css` do app de exemplo ganhou `--watch`, ligado nos
quatro comandos de `start`.

O botao de copiar do painel de exemplo do site nao estava cortado a 320px:
estava **inteiramente fora do cartao**. A fileira interna tem 334px de largura
intrinseca numa coluna de 248 e nao encolhe, entao transbordava 86px e o
`overflow-hidden` da secao comia o botao inteiro - 75px fora, e
`elementFromPoint` no centro dele nao devolvia nada. Sao treze deles na pagina
do `DataTable`. A linha quebra agora, e as abas viajam junto com o copiar para a
quebra nunca separar o botao do "Codigo" que ele copia: custa 42px por cartao a
320, e zero a 414, 768 e 1280.

## Verificacao que nao verifica

Esta e a secao mais util do arquivo, e nao e uma lista de bugs. O dia teve uma
familia de defeito que se repetiu quatro vezes, em quatro lugares que nao se
parecem: **a guarda estava verde por nao estar olhando nada.** Verde por
vacuidade nao e um bug de teste, e um bug de confianca - ele consome o unico
recurso que o gate tem, que e alguem acreditar nele.

Os quatro casos, medidos:

1. **Um glob de chave aninhada casava zero arquivos.** A juncao das duas arvores
   em `test/acentos.test.ts` foi escrita como `{src/**/*.{ts,tsx},...}`, e o
   Glob do Bun nao aninha `{}` dentro de `{}`. O teste varria ZERO arquivo, em
   silencio, e passava. O antidoto entrou no proprio teste, uma linha antes do
   laco: `expect(files.length).toBeGreaterThan(100)`. Varredura que nao acha
   nada nao pode passar calada.

2. **`toContain` sobre string de classe passava com o defeito E com o
   conserto.** `expect(className).toContain("bg-accent")` fica verde quando a
   classe e `bg-accent-text`, porque uma e prefixo da outra - e `bg-accent-text`
   era exatamente o conserto. Apareceu em tres arquivos de teste. O antidoto e
   dividir antes de comparar (`className.split(" ")`), o que transforma prefixo
   em token exato, e afirmar tambem o `not.toContain` do valor antigo: sem isso o
   teste nao distingue conserto de nada.

3. **A frase-marca do `check:cli` saiu da fonte num rename.** A guarda procura em
   `dist/index.js` uma frase literal que so existe dentro do modulo de
   ferramenta; frase que nao existe nunca aparece no bundle, e a guarda ficou
   verde por vacuidade. O antidoto foi uma quarta assercao: a frase tem que
   continuar existindo NA FONTE. As tres marcas de hoje estao em `TOOL_ONLY`, em
   `scripts/check-fronteira-do-cli.ts`, e sao literais e nao nomes de funcao,
   porque nome sobrevive ao empacotamento com sorte e literal sobrevive sempre.

4. **Retratos foram comparados contra um build velho, e duas frentes relataram o
   resultado como regressao real do `EventCalendar`.** Nao era. Os PNG eram de
   08:55 e o `demo/dist/demo.css` foi reconstruido as 09:12; o CSS velho era o de
   hoje menos uma regra, `.[scrollbar-gutter:stable]`, usada num unico lugar do
   repositorio. Provado por reconstrucao: apagando so essa regra e
   refotografando, o resultado bateu com o PNG velho em 0 pixels de 6.150.400 e
   reproduziu os numeros exatos do alarme. Custou meio dia de duas pessoas. O
   antidoto e a marca de build dentro do PNG, descrita acima: comparacao que
   pode estar medindo outro build nao pode sair verde nem vermelha, porque as
   duas respostas mentem.

O que os quatro tem em comum e que o sintoma era **ausencia**: nenhum deles
falhou, nenhum deles gritou, e tres deles estavam verdes havia semanas. O
antidoto que funcionou nas quatro vezes e o mesmo, e ele e um habito e nao uma
ferramenta: **provar que a guarda morde antes de acreditar que ela guarda.**
Quebre de proposito o que ela deveria pegar, veja vermelho, restaure. Trinta
segundos por guarda.

Isso vale para o `check` inteiro, e vale especialmente para guarda nova. Guarda
que nunca ficou vermelha na sua frente e uma hipotese, nao uma prova. E vale
para relato de agente: o `bun run visual` verde de hoje, "44 retratos, nenhum
mudou", so significa alguma coisa porque a guarda recusa build velho - antes
dessa marca, a mesma frase teria sido compativel com nao ter medido nada.

## O gate, medido

`bun run check` sao **trinta passos** mais `bun test`, em sequencia, parando no
primeiro que falhar. Ontem eram vinte e quatro. Os seis que entraram hoje:
`check:contrast:nativo`, `check:native:contrast`, `check:classes`, `check:cli`,
`check:tema:nativo` e `check:retratos`.

O numero trinta esta escrito no `CLAUDE.md` de proposito, e a linha ao lado diz
por que: quando ele nao bate com o `scripts.check` do `package.json`, o gate
cresceu e a pagina nao acompanhou.

O que cada guarda mede hoje, em numero:

| Guarda                   | O que ela diz hoje                                                            |
| ------------------------ | ----------------------------------------------------------------------------- |
| `check:pecas`            | 91 pecas, e e o que o README e o `package.json` anunciam                       |
| `check:doc`              | 177 paginas, todas com codigo por tras                                        |
| `check:props`            | 250 pecas, 3918 props                                                         |
| `check:paridade`         | 91 pecas conferidas: a tabela e as paginas dizem a mesma coisa                 |
| `check:temas`            | 71 tokens de tema e forma, e 55 papeis obrigatorios                            |
| `check:contrast`         | 152 pares em dois temas, 76 por tema                                          |
| `check:contrast:nativo`  | 1 mapa, 89 pares por esquema, 7 papeis sem par por declaracao                  |
| `check:native:contrast`  | espelho de 180 linhas em dia com `src/lib/contrast.ts`                        |
| `check:tema:nativo`      | 8 sementes, 37 derivados, 45 no `@theme`                                      |
| `check:classes`          | 193 arquivos, sem lista de excecao                                            |
| `check:colors`           | 96 arquivos sem cor literal fora de `src/tokens/`                             |
| `check:grupos`           | 3 seletores de grupo, todos com quem declare                                  |
| `check:skill`            | 54 props citadas nos exemplos da skill, todas existentes                      |
| `check:lista-skill`      | 8 arquivos de referencia, todos no indice E no laco `curl` do site            |
| `check:retratos`         | 12 retratos de secao sobre 6 areas, 22200 quadrados, 47 marcadores            |
| `check:demo`             | 88 de 91 pecas na vitrine, em 16 paginas                                      |
| `check:readme`           | 50 de 91 pecas citadas no `README.md`                                         |
| `check:compartilhado`    | 2 arquivos de `src/shared/` espelhados, sem import de plataforma              |
| `check:testes`           | 1285 testes em 108 arquivos, e e o numero que a home exibe                     |
| `bun test`               | 1285 passam, 0 falham; 373 deles sao do nativo, em 26 arquivos                |

## As listas de divida declarada, e o tamanho de hoje

A casa tem seis listas de excecao, e o acordo e o mesmo para todas: **elas so
encolhem**. Entrada que nao acusa mais e erro, e a guarda manda apagar a linha.
Medidas hoje:

| Lista              | Guarda                | Tamanho | Quem esta nela                                                                  |
| ------------------ | --------------------- | ------: | ------------------------------------------------------------------------------- |
| `DEBT`             | `check:comentarios`   |   **0** | vazia, e o acordo e que continue                                                |
| `FILA_DECLARADA`   | `check:paridade`      |   **1** | `EventCalendar`, por decisao de gesto                                           |
| `SEM_VITRINE`      | `check:demo`          |   **3** | `ToastViewport`, `Autocomplete`, `Editable`                                     |
| `OUT`              | `check:scripts`       |   **5** | `regressao-visual`, `shot`, `serve`, `build-preset`, `copy-fonts`               |
| `COPIA_DECLARADA`  | `check:compartilhado` |  **14** | codigo que nao atravessa: `useZodForm`, `RivoContext`, `normalizeColor` e mais 11 |
| `OUT_OF_README`    | `check:readme`        |  **41** | 41 pecas do catalogo nao citadas no `README.md`, com o motivo de cada uma       |

Duas noticias e um aviso. A noticia boa e o `DEBT` do `check:comentarios`, que
esta vazio, e `check:nomes` tambem nao tem divida declarada. A outra e que
`check:classes` nasceu **sem** lista de excecao e continua sem.

O aviso e o `OUT_OF_README`, com 41 de 91. E a maior divida declarada do
repositorio, e a que menos incomoda quem trabalha aqui, o que e exatamente o
motivo de ela ser a maior. Ela nasceu porque o digito estava certo e a lista
embaixo dele nao: o `check:pecas` guardava o "90 pecas." e o arquivo inteiro
citava 49.

Vale registrar tambem que o `SEM_VITRINE` explica bem o que uma linha de divida
deve conter. A do `Editable` nao diz "falta fazer": diz que `editing` e estado
interno, que `EditableProps` nao tem prop que o force, e qual e o caminho que
quem for pagar deve tomar - o mesmo que o `ContextMenu` tomou, disparando o
gesto por script depois de montar. E fecha proibindo o atalho: nao se inventa
prop so para a vitrine.

## O que esta pendente de verdade

### Divida de codigo

Duas das quatro que este arquivo listava foram pagas hoje, ou ja estavam pagas
sem ninguem marcar. **O `Splitter` em `dir="rtl"` esta consertado** - ele le
`useDirection()` e a pagina dele diz que a divisoria vira junto. **As tres
assinaturas visuais desatualizadas tambem cairam**: `bun run visual` responde
"44 retratos, nenhum mudou". Sobram estas:

1. **`accessibilityLiveRegion` e do Android.** Tres pecas nativas anunciam por
   ela - `FilterBar`, `DateRangePicker` e o `toast` -, e no iOS o anuncio
   automatico nao existe sem `announceForAccessibility`, que nenhuma peca do
   catalogo usa. Vale para toda peca nativa que queira anunciar mudanca sem
   foco.
2. **O `scrollToIndex` do `VirtualList` continua sendo o unico
   `useImperativeHandle` do `src/`.** Nao ha precedente na casa, e nao ha regra
   escrita sobre quando expor `ref` imperativo - procurei por "imperativ" no
   `conventions.md`, no `CLAUDE.md` e na skill, e nao ha nada. Ou vira padrao
   documentado, ou vira excecao justificada.
3. **`QueryBoundary` nao trata dado velho enquanto revalida.** O
   stale-while-revalidate mostra o esqueleto por cima do que ja estava na tela.
   E o caso que mais aparece em tela real, e ele piorou de status: a pagina da
   peca **nao menciona mais** o limite. Ate ontem o consolo era que estava
   escrito; hoje nem isso.

### Pecas novas

A lista de sete que a auditoria propos esta fechada: o `EventCalendar` entrou de
madrugada, com quatro vistas, e a linha que o separa do vizinho nao e o
`Calendar` e sim o `DataTable` - se ninguem precisa ver duracao nem choque de
horario, e tabela. Nao ha peca nova proposta e nao feita.

O que sobra do `EventCalendar` e o lado nativo, e ele esta na fila declarada.

## O que esta bloqueado esperando acao humana

Duas coisas, e nenhuma e trabalho de codigo.

**1. As duas tags, e elas sao acao de uma pessoa.** `0.9.1` e `0.4.1` estao
comitadas, os dois CHANGELOGs estao fechados, a `main` esta empurrada e o site
esta no ar - e as tags `v0.9.1` e `native-v0.4.1` nao existem. As que existem
param em `v0.9.0` e `native-v0.4.0`, e as duas estao no npm.

A 0.9.1 leva o conserto do foco do `Popconfirm` no Firefox, e ele **nao foi
verificado em Firefox**: nao ha Playwright neste repositorio. Quem roda a suite
e o app que consome, e o teste de la esta marcado `test.fail` para o Firefox -
entrando o conserto, o Playwright acusa sozinho com um "unexpected pass". Essa
e a confirmacao que falta antes da tag.

A ordem da casa e: CHANGELOG fechado, bump comitado, merge na `main`, ensaio no
nativo, e so entao a tag. Publicar 0.9.0 e 0.4.0 duas vezes nao da: o registro
recusa com 403, e o conserto de versao publicada e versao nova.

**2. A landing esta duas versoes atras.** Ela esta em `^0.7.0` com 0.7.0
instalada, e a biblioteca fechou 0.9.0. Isso e o que sobra de um item que hoje
encolheu bastante, e vale registrar o que foi resolvido: a linha do
`fonts.css` **existe** (`@import '@rivocode/ui/fonts.css'` em
`src/styles/global.css`), e a duvida do gerenciador **acabou** - so ha
`bun.lock`, ele esta rastreado, e nao ha `pnpm-lock.yaml` nem
`pnpm-workspace.yaml` na arvore. O que a producao serve e a build que carrega as
fontes: o CSS servido em `rivocode.com.br` tem o mesmo nome com resumo de
conteudo do `dist/` local, `global-BENmh2Nr.css`, com 28 referencias a `woff2` e
as tres familias da marca presentes.

### A procedencia, e a licao que ela deixou

**O repositorio esta publico**, e os dois workflows publicam com `--provenance` e
`id-token: write`. Uma armadilha esta escrita nos dois: `--provenance` e
`id-token` andam JUNTOS, e o `--dry-run` do npm nao exercita nenhum dos dois, ha
um `if (!dryRun)` antes da geracao da assinatura. Por isso existe um passo que
falha cedo se o token OIDC nao estiver la.

Isso entrou as 08:27 de hoje. As duas versoes de hoje sairam antes: `0.8.0` as
05:37 e `0.3.1` as 05:36. Medido no registro, o endpoint de attestations do npm
devolve "Not found" para `0.7.0`, `0.8.0`, `0.3.0` e `0.3.1` - **nenhuma versao
publicada tem procedencia.** As assinaturas que aparecem em `npm view ... dist`
sao a do registro, e nao a de proveniencia; confundir as duas e o caminho mais
curto para achar que esta assinado.

Nao ha conserto: publicacao no npm nao se desfaz e o registro nao deixa
sobrescrever. As quatro versoes de tras ficam como estao, e a partir da tag
seguinte o tarball passou a sair assinado - medido no registro, o endpoint de
attestations responde para `@rivocode/ui@0.9.0` e para
`@rivocode/ui-native@0.4.0`. A licao que fica e a mesma da secao
"Verificacao que nao verifica", vista de outro angulo: o relato dizia que a
procedencia estava em pe, e ninguem abriu o workflow.

## Decisoes que continuam valendo

- **Mobile primeiro.** Decidir o que acontece em 390px antes de desenhar o
  desktop. Painel flutuante nao encosta na borda, calendario cai para um mes,
  dialogo vira folha de baixo, tabela rola dentro da propria moldura. O botao de
  copiar do site foi o custo de nao aplicar isso numa pagina que nao e peca.
- **Um subcaminho por peer, e nao um por assunto.** E o peer que cobra a
  instalacao, entao e ele que decide onde a porta fica. Vale nos dois pacotes.
- **Cor literal so em `src/tokens/`**, e contraste medido em vez de estimado.
  Cor que a conta nao sabe ler reprova: o que nao se mede nao se promete.
- **Ferramenta de mesa nao viaja no bundle da biblioteca.** A conta de contraste,
  as consequencias escritas de cada papel e o catalogo de papeis servem ao CLI, e
  `check:cli` le o grafo de imports para que continuem so la.
- **A TanStack Table entrou, como motor interno.** O `DataTable` importa
  `@tanstack/react-table` v9 e `@tanstack/react-virtual`, e nenhum tipo de
  terceiro vaza para a assinatura publica.
- **React Query fica de fora.** E arquitetura de aplicacao, nao de design. O que
  cabe ao design system e a apresentacao dos estados que uma consulta produz.
- **Receitas de tela inteira** (login, painel, listagem pronta) continuam de
  fora, porque receita nao versiona como componente e ninguem decidiu se elas
  moram aqui ou num pacote separado.
- **Nenhum agente cria tag.** Publicacao e acao de uma pessoa, porque ela nao se
  desfaz.

## Duas armadilhas de processo

**Nao se roda `git stash` numa arvore compartilhada.** Isso foi aprendido em
26/08: sete agentes trabalhavam em paralelo, dois rodaram `git stash` para
conferir se uma falha era pre-existente, e um stash tira do disco o trabalho de
todo mundo. Tudo foi restaurado, mas o `stash pop` conflitou, e por alguns
minutos leituras do repositorio devolveram conteudo velho: mediu-se falha que
nao existia. A regra que fica: enquanto houver mais de uma frente escrevendo,
nao se roda `git stash`, `git checkout --` nem `git reset --hard`. Para ler uma
versao antiga, `git show HEAD:<arquivo>`, que le sem tocar no disco.

**E nao se confia em relato de agente sobre numero.** Foi o que custou a
procedencia de duas versoes hoje. Relato e resumo, e resumo nao e medida. Quando
um agente diz "a guarda esta verde", a pergunta certa nao e se ele rodou, e sim
se a guarda ainda morde - as quatro verificacoes vazias deste dia estavam todas
verdes, e todas honestamente relatadas como verdes.

## Como retomar

```sh
cd /Users/emanuelbacalhau/projects/rivocode/ui
bun install
bun run check        # trinta verificacoes mais os 1293 testes
bun run build        # ha quebra que so aparece ao empacotar
bun run shot         # gera a vitrine e os retratos em demo/dist/
bun run visual       # compara com as 44 assinaturas comitadas
cd apps/docs && bun run dev   # o site de documentacao, local
```

O primeiro passo pendente nao e nenhum desses: sao as duas tags, `v0.9.1` e
`native-v0.4.1`, e as duas sao acao de uma pessoa. A `main` ja esta empurrada e
o site ja esta no ar com a doc da 0.9.1.

O contrato de uso da biblioteca esta em `.design-sync/conventions.md` e no ar em
`ds.rivocode.com.br/convencoes.md`. A skill que um agente le esta em
`.claude/skills/rivocode-ui/`, com oito arquivos de referencia, e vai dentro do
pacote publicado (`skill/`, gerado por `bun run build:skill`). As notas do sync
com o claude.ai/design estao em `.design-sync/NOTES.md`.

## Como conferir cada numero

```sh
ls .design-sync/docs/*.md | wc -l                  # 177 documentos
bun run check:pecas                                # 91 pecas
bun run check:testes                               # 1293 testes em 109 arquivos
bun test native/test                               # 373 deles, em 26 arquivos
bun run check:paridade                             # 91 linhas: 69 traduz, 4 vira, 18 nao, 0 fila
bun run check:contrato                             # os SEIS subcaminhos de codigo, web e nativo
bun run check:temas                                # 71 tokens, 55 papeis obrigatorios
bun run check:contrast                             # 152 pares nos dois temas
bun run check:contrast:nativo                      # 89 pares por esquema, 1 mapa
bun run check:tema:nativo                          # 8 sementes, 37 derivados, 45 no @theme
bun run check:classes                              # 193 arquivos, sem excecao
bun run check:demo                                 # 88 de 91 na vitrine, 3 declaradas fora
bun run check:readme                               # 50 de 91 citadas, 41 declaradas fora
bun run check:retratos                             # 12 retratos de secao sobre 6 areas
bun run check:scripts                              # os 5 scripts fora do gate, com o motivo
bun run check:compartilhado                        # 2 espelhados, 14 copias declaradas
bun run visual                                     # 44 retratos, e recusa build velho
node -e 'p=require("./package.json");console.log(p.scripts.check.split("&&").length)'   # 31, ou seja 30 mais bun test
git log --oneline origin/main..HEAD | wc -l        # commits que o site ainda nao viu
git tag --list                                     # v0.9.0 e native-v0.4.0 sao as ultimas
npm view @rivocode/ui version                      # 0.9.0, contra 0.9.1 no package.json
npm view @rivocode/ui-native version               # 0.4.0, contra 0.4.1 no native/package.json
curl -s https://registry.npmjs.org/-/npm/v1/attestations/@rivocode/ui@0.9.0   # responde: assinada
gh run list --workflow=docs --limit 5              # a publicacao do site
gh run list --workflow=release-native --limit 5    # o ensaio e a publicacao da 0.4.0
curl -sI https://ds.rivocode.com.br/llms.txt       # 200, e o texto abre dizendo 91 e 177
```

As pecas nao saem de um `ls`: elas saem do catalogo, que separa peca de parte. O
caminho curto e `curl -s https://ds.rivocode.com.br/llms.txt | head`, que abre
dizendo os dois numeros. Localmente, `ENTRIES` em `apps/docs/src/catalog.ts`.

## O que nao foi medido

- **Os 8,3% de crescimento do CSS nativo que o `native/CHANGELOG.md` afirma.**
  Foi tentado por dois caminhos e nenhum bate: `native/theme.css` cresceu 24,8%
  em bytes no commit do tema, e `examples/native/generated.css` cresceu 14,5% em
  regras ao longo do dia, sem mudar naquele commit. Provavelmente foi medido no
  CSS compilado do projeto de quem reportou. O numero fica no CHANGELOG porque
  ja saiu; nao o repita sem remedir.
- **As pecas em aparelho de verdade.** O conserto do tema de cliente, o dos
  quatro controles marcados e os dois avisos novos foram medidos em teste e em
  arvore renderizada, e o `react-native-web` agora sobe - o que e uma bancada
  boa, e nao um aparelho. Ninguem olhou nada disso num telefone hoje.
- **O `EventCalendar` em uso.** Ele nasceu de madrugada, tem pagina, preview e
  teste, e nenhuma tela real foi construida em cima dele. O piso de altura da
  tarja assume um defeito de proposito - dois eventos curtos que nao colidem no
  dado podem se empilhar na tela -, e isso e o tipo de decisao que so se julga
  com dado de verdade dentro.
- **Se o sync com o claude.ai/design chegou a subir alguma coisa em 24/08.** O
  que se sabe e a data do ultimo log local. O estado do lado de la nao foi
  consultado.
- **O `bun run build` de hoje nao foi disparado por mim.** O `dist/` e de 13:04,
  depois do ultimo commit, e as tres coisas que valia conferir nele foram
  conferidas: zero `@font-face` em `dist/styles.css` contra catorze em
  `dist/fonts.css`, e zero ocorrencia da conta de contraste em `dist/index.js`.
  Um build limpo, do zero, nao foi feito.
