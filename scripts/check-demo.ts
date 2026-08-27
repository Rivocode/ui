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
 * que IMPEDE, e nao que esta faltando. Tres coisas diferentes moram nesta
 * lista, e distingui-las e o trabalho: peca que outra ja retrata, peca cujo
 * estado so existe durante um gesto que retrato nenhum guarda, e divida mesmo.
 * Vinte e oito linhas iguais dizendo "falta fazer" seriam a mesma coisa que
 * nao ter lista.
 */
const SEM_VITRINE: Record<string, string> = {
  ToastViewport:
    "Nao tem vitrine propria: o RivoProvider a monta, e nenhum aplicativo a escreve. O que se ve dela ja esta em demo/flutuantes.tsx, que dispara os avisos que caem dentro dela.",
  Autocomplete:
    "O painel e o mesmo do Combobox, que ja esta em demo/dados.tsx. O que ela tem de proprio - aceitar o que nao esta na lista - so aparece enquanto se digita.",
  ContextMenu:
    "Gesto: abre no botao direito e nao tem prop de aberto para posar. Parada, ela e o Menu que demo/flutuantes.tsx ja retrata.",
  Editable:
    "Gesto: o `editing` e estado interno, sem prop que o force. Em retrato ela e o paragrafo que ja esta na tela, e o campo que ela vira nao aparece.",
  Command:
    "Divida, e das faceis: ela tem `open` controlado, entao posa aberta. Falta a pagina que a abra.",
  Kbd: "Divida. Nasce colada ao Command, no rodape da paleta e no atalho do menu, e os dois estao fora pelo mesmo esquecimento.",
  Stat: "Divida. O painel de numeros e o retrato mais obvio que falta na vitrine, e e onde a densidade compacta aperta primeiro.",
  Sparkline:
    "Divida. Ela mora dentro de um numero de painel, e o Stat, que e onde ela cabe, tambem esta fora - as duas entram na mesma pagina ou em nenhuma.",
  ChartDonut:
    "Divida. demo/graficos.tsx monta a pizza com a Recharts na mao e nunca chamou o embrulho, entao o que a vitrine confere e o grafico cru, e nao a peca.",
  ChartRadial: "Divida. Mesma pagina e mesmo esquecimento: nenhum arco de medida unica ali.",
  Tracker:
    "Divida. Noventa quadradinhos lado a lado sao teste de contraste de verdade nos dois temas, e e justamente esse retrato que nao existe.",
  Timeline:
    "Divida. Entrou no catalogo em 26/08/2026, no mesmo lote que criou este buraco.",
  Code: "Divida. Peca de uma linha dentro de um paragrafo; por pequena, nunca ganhou lugar em pagina nenhuma.",
  RelativeTime:
    "Divida com condicao: o texto muda com o relogio, entao ela so entra com `now` fixo. Sem isso o retrato do `bun run visual` muda sozinho e a assinatura comitada vira ruido.",
  DescriptionList:
    "Divida. E a folha de detalhes de toda listagem, e nao ha um `dl` em demo/ nenhum - nem em demo/listagem.tsx, que e onde ela deveria estar.",
  PageHeader:
    "Divida. E o topo que toda rota reescreve, e nenhuma pagina da vitrine tem topo: elas comecam direto no primeiro Card.",
  ButtonGroup:
    "Divida. demo/controles.tsx nasceu so com botao solto, e o grupo e onde a densidade mais aperta, por causa da borda compartilhada entre os alvos.",
  NavigationMenu:
    "Divida. demo/navegacao.tsx retrata Breadcrumb e Tabs e para ali; o painel por secao dela nao aparece em lugar nenhum.",
  SearchInput:
    "Divida, e ela mesma prova o custo: demo/dados.tsx monta a lupa na mao, com MaskedInput e o icone Search posicionado por cima, que e exatamente o arranjo que esta peca existe para substituir.",
  PasswordInput:
    "Divida. demo/formulario.tsx tem campo, rotulo, descricao e erro, e nao tem senha - entao o olho que revela nunca foi olhado nos dois temas.",
  TagsInput:
    "Divida. Parada ela e uma linha de Badge dentro de um campo, e retrata bem; e o campo que cresce conforme se escreve, e crescer e o que a densidade muda.",
  ColorPicker:
    "Divida. A grade de amostras e estatica e retrata bem; o que exige gesto e so o seletor fino, que pode entrar depois.",
  Clipboard:
    "Divida. O botao parado e retratavel, e o estado copiado dura dois segundos - vale posar os dois lado a lado.",
  FileUpload:
    "Divida, e das que mais doem: a area parada tem borda tracejada, que e onde o contraste escorrega no tema escuro, e ninguem olhou.",
  Indicator:
    "Divida. E a contagem por cima de outra coisa, e falta na vitrine a coisa de baixo - o sino, a aba com pendencia, o avatar com aviso.",
  Tree: "Divida. O TreeSelect esta em demo/dados.tsx e a arvore solta nao, entao o que a vitrine confere e o campo, e nao a arvore dentro dele.",
  Splitter:
    "Divida de layout: ela precisa de altura definida, e as paginas da vitrine crescem para baixo sem limite. E trabalho de montar a pagina, e nao impedimento da peca.",
  AspectRatio:
    "Divida que depende de outra coisa: ela e moldura, e so aparece com media dentro. Nao ha uma imagem em demo/ nenhum, entao ela entra junto com o primeiro retrato que tiver uma.",
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
