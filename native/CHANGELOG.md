# Mudancas

## 0.6.0

### O `tsc` do app nao trava mais na nossa fonte

O pacote publica FONTE - `main` e `types` apontam para `src/index.ts` -, entao o
compilador de quem consome atravessa as nossas pecas. Um app com
`noUncheckedIndexedAccess`, que e comum em projeto novo com `strict`, nao
compilava por causa de OITO pontos nossos, em `badge`, `basics`, `button` e
`calendar`. Nada disso aparecia aqui, porque a nossa propria passagem de tipos
nao ligava a flag.

Os oito foram consertados sem `!` e sem `as`: onde o indice pode faltar de
verdade, a falta passou a ser tratada. Tom desconhecido no `Badge` veste o
neutro, tom desconhecido no `Alert` veste o info, variante desconhecida no
`Button` pinta o spinner como o `secondary`, e mes fora da faixa no `Calendar`
da a volta em vez de quebrar - a mesma volta que o `new Date` ao lado ja fazia.

A flag entrou no `native/tsconfig.check.json`, que roda no job `nativo` da CI.
E o que impede a volta: o app so descobria isto depois de instalar.

### O `Avatar` aceita foto, e sem peer novo

O JSDoc dizia que a imagem chegaria depois, com `expo-image`. Estava errado
desde sempre: a `Image` do CORE do React Native ja busca `https://` sozinha.
Entao `src` e `alt` entraram com os mesmos nomes do web, sem peer novo, sem
subcaminho novo e sem passo a mais na instalacao.

A foto e desenhada por cima das iniciais, entao `fallback` continua obrigatoria
e passou a ter razao melhor: e o que aparece enquanto a imagem baixa e o que
volta se ela falhar. O estado guarda QUAL `src` quebrou, entao trocar a foto
tenta de novo sozinho. Sem `alt`, a imagem sai do leitor de tela - e o caso de
quando o nome ja aparece do lado.

A tabela de assinatura perdeu a linha `Avatar | src | - | imagem remota ainda
nao entra`: a prop passou a existir dos dois lados com a mesma assinatura, e
linha que descreve divergencia que acabou e ruido. Sao 146 divergencias agora.

### `nativewind-env.d.ts` entrou na receita, e sao sete arquivos

Sem `/// <reference types="nativewind/types" />` num `.d.ts` do app, o `tsc`
dele reprova DENTRO do `node_modules`, porque `className` nao existe em `View`,
`Text` e `Pressable` - e o `skipLibCheck` nao salva, porque ele so pula `.d.ts`
e o que estamos compilando e `.tsx`.

O `npx rivocode-ui-native-init` passou a escrever o arquivo, o README passou a
lista-lo, e o `check:receita` passou a medi-lo como FATO: a lista de
`reference types` e a de `declare module`, e nao o texto em volta.

## 0.5.0

### Quebra: o `RivoNativeThemeMap` e a prop `scheme` sairam

O tipo estava `@deprecated` e inerte desde a 0.4.0: o provider ja resolvia os 45
papeis lendo o CSS compilado, e o objeto nao vestia mais nada alem de um aviso
em `__DEV__`. Agora ele saiu do pacote - nao ha tipo exportado, nem membro na
uniao da prop `theme`, nem aviso. A prop aceita `rivocode-dark`,
`rivocode-light` e `system`.

A prop `scheme` saiu junto. Ela so era lida quando `theme` era um objeto, para
escolher entre o claro e o escuro do mapa; sem o mapa, ninguem a lia.

Quem passava `theme={{ light, dark }}` nao perde cor nenhuma, porque o mapa ja
nao pintava: sobrescreva os papeis `--color-*` num `@theme` do `global.css` do
app e recompile com `npx rivocode-ui-native-css`. Quem passava `scheme` troca
por `theme="rivocode-light"`, `theme="rivocode-dark"` ou `theme="system"`.

O `gen:native --tema` continua emitindo o arquivo de mapa, agora com a forma
declarada inline em vez de importar o tipo: ele serve de conferencia de papel
faltando e e a entrada da guarda de contraste.

### Corrigido: a tela parava de sair metade num esquema e metade no outro

O provider lia a paleta do DOM uma vez e congelava. As cores resolvem por
`light-dark()`, que depende do `color-scheme`, e o inicial e claro - entao o app
que declara o esquema dentro de um `useEffect`, que e o padrao obvio, ja tinha
perdido a leitura. O sintoma media assim: fundo escuro pela classe, barra de
abas branca porque veio de `useRivo().colors`.

E a mesma tela misturada que a 0.4.0 consertou, voltando por outra porta - antes
a causa era o mapa de tema, agora era ordem de efeitos.

A leitura passa a reagir a tres gatilhos, e cada um pega o que os outros nao
pegam: mutacao de `style` e `class` na raiz e no `body`, a media query de
esquema para o app que fica no automatico, e uma releitura no quadro seguinte
para a folha que o app injeta sem tocar na raiz. So vira estado quando algum
valor muda de fato, entao nao ha repintura por quadro. Fora do alvo web o
caminho e inerte.

### Quebra: as classes de familia de fonte nao existem mais

`font-display` nunca gerou um byte. Pior: `font-sans`, `font-serif` e
`font-mono` GERAVAM regra, apontando para a pilha de CSS que o Tailwind traz de
fabrica - e o `react-native-css` guarda so o primeiro nome dela. Ou seja, o
texto saia numa fonte que ninguem escolheu, sem erro em lugar nenhum.

O `@theme` gerado passa a zerar os tres tokens de familia com `initial`, entao
as quatro classes deixam de compilar e a guarda de classe sem regra as acusa
dentro do pacote. Quem escrever uma delas numa tela ouve, em `__DEV__`, o nome
do caminho que funciona: a prop `fonts` do `RivoProvider`, que e a unica que
alcanca o aparelho.

### Corrigido: o `+` do `NumberField` volta para dentro da caixa

No alvo web o passo de somar saia para fora e ficava invisivel e intocavel:
`flex: 1 1 0%` com `min-width: auto` dentro de um `overflow-hidden`. O campo do
meio ganhou `min-w-0`.

### Corrigido: o numero do `NumberField` e a hora do `TimeField` nascem centrados

Centralizar texto de `TextInput` nao tinha caminho, e as duas tentativas obvias
falhavam de jeitos diferentes. A classe `text-center` nao e ignorada: ela
estoura, porque o `react-native-css` declara `nativeStyleMapping` para
`textAlign` e o runtime chama `path.split` num booleano. E a prop `textAlign`
nao esta no `forwardPropsList` do react-native-web, entao e descartada calada -
era ela que as duas pecas usavam.

As duas passaram a alinhar por `style`, que e o unico caminho que os dois alvos
leem. Nao ha prop nova: as pecas vem centradas, como no web.

### Marca de grafico com chave desconhecida passa a acusar

`colors[chave]` com chave que nao existe devolvia `undefined`, virava
`fill={undefined}`, e o SVG pintava PRETO - cor que nao pertence a tema nenhum
da casa. Em `__DEV__` o mapa entregue ao desenho vai num `Proxy` que nomeia a
chave desconhecida e lista as validas, uma vez por chave. Em producao e o
objeto cru, sem custo.

### `npx rivocode-ui-native-init`: a receita de instalacao vira comando

Seis arquivos do app precisam concordar entre si para o pacote funcionar, e ate
aqui a unica forma de descobrir quais era ler o `examples/native` inteiro: o
README listava QUATRO, e escondia os dois mais caros de diagnosticar. O comando
novo escreve a receita e imprime o que fez, arquivo por arquivo.

Ele nao sobrescreve calado. Arquivo que nasce inteiro e ja existe com outro
conteudo sai marcado, o comando termina com codigo 1, e so `--force` faz a
receita vencer; chave de JSON e trocada com o valor antigo a vista. `--dry-run`
mostra o plano sem escrever nada.

O `babel.config.js` e o caso que mais surpreende, e ele foi medido: o certo e
**nao existir**. Sem arquivo de Babel nenhum o Expo cai no `babel-preset-expo`
sozinho; escrever um a mao com esse preset derruba o app no SDK 57, porque ali
o preset nao resolve da raiz do projeto. O comando nao escreve nenhum - ele
olha se existe um e acusa as duas linhas da receita v4 do NativeWind que ainda
circulam, `jsxImportSource: "nativewind"` e o preset `nativewind/babel`.

### Corrigido no README: o comando de instalacao trazia a versao errada

`npx expo install nativewind` traz a `4.2.6`, que nao satisfaz o peer
`>=5.0.0-preview.1` deste pacote. O comando certo e `nativewind@preview`. O
`react-native-reanimated`, que o `react-native-css` exige em tempo de bundle,
tambem faltava na linha.

## 0.4.1

### Corrigido: o `rivocode-ui-native-theme` le os dois esquemas, e nao um deles duas vezes

Paleta escrita como a ajuda do proprio comando manda - `export const light` e
`export const dark` soltos no arquivo - saia com **um esquema so**. O comando
lia os exports em ordem alfabetica, ficava com o primeiro (`dark`), e enchia as
duas vagas do `light-dark()` com ele. Tres sintomas, uma raiz:

- o CSS nascia sem `light-dark()` nenhum, e o aparelho no modo claro mostrava o
  tema escuro;
- o resumo dizia "45 papeis, claro e escuro" tendo medido o escuro duas vezes,
  e a guarda de contraste concordava, porque media o mesmo esquema nas duas
  pontas;
- o aviso "o esquema `light` tem fundo escuro" acusava paleta clara correta.

A extensao do arquivo nunca foi o eixo: `.ts` e `.mjs` erravam igual. O que
separava era a FORMA - `export const tema = { light, dark }` funcionava.

### Corrigido: a paleta em `.json` carrega

`rivocode-ui-native-theme paleta.json` morria com `needs an import attribute of
"type: json"`, e a mensagem de erro do comando oferecia `.json` como a saida
para quem tem Node antigo. Agora ele le o arquivo em vez de importa-lo.

### Melhorado: tema de um esquema so sai anunciado

Paleta com so `light` (ou so `dark`) continua valendo - tema de um esquema e
escolha -, mas o comando agora diz que as duas vagas sairam iguais, em vez de
descartar a outra calado. O resumo tambem para de dizer "claro e escuro" quando
mediu um.

## 0.4.0

Esta versao nasceu de um app Expo de verdade que vestiu um tema de cliente
inteiro. O relato que voltou tinha tres defeitos, e o primeiro deles significa
que **o tema de cliente nunca funcionou como a documentacao dizia.** Ha duas
quebras aqui, e as duas sao a API deixando de prometer o que nao entregava.

### Corrigido: o tema de cliente veste a tela inteira

O sintoma na tela era donut de um tema e botao de outro, lado a lado.

A causa esta abaixo da biblioteca. O compilador do `react-native-css` crava o
hexadecimal dentro da regra - `.bg-accent` vira `{"backgroundColor":"#d4f34a"}`,
literal - e no CSS compilado nao sobra **uma ocorrencia** de `--`. O
`VariableContextProvider` entregava os 44 papeis a ninguem: classe nenhuma lia
variavel. O que o mapa alcancava era so quem le cor por JS, e sao oito: os
graficos, o giro do `Button` e do `Spinner`, o trilho do `Switch`, o
`Sparkline`, e o `placeholderTextColor` de `Field` e `Textarea`. Metade da tela
no tema do cliente, metade na cor da casa.

Manter variavel viva no CSS explode a compilacao pelas cinco formas testadas -
declarar duas vezes, com fallback, por classe, ou desligando o inliner - e
`3.0.7` e a ultima versao publicada. Nao havia para onde subir.

A saida foi pelo outro lado: **as pecas param de precisar do mapa.** O
`RivoProvider` resolve os 45 papeis do proprio CSS compilado, em runtime, e
publica pelo `RivoContext` que ja existia. As 14 pecas que leem `useRivo().colors`
nao mudaram uma linha. Custo medido: 53 microssegundos por render do provider,
que na pratica e por troca de tema.

Faltavam classes para isso funcionar, e faltavam justo as que os graficos
precisam: **23 dos 45 papeis nao tinham `bg-` emitido**, os oito `chart-1..8`
inclusive. Agora tem, e o CSS gerado cresceu 8,3%.

O que se ganha: `@theme { --color-accent: #1b57ff }` no CSS do app veste
`Button`, `Switch` e `ChartDonut` com a mesma cor, provado numa unica arvore.

**Duas coisas que valem entrar no seu contrato.** Cor de classe so muda em
BUILD: tema de cliente no nativo e geracao de CSS, e nao troca em runtime. E
`light-dark()` tem duas vagas, entao sao **dois temas por build, no maximo** -
uma vitrine de cinco temas nao cabe sem cinco bundles.

### Quebra: `RivoNativeThemeMap` esta descontinuado

O tipo levou `@deprecated`. A prop `theme` continua sem tag, porque
`theme="rivocode-light"` e uso legitimo - o que esta descontinuado e passar
mapa. Ele ficou inerte: quem passa ouve um aviso em `__DEV__` dizendo por que
era pior do que nada (metade da tela discordando da outra) e qual e o caminho
que funciona.

Migre sobrescrevendo os papeis no `@theme` do CSS do app, antes de compilar. O
comando novo abaixo faz isso de uma paleta de oito cores.

### Quebra: a prop `density` sai

`<RivoProvider density>` e o tipo `RivoDensity` nao existem mais. A prop era
aceita, a escala `compact` era gerada em `tokens.ts`, e nenhuma peca lia
nenhuma das duas: a API prometia uma densidade que a biblioteca nunca entregou.

Ela nao vai ser implementada, e o motivo ja estava escrito em tres lugares
antes de a prop sair. A escala compacta levaria o controle medio de 40 para 32
pontos e o grande de 48 para 38 - todos abaixo dos 44 que um dedo pede. O
catalogo anda no sentido contrario de proposito: das 27 pecas com altura fixa,
25 tem alvo de toque, e a altura mais comum e 48. `comfortable` e a unica
altura, e agora a API diz isso.

Quem passava `density="comfortable"` apaga a linha: era o padrao, e a tela nao
muda. Quem passava `density="compact"` nunca viu efeito. A escala saiu do
`tokens.ts` junto, e as medidas confortaveis entraram em `scales`, porque no
toque elas nao sao uma densidade entre duas - sao A medida.

### `rivocode-ui-native-theme`: vestir um cliente deixa de ser trabalho do app

Para vestir um cliente, o app que reportou tudo isto precisou escrever 220
linhas: os nomes de papel, os pares de contraste, os minimos, a composicao de
alfa, o formato de saida. Nada disso e do app, e o proximo projeto reescreveria
pela metade - com o mesmo defeito que a copia dele herdou, porque a conta que
ele portou nao enxergava `rgba()` e devolvia `NaN` em 12 dos 45 papeis.

```sh
rivocode-ui-native-theme minha-paleta.ts
```

Voce escreve **oito** cores por esquema - `bg`, `surface`, `fg`, `accent`,
`success`, `warning`, `danger`, `info` - e os outros 37 sao derivados. A regra
e uma so: o gerador **nunca inventa matiz nova**; ele reusa cor que voce
escreveu ou compoe alfa dela. Os cinco `*-text` sao o caso conservador, porque
sao a cor que se le: onde o proprio preenchimento nao passa, o comando recusa e
**diz o valor que passaria**.

E ele nao escreve tema que reprova no contraste:

```
Guarda de contraste:
  claro: 1 falha(s)
    accent-fg sobre accent: 3.18 < 4.5
Nada foi escrito: conserte o contraste antes de gerar o CSS.
```

A lista de papeis sai do `tokens.json` do pacote **instalado**, nunca de uma
copia dentro do comando. Papel novo numa versao futura para o comando pelo
nome, com a versao, em vez de o tema quebrar calado.

### `@rivocode/ui-native/contrast`

A conta de contraste do toque passa a ser importavel:

```ts
import { checkThemeMap, contrastRatio, compose } from "@rivocode/ui-native/contrast";
```

A tabela de pares dela e a do TOQUE, e nao a do web: saem `ring`, `accent-hover`,
`line-hover` e `border-disabled`, porque nao ha foco de teclado nem ponteiro no
celular. Entram pares que so existem no dedo - rotulo sobre o preenchimento
pressionado, alfa sobre alfa no `Calendar`, e o par de camada do `opacity` do
React Native, que achata preenchimento **e** rotulo juntos e derruba o `Button`
destrutivo de 4,83 para 4,57:1 sob o toque.

Ela le os mesmos espacos de cor que o web aprendeu nesta rodada, `oklch`
incluido.

### Corrigido: o pacote sobe no react-native-web

`Appearance.setColorScheme` nao existe no `react-native-web`, e o
`RivoProvider` chamava sem guarda. Como ele embrulha o app inteiro, **o app
inteiro nao renderizava**: tela em branco e `setColorScheme is not a function`
no console.

A chamada passou a ser condicional, e o caso "nao deu" nao e silencioso - o
aviso explica que no web o `light-dark()` resolve pelo `color-scheme` do
elemento, e que o remedio e do app. Dois vizinhos foram consertados na mesma
varredura: `I18nManager.isRTL` nao existe no RNW (le-se por `getConstants()`), e
`AppState.addEventListener` devolve `undefined` sem DOM, entao `remove()`
estourava.

Isto vale mais do que um alvo a mais: o web e a unica bancada onde se inspeciona
arvore renderizada e se tira retrato sem simulador.

### Corrigido: o controle marcado, e o polegar do Slider

`Switch`, `Checkbox` e `RadioGroup` marcados mediam 1,21:1 no tema claro, contra
os 3:1 da WCAG 1.4.11 - menos que o estado desmarcado. E o conserto do web
inteiro esta no CHANGELOG dele; aqui foi pior num ponto: o circulo do
`RadioGroup` e vazado, entao o ponto marcado era lima cheia direto sobre a
pagina, e a opcao escolhida nao se via. Agora medem 5,55:1 sobre a pagina e
5,75:1 sobre o cartao.

O polegar do `Slider` perdeu `shadow-1`. A classe nao existia no CSS nativo -
nunca gerou um byte, e o polegar nunca teve sombra. Nao foi implementada porque
o polegar do `Slider` do web tambem nao tem sombra: a classe era invencao da
copia, e nao traducao. O polegar se le sem ela, a 12,97:1 sobre o trilho.

Uma guarda nova acusa essa familia inteira agora: classe usada e nao gerada
falha o gate, e ela pergunta ao proprio compilador em vez de consultar lista.

### `ChartContainer` e `Indicator` param de aceitar uso errado em silencio

Os dois avisos do web valem aqui, com os mesmos numeros: moldura de grafico com
altura zero, e filho de `Indicator` mais largo que 48 pontos.

## 0.3.1

A `FilterBar` nao tratava `dir="rtl"`, e o defeito durava para sempre no iOS.

O codigo guardava zero como valor de repouso da rolagem. Em LTR isso e verdade;
em RTL o repouso e o fim do conteudo. E em repouso o iOS nao emite evento de
rolagem nenhum, entao enquanto ninguem arrastasse a fileira, a regua que marca
"ha mais escondido deste lado" aparecia do lado errado, para sempre.

O que o React Native ja resolvia sozinho ficou como estava, e isso foi
verificado na fonte e nao de memoria: a fileira e a ficha ja sao espelhadas
pelo Yoga, e o repouso da rolagem ja para na borda onde a leitura comeca.
Inverter de novo seria o erro classico de espelhar duas vezes, que custou
defeito real em quatro pecas do web hoje.

O `contentOffset` que chega ao JavaScript e sempre distancia fisica a partir da
esquerda, nos dois sentidos e nas duas plataformas, por caminhos diferentes:
o Android emite o valor cru, o iOS converte na emissao. Entao a regua marca o
lado fisico que tem conteudo alem dele, e nao troca de lado.

O respiro do botao de limpar passou de `ml-2` para `gap-2` na fileira: em RTL o
`flex-row` do pai o joga para a esquerda fisica, e a margem punha o respiro do
lado de fora em vez de entre ele e as fichas.

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

| Antes                         | Agora                        | Peca         |
| ----------------------------- | ---------------------------- | ------------ |
| `tone`                        | `trend`                      | `Sparkline`  |
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

| Antes                 | Agora                                             |
| --------------------- | ------------------------------------------------- |
| `Avatar initials`     | `Avatar fallback`                                 |
| `OTPField onComplete` | `OTPField onValueComplete`                        |
| `ToggleGroup single`  | `ToggleGroup multiple` (e o padrao inverte junto) |

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
