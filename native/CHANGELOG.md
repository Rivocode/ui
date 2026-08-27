# Mudancas

## 0.3.0

A fila chega a zero. Das 83 pecas do catalogo do web, 67 tem par no celular -
64 com o mesmo nome, 3 com outro - e as 16 que faltam nao estao atrasadas: sao
idioma de mesa, e a decisao de cada uma esta escrita na tabela de paridade.
Nenhuma peca nova vai entrar por ali sem que alguem mude de ideia sobre o que
um dedo faz.

Junto vem o que o pacote ganhou depois da 0.2.0 e nunca foi registrado aqui:
quatro subcaminhos, dezesseis pecas, e uma letra que a biblioteca prometia e
nao entregava desde o comeco.

### Quebras: dois nomes e um acento

| Antes | Agora | Peca |
|---|---|---|
| `tone` | `trend` | `Sparkline` |
| `accessibilityState.selected` | `accessibilityState.checked` | `RadioGroup` |

O `tone` da `Sparkline` acompanha o web, que fez a mesma troca na 0.7.0 - o
nome nao pode significar coisas diferentes nos dois lados. O `tsc` acha.

O `RadioGroup` e conserto de acessibilidade, e nao gosto: o papel `radio` pede
`checked`, e com `selected` o VoiceOver le "selecionada" em vez de anunciar
marcada. Quem tinha teste afirmando sobre `selected` precisa reescrever a
afirmacao; quem so usa a peca nao muda uma linha, e passa a ser anunciado
direito.

A terceira quebra nao aparece em nome nenhum e muda o que sai na tela: o padrao
de `errorMessage` do `DataList` era `"Nao foi possivel carregar a lista."`, sem
acento, enquanto o web escrevia a mesma frase acentuada havia versoes. A guarda
que cobra acento em texto de tela so varria `src/`, entao ninguem acusava.
Agora ela varre os dois pacotes, e o padrao saiu corrigido. Quem comparava essa
string ao pe da letra - num teste de ponta a ponta, digamos - compara a versao
acentuada.

### `font-mono` nunca chegou ao aparelho

Seis pecas pediam letra de codigo e nenhuma recebia: `Code`, `Timeline`,
`Calendar`, `ColorPicker`, `ChartDonut` e `FileUpload`. A classe compilava para
`{ fontFamily: "ui-monospace" }`, o react-native-css guarda so a PRIMEIRA
familia da lista, e `ui-monospace` e generica de CSS - nao existe instalada no
iOS nem no Android. O sistema caia calado na letra padrao, e como o texto
aparecia, ninguem percebia.

O conserto e um modulo escrito a mao, `native/src/font.ts`, com
`Platform.select({ ios: "Menlo", android: "monospace" })`. Nao saiu dos tokens
de proposito: `native/tokens.ts` e gerado do CSS, e familia de fonte por
plataforma nao sai de CSS - sairia `ui-monospace` outra vez.

**O efeito e visivel.** Chave de acesso de NF-e, valor hexadecimal de cor e
tamanho de arquivo passam a alinhar em coluna, que e a unica razao de a letra
ser monoespacada. Se a sua tela contava com a largura da letra proporcional,
ela muda.

Ha guarda: um teste varre `native/src/` inteiro e falha se `font-mono` voltar a
aparecer numa classe. A classe morta nao acusa sozinha, e foi assim que ela
durou.

### Quatro subcaminhos, e a regra que os separa

`@rivocode/ui-native/form`, `/chart`, `/clipboard` e `/file-upload`. Cada um
existe porque tem um peer OPCIONAL atras, e no celular peer nao e byte: modulo
do Expo e do `react-native-svg` custa build, e quem so quer um `Button` nao
pode pagar isso.

A regra que sai daqui e **um subcaminho por peer, e nao um por assunto**.
`clipboard` e `file-upload` poderiam dividir uma porta chamada `/expo`, e a
conta de quem instala diz que nao: quem poe um botao de copiar ao lado da chave
de acesso de uma NF-e nao anexa arquivo nenhum, e um indice comum arrastaria o
`expo-document-picker` para o projeto dele. E o peer que cobra a instalacao,
entao e ele que decide onde a porta fica.

`bun run check:contrato` passou a conferir os quatro: o que eles exportam tem
que estar citado no contrato E na skill. Na primeira vez que rodou, achou sete
nomes que existiam no pacote e em texto nenhum.

### As pecas

Da 0.2.0 para ca entraram, alem das tres de hoje: `Steps`, `DateRangePicker`,
`Form`, `Tracker`, `InputGroup`, `PasswordInput`, `TagsInput`, `Indicator`,
`Item`, `RelativeTime`, `Timeline`, `Code`, `ColorPicker`, `Clipboard`,
`FileUpload` e as tres de grafico - `ChartContainer`, `ChartDonut` e
`ChartRadial`.

As tres ultimas da fila fecham o catalogo, e as tres esperavam decisao de
gesto, nao codigo:

- **`Tree`** empilha um nivel por vez. Tocar num galho empurra o nivel de
  dentro; o cabecalho mostra o caminho e volta um nivel. Indentacao de arvore
  inteira e ilegivel no terceiro nivel a 390px. O galho tem dois alvos - a
  caixa marca o galho inteiro, o nome entra no nivel -, porque com um alvo so
  nao havia como marcar "Financeiro" sem visitar as sete folhas.
- **`TreeSelect`** e a mesma navegacao dentro de uma folha, com a contagem do
  rascunho e `Aplicar` no rodape. A regra do web sobrevive: quem vale e a
  folha, e marcar um pai marca todas as folhas debaixo. Galho meio marcado sai
  com a caixa vazia e um `"2 de 7 escolhidos"` embaixo do nome - o `Checkbox`
  nativo nao tem estado misto, e texto se le e se ouve.
- **`Editable`** entra em edicao por toque LONGO, que e o gesto que o sistema
  usa para agir sobre um texto. Toque curto nao faz nada, senao o teclado subia
  a cada esbarrao numa lista que rola. **Sair do campo NAO salva**: o proprio
  `Cancelar` tira o foco antes de rodar, entao um blur que salvasse salvaria o
  rascunho no caminho de cancela-lo. E ha `accessibilityActions` de toque
  longo, porque quem usa VoiceOver nao segura o dedo - sem isso a peca nao
  tinha porta nenhuma para essa pessoa.

### Os quatro finais falam a lingua do web

`ChartContainer` e `DataList` cravavam os textos de erro. Agora aceitam
`errorTitle`, `errorMessage` e `noResultsMessage`, com os mesmos nomes e os
mesmos padroes do `@rivocode/ui`.

Uma diferenca de padrao, e e decisao: o `errorTitle` do `DataList` nasce vazio.
No web o titulo e quem diz "Nao foi possivel carregar" e a mensagem detalha;
aqui o aviso da lista sempre teve uma linha so, e essa linha e a
`errorMessage`. Dar padrao ao titulo poria duas frases quase iguais uma em cima
da outra em toda tela que ja usa a peca.

### A fonte da marca chega ao celular, e quem a carrega e o app

Ate aqui o pacote nao embarcava fonte nenhuma: tudo saia na letra do sistema
enquanto o web tinha Manrope, Poppins e JetBrains Mono. Agora o app declara uma
vez, no provider, e o catalogo inteiro se veste:

```tsx
const [ready] = useFonts({ Manrope: ..., Poppins: ..., JetBrainsMono: ... });

<RivoProvider
  fonts={{ sans: "Manrope", display: "Poppins", mono: "JetBrainsMono" }}
  isFontLoaded={isLoaded}
/>
```

O `Text` e o `TextInput` do pacote passam a ser publicos, e sao a porta de quem
usa: `<Text font="mono">` pede o papel e o provider responde. Sem eles a
biblioteca vestia as proprias pecas e o texto do app ficava de fora.

`sans` veste o corrido, `display` os titulos, `mono` o de largura fixa.
`display` omitida cai em `sans`; `mono` omitida mantem Menlo no iOS e monospace
no Android. **Nada declarado e o comportamento de antes, byte a byte** - sem
familia, o wrapper nao injeta `fontFamily` nenhum.

**Nao ha subcaminho novo, e isso e a regra da casa sendo aplicada e nao
esquecida.** Um subcaminho existe por PEER, e aqui nao ha peer: a biblioteca
nunca importa `expo-font`, nem em tipo. O que atravessa a fronteira e `string`.
Uma porta `/font` cobraria instalacao sem nada atras dela e sugeriria,
falsamente, que a biblioteca carrega fonte.

**O nome errado passa a falhar alto.** Familia que nao esta no aparelho falha
em silencio - foi assim que o `ui-monospace` durou versoes. Em `__DEV__` o
provider acusa pilha de CSS com virgula, aspas herdadas, `var(--...)`, nome
vazio e familia generica. O que ele nao ve sozinho e a tabela de fontes do
aparelho, e por isso existe o `isFontLoaded`: o app entrega o leitor que ja tem
do `expo-font`, e cada nome declarado que nao chegou sai nomeado no aviso. E a
unica forma honesta de responder "declarei Poppins e ela nao carregou" sem
importar o peer.

Ha guarda: um teste varre `native/src/` e barra `font-sans`, `font-display` e
`font-mono` em classe, mais qualquer `fontFamily` escrito a mao fora do
wrapper - e ele que impede alguem de contornar o provider outra vez.

### O bloco `fonts` dos tokens some

`tokens.ts` e `tokens.json` anunciavam `"Manrope Variable"`, `"Poppins"` e
`"JetBrains Mono Variable"`. Nenhuma existe instalada em aparelho algum, nada
as lia, e eram perigosas por parecerem utilizaveis: copiar qualquer uma delas
para `fonts={{...}}` produz o defeito calado. Pior, o gerador as resolvia com
`split(",")[0]`, ficando com a primeira da pilha e jogando fora o fallback -
a mesma falha, escrita dentro da ferramenta. No celular so o app sabe o que
carregou.

### A fila volta a zero no mesmo dia em que encheu

Cinco pecas web nasceram hoje e chegaram aqui junto: `QueryBoundary`,
`FilterBar`, `FilterChip`, `TimeField` e `TimePicker`. Das 90 do catalogo web,
73 tem par no celular e 17 nao portam por decisao.

Isso deixou de ser boa vontade. **Peca web nova passa a nascer nos dois pacotes
no mesmo dia**, e `bun run check:paridade` recusa peca que entre na fila sem
uma linha em `FILA_DECLARADA` dizendo por que ela nao pode nascer junto. A
lista so encolhe, como o `DEBT` das outras guardas. O motivo esta escrito la: a
fila chegou a zero em 26/08 e voltou a encher no mesmo dia, com sete pecas de
uma vez - cada uma parecendo atraso temporario, e temporario e como uma fila de
vinte comeca.

O que se reescreveu em cada uma, e por que:

- **`TimeField`** continua sendo o campo de DIGITAR - quem marca ponto escreve
  `0800` mais rapido do que abre painel. As setas do teclado, que nao existem
  no toque, viram dois botoes de passo no molde do `NumberField`; eles chamam o
  mesmo calculo, entao pousam na mesma grade do web.
- **`TimePicker`** e gatilho mais folha de baixo, e **nao embute o `TimeField`**
  como o web faz. Um `TextInput` dentro de um `Pressable` engole o toque do
  pai, e o gatilho precisa ser um alvo unico para o leitor de tela.
- **`FilterBar`** poe o limpar FORA do que rola: se ele rolasse junto, o
  controle que existe para desfazer tudo seria o unico que exige rolar ate o
  fim para achar.
- **`FilterChip`** tem faixa de toque de 44pt com a pilula pintada de 28
  dentro. A faixa foi esticada em vez de dar `hitSlop` vertical porque **no
  Android o toque fora dos limites do pai nao e entregue** - a folga seria
  descartada justamente no aparelho onde mais falta alvo.
- **`QueryBoundary`** traz os mesmos nomes e a mesma ordem, e nao trouxe
  `classNames`: a prop existe no web para ninguem alcancar o no interno por
  `[&_div]`, e aqui nao ha seletor de descendente, entao ela nao teria o que
  evitar.

Duas nao portam, e as duas por decisao: o `VirtualList`, porque a `FlatList` ja
virtualiza de fabrica e uma peca nossa por cima seria embrulho de embrulho; e o
`Popconfirm`, que vira `AlertDialog` - painel ancorado a um botao de lixeira
encostado na borda a 390px sai da tela ou tapa a linha que se vai apagar.

### O grafico mostrava esqueleto quando devia mostrar erro

Mesmo defeito do web, e herdado dele: `isLoading` era testado antes de
`isError`, entao consulta que falhou durante um refetch escondia a falha atras
do esqueleto. No celular doi mais - nao ha barra de rede visivel, e a pessoa
fica olhando um carregamento que nunca termina, sem o botao de tentar de novo.
O `DataList` sempre ordenou certo. Ha teste agora.

### Como migrar

Busca e troca resolve as duas renomeacoes, e o `tsc` aponta a da `Sparkline`. A
do `RadioGroup` so aparece em teste que afirma sobre `accessibilityState`. O
acento do `DataList` e o unico que nao ha como o compilador achar: procure a
string antiga em teste de ponta a ponta.

Se alguma tela contava com a letra proporcional onde a biblioteca pedia
monoespacada, ela muda de largura nesta versao.

## 0.2.0

A primeira versao depois de uma auditoria externa que instalou o pacote,
tipou-o contra o react-native e cruzou o catalogo dele com o do web. Tres
achados eram criticos, e um deles impedia o projeto de rodar.

### O guia de instalacao fixava a versao errada

`npx expo install nativewind` resolvia para a `4.2.6`, e este pacote exige a
5 - que so existe sob a tag `preview`. Quem seguia a doc instalava a major
errada, o peer ficava insatisfeito e nada funcionava. Pior: o trecho de
`metro.config.js` da mesma pagina usava `withNativewind`, que so existe na v5
(a v4 exporta `withNativeWind`, com W maiusculo), entao o snippet quebrava com
a versao que a linha acima dele instalava.

A linha agora e `npx expo install nativewind@preview`, e a doc diz que a v5 e
pre-lancamento - quem vai para producao precisa saber disso antes de comecar.

### Dois erros de tipo saiam daqui e caiam no build de quem usa

O pacote publica FONTE: o `exports` aponta para `./src/index.ts` e o Metro
compila no app. A consequencia e que erro de tipo daqui nao fica aqui - ele
aparece dentro do `node_modules` de quem consome, e o `skipLibCheck` de la nao
ajuda, porque so cobre `.d.ts`. Os dois erros do `OTPField` foram consertados,
e a passagem de tipos sobre a fonte publicada virou condicao de publicacao.

### O `nativewind-env.d.ts` faltava no guia

Sem a linha de referencia de tipos do NativeWind, o TypeScript nao conhece
`className` em `View`, `Text` ou `Pressable`: sao 165 erros num projeto novo.
A doc cobria metro, browserslist, app.json e global.css; este era o quinto
arquivo, e ficou de fora.

### Quebras de contrato: tres nomes se alinham ao web

Os mesmos conceitos tinham nomes diferentes de cada lado. Alinhar custa tres
renomeacoes agora, e custaria codigo de cliente depois.

| Antes | Agora |
|---|---|
| `Avatar initials` | `Avatar fallback` |
| `OTPField onComplete` | `OTPField onValueComplete` |
| `ToggleGroup single` | `ToggleGroup multiple` (e o padrao inverte junto) |

O `ToggleGroup` merece atencao: `single` era o padrao, e agora o padrao e a
escolha unica com `multiple` opcional - igual ao web. Quem dependia do
comportamento multiplo precisa passar `multiple`.

### O tema de cliente passa a existir

O pacote tinha 44 tokens com hexadecimal cravado em `light-dark()`, e o
provider aceitava apenas os dois temas de casa. Nao havia nome de cliente
possivel - a promessa white-label, que e a razao de a biblioteca existir do
jeito que existe, valia so no web.

```sh
bun run gen:native --tema tema-acme.css --saida acme.theme.ts
```

```tsx
<RivoProvider theme={acmeTheme} scheme="system">
```

A fonte e a mesma do web: o cliente escreve a camada 3 uma vez. Os dois temas
de casa nao mudam - continuam no `light-dark()`, com troca no mesmo frame e sem
re-render. O tema de cliente entra pelo `VariableContextProvider` do NativeWind
e custa uma re-renderizacao por troca, paga so por quem veste um cliente.

**Para quem escreve peca:** cor lida por fora da classe agora vem de
`useRivo().colors`, e nao de `tokens.themes[...]`. Lendo o mapa direto, a tela
do cliente sairia com metade das cores dele e metade da lima da RivoCode.

### Pecas novas

`Meter` - a medida que o web separa do `Progress` com argumento proprio, e que
faltava aqui: sem ela, cota e limite eram desenhados com `Progress`, e o leitor
de tela anunciava "carregando" para algo que nao carrega. O papel de
acessibilidade e diferente do web porque o React Native nao tem equivalente de
`meter`: a peca se anuncia como texto com valor, e nunca como `progressbar`.

`Sparkline` - desenhada com `View`, sem trazer `react-native-svg` para o
pacote. `line` e `bar` valem nos dois mundos; `area` nao porta, porque pede
poligono preenchido.

### O `DataList` deixa de so ler

`filter` e `selectable` chegam com o mesmo nome de prop do web. Ordenacao e
paginacao ficam de fora por desenho, e nao por atraso: no celular, ordenar e um
menu de "ordenar por" e paginar e rolagem infinita - forcar o nome do web ali
seria paridade de fachada.

Junto, um defeito que a auditoria nao pegou: a chave da linha saia do indice
pos-filtro, entao digitar na busca renumerava as linhas e a que estava marcada
trocava de dono.

### Escolha multipla

`Select` e `Combobox` aceitam `multiple`. A folha nao fecha ao escolher - senao
o caso da prop seria impossivel - e por isso ganhou um botao de concluir, que
no `Combobox` fica fora da rolagem: dentro dela, so quem rolasse ate o fim das
vinte opcoes o acharia.

### Acessibilidade e alvo de toque

O `Button` ganha `loading`, passa `accessibilityState` (desabilitado so
escurecia, e o leitor anunciava um botao ativo) e cresce ate o minimo das duas
plataformas: `md` vai de 40 para 44px, `lg` para 48. O `sm` continua com 32px de
desenho - subir o tornaria identico ao `md`, e a variante existe para a linha
densa - mas ganha `hitSlop`, entao o alvo tem os 44 da Apple.

A tarja do `Dialog` e da `Sheet` vira irma do painel, e nao pai: era um
`Pressable` com rotulo "Fechar" com o dialogo inteiro dentro, e no VoiceOver a
primeira parada ao entrar era um botao gigante chamado "Fechar" que embrulhava
tudo. O contedor ganha `accessibilityViewIsModal`, e o titulo vira cabecalho.

### A tabela de paridade

A doc listava o que traduz e nomeava quatro ausencias; faltavam 23 pecas que
ela nao citava. Agora sao 82 linhas com quatro estados explicitos - traduz,
vira outra peca, na fila, nao porta - e cada pagina do catalogo diz o que
acontece com ela no celular. A tabela e gerada, e um check falha quando ela
diverge do que o pacote exporta.

## 0.1.0

A primeira versao: 42 pecas traduzidas do web, tokens derivados dos mesmos CSS,
e a decisao que organiza o resto - traducao, e nao porte. A tabela virou
`DataList`, o `NumberField` virou stepper, o `Menu` virou folha de baixo.
