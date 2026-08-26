# Como se programa aqui

As regras da casa, para humano e para agente. Sem acento, como o resto da
documentacao interna; o texto que sai para o cliente e acentuado.

Isto e a REGRA. O estado do repositorio - o que existe, o que falta, os numeros
- mora em `docs/ESTADO.md`. O contrato para quem CONSOME a biblioteca mora em
`.design-sync/conventions.md` e em `.claude/skills/rivocode-ui/SKILL.md`.

## Comentario

**O teste:** um comentario fica quando explica uma decisao ou uma armadilha que
o codigo nao mostra; sai quando descreve o que a linha ja diz.

O que "o codigo nao mostra" costuma ser: por que a escolha obvia esta errada,
que erro criptico ela produz, quanto ja se pagou por descobrir isso, e o que
acontece se alguem desfizer. Escreva o custo, e nao a intencao.

Fica - `.github/workflows/release.yml:23`, sobre a falta de `id-token`: diz que
o registro recusa `--provenance` de repositorio privado, cita o 422 e a
mensagem exata, e avisa que devolver a flag so recria a falha no ultimo passo.
Sem isso, o proximo a "consertar" o workflow refaz a falha inteira. O mesmo
padrao em `examples/native/global.css:13`, `native/scripts/build-css.mjs:71` e
`src/components/data-table.tsx:380`.

Sai - `apps/docs/src/components/markdown.tsx:13,22,27,32,39`: `// Headings`,
`// Prose`, `// Lists`, `// Code`, `// Table` em cima de `[&_h1]`, `[&_p]`,
`[&_ul]`, `[&_code]`, `[&_table]`. O seletor ja e o rotulo. Note que no MESMO
arquivo, na linha 17, ha um comentario que fica: ele explica por que o `h4`
desce de nivel sem encolher junto.

Mais duas formas de comentario que sai:

- **Obsoleto.** Comentario que cita nome que a renomeacao levou embora e pior
  que nenhum: manda procurar o que nao ha. O `chart-tooltip.tsx` mandou ver
  `chaveDaSerie` na legenda por meses depois de a funcao virar `seriesKey`, e
  nada acusa - grep por nome citado em comentario nao e coisa que se faca de
  propria vontade. Ao renomear, procure o nome antigo em comentario tambem.
- **Rotulo decorativo dentro de dado.** `scripts/paridade-nativo.ts:103, 266,
  298, 438` separam a tabela com `// ---- traduzem`, `// ---- na fila`. Cada
  entrada ja carrega `state: "traduz"` / `"fila"`.

Cuidado com o falso positivo desta regra: `src/lib/mask.ts:133` PARECE os dois
casos acima - cita `patternFor` e `applyXMask`, que nao sao funcoes, e tem um
`@deprecated` logo abaixo dizendo o mesmo em uma linha. Mas os dois nomes sao o
PADRAO, e nao referencias, e o paragrafo conta a armadilha que o `@deprecated`
nao cabe: as tres funcoes de mascara tinham a mesma assinatura, entao quem
chamasse esperando texto formatado recebia o molde escrito no campo, sem o
TypeScript poder acusar. Comentario que explica o custo fica, mesmo quando a
forma se parece com a do que sai.

Regras de forma:

- Comentario e JSDoc em portugues, **sem acento**. O texto que vai para a tela
  ou para a doc publicada leva acento (`test/acentos.test.ts` cobra).
- Divisor `/* ---- */` no topo de arquivo e o cabecalho da casa - so vale se
  carregar prosa embaixo, como em `src/lib/screen.ts` ou `apps/docs/src/parts.ts`.
- JSDoc de peca: a primeira frase e a mesma lede da pagina em
  `.design-sync/docs/<Peca>.md`. O detalhe mora la, nao duplicado aqui.
- JSDoc de prop diz o que o TIPO nao diz: unidade, o que muda na tela, com o
  que se combina. Nunca a assinatura.
- `/** */` acima de cada `export function` em `.design-sync/previews/*` NAO e
  comentario, e titulo da historia: `apps/docs/src/example-source.ts` le esse
  bloco. Nao apague.

A regra passou a ter guarda: `bun run check:comentarios` acusa comentario em
ingles por classe fechada - `the`, `this`, `which`, `because` -, e nao por
vocabulario, que e ingles de propria vontade em metade do que se escreve aqui.
Duas dessas palavras no mesmo comentario e o corte.

Divida pendente: `apps/docs/src/pages/home.tsx` e `apps/docs/vite.config.ts`,
os dois ultimos comentados em ingles. Eles estao escritos no `DEBT` da guarda,
que so encolhe.

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
tokens nativos, paridade, contagem de testes, e por fim `bun test`.

Cada `scripts/check-*.ts` abre com o JSDoc do incidente que o fez existir - leia
o de cima antes de mexer no que ele guarda. As guardas que mais surpreendem:

- `check:doc` - peca sem pagina e pagina sem peca, nos dois sentidos.
- `check:contrato` - o que `src/chart/index.ts` e `src/form/index.ts` exportam
  tem que estar citado em `conventions.md` E na skill.
- `check:skill` - prop citada em exemplo da skill tem que existir na peca.
- `check:paridade` - `scripts/paridade-nativo.ts` e a fonte unica da tabela de
  paridade, e ela escreve tambem a secao "No React Native" de cada pagina.
- `check:testes` - a contagem que a home exibe.

`bun run build` depois, porque ha quebra que so aparece ao empacotar.

## Peca nova

Sao oito artefatos e a peca nao existe sem os oito. Use o agent `peca-nova`
(`.claude/agents/peca-nova.md`), que tem a ordem e o motivo de cada etapa.
Resumo: wrapper sem cor literal e sem `z-index` numerico, `classNames` por
parte, preview, pagina com a secao "quando nao usar" nomeando a peca vizinha,
teste, `gen:props`, pares de contraste novos.

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
