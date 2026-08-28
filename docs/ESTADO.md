# Onde paramos

Atualizado em 28/08/2026, no fim da manha. Este arquivo e o "onde paramos" do
repositorio: serve a quem chega frio, humano ou agente, e responde tres coisas:
o que existe, o que falta de verdade, e o que esta parado esperando uma pessoa.

Todo numero aqui foi medido com comando, nesta arvore, hoje. A secao **Como
conferir cada numero** no fim diz qual comando produziu cada um, para que a
proxima pessoa nao precise acreditar em nada: mede de novo.

Isso nao e cerimonia. Em 27/08 duas versoes deste pacote sairam para o npm **sem
procedencia** porque alguem confiou num relato em vez de abrir o arquivo, e
publicacao no npm nao se desfaz. O indice de trabalho que originou a reescrita
daquele dia tinha erros de numero em tres pontos, e eles continuam apontados
abaixo, no lugar onde a medida discordou.

O estado do repositorio mora aqui. A REGRA mora em `CLAUDE.md`, o contrato de
quem consome mora em `.design-sync/conventions.md` e em
`.claude/skills/rivocode-ui/SKILL.md`.

## O que existe hoje

| Peca                        | Onde                                        | Estado                                                              |
| --------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `@rivocode/ui`              | este repo, `src/`                           | **0.10.0** comitada no `package.json`, sem tag; 0.9.1 no npm, na tag |
| `@rivocode/ui-native`       | este repo, `native/`                        | **0.5.0** comitada no `native/package.json`, sem tag; 0.4.1 no npm, na tag |
| Site de documentacao        | `apps/docs/`, no ar em `ds.rivocode.com.br` | No ar e em dia com a `main`, que esta em `e37084d`                   |
| Landing                     | repo `rivocode.com`, na `main`              | No ar, no `^0.7.0`, com o `fonts.css` importado e o lock decidido    |
| Sync com o claude.ai/design | projeto `RivoCode`                          | Parado desde 24/08, e provavelmente nao vale mais retomar            |

Os dois bumps de versao, as duas secoes novas de CHANGELOG, as duas guardas
novas do gate e a tabela de assinatura do nativo ESTAO comitados e empurrados:
**o `HEAD` e o `origin/main` sao o mesmo commit**, `e37084d`, e
`git log --oneline origin/main..HEAD` devolve zero. Foram **6 commits em
28/08**, todos empurrados.

A arvore **nao** esta limpa, e o que sobra nela e uma coisa so: `git status
--short` devolve **6 linhas** - o workflow de tag automatica, o script de
decisao, o teste dele, e as tres paginas que os acompanham, esta inclusive. E o
unico trabalho que ainda nao esta no ar.

O gate esta verde. `bun run check` roda **trinta e tres verificacoes** mais a
suite e sai com codigo zero; a suite tem **1382 testes em 119 arquivos**, com
3665 chamadas de `expect`. O `bun run build` rodou depois do ultimo commit
(`dist/index.js` e `dist/cli.js` sao de 10:40, e o commit mais novo e de 10:01).

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
densidade confortavel e compacta no web, guarda de cor literal sobre 98
arquivos, e duas guardas de contraste - uma por pacote.

## O React Native

**A fila esta vazia.** Das 91 pecas do web, **73 tem par no celular**, e as 18
que faltam faltam por decisao escrita, nao por atraso.

| No React Native    | Quantas | O que significa                                                                              |
| ------------------ | ------: | -------------------------------------------------------------------------------------------- |
| Traduz, mesmo nome |      69 | mesma peca, mesmo nome de prop: a assinatura muda, veja abaixo                               |
| Traduz, outro nome |       4 | `Autocomplete` vira `Combobox`, `DataTable` vira `DataList`, `ToastViewport` vira `useToast` |
| `○ na fila`        |       0 | `FILA_DECLARADA` esta vazia, e o acordo e que continue                                       |
| `✕ nao porta`      |      18 | decisao, nao atraso: idioma de mesa que nao tem sentido no toque                              |

O `EventCalendar` merece o paragrafo, porque ele foi o teste do acordo do nono
artefato - e o acordo foi cumprido do jeito mais util: a fila nao foi zerada
portando a peca, e sim **decidindo contra ela**, em 27/08/2026, depois do
desenho escrito e medido em `docs/2026-08-27-event-calendar-nativo-desenho.md`.
A `day` e a `week` sao a peca inteira e custariam de 15 a 18% do pacote,
compiladas pelo metro no aplicativo de quem importa um `Button`, porque o nativo
publica FONTE; e sete colunas em 358px dao 44,8px cada, onde a coluna de semana
existe justamente para mostrar hora e duracao. No telefone a resposta e outra
peca: compromisso por dia e lista, e data com valor e o `Calendar`. A linha saiu
de `FILA_DECLARADA` e virou `nao` com o motivo escrito, que e o unico jeito de
uma entrada de divida sair da lista.

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
peer nenhum, e **tres binarios**: `rivocode-ui-native-css`,
`rivocode-ui-native-theme` e o `rivocode-ui-native-init` da 0.5.0, que escreve a
receita de instalacao.

## O dia: o que compilava, renderizava e saia errado na tela

A 0.10.0 e a 0.5.0 estao escritas na arvore e ainda nao comitadas, e as duas tem
um tema so, que e primo do tema de 27/08: **defeito que so a tela denunciava
passa a ter quem o denuncie antes.** Sete frentes, todas da mesma forma - `tsc`
verde, build verde, tela errada.

**Parte de campo fora do `Field` nao derruba mais a pagina.** `FieldLabel`,
`FieldDescription` e `FieldError` soltas lancavam `FieldRootContext is missing`
la dentro da Base UI e a arvore inteira caia: pagina em branco, sem erro na
tela. As tres leem um contexto proprio agora, desenham `label`, `p` e `div` com
as mesmas classes, e reclamam em desenvolvimento nomeando a peca e o conserto.
`Input` e `Textarea` ficaram de fora de proposito: elas nao caem, e o proprio
catalogo as usa fora de `Field` no `MaskedInput`, no `DatePicker`, no
`ColorPicker` e no `TimeField`.

**`Select` e `Combobox` acusam rotulo cru.** Sem o mapeamento, as duas escreviam
a CHAVE: `freire` no lugar de `Freire Contabilidade`. O aviso nao pergunta
"falta a prop", e sim "o que o campo escreve e diferente do que a lista
escreve" - so sai quando a resolucao caiu para o valor cru, com o item escolhido
e filho de texto puro. Peca nao controlada e sem `defaultValue` fica muda de
proposito, porque nao da para saber o escolhido sem interceptar o
`onValueChange`.

**Marca de grafico sem cor saia PRETA nos dois pacotes, por causa gemea, e as
duas respostas sao diferentes de proposito.** No web a moldura ja conhecia a
serie pelo `config`, entao ela desce nos filhos e pinta a marca que nasce sem
`fill` E sem `stroke`: o defeito deixa de existir em vez de virar aviso. No
nativo nao ha o que herdar, e o mapa de cores entregue ao desenho vai num
`Proxy` em `__DEV__` que nomeia a chave desconhecida e lista as validas, uma vez
por chave.

**O provider nativo rele a paleta quando o esquema muda.** Ele lia o DOM uma vez
e congelava; as cores resolvem por `light-dark()`, que depende do
`color-scheme`, e o inicial e claro - entao o app que declara o esquema dentro
de um `useEffect`, que e o padrao obvio, ja tinha perdido a leitura. E a mesma
tela misturada que a 0.4.0 consertou, voltando por ordem de efeitos em vez de
pelo mapa de tema. A leitura reage a tres gatilhos, e cada um pega o que os
outros nao pegam.

**As classes de familia de fonte deixaram de existir no nativo.**
`font-display` nunca gerou um byte, e `font-sans`, `font-serif` e `font-mono`
geravam regra apontando para a pilha de fabrica do Tailwind, da qual o
`react-native-css` guarda so o primeiro nome: o texto saia numa fonte que
ninguem escolheu. O `@theme` gerado zera os tres tokens de familia com
`initial`, entao as quatro classes deixam de compilar e o `check:classes` as
acusa dentro do proprio pacote.

**`NumberField` e `TimeField` alinham por `style`.** `text-center` nao e
ignorada, ela ESTOURA - o `react-native-css` declara `nativeStyleMapping` para
`textAlign` e o runtime chama `path.split` num booleano -, e a prop `textAlign`
nao esta no `forwardPropsList` do `react-native-web`, entao e descartada calada.
`style` e o unico caminho que os dois alvos leem. Junto veio o `min-w-0` que
traz o `+` do `NumberField` de volta para dentro da caixa.

### Duas coisas que mudam o contrato de quem usa

**Quebra: o `RivoNativeThemeMap` e a prop `scheme` sairam do pacote nativo.** O
tipo estava `@deprecated` e inerte desde a 0.4.0 - o provider ja resolvia os 45
papeis lendo o CSS compilado, e o objeto nao vestia mais nada alem de um aviso.
Agora nao ha tipo exportado, nem membro na uniao da prop `theme`, nem aviso:
sao **zero ocorrencias** de `RivoNativeThemeMap` em `native/src/` e em
`native/tokens.ts`. Quem passava `theme={{ light, dark }}` nao perde cor
nenhuma, porque o mapa ja nao pintava; quem passava `scheme` troca por
`theme="rivocode-light"`, `"rivocode-dark"` ou `"system"`.

**`npx rivocode-ui-native-init`: a receita de instalacao virou comando.** Seis
arquivos do app precisam concordar entre si para o pacote funcionar, e o README
listava QUATRO - escondendo os dois mais caros de diagnosticar. O comando
escreve a receita e imprime o que fez, arquivo por arquivo; nao sobrescreve
calado, e `--dry-run` mostra o plano. O caso que mais surpreende e o
`babel.config.js`, e ele foi medido: o certo e **nao existir**, porque sem
arquivo nenhum o Expo cai no `babel-preset-expo` sozinho e escrever um a mao
derruba o app no SDK 57. A guarda `check:receita` cobra que a receita e o
`examples/native` digam a mesma coisa: 6 arquivos, 9 diretivas de CSS, 1 plugin
de PostCSS, `withNativewind`, `userInterfaceStyle automatic`, `browserslist` com
3, e nenhum arquivo de Babel nos dois.

### A tabela de assinatura, e por que ela precisou de um segundo catalogo

`.claude/skills/rivocode-ui/reference/native.md` ganhou "A assinatura, prop a
prop": **147 divergencias em 66 pecas**, cada uma conferida contra os dois
catalogos por `bun run check:assinatura`. Ate aqui a tabela de paridade dizia se
a peca existia dos dois lados, e a diferenca de API era descoberta uma a uma no
`tsc` - os seis casos que mais custaram tempo (`SearchInput`, `MaskedInput`,
`Timeline`, `Sparkline`, `Popconfirm` e `Meter`) nao estavam escritos em lugar
nenhum.

Para a guarda ter contra o que conferir foi preciso um catalogo de props do
nativo, `apps/docs/src/native-props.json`, gerado por `gen:props:nativo`: **82
pecas, 447 props.** Ele e artefato comitado por um motivo que vale ler antes de
tentar mover: o gerador le os tipos do pacote nativo, e `react` e `react-native`
so estao instalados em `examples/native`, que nao e workspace. No gate local ele
nao apenas falharia - ele **passaria mentindo**, porque sem os peers
`Omit<TextInputProps, ...> & {...}` colapsa e dez pecas saem sem props. Por isso
o `check:props:nativo` roda no job `nativo` da CI, ao lado do
`check:native:types`, e o que o gate alcanca e o `check:assinatura`, que le o
JSON.

## O dia anterior: o consumidor mediu, e a biblioteca respondeu

O dia nao comecou com uma lista de desejos. Um consumidor real instalou
`@rivocode/ui@0.8.0` e `@rivocode/ui-native@0.3.1` num app Expo e num app web, e
voltou com achados medidos com comando. O tema das duas versoes fechadas ali e
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
existia. Os **15 arquivos** que leem `useRivo()` fora do provider nao mudaram uma
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
modificador de opacidade passam pelo caminho do build. Cobre **196 arquivos**
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

Esta e a secao mais util do arquivo, e nao e uma lista de bugs. O 27/08 teve uma
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
   08:55 e o `demo/dist/demo.css` foi reconstruido as 09:12; o CSS velho era o do
   dia menos uma regra, `.[scrollbar-gutter:stable]`, usada num unico lugar do
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
para relato de agente: o `bun run visual` verde de 27/08, "44 retratos, nenhum
mudou", so significa alguma coisa porque a guarda recusa build velho - antes
dessa marca, a mesma frase teria sido compativel com nao ter medido nada.

## O gate, medido

`bun run check` sao **trinta e tres passos** mais `bun test`, em sequencia,
parando no primeiro que falhar. Ontem eram trinta e um. Os dois que entraram
hoje: `check:assinatura` e `check:receita`.

Ha um par que **nao** esta no gate e nao e esquecimento: `gen:props:nativo` e
`check:props:nativo` rodam no job `nativo` da CI, porque so ali existe o
`examples/native` instalado com `react` e `react-native`. O motivo esta no `OUT`
do `check:scripts`, e ele e do tipo que vale ler antes de tentar mover: sem os
peers o gerador nao falha, ele PASSA mentindo.

O numero trinta e tres esta escrito no `CLAUDE.md` de proposito, e a linha ao
lado diz por que: quando ele nao bate com o `scripts.check` do `package.json`, o
gate cresceu e a pagina nao acompanhou.

O que cada guarda mede hoje, em numero:

| Guarda                   | O que ela diz hoje                                                            |
| ------------------------ | ----------------------------------------------------------------------------- |
| `check:pecas`            | 91 pecas, e e o que o README e o `package.json` anunciam                       |
| `check:doc`              | 177 paginas, todas com codigo por tras                                        |
| `check:props`            | 250 pecas, 3918 props                                                         |
| `check:paridade`         | 91 pecas conferidas: a tabela e as paginas dizem a mesma coisa                 |
| `check:assinatura`       | 147 divergencias de assinatura em 66 pecas, conferidas contra os dois catalogos |
| `check:temas`            | 71 tokens de tema e forma, e 55 papeis obrigatorios                            |
| `check:contrast`         | 152 pares em dois temas, 76 por tema                                          |
| `check:contrast:nativo`  | 1 mapa, 89 pares por esquema, 7 papeis sem par por declaracao                  |
| `check:native:contrast`  | espelho de 180 linhas em dia com `src/lib/contrast.ts`                        |
| `check:tema:nativo`      | 8 sementes, 37 derivados, 45 no `@theme`                                      |
| `check:classes`          | 196 arquivos, sem lista de excecao                                            |
| `check:colors`           | 98 arquivos sem cor literal fora de `src/tokens/`                             |
| `check:grupos`           | 3 seletores de grupo, todos com quem declare                                  |
| `check:skill`            | 54 props citadas nos exemplos da skill, todas existentes                      |
| `check:lista-skill`      | 8 arquivos de referencia, todos no indice E no laco `curl` do site            |
| `check:retratos`         | 12 retratos de secao sobre 6 areas, 22200 quadrados, 47 marcadores            |
| `check:demo`             | 88 de 91 pecas na vitrine, em 16 paginas                                      |
| `check:readme`           | 50 de 91 pecas citadas no `README.md`                                         |
| `check:receita`          | 6 arquivos de receita, 9 diretivas de CSS, e nenhum Babel nos dois lados      |
| `check:compartilhado`    | 2 arquivos de `src/shared/` espelhados, sem import de plataforma              |
| `check:testes`           | 1382 testes em 119 arquivos, e e o numero que a home exibe                     |
| `bun test`               | 1382 passam, 0 falham, 3665 `expect`; 404 sao do nativo, em 31 arquivos       |

Fora do gate, no job `nativo` da CI: `check:props:nativo`, com **82 pecas e 447
props** - o catalogo que da ao `check:assinatura` o lado nativo da comparacao.

## As listas de divida declarada, e o tamanho de hoje

A casa tem oito listas de excecao, e o acordo e o mesmo para todas: **elas so
encolhem**. Entrada que nao acusa mais e erro, e a guarda manda apagar a linha.
Medidas hoje:

| Lista              | Guarda                | Tamanho | Quem esta nela                                                                  |
| ------------------ | --------------------- | ------: | ------------------------------------------------------------------------------- |
| `DEBT`             | `check:comentarios`   |   **0** | vazia, e o acordo e que continue                                                |
| `FILA_DECLARADA`   | `check:paridade`      |   **0** | esvaziou em 27/08, quando o `EventCalendar` nativo virou `nao`                  |
| `OUT_OF_SCOPE`     | `check:skill`         |   **1** | `reference/native.md`, e a linha esta OBSOLETA - veja "Divida de processo"      |
| `OUT`              | `check:piso`          |   **2** | `retratos`, `regressao-visual`                                                  |
| `SEM_VITRINE`      | `check:demo`          |   **3** | `ToastViewport`, `Autocomplete`, `Editable`                                     |
| `OUT`              | `check:scripts`       |   **6** | `regressao-visual`, `shot`, `serve`, `props-do-catalogo-nativo`, `build-preset`, `copy-fonts` |
| `COPIA_DECLARADA`  | `check:compartilhado` |  **14** | codigo que nao atravessa: `useZodForm`, `RivoContext`, `normalizeColor` e mais 11 |
| `OUT_OF_README`    | `check:readme`        |  **41** | 41 pecas do catalogo nao citadas no `README.md`, com o motivo de cada uma       |

Duas noticias, um aviso e uma linha que precisa sair. A noticia boa e o `DEBT`
do `check:comentarios`, que esta vazio, e `check:nomes` tambem nao tem divida
declarada; junto veio o `FILA_DECLARADA`, que zerou. A outra e que
`check:classes` nasceu **sem** lista de excecao e continua sem. O `OUT` do
`check:scripts` cresceu de 5 para 6, e o crescimento tem motivo escrito - o
`props-do-catalogo-nativo` precisa de um app que nao e workspace -, mas cresceu.

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

Duas das quatro que este arquivo listava foram pagas em 27/08, ou ja estavam
pagas sem ninguem marcar. **O `Splitter` em `dir="rtl"` esta consertado** - ele
le `useDirection()` e a pagina dele diz que a divisoria vira junto. **As tres
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
   peca **nao menciona mais** o limite. Ate 26/08 o consolo era que estava
   escrito; hoje nem isso.
4. **`Clipboard.value` nao aparece na tabela de props publicada, e ela e
   obrigatoria.** Medido: `component-props.json` lista `labels`, `loading`,
   `onCopy`, `ref`, `render`, `shape`, `size`, `timeout` e `variant` para o
   `Clipboard` - e nao `value`, que e o que vai para a area de transferencia e
   sem o que a peca nao faz nada. Ou seja, sumiu de `ds.rivocode.com.br`.

   A causa esta em `scripts/props-do-catalogo.ts`, na linha que descarta a prop
   quando `prop.declarations[0].path` cai dentro de `@types/react`. Prop propria
   que COLIDE com um atributo que o elemento raiz ja declara tem duas
   declaracoes, e a primeira e a do React: `ClipboardProps` e
   `Omit<ButtonProps, "children" | "onCopy"> & { value: string }`, e
   `ButtonProps` estende `ComponentPropsWithoutRef<"button">`, que traz `value`.
   O `Omit` nao a tira, entao a propria e engolida pela homonima.

   Nao e caso unico. Varrendo os `export type *Props` do `src/` contra o JSON,
   **8 props proprias nao aparecem** - `Clipboard.value`, `AccordionItem.title`,
   `TreeSelect.defaultValue`, `TimeField.name`, `Sidebar.title`, `TagsInput.max`
   e o `format` dos dois eixos de grafico -, e as duas obrigatorias sao
   `Clipboard.value` e `AccordionItem.title`. Todas carregam nome que o
   `@types/react` tambem declara.

   Nao foi consertado hoje de proposito: mexer ali reescreve
   `component-props.json` inteiro e mexe nos carimbos `since`, que sao memoria e
   nao derivado do tipo. E conserto de commit proprio, com o diff do JSON lido.

### Divida de processo

**O `check:skill` tem uma excecao obsoleta, e ela nunca vai gritar sozinha.** O
`OUT_OF_SCOPE` de `scripts/check-props-da-skill.ts` e
`new Set(["reference/native.md"])`, e o JSDoc acima dele diz por que: "Enquanto
o `@rivocode/ui-native` nao gerar tabela propria, este arquivo fica de fora".

**Agora gera.** `apps/docs/src/native-props.json` existe desde hoje, com 82
pecas e 447 props, e `check:props:nativo` o mantem em dia no job `nativo` da CI.
A condicao escrita na propria excecao deixou de valer, e o efeito e concreto: os
exemplos `tsx` de `reference/native.md` sao o unico pedaco da skill cujas props
ninguem confere - e e justamente o arquivo onde `Button` e `Card` tem props
diferentes das do web, que era o motivo original de excluir.

Lista de excecao so encolhe, e esta e a linha que esta pronta para sair. O que
falta e o `check:skill` aprender a escolher o catalogo pelo arquivo, em vez de
pular o arquivo.

### Pecas novas

A lista de sete que a auditoria propos esta fechada: o `EventCalendar` entrou em
27/08, com quatro vistas, e a linha que o separa do vizinho nao e o `Calendar` e
sim o `DataTable` - se ninguem precisa ver duracao nem choque de horario, e
tabela. Nao ha peca nova proposta e nao feita.

O que sobrava do `EventCalendar` era o lado nativo, e ele **nao vai existir**: a
decisao foi tomada, escrita e medida, e a linha dele na tabela de paridade e
`nao`. A fila do nativo esta vazia.

## O que esta bloqueado esperando acao humana

Duas coisas, e em nenhuma delas ha codigo a escrever.

**1. Um empurrao na `main`, e as duas tags nascem sozinhas.** Isto mudou em
28/08/2026: a tag deixou de ser acao de uma pessoa. O `tag.yml` roda depois de
o `ci` fechar verde na `main`, compara cada manifesto com o mundo e cria a tag
quando as quatro guardas passam - tag inexistente, versao inedita no npm,
CHANGELOG aberto na secao daquela versao, e nenhum `[no-release]` na mensagem do
commit. Depois de criar, ele chama o release por `workflow_dispatch`, porque tag
empurrada com o `GITHUB_TOKEN` nao dispara `on: push: tags`.

O que sobrou de humano e o que sempre foi caro: o numero da versao e o
fechamento do CHANGELOG. Os dois ja estao feitos. A `0.10.0` e a `0.5.0` estao
comitadas no `package.json` e no `native/package.json`, com as duas secoes de
CHANGELOG fechadas no topo de cada arquivo. `git tag --list` para em `v0.9.1` e
`native-v0.4.1`, e nao ha nenhum release no GitHub (`gh release list` volta
vazio, para as doze tags que existem).

Entao o proximo `ci` verde na `main` cria `v0.10.0` e `native-v0.5.0` e publica
as duas. Nao ha comando a dar, e nao ha como dar meio comando: para segurar
qualquer um dos dois, o caminho e a valvula - `[no-release]` na mensagem do
commit da cabeca, que barra os DOIS pacotes, porque a mensagem e uma so.
Publicar 0.9.1 e 0.4.1 de novo nao da: o registro recusa com 403, e o conserto
de versao publicada e versao nova.

Vale lembrar que o empurrao na `main` publica o site junto, e o site ja descreve
a `0.10.0`. A `0.5.0` carrega **quebra** de contrato no nativo (o
`RivoNativeThemeMap` e a prop `scheme`).

**2. A landing esta tres versoes atras.** Ela esta em `^0.7.0` com 0.7.0
travada no `bun.lock`, o npm ja serve 0.9.1 e a arvore fechou 0.10.0. Isso e o
que sobra de um item que encolheu bastante, e vale registrar o que foi
resolvido: a linha do
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

Isso entrou as 08:27 de 27/08. As duas versoes daquela manha sairam antes:
`0.8.0` as 05:37 e `0.3.1` as 05:36. Medido no registro, o endpoint de
attestations do npm devolve "Not found" para `0.7.0`, `0.8.0`, `0.3.0` e
`0.3.1` - **essas quatro nao tem procedencia.** As assinaturas que aparecem em
`npm view ... dist` sao a do registro, e nao a de proveniencia; confundir as
duas e o caminho mais curto para achar que esta assinado.

Nao ha conserto: publicacao no npm nao se desfaz e o registro nao deixa
sobrescrever. As quatro versoes de tras ficam como estao, e a partir da tag
seguinte o tarball passou a sair assinado - medido no registro hoje, o endpoint
de attestations responde para as **quatro** versoes de la para ca:
`@rivocode/ui@0.9.0`, `@rivocode/ui@0.9.1`, `@rivocode/ui-native@0.4.0` e
`@rivocode/ui-native@0.4.1`. A licao que fica e a mesma da secao
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
- **A tag nasce por maquina; o numero da versao, nao.** Desde 28/08/2026 o
  `tag.yml` cria a tag e chama o release quando quatro guardas passam. O que
  nenhuma maquina decide continua sendo o numero da versao e o fechamento do
  CHANGELOG - e a guarda do CHANGELOG e o que substitui o dedo humano no
  `git tag`. Publicacao no npm nao se desfaz, e e por isso que sao quatro.

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
procedencia de duas versoes em 27/08. Relato e resumo, e resumo nao e medida.
Quando um agente diz "a guarda esta verde", a pergunta certa nao e se ele rodou,
e sim se a guarda ainda morde - as quatro verificacoes vazias daquele dia
estavam todas verdes, e todas honestamente relatadas como verdes.

## Como retomar

```sh
cd /Users/emanuelbacalhau/projects/rivocode/ui
bun install
bun run check        # trinta e tres verificacoes mais os 1382 testes
bun run build        # ha quebra que so aparece ao empacotar
bun run shot         # gera a vitrine e os retratos em demo/dist/
bun run visual       # compara com as 44 assinaturas comitadas
cd apps/docs && bun run dev   # o site de documentacao, local
```

O primeiro passo pendente nao e nenhum desses: e empurrar. O `0.10.0` e o
`0.5.0` ja estao comitados com os dois CHANGELOGs fechados, entao o `ci` verde
na `main` cria `v0.10.0` e `native-v0.5.0` e publica as duas sem mais nenhum
comando. Para ver a decisao antes, sem criar tag nenhuma:
`gh workflow run tag`, que vem com o ensaio marcado.

O contrato de uso da biblioteca esta em `.design-sync/conventions.md` e no ar em
`ds.rivocode.com.br/convencoes.md`. A skill que um agente le esta em
`.claude/skills/rivocode-ui/`, com oito arquivos de referencia, e vai dentro do
pacote publicado (`skill/`, gerado por `bun run build:skill`). As notas do sync
com o claude.ai/design estao em `.design-sync/NOTES.md`.

## Como conferir cada numero

```sh
ls .design-sync/docs/*.md | wc -l                  # 177 documentos
bun run check:pecas                                # 91 pecas
bun run check:testes                               # 1382 testes em 119 arquivos
bun test                                           # 1382 passam, 0 falham, 3665 expect()
bun test native/test                               # 404 deles, em 31 arquivos
bun run check:paridade                             # 91 linhas: 69 traduz, 4 vira, 18 nao, 0 fila
bun run check:assinatura                           # 147 divergencias de assinatura, em 66 pecas
bun run check:contrato                             # os SEIS subcaminhos de codigo, web e nativo
bun run check:temas                                # 71 tokens, 55 papeis obrigatorios
bun run check:contrast                             # 152 pares nos dois temas
bun run check:contrast:nativo                      # 89 pares por esquema, 1 mapa
bun run check:tema:nativo                          # 8 sementes, 37 derivados, 45 no @theme
bun run check:classes                              # 196 arquivos, sem excecao
bun run check:colors                               # 98 arquivos sem cor literal
bun run check:demo                                 # 88 de 91 na vitrine, 3 declaradas fora
bun run check:readme                               # 50 de 91 citadas, 41 declaradas fora
bun run check:retratos                             # 12 retratos de secao sobre 6 areas
bun run check:receita                              # 6 arquivos de receita, e nenhum Babel nos dois
bun run check:scripts                              # os 6 scripts fora do gate, com o motivo
bun run check:piso                                 # os 2 fora do piso, com o motivo
bun run check:compartilhado                        # 2 espelhados, 14 copias declaradas
bun run check:props:nativo                         # 82 pecas, 447 props - so roda no job `nativo` da CI
bun run visual                                     # 44 retratos, e recusa build velho
node -e 'p=require("./demo/assinaturas.json");console.log(Object.keys(p).length)'       # 44, sendo 32 de vitrine e 12 de secao
node -e 'p=require("./package.json");console.log(p.scripts.check.split("&&").length)'   # 34, ou seja 33 mais bun test
git status --short | wc -l                         # 6: so o workflow de tag automatica, o script, o teste e as tres paginas
git log --oneline origin/main..HEAD | wc -l        # 0 - o HEAD e o origin/main sao e37084d
git tag --list                                     # v0.9.1 e native-v0.4.1 sao as ultimas
gh release list                                    # vazio: as doze tags nao viraram release
npm view @rivocode/ui version                      # 0.9.1, contra 0.10.0 no package.json
npm view @rivocode/ui-native version               # 0.4.1, contra 0.5.0 no native/package.json
curl -s https://registry.npmjs.org/-/npm/v1/attestations/@rivocode/ui@0.9.1   # responde: assinada
curl -s https://registry.npmjs.org/-/npm/v1/attestations/@rivocode/ui-native@0.4.1   # idem
gh run list --workflow=docs --limit 5              # a publicacao do site, a ultima do commit e37084d
gh run list --workflow=release-native --limit 5    # o ensaio e a publicacao da 0.4.1
curl -sI https://ds.rivocode.com.br/llms.txt       # 200, e o texto abre dizendo 91 e 177
node -e 'j=require("./apps/docs/src/component-props.json");console.log(j.Clipboard.props.some(p=>p.name==="value"))'   # false, e e a divida da secao "Divida de codigo"
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
  quatro controles marcados, os avisos novos e o alinhamento por `style` do
  `NumberField` e do `TimeField` foram medidos em teste e em arvore renderizada,
  e o `react-native-web` sobe - o que e uma bancada boa, e nao um aparelho.
  Ninguem olhou nada disso num telefone. Vale dobrado para o alinhamento: as
  duas tentativas que falharam falharam de jeitos DIFERENTES em cada alvo, e o
  que passou nos dois foi medido em dois, nao em tres.
- **O `npx rivocode-ui-native-init` num projeto que nao seja o
  `examples/native`.** O `check:receita` compara a receita com o app de exemplo
  desta arvore, que e onde ela ja funciona. Rodar o comando num Expo recem-criado
  e ver o app subir e outra medida, e ela nao foi feita.
- **O `EventCalendar` em uso.** Ele nasceu em 27/08, tem pagina, preview e
  teste, e nenhuma tela real foi construida em cima dele. O piso de altura da
  tarja assume um defeito de proposito - dois eventos curtos que nao colidem no
  dado podem se empilhar na tela -, e isso e o tipo de decisao que so se julga
  com dado de verdade dentro.
- **Se o sync com o claude.ai/design chegou a subir alguma coisa em 24/08.** O
  que se sabe e a data do ultimo log local. O estado do lado de la nao foi
  consultado.
- **O `bun run build` de hoje nao foi disparado por mim.** O `dist/` e de 10:40,
  depois do ultimo commit, e as tres coisas que valia conferir nele foram
  conferidas: zero `@font-face` em `dist/styles.css` contra catorze em
  `dist/fonts.css`, e zero ocorrencia de `contrastRatio` ou `oklch` em
  `dist/index.js`, contra 52 KB de `dist/cli.js`. Um build limpo, do zero, nao
  foi feito - e o `dist/` e anterior aos bumps para 0.10.0 e 0.5.0.
- **O `bun run visual` de hoje.** As 44 assinaturas comitadas foram CONTADAS
  (32 de vitrine, 12 de secao) e o `check:retratos` confere que cada secao
  declarada tem a sua, mas nenhum retrato foi tirado nesta sessao: isso pede
  Chrome em caminho fixo do macOS, e o script vive fora do gate por isso.
