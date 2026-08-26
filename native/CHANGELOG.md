# Mudancas

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
