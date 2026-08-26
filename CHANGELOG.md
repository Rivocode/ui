# Mudancas

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
doc publica com confianca. Prop com `—` e prop que ainda nao saiu.

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
| `Meter`, `Progress`, `Slider` | — | `format="percent"` ou `format={(v) => ...}` |
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
