/**
 * Guarda da vitrine: peca do catalogo que ninguem olhou nos dois temas.
 *
 * O processo da casa termina com um passo que nenhuma maquina fazia: renderize
 * no `demo/` e olhe, nos dois temas e nas duas densidades. E o unico lugar onde
 * aparecem as coisas que teste nao ve - estado indeterminado, estado carregando,
 * borda tracejada que some no escuro, alvo de toque que encolhe no denso.
 *
 * Em 26/08/2026 sete pecas foram publicadas no npm sem que ninguem tivesse
 * olhado para nenhuma delas: `TimeField`, `TimePicker`, `FilterBar`,
 * `FilterChip`, `QueryBoundary`, `Popconfirm` e `VirtualList`. Passaram em 1072
 * testes. Os sete agentes que as escreveram pularam o passo, cada um por um
 * motivo razoavel, e nada acusou - porque o passo era prosa num agent, e prosa
 * nao falha.
 *
 * Ao medir, a conta era pior que as sete: 28 das 90 pecas do catalogo estavam
 * fora do `demo/`. A regra existia desde sempre e a taxa de cumprimento era de
 * dois tercos, o que e outro jeito de dizer que ela nao existia.
 *
 * Esta guarda nao pede retrato bonito nem cobra qualidade de vitrine - ela nao
 * consegue ver a tela. Ela cobra a DECLARACAO, como o `check:scripts` faz com
 * script orfao: ou a peca aparece em alguma pagina de `demo/*.tsx`, ou ha uma
 * linha em `SEM_VITRINE` dizendo POR QUE nao aparece. As duas respostas sao
 * validas; o silencio, nao.
 *
 * `SEM_VITRINE` **so encolhe**, como o `DEBT` do `check:comentarios` e a
 * `FILA_DECLARADA` da paridade: peca que passou a aparecer no demo e erro, e a
 * guarda manda apagar a linha. Lista de excecao que nao encolhe vira o lugar
 * onde a divida mora sem incomodar ninguem.
 *
 * A busca e por limite de palavra, e isso nao e detalhe de expressao regular:
 * `Card` esta dentro de `CardHeader` e `Button` esta dentro de `ButtonGroup`.
 * Sem o limite, o `ButtonGroup` - que de fato nao esta na vitrine - passaria
 * verde para sempre por causa do `Button` que aparece em oito lugares, e a
 * guarda estaria mentindo exatamente sobre a peca que ela existe para pegar.
 */
import { readdirSync } from "node:fs";

import { findParent } from "../apps/docs/src/parts";

const DOCS = ".design-sync/docs";
const DEMO = "demo";

/**
 * A mesma fonte do `check:pecas` e da `catalogPieces()` da paridade.
 *
 * `.design-sync/docs/` menos as partes, e o `findParent` de
 * `apps/docs/src/parts.ts` e quem decide o que e parte - o mesmo que a barra
 * lateral do site usa. A paridade carrega uma copia dessa regra por nao poder
 * importar do app; se as duas divergirem, o numero de pecas passa a depender de
 * qual guarda voce rodou, que e o comeco de toda contagem errada deste
 * repositorio.
 */
function catalogPieces() {
  const names = readdirSync(DOCS)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""))
    .sort();

  return names.filter((name) => !findParent(name, names));
}

/**
 * As pecas que hoje nao tem vitrine, e o motivo de cada uma.
 *
 * O motivo e para quem for decidir se ainda vale ficar de fora, entao ele diz o
 * que IMPEDE, e nao que esta faltando. Duas coisas moram nesta lista, e
 * distingui-las e o trabalho: peca que outra ja retrata, e peca cujo estado so
 * existe durante um gesto que retrato nenhum guarda.
 *
 * A terceira classe - divida mesmo, que era a maioria - foi paga em 27/08/2026:
 * vinte e cinco linhas sairam daqui de uma vez, entre pecas postas nas paginas
 * que ja existiam e as duas paginas novas, `demo/painel.tsx` e `demo/paleta.tsx`.
 * Se alguma voltar para ca, o motivo tem que dizer o que passou a impedir.
 */
const SEM_VITRINE: Record<string, string> = {
  ToastViewport:
    "Nao tem vitrine propria: o RivoProvider a monta, e nenhum aplicativo a escreve. O que se ve dela ja esta em demo/flutuantes.tsx, que dispara os avisos que caem dentro dela.",
  Autocomplete:
    "O painel e o mesmo do Combobox, que ja esta em demo/dados.tsx. O que ela tem de proprio - aceitar o que nao esta na lista - so aparece enquanto se digita.",
  Editable:
    "Gesto: o `editing` e estado interno, e `EditableProps` nao tem prop que o force - nem `editing`, nem `defaultEditing`, nem `open`. Parada ela e o paragrafo que ja esta na tela, e o campo que ela vira nao aparece. O caminho que sobra e o que o ContextMenu tomou em demo/flutuantes.tsx: a pagina dispara o gesto por script depois de montar. Quem for pagar esta divida faz isso, e nao inventa prop so para a vitrine.",
};

const pieces = catalogPieces();

const pages = readdirSync(DEMO)
  .filter((file) => file.endsWith(".tsx"))
  .sort();

const sources = await Promise.all(
  pages.map(async (page) => [page, await Bun.file(`${DEMO}/${page}`).text()] as const),
);

/** Onde a peca aparece, por nome inteiro: `Card` nao casa dentro de `CardHeader`. */
function pagesWith(piece: string) {
  const named = new RegExp(`\\b${piece}\\b`);
  return sources.filter(([, source]) => named.test(source)).map(([page]) => page);
}

const problems: string[] = [];
const onStage: string[] = [];
const declared: string[] = [];

for (const piece of pieces) {
  const found = pagesWith(piece);

  if (found.length > 0) {
    onStage.push(piece);

    if (SEM_VITRINE[piece]) {
      problems.push(
        `\`${piece}\` esta em SEM_VITRINE e JA aparece em ${found.join(", ")}.\n` +
          "    A divida foi paga: apague a linha dela da lista. Excecao que nao encolhe\n" +
          "    vira o lugar onde a peca sem vitrine se esconde.",
      );
    }
    continue;
  }

  if (SEM_VITRINE[piece]) {
    declared.push(piece);
    continue;
  }

  problems.push(
    `\`${piece}\` nao aparece em nenhuma pagina de ${DEMO}/*.tsx.\n` +
      "    Renderize a peca numa das paginas e olhe nos DOIS temas e nas DUAS densidades -\n" +
      "    e o unico passo do processo que nenhum teste faz por voce. Se ela nao deve ter\n" +
      "    vitrine, escreva o motivo em SEM_VITRINE, em scripts/check-demo.ts.",
  );
}

for (const piece of Object.keys(SEM_VITRINE)) {
  if (!pieces.includes(piece)) {
    problems.push(
      `\`${piece}\` esta em SEM_VITRINE e nao e peca do catalogo.\n` +
        `    Ou o nome mudou, ou a pagina em ${DOCS} sumiu. Apague ou corrija a linha:\n` +
        "    entrada morta faz a lista parecer maior do que a divida.",
    );
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problema(s) na vitrine:\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  console.error(
    "Sete pecas foram publicadas no npm sem que ninguem tivesse olhado para\n" +
      "nenhuma delas, e os 1072 testes ficaram verdes o tempo todo. Esta guarda e\n" +
      "o que sobrou desse dia: ou a peca esta na vitrine, ou o motivo esta escrito.",
  );
  process.exit(1);
}

console.log(
  `${onStage.length} de ${pieces.length} pecas na vitrine, e ${declared.length} declaradas fora, ` +
    `em ${pages.length} paginas de ${DEMO}/.`,
);
