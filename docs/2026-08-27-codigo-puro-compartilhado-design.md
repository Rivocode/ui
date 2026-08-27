# Código puro compartilhado entre os dois pacotes: design

Data: 2026-08-27. O item 7 da lista de decisões humanas do
`2026-08-27-calendar-de-agenda-design.md`, e a única daquela lista que não é
sobre o `EventCalendar`: ela é sobre o repositório. Este documento existe para
ser discutido antes do código, como o calendário foi.

## O problema, e o que a medição mostrou

O que se sabia: os cinco ajudantes de valor do `TimeField` (`applyTimeMask`,
`parseTime`, `formatTime`, `timeWindow`, `stepTime`) são cópia caractere a
caractere entre `src/components/time-field.tsx` e `native/src/time-field.tsx`.

O que se descobriu ao medir: **são vinte declarações de topo idênticas, e não
cinco.** Uma varredura que quebra os dois arquivos em declarações de primeiro
nível, tira comentário, normaliza espaço e compara os textos acha isto:

| Declaração       | Web                                     | Nativo                               |
| ---------------- | --------------------------------------- | ------------------------------------ |
| `fromWheel`      | `src/components/color-picker.tsx:57`    | `native/src/color-picker.tsx:44`     |
| `stepTime`       | `src/components/time-field.tsx:81`      | `native/src/time-field.tsx:41`       |
| `useZodForm`     | `src/form/use-zod-form.ts:13`           | `native/src/form/use-zod-form.ts:11` |
| `formatTime`     | `src/components/time-field.tsx:67`      | `native/src/time-field.tsx:27`       |
| `parseTime`      | `src/components/time-field.tsx:56`      | `native/src/time-field.tsx:16`       |
| `normalizeColor` | `src/components/color-picker.tsx:44`    | `native/src/color-picker.tsx:31`     |
| `timeWindow`     | `src/components/time-field.tsx:75`      | `native/src/time-field.tsx:35`       |
| `nameFromConfig` | `src/chart/chart.tsx:236`               | `native/src/chart/chart.tsx:152`     |
| `applyTimeMask`  | `src/components/time-field.tsx:50`      | `native/src/time-field.tsx:10`       |
| `TONE`           | `src/components/tracker.tsx:24`         | `native/src/tracker.tsx:14`          |
| `blankOf`        | `src/components/query-boundary.tsx:120` | `native/src/query-boundary.tsx:119`  |
| `applied`        | `src/components/filter-bar.tsx:26`      | `native/src/filter-bar.tsx:31`       |
| `leavesOf`       | `src/components/tree.tsx:267`           | `native/src/tree.tsx:31`             |
| `nameOf`         | `src/components/color-picker.tsx:84`    | `native/src/color-picker.tsx:71`     |
| `flatten`        | `src/components/data-table.tsx:126`     | `native/src/data-list.tsx:43`        |
| `counted`        | `src/components/filter-bar.tsx:22`      | `native/src/filter-bar.tsx:27`       |
| `valueOf`        | `src/components/color-picker.tsx:82`    | `native/src/color-picker.tsx:69`     |
| `RivoContext`    | `src/provider/rivo-provider.tsx:32`     | `native/src/provider.tsx:29`         |
| `HEX`            | `src/components/color-picker.tsx:42`    | `native/src/color-picker.tsx:29`     |
| `DAY`            | `src/components/time-field.tsx:18`      | `native/src/time-field.tsx:8`        |

Vinte, e nenhum falso positivo na lista. Ninguém tinha contado porque nada
contava: o `check:paridade` compara **peças**, não código. Ele diria que o
`TimeField` "traduz" e estaria certo, enquanto os dois `stepTime` divergiam.

E a cópia não fica dentro da mesma peça. O `flatten` do `DataTable` é o mesmo
do `DataList`, que é outra peça, em outro pacote, com outro nome. Quem for
consertar acentuação de busca num dos dois não tem por que abrir o outro.

**O estrago não é o byte repetido, é a divergência silenciosa.** É a história
que o `test/acentos.test.ts` carrega no comentário: o `DataList` nativo serviu
"Nao foi possivel carregar a lista." por versões, acentuado do lado web e cru
no aparelho, sem nada acusar.

## A restrição que decide tudo: os dois publicam de formas diferentes

Antes de propor lugar, os fatos que eliminam a maioria das saídas.

**`@rivocode/ui` publica compilado.** `files` lista `dist`, o `tsdown` empacota
a partir de `src/index.ts`, `src/form/index.ts` e `src/chart/index.ts`. Todo
módulo alcançável a partir de uma entrada entra no `dist`, e o que ninguém
importa some na árvore. O consumidor recebe `.js` e `.d.ts`.

**`@rivocode/ui-native` publica fonte.** `exports` aponta para
`./src/index.ts`, `files` lista `src`, e quem compila é o metro dentro do app
de quem instala. Duas consequências, e as duas mandam neste desenho:

1. **Só sai no pacote o que está fisicamente dentro de `native/`.** Um import
   relativo que suba acima da pasta (`../../src/lib/x`) resolve na árvore de
   desenvolvimento e **não existe no tarball**. Quebra na instalação, não aqui.
2. **Byte não usado não é grátis.** No web o `tsdown` remove o que ninguém
   importa; no nativo o arquivo viaja e o metro o compila no app alheio. Isso
   volta na hora de definir o critério.

**`native/` não é workspace.** `bun install` lá dentro cria um segundo React e
derruba dezenas de testes com "Invalid hook call"; `check:instalacao` é a
guarda. Qualquer saída que peça instalação em `native/` está descartada de
saída, e o mesmo vale para o nativo depender do `dist` do web: o `dist` não
existe em árvore limpa, não é versionado, e amarraria o pacote que publica
fonte ao artefato de build do outro.

## As saídas consideradas

| Saída                                                                   | No web                                     | No nativo                                                                                             | Veredito                                 |
| ----------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Pasta nova na raiz (`shared/`), os dois importando por caminho relativo | `tsdown` empacota, funciona                | o `files` do nativo não leva a pasta: o import sai do tarball                                         | **recusada**                             |
| `src/lib/`, com o nativo importando `../../src/lib/x`                   | funciona                                   | mesma quebra, e ainda amarra a árvore do nativo à do web                                              | **recusada**                             |
| Symlink `native/src/shared` para `src/shared`                           | funciona                                   | `npm pack` e metro tratam link de jeitos diferentes, e o que quebra quebra na máquina de quem instala | **recusada**                             |
| Terceiro pacote `@rivocode/ui-core` no npm                              | dependência a mais, resolve                | dependência a mais, resolve                                                                           | **recusada hoje**, e a conta está abaixo |
| **`src/shared/` no web, espelhado em `native/src/shared/` por gerador** | módulo comum do grafo, o `tsdown` empacota | arquivo de verdade dentro de `src`, já coberto pelo `files`                                           | **escolhida**                            |

### Por que o terceiro pacote não paga hoje

Ele é a resposta certa em abstrato e cara em concreto, e o preço não é técnico,
é de publicação. Hoje são duas tags, dois workflows, e o prefixo é o que
separa. Um terceiro pacote traz um terceiro prefixo de tag, um terceiro
workflow, uma terceira versão para manter em passo, e uma **dependência de
tempo de instalação** no pacote que publica fonte: o `@rivocode/ui-native`
passaria a exigir que uma versão do `ui-core` já esteja no registro antes de
ele próprio poder ser instalado.

Some-se o que o `CLAUDE.md` já escreve em letra grande: publicação não se
desfaz, e o npm não deixa sobrescrever. Uma versão ruim do `ui-core`
envenenaria os dois pacotes de uma vez, e o conserto seria versão nova nos
três. Hoje o ganho disso são cinco funções e quarenta linhas.

E ele nem resolveria o problema sozinho: para o metro do app alheio o
`ui-core` também teria que publicar fonte, ou publicar dois formatos. É a
história de custo do `@rivocode/ui-native` de novo, num pacote a mais.

**O que faria a conta virar**, para a próxima pessoa não refazer esta análise:

- a superfície compartilhada passar de umas quinhentas linhas, quando o
  espelho deixar de ser algo que se lê num diff;
- aparecer um **terceiro** consumidor que não é peça de tela: uma CLI, um
  validador de servidor, um pacote de formatação. Com dois consumidores o
  espelho basta; com três ele vira três;
- o repositório virar público. Aí a procedência volta (hoje o npm recusa
  `--provenance` com 422), e o custo de mais um workflow cai;
- o compartilhado precisar de **peer**. O espelho só funciona porque o código
  não importa nada; no dia em que precisar, ele vira pacote com peer declarado.

## A escolha

**O código puro mora em `src/shared/`, e o pacote nativo recebe uma cópia
gerada em `native/src/shared/`.**

O espelho não é conserto de meia-boca: é a mesma decisão que a casa já tomou
para os tokens. `native/theme.css`, `native/tokens.ts` e `native/tokens.json`
são cópias derivadas do CSS do web, versionadas, com cabeçalho dizendo que são
geradas, e o `check:native` fica vermelho se o comitado divergir da fonte. O
motivo é idêntico: o mesmo dado tem que existir fisicamente nas duas árvores
porque as duas publicam de jeitos diferentes, e o que impede a divergência é
uma guarda, não a boa vontade.

**A duplicação continua existindo em bytes. O que acaba é a capacidade de
divergir.** Esse era o pedido: "uma cópia pode ganhar conserto que a outra não
ganha, e nada acusa". Agora acusa, e acusa no gate.

### Por que dentro de `src/`, e não numa pasta nova na raiz

Porque o repositório inteiro já olha para `src/**` e `native/src/**`, e não
olha para mais nada:

- `check:nomes` e `check:comentarios` varrem as duas árvores; pasta nova na
  raiz nasceria fora das duas;
- `check:grupos` e `test/acentos.test.ts` idem, e o comentário do `acentos`
  diz por que: tirar `native/src` de lá devolveu um ponto cego inteiro;
- o `tsconfig.json` da raiz inclui `src`, `test`, `scripts` e `demo`;
- o `native/tsconfig.check.json` inclui `src`, e é ele que impede erro de tipo
  daqui de aparecer dentro do `node_modules` de quem consome;
- o `files` do `native/package.json` já lista `src`.

Escolher `src/shared/` e `native/src/shared/` faz o mecanismo nascer coberto
por sete guardas que já existem, sem editar nenhuma delas, e sem tocar em
`package.json`, `native/package.json` ou `tsdown.config.ts`. Uma pasta na raiz
exigiria mexer nos três lugares que decidem publicação para ganhar menos.

### Por que não `src/lib/`

Porque o critério precisa de fronteira física, e não de acordo. `src/lib/` hoje
tem `screen.ts` (usa `matchMedia`), `positioning.ts`, `inert-background.ts` e
`loading-announcement.tsx`: DOM puro. Uma regra do tipo "os arquivos puros de
`src/lib/` atravessam" é uma regra que alguém quebra sem perceber, porque nada
na pasta diz qual arquivo é qual. **A pasta é o critério**, e a guarda cobra a
pureza de tudo que está dentro dela.

## Como cada lado consome

**Web.** `src/shared/time.ts` é um módulo comum, importado por
`src/components/time-field.tsx` como qualquer arquivo de `src/lib/`. O
`tsdown` o empacota dentro de `dist/index.js` e o `dts` sobe os tipos junto.
Nenhuma entrada nova, nenhum `exports` novo: **o compartilhado é
infraestrutura, não superfície.** Ele só aparece na API pública através da peça
que já o exportava, e por isso o `.d.ts` publicado não muda com esta migração.

**Nativo.** `native/src/shared/time.ts` é arquivo de verdade no disco, dentro
de `src`, importado por `native/src/time-field.tsx` como `./shared/time`. O
metro resolve sem configuração: sem symlink, sem `watchFolders`, sem
`extraNodeModules`. O `files` já o leva no tarball, e o `check:native:types`
já o tipa.

**O gerador.** `scripts/codigo-compartilhado.ts`, com `bun run
gen:compartilhado` para escrever e `bun run check:compartilhado` para conferir,
que é a forma do `gen:native` / `check:native`. Cada arquivo do espelho é a
fonte precedida de uma linha de cabeçalho dizendo de onde veio e que não se
edita, como `native/tokens.ts` já faz.

## O critério: o que é código puro

Uma frase, e ela é verificável: **código puro é o que compila sem nenhum
`import`.**

Não "não toca o DOM". "Não toca o DOM" é descrição, e descrição se discute na
revisão. Zero imports é binário, a guarda mede, e ninguém argumenta com ela. O
efeito colateral é bom: uma função sem imports não alcança React, não alcança
`react-native`, não alcança peer opcional e não alcança outra peça.

Sobre isso, duas exigências a mais:

- **Só `.ts`, nunca `.tsx`.** JSX é superfície, e as duas superfícies são
  diferentes por natureza.
- **Nada de global de plataforma**: `document`, `window`, `navigator`,
  `localStorage`, `HTMLElement`, `Element`, `Node`, `process`. São os nomes que
  compilam nos dois lados e falham num.

E a segunda metade do critério, que é a que evita a gaveta de tralha:

**Puro não basta. Tem que já estar duplicado.**

O `src/shared/` não é onde código puro deve morar; é onde código puro vai
quando um segundo consumidor aparece. A razão é a assimetria de publicação: no
web o `tsdown` remove o que ninguém importa, no nativo o arquivo viaja no
tarball e o metro o compila dentro do app de quem instala. Encher o espelho por
simetria é mandar bytes mortos para o aparelho de terceiros.

### O critério nos casos reais que a medição achou

**`formatDate` entra?** Pelo critério de pureza, sim: `src/lib/date.ts`
(`formatDate`, `parseDate`, `applyDateMask`) não importa nada e só mexe em
`Date`. Pela segunda metade, **não hoje**: não há cópia. O `formatDate` do
nativo (`native/src/calendar.tsx:28`) é outra função, que recebe string ISO e
não `Date`. Migrar seria mover código por simetria. Ele entra no dia em que o
nativo quiser a mesma função, e nesse dia entra inteiro.

**`applyMask` entra?** Quase, e o "quase" é instrutivo. `src/lib/mask.ts` não
importa nada, mas `applyMask` lê `process.env.NODE_ENV` e chama `console.warn`
para avisar molde desconhecido. `process.env` existe no metro, então não
quebraria, mas é ambiente e não cálculo, e a regra tem que valer sem asterisco.
**O aviso de desenvolvimento sai da função pura e fica no lado que a chama**,
ou o arquivo não atravessa. E, de novo, hoje não há cópia: o `MaskedInput`
nativo aponta "traduz" na paridade, mas o código não é o mesmo texto.

**`src/lib/format.ts` entra?** Não importa nada, mas vive de `Intl`, e `Intl` é
dependência de plataforma disfarçada de global: no Hermes a tabela de locale
depende de como o app foi montado, e `Intl.DateTimeFormat` com `month: "short"`
em pt-BR já saiu diferente entre motores. A guarda não o proíbe, porque `Intl`
existe nos dois; o registro fica aqui para que o dia em que ele quiser
atravessar seja um dia de medir, e não de supor.

**`useZodForm` não entra**, e é o caso mais claro. O corpo é idêntico, mas ele
importa `react-hook-form`, `zod` e `@hookform/resolvers` - três peers
**opcionais**, atrás do subcaminho `./form` nos dois pacotes. Zero imports o
recusa, e recusa certo: `src/shared/` é núcleo, e o `check:chart` existe
exatamente para que o núcleo dos dois pacotes continue montando sem o peer
instalado. Um arquivo compartilhado que importasse `zod` seria um furo nessa
fronteira alcançável pelos dois pacotes ao mesmo tempo.

**`leavesOf` não entra**, e é o caso mais sutil. O corpo é idêntico, mas os
dois `TreeNode` não são o mesmo tipo: no web `label` é `ReactNode` e existe
`search`; no nativo `label` é `string`, e o JSDoc de lá explica que é de
propósito, porque o texto entra no rótulo falado. **O corpo é igual por acaso.**
Para atravessar ela teria que virar genérica sobre `{ id: string; children?:
N[] }`, o que muda a assinatura exportada dos dois pacotes. Vale, e não hoje.

**`nameFromConfig` não entra** pelo mesmo motivo do `useZodForm`: mora atrás do
peer opcional do gráfico nos dois lados, e o tipo `ChartConfig` é de lá.

**`TONE` e `RivoContext` não entram.** O primeiro é mapa de classe, não
cálculo, e `check:grupos` já olha classe nos dois lados. O segundo é idêntico
por inevitabilidade da API do React, e o tipo dele é de cada pacote.

**Entram, e estão na fila:** os cinco do `TimeField` mais o `DAY` (hoje);
`normalizeColor`, `fromWheel`, `nameOf`, `valueOf` e `HEX` do `ColorPicker`;
`counted` e `applied` da `FilterBar`; `blankOf` do `QueryBoundary`; `flatten`
do `DataTable`/`DataList`; e o `src/lib/event-layout.ts` inteiro, que já nasceu
puro e é o que o `EventCalendar` nativo vai pedir primeiro.

## A guarda: `check:compartilhado`

Uma guarda, três regras, no `scripts/codigo-compartilhado.ts`, encadeada no
`check` logo depois do `check:native`, que é a guarda irmã.

**Regra 1, pureza.** Todo arquivo de `src/shared/` é `.ts`, não tem nenhum
`import`, `require` ou `import()`, e não menciona global de plataforma. É o
critério de cima, cobrado.

**Regra 2, espelho em dia.** Para cada `src/shared/*.ts` existe
`native/src/shared/*.ts` igual ao cabeçalho mais a fonte, e não existe arquivo
sobrando no espelho. É o `check:native` aplicado a código em vez de token.

**Regra 3, cópia nova.** Quebra `src/**` e `native/src/**` em declarações de
primeiro nível, tira comentário, normaliza espaço e acusa todo texto que
aparece nas duas árvores. `src/shared/` e o espelho ficam de fora da varredura,
porque lá a igualdade é o objetivo. É esta regra que impede a reintrodução: sem
ela, o mecanismo existe e ninguém é obrigado a usá-lo.

A regra 3 nasce com a lista `COPIA_DECLARADA`, uma linha por cópia que fica,
com o motivo. **Ela só encolhe**, como o `OUT` do `check:scripts` e o `DEBT` do
`check:comentarios`: entrada que não acusa mais é erro, e a guarda manda apagar
a linha.

### O incidente, que é o cabeçalho dela

> Guarda de código puro copiado entre os dois pacotes.
>
> O `TimeField` foi publicado com cinco funções de valor idênticas caractere a
> caractere nos dois pacotes, e o custo disso não é o byte repetido: é que uma
> cópia pode ganhar conserto que a outra não ganha, e nada acusa. O
> `check:paridade` não pega, porque ele compara peças, e as duas peças estão
> lá; ele diria "traduz" enquanto os dois `stepTime` divergiam. Foi assim que o
> `DataList` nativo serviu texto sem acento por versões, com a versão web
> acentuada ao lado.
>
> Ao medir pela primeira vez, em 27/08/2026, eram **vinte** declarações
> idênticas, e não cinco. Quinze delas ninguém tinha nomeado, e uma atravessa
> peças diferentes: o `flatten` do `DataTable` é o mesmo do `DataList`, então
> quem for consertar a busca sem acento de uma não tem por que abrir a outra.
> O número não era conhecido porque nada o contava.

E vale registrar a armadilha de implementação, porque a primeira versão do
detector caiu nela: extrair o corpo procurando a primeira `{` depois do nome
casa a **desestruturação do parâmetro**, não o corpo. Com isso
`FileUploadItem` e `FormField` apareceram como cópias sendo apenas assinaturas
parecidas. A leitura por declaração de primeiro nível não tem esse furo, e é
por isso que ela também pega `const` de seta e constante solta.

### O que a guarda não faz

Ela não compara **semântica**. Duas funções que fazem a mesma coisa escritas de
jeitos diferentes passam, e passam de propósito: um detector de clone
aproximado teria falso positivo, e guarda com falso positivo é guarda que
alguém desliga. A varredura mais larga foi tentada e medida: comparar corridas
de linhas iguais acusa de dez a trinta pares de arquivo, quase todos JSDoc de
prop repetido de propósito entre os pacotes. Vinte declarações com zero falso
positivo é o recorte que se pode cobrar.

## A migração dos cinco ajudantes do `TimeField`

É o caso de teste real, e o desenho dela é escolhido para **não aparecer para
quem consome**.

1. Nasce `src/shared/time.ts` com `DAY`, `applyTimeMask`, `parseTime`,
   `formatTime`, `timeWindow` e `stepTime`, exatamente como estão.
2. `src/components/time-field.tsx` importa as cinco e **as re-exporta**. É o
   que mantém dois caminhos vivos: `src/index.ts` exporta `applyTimeMask`,
   `formatTime` e `parseTime` a partir dela, e `demo/novas.tsx` importa
   `stepTime` e `timeWindow` de `../src/components/time-field`. O `.d.ts`
   publicado sai idêntico.
3. `bun run gen:compartilhado` escreve `native/src/shared/time.ts`.
4. `native/src/time-field.tsx` importa de `./shared/time` e re-exporta, porque
   `native/src/index.ts` importa as três de `./time-field`.
5. `isOutsideWindow` **fica onde está**. Ela só existe no nativo, não é cópia,
   e compõe as cinco. Levá-la junto mandaria para o tarball de todo mundo uma
   função que o web não chama.

**A prova é a suíte não mudar.** `test/campo-de-hora.test.tsx` e
`native/test/hora.test.tsx` continuam intactos, importando dos mesmos lugares.
Se a migração tivesse mudado comportamento, eles cairiam.

E não nasce arquivo de teste novo, de propósito. Guarda nesta casa mora em
`scripts/check-*.ts` e se prova rodando no gate: das dezenove, só a de
contraste tem teste, porque ela faz conta que vale fixar. Some-se que
`check:testes` cobra o número exato que a home exibe, e mexer nele é edição em
`apps/docs/`, que é outra frente.

## O que precisa de decisão humana

Em ordem de quanto trava o próximo passo.

1. **O nome da pasta.** `src/shared/`, porque identificador e caminho são em
   inglês. `src/puro/` diria melhor o que é e brigaria com o `check:nomes`.
2. **A lista "Gerados. Não editar a mão" do `CLAUDE.md` precisa da linha
   nova.** Hoje ela cita `native/theme.css`, `native/tokens.ts`,
   `native/tokens.json`, `apps/docs/src/component-props.json` e
   `examples/native/generated.css`. `native/src/shared/**` entra na mesma
   frase, com `bun run gen:compartilhado`. Não foi editado aqui porque o
   arquivo é do dono.
3. **O cabeçalho de gerado dentro de `native/src/`.** A regra de comentário diz
   que em `src/` e `native/src/` fica só JSDoc de prop pública. A linha `/*
Gerado de ... Nao editar. */` é a exceção que a regra de arquivo gerado
   exige ("todos carregam cabeçalho dizendo isso"), e é a primeira vez que um
   gerado mora dentro de `native/src/`. Vale a decisão explícita.
4. **A ordem da fila.** Doze declarações puras esperando, e a maior é o
   `ColorPicker` com cinco. A proposta é que cada uma atravesse quando alguém
   abrir a peça por outro motivo, e não numa mutirão só.
5. **O `event-layout.ts`.** Ele é o motivo de tudo isto existir, e não migrou
   hoje porque mexer nele é mexer em `src/components/event-calendar.tsx`, que
   está fora desta frente. Quando migrar, a nota do `EventCalendar` em
   `scripts/paridade-nativo.ts` deixa de ser verdade: ela ainda diz que "não há
   mecanismo no repositório para compartilhar código puro entre os dois
   pacotes". Essa frase e a página que ela gera saem no mesmo commit.
6. **O terceiro pacote.** Está recusado hoje com quatro gatilhos escritos
   acima. Se algum deles já for verdade e este documento não soube, a decisão
   muda agora e não depois de o espelho ter dez arquivos.
