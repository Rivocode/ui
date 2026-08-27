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
dono, e o corte removeu 5086 linhas. Se voce esta lendo um arquivo com
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

`bun run check` roda tudo em sequencia e para no primeiro que falhar:
instalacao, lint, tipos, previews, props, nomes, comentarios, cor literal,
contraste, temas, contrato, doc, grupos de classe, fronteira do chart, skill,
tokens nativos, paridade, contagem de pecas, script fora do gate, contagem de
testes, e por fim `bun test`.

Cada `scripts/check-*.ts` abre com o JSDoc do incidente que o fez existir - leia
o de cima antes de mexer no que ele guarda. As guardas que mais surpreendem:

- `check:doc` - peca sem pagina e pagina sem peca, nos dois sentidos.
- `check:contrato` - o que `src/chart/index.ts` e `src/form/index.ts` exportam
  tem que estar citado em `conventions.md` E na skill.
- `check:skill` - prop citada em exemplo da skill tem que existir na peca.
- `check:paridade` - `scripts/paridade-nativo.ts` e a fonte unica da tabela de
  paridade, e ela escreve tambem a secao "No React Native" de cada pagina.
- `check:testes` - a contagem que a home exibe.
- `check:scripts` - todo `scripts/*.ts` tem que ser alcancavel a partir do
  `check`, ou ter linha em `OUT` dizendo o que o impede. Nasceu porque o
  `regressao-visual.ts` viveu fora do gate e ficou vermelho em silencio: tres
  assinaturas de retrato divergiam do comitado e ninguem sabia, porque ninguem
  rodava. A lista `OUT` so encolhe.

`bun run build` depois, porque ha quebra que so aparece ao empacotar.

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

**O repositorio e privado**, entao o npm recusa `--provenance` com 422 e os
dois workflows publicam sem assinatura. Torna-lo publico e o que devolve a
procedencia. Esta escrito nos dois workflows, no lugar onde alguem tentaria
"consertar".
