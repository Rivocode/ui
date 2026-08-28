# Como se programa aqui

As regras da casa, para humano e para agente. Sem acento, como o resto da
documentacao interna; o texto que sai para o cliente e acentuado.

Isto e a REGRA. O estado do repositorio - o que existe, o que falta, os numeros
- mora em `docs/ESTADO.md`. O contrato para quem CONSOME a biblioteca mora em
`.design-sync/conventions.md` e em `.claude/skills/rivocode-ui/SKILL.md`.

## Comentario

**A regra:** fica SOMENTE o JSDoc preso a uma prop publica. Todo o resto sai.

Prop publica e membro de um `type` ou `interface` de props exportada - o bloco
cujo proximo token e um nome seguido de `:`. Esse texto nao e comentario, e
DADO: `bun run gen:props` o extrai para o campo `note` de
`apps/docs/src/component-props.json`, que e a tabela de props publicada em
`ds.rivocode.com.br`. Apaga-lo apaga documentacao do site, e nenhum teste
acusa - a guarda e `bun run check:props`, que fica vermelho se o JSON divergir.

```ts
export type ButtonProps = {
  /** O tamanho do alvo de toque. Combina com a densidade do provider. */
  size?: "sm" | "md";
};
```

Sai todo o resto, sem excecao: JSDoc acima de `export function`, `export
const`, `type` e `interface`; cabecalho `/* ---- */` de topo de arquivo; toda
linha `//`; todo `{/* */}` dentro de JSX; todo `/* */` nos `.css`. **Inclusive
comentario que conta incidente, armadilha ou custo.** Essa parte doi e e a
decisao: o porque de uma escolha mora no `git log`, nos dois CHANGELOGs e em
`docs/ESTADO.md`, e nao espalhado pelo codigo.

Preserve o que NAO e prosa: `@deprecated`, `@internal`, `eslint-disable`,
`oxlint-disable`, `@ts-expect-error`, `@ts-ignore`. Sao diretivas, e mudam
compilacao ou lint. Se uma delas estiver dentro de um bloco que sai, mantenha
so a tag num bloco minimo.

Duas excecoes, e as duas sao funcionais:

- **`.design-sync/previews/*`**. O `/** */` acima de cada `export function` la
  NAO e comentario, e o TITULO da historia: `apps/docs/src/example-source.ts`
  le esse bloco para montar o site. Apagar quebra a pagina. Nao se toca.
- **`scripts/check-*.ts`**. Cada um abre com o JSDoc do incidente que o fez
  existir. Sem ele, a proxima pessoa remove a guarda por parecer paranoia, e o
  incidente volta. A pasta segue a regra antiga: comentario fica quando explica
  uma decisao ou uma armadilha que o codigo nao mostra.
- **`apps/docs/`**. E aplicacao, e nao biblioteca: nao exporta prop nenhuma,
  entao a regra de cima nao teria o que preservar - aplica-la ali e remocao
  total, sem o criterio que a justifica. Segue a regra antiga.

Regras de forma que continuam valendo:

- JSDoc em portugues, **sem acento**. O texto que vai para a tela ou para a doc
  publicada leva acento (`test/acentos.test.ts` cobra, nos DOIS pacotes).
- JSDoc de prop diz o que o TIPO nao diz: unidade, o que muda na tela, com o
  que se combina. Nunca a assinatura.
- `bun run check:comentarios` continua guardando o IDIOMA, e nao a presenca:
  acusa comentario em ingles por classe fechada (`the`, `this`, `which`,
  `because`), duas no mesmo comentario e o corte. A lista `DEBT` dele esta
  vazia, e o acordo e que ela so encolhe.

Historico: ate 26/08/2026 a regra era "fica quando explica uma decisao ou uma
armadilha que o codigo nao mostra". Ela foi trocada pela de cima por decisao do
dono, e o corte removeu milhares de linhas. Se voce esta lendo um arquivo com
comentario de prosa fora das duas excecoes, ele e anterior a essa data ou
escapou - e para sair, nao para ser imitado.

## Idioma do codigo

Identificador em ingles, sempre - inclusive nome de parametro de prop publica,
que vaza para o `.d.ts` e para a tabela de props do site. `bun run check:nomes`
falha por lista de palavras conhecidas e por sufixo (`-acao`, `-mento`,
`-dade`, `-agem`, `-encia`, `-ivel`).

## Onde mora o que

| Pasta | O que e |
|---|---|
| `src/` | o pacote web `@rivocode/ui` |
| `src/chart/`, `src/form/` | subcaminhos com peer OPCIONAL; a Recharts nao pode vazar para `src/index.ts` (`check:chart`) |
| `src/tokens/` | o UNICO lugar onde pode existir cor literal (`check:colors`) |
| `native/src/` | o pacote `@rivocode/ui-native`, publicado como FONTE |
| `.design-sync/docs/` | uma pagina por peca e por parte |
| `.design-sync/previews/` | o exemplo executavel de cada peca |
| `apps/docs/` | o site `ds.rivocode.com.br` |
| `test/`, `native/test/` | a suite; nome de arquivo em portugues |
| `demo/` | onde se olha a peca nos dois temas e nas duas densidades |

**Gerados. Nao editar a mao:** `native/theme.css`, `native/tokens.ts`,
`native/tokens.json` (`bun run gen:native`), `apps/docs/src/component-props.json`
(`bun run gen:props`), `examples/native/generated.css` (`bun run build:css` do
app). Todos carregam cabecalho dizendo isso, e o `check` falha se o comitado
divergir da fonte.

**Nao rode `bun install` dentro de `native/`.** Ela nao e workspace: o comando
cria um segundo React e derruba dezenas de testes com "Invalid hook call". A CI
nunca ve, porque so instala na raiz. `check:instalacao` e a guarda.

## O gate

`bun run check` roda TRINTA E UM passos em sequencia e para no primeiro que
falhar: instalacao, lint, tipos, previews, props, nomes, comentarios, cor
literal, contraste do web, contraste do mapa nativo, espelho do contraste,
temas, contrato, doc, cobertura do README, classe sem regra, grupos de classe,
fronteira do chart, fronteira do CLI, skill, lista da skill, tokens nativos,
gerador de tema nativo, codigo compartilhado, paridade, contagem de pecas,
vitrine, retratos declarados, script fora do gate, piso de varredura, contagem
de testes, e por fim `bun test`.

O numero acima nao e enfeite: quando ele nao bate com o `scripts.check` do
`package.json`, o gate cresceu e esta pagina nao acompanhou.

Cada `scripts/check-*.ts` abre com o JSDoc do incidente que o fez existir - leia
o de cima antes de mexer no que ele guarda. As guardas que mais surpreendem:

- `check:doc` - peca sem pagina e pagina sem peca, nos dois sentidos.
- `check:readme` - toda peca do catalogo tem que ser citada no `README.md`, ou
  ter linha em `OUT_OF_README` com o motivo, e a frase que abre o catalogo tem
  que continuar dizendo que a tabela NAO e o indice. Nasceu porque o digito
  estava certo e a lista embaixo dele nao: o `check:pecas` guardava o "90
  pecas.", e das 90 o arquivo inteiro citava 49. A lista so encolhe.
- `check:contrato` - o que `src/chart/index.ts` e `src/form/index.ts` exportam
  tem que estar citado em `conventions.md` E na skill.
- `check:skill` - prop citada em exemplo da skill tem que existir na peca.
- `check:lista-skill` - todo arquivo de `.claude/skills/rivocode-ui/reference/`
  tem que estar no indice do `SKILL.md` E no laco `curl` de
  `apps/docs/src/content/skill.md`. Nasceu porque o laco listava sete nomes e a
  pasta tinha oito: quem instalava pelo site ficava sem a referencia de React
  Native, e o `curl` saia zerado. Zero excecao, e sem lista de excecao.
- `check:paridade` - `scripts/paridade-nativo.ts` e a fonte unica da tabela de
  paridade, e ela escreve tambem a secao "No React Native" de cada pagina.
- `check:testes` - a contagem que a home exibe.
- `check:demo` - toda peca tem que aparecer em `demo/*.tsx`, ou ter linha em
  `SEM_VITRINE` com o motivo. Nasceu porque sete pecas foram publicadas no npm
  sem ninguem ter olhado para nenhuma delas: passaram em 1072 testes, e o passo
  do processo que manda olhar nos dois temas e nas duas densidades foi pulado
  sem nada acusar. Medindo depois, 28 das 90 estavam fora da vitrine. A lista
  so encolhe.
- `check:scripts` - todo `scripts/*.ts` tem que ser alcancavel a partir do
  `check`, ou ter linha em `OUT` dizendo o que o impede. Nasceu porque o
  `regressao-visual.ts` viveu fora do gate e ficou vermelho em silencio: tres
  assinaturas de retrato divergiam do comitado e ninguem sabia, porque ninguem
  rodava. A lista `OUT` so encolhe.
- `check:piso` - varredura que pode devolver lista vazia e deixar a
  verificacao em cima dela verde. Em `scripts/`, `new Glob(` so em
  `scripts/varredura.ts`: quem varre chama `scanAtLeast(padrao, piso)`, que
  cobra o piso na MESMA chamada - nao da para pedir os arquivos sem dizer
  quantos se espera. Em `test/` e `native/test/`, todo `new Glob(` ou
  `readdirSync(` dentro de um bloco `test(...)` precisa de um piso no mesmo
  bloco. Nasceu porque quebrar cada padrao de proposito, num dia so, deixou
  onze guardas de `scripts/` verdes lendo ZERO arquivo - entre elas o
  `check:contrast`, que anunciou "Contraste ok em todos os temas" sem ter
  aberto um tema - e seis blocos de teste passando com a lista vazia. Uma area
  estava escrita e nunca fora lida: o `check:comentarios` declarava
  `.design-sync/previews/*.tsx` e o Glob do bun pula pasta oculta sem `dot`.
  A lista `OUT` so encolhe.
- `check:classes` - classe usada em `src/**` ou `native/src/**` que o Tailwind
  daquele pacote nao sabe compilar. Nasceu porque o polegar do `Slider` nativo
  pintava `shadow-1` e `shadow` nao existe no CSS nativo: a classe nunca gerou
  um byte, o `tsc` passava, o build passava, e o polegar ficou sem sombra desde
  que nasceu. Ela pergunta ao proprio compilador, e nao a uma lista - entao
  variante, valor arbitrario e modificador de opacidade passam pelo caminho do
  build. Sem lista de excecao, e o acordo e que continue sem.
- `check:cli` - `src/lib/contrast.ts`, `src/lib/theme-check.ts` e
  `src/tokens/theme-roles.ts` sao ferramenta de mesa: eles viajam em
  `dist/cli.js` e **nao** podem virar alcancaveis de `src/index.ts`, senao a
  conta de contraste entra no bundle de quem so usa as pecas. Ela le o GRAFO de
  imports a partir das tres entradas e imprime a cadeia, porque proibir a pasta
  deixa o caminho indireto aberto. Confere tambem o sentido inverso, para nao
  virar decoracao, e que a frase-marca de cada arquivo ainda existe na fonte -
  essa ultima assercao faltava, e a guarda ficou verde por vacuidade quando um
  rename levou a frase embora.
- `check:native:contrast` - `native/scripts/contrast.mjs` e espelho GERADO de
  `src/lib/contrast.ts`, porque o pacote nativo publica FONTE e nao alcanca o
  `src/` do web. Ela confere o texto E que o espelho MEDE: importa os dois e
  compara linha por linha no tema da casa. Texto pega o arquivo editado a mao;
  a medida pega o arquivo que virou inerte. A comparacao ignora espaco em
  branco, porque os workflows usam `bun-version: latest` e formatacao nova do
  transpilador deixaria a CI vermelha sem ninguem tocar no repo.
- `check:tema:nativo` - o `rivocode-ui-native-theme` deriva 37 papeis de 8
  sementes, e a guarda fica vermelha **no commit que adiciona um papel novo**,
  nos dois sentidos. E para a pergunta "deriva de que?" custar cinco minutos em
  vez de uma versao.
- `check:retratos` - secao declarada em `SECTIONS` tem que ter marcador na
  vitrine e assinatura comitada, e assinatura orfa tem que sair. Roda em
  milissegundos e sem navegador, porque o retrato em si vive fora do gate.

`bun run build` depois, porque ha quebra que so aparece ao empacotar.

## Assercao que passa sem medir

Guarda verde nao e guarda que mediu: e guarda que nao reclamou. Em 27/08/2026
foram encontradas quatro verificacoes cujo sucesso nao dependia do que elas
diziam guardar, e a varredura da arvore inteira achou mais dezenove da mesma
familia. Duas regras sairam disso, e uma delas nao tem guarda.

**Varredura declara quanto espera achar.** Tem guarda: `check:piso`, descrita
acima. Em `scripts/`, use `scanAtLeast` de `scripts/varredura.ts`; em teste,
`expect(arquivos.length).toBeGreaterThan(n)` antes do laco. O piso e folgado, e
nao a contagem de hoje.

**Classe se compara por TOKEN, e nao por pedaco de string.** Nao tem guarda, e
a decisao foi medida: `bg-accent` e prefixo de `bg-accent-text`, e
`expect(className).toContain("bg-accent")` passa com os dois - com o defeito E
com o conserto. Foram dezesseis assercoes assim, provadas uma a uma trocando o
token na peca e vendo o teste continuar verde: o Button primario pintando
`bg-accent-text`, o Card nascendo `raised`, o Alert virando `flex-col-reverse`,
o campo nativo em foco vestindo `border-accent-text`. A forma que mede e
`expect(className.split(" ")).toContain("bg-accent")`, mais um
`not.toContain` do valor errado quando ele existe.

Por que sem guarda: o detector de prefixo levantou 50 candidatos e 16 eram
defeito. Os outros 34 eram `toContain` de trecho de MENSAGEM - "altura",
"isEmpty", "março" - onde prefixo nao quer dizer nada. Guarda que erra em dois
tercos das vezes e desligada na segunda semana, e ai o um terco que ela
acertava para de ser visto. Fica a regra escrita, e a proxima varredura mede de
novo.

Quando desconfiar de uma assercao, **quebre de proposito o que ela deveria
pegar**. Suspeito que morde nao e defeito. As formas que mais enganaram aqui:
literal procurado num artefato DERIVADO sem ninguem cobrar o literal na fonte
(`check:cli`), dois artefatos gerados da MESMA fonte comparados entre si
(`check:paridade`) e laco de assercao que passa com zero voltas.

## Peca nova

Sao NOVE artefatos e a peca nao existe sem os nove. Use o agent `peca-nova`
(`.claude/agents/peca-nova.md`), que tem a ordem e o motivo de cada etapa.
Resumo: wrapper sem cor literal e sem `z-index` numerico, `classNames` por
parte, preview, pagina com a secao "quando nao usar" nomeando a peca vizinha,
teste, `gen:props`, pares de contraste novos.

**O nono artefato e o lado nativo, e ele nao e opcional.** Peca web nova nasce
nos dois pacotes no mesmo dia. Nao e regra de simetria: e o que impede a fila
do nativo de existir. Ela chegou a zero em 26/08/2026 e voltou a encher no
mesmo dia, quando sete pecas entraram no web de uma vez - cada uma parecendo
atraso temporario, e temporario e como uma fila de vinte comeca.

Tres respostas sao validas, e todas tem que estar ESCRITAS em
`scripts/paridade-nativo.ts` na hora:

- **`traduz` / `vira`** - a peca nasceu nos dois lados. E o caso padrao.
- **`nao`** - idioma de mesa que nao tem sentido no toque, ou coisa que a
  plataforma ja da de fabrica. Decisao, e nao atraso; o motivo vai na linha.
- **`fila`** - so quando a peca depende de DECISAO DE GESTO que ainda nao foi
  tomada, e nunca por falta de tempo. Ela exige entrada em `FILA_DECLARADA`
  com o motivo, e `bun run check:paridade` recusa fila sem declaracao.

A lista `FILA_DECLARADA` **so encolhe**, como o `DEBT` das outras guardas:
entrada que nao acusa mais e erro, e a guarda manda apagar a linha.

## Commit e release

Mensagem: `tipo: frase em minuscula, sem acento, em prosa, dizendo o efeito`.
O sujeito e o codigo, nao voce - "o applyMask decide o molde do telefone",
"as guardas passam a pegar o que elas prometiam pegar". Tipos em uso: `feat`,
`fix`, `refactor`, `docs`, `ci`, `chore`.

Duas tags, dois workflows, e o prefixo e o que separa:

- `v*` publica `@rivocode/ui` (versao em `package.json`).
- `native-v*` publica `@rivocode/ui-native` (versao em `native/package.json`).

Os pacotes andam em velocidades diferentes de proposito. A tag tem que bater
com a versao do `package.json` correspondente, e o workflow confere isso -
junto com o segredo e com a existencia da versao no registro - ANTES de gastar
o `check` inteiro.

### O que cada empurrao publica

**Push na `main` publica o SITE, sozinho e sem tag.** E a coisa mais facil de
esquecer aqui, porque nada no comando avisa: `git push origin main` dispara o
`docs.yml` e `ds.rivocode.com.br` muda. Nenhum PACOTE sai por push - npm so
sai por tag. Entao merge de trabalho pela metade nao quebra instalacao de
ninguem, mas troca o que esta no ar para quem le a doc.

| Gatilho | Workflow | Publica |
|---|---|---|
| push na `main` | `ci.yml` + `docs.yml` | o site |
| tag `v*` | `release.yml` | `@rivocode/ui` no npm |
| tag `native-v*` | `release-native.yml` | `@rivocode/ui-native` no npm |

### A ordem, e por que ela e essa

1. **Feche o CHANGELOG antes da tag.** E ele que sai junto com a versao;
   incompleto ali e surpresa na tela de quem migra.
2. **Bump da versao no `package.json` certo**, e commit.
3. **Merge na `main`** - o site sobe com a doc da versao nova.
4. **Ensaio, no nativo:** `gh workflow run release-native --field ensaio=true`
   roda o caminho inteiro sem gastar versao. Nao pule: a primeira publicacao
   nativa de verdade falhou com `ENEEDAUTH`, alguem publicou a mao, e as tres
   tentativas seguintes tomaram `403` por tentar republicar a MESMA versao. O
   ensaio e o unico jeito de saber se o segredo esta bom sem queimar a tag.
5. **A tag**, e so entao.

**Publicacao nao se desfaz, e o npm nao deixa sobrescrever.** Versao publicada
com defeito nao se conserta republicando: conserta-se com versao nova. Por isso
o passo 4 existe, e por isso a tag e sempre acao de uma pessoa - nenhum agente
cria tag por conta propria.

**O repositorio esta publico**, e os dois workflows publicam com
`--provenance` e `id-token: write`. Os dois andam JUNTOS: um sem o outro nao
publica, e o `--dry-run` do npm nao exercita nenhum dos dois - ha um
`if (!dryRun)` antes da geracao da assinatura. Por isso cada workflow tem um
passo que falha cedo se o token OIDC nao estiver la. Esta escrito nos dois, no
lugar onde alguem tentaria "consertar".

Ate `v0.8.0` e `native-v0.3.1` o repositorio era privado e o npm recusava a
assinatura com 422: essas versoes ficaram sem procedencia e assim continuam -
publicacao no npm nao se desfaz. Da `v0.9.0` e da `native-v0.4.0` em diante o
tarball sai assinado, e o endpoint de attestations do registro responde.
