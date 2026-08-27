/**
 * Guarda da promessa do README: peca que o catalogo tem e o README nao cita.
 *
 * O `check:pecas` ja confere o DIGITO - o README abre o catalogo dizendo "90
 * pecas." e falha se o numero envelhecer. O digito estava certo e a lista
 * abaixo dele nao: das 90 pecas, 49 apareciam em algum lugar do arquivo e 41
 * nao apareciam em lugar nenhum. Um numero verdadeiro em cima de uma lista que
 * cobre pouco mais da metade e pior que um numero errado, porque nada acusa e
 * o leitor confia nos dois.
 *
 * Esta e a primeira guarda de uma familia nova aqui. As outras conferem
 * numero, caminho, cor, contraste, export; nenhuma conferia se uma lista
 * escrita a mao cobre o que ela promete cobrir.
 *
 * ## A decisao, porque ela nao e obvia
 *
 * A tabela do README nao vai listar as 90, e isso e escolha, e nao atraso.
 * O README e a pagina que o npm mostra: o trabalho dele e instalar alguem e
 * dizer a diferenca entre as pecas que se parecem - `Switch` contra
 * `Checkbox`, `Progress` contra `Meter`, `Accordion` contra `Collapsible`.
 * Noventa linhas afogam exatamente essa parte. O indice de verdade e gerado,
 * mora em `/llms.txt` e nunca envelhece, e duplica-lo a mao seria criar o
 * segundo catalogo escrito a mao deste repositorio - o primeiro anunciou 55
 * pecas quando ja eram 83.
 *
 * Entao a guarda cobra duas coisas diferentes, e as duas vem da mesma decisao:
 *
 *   1. **A frase.** O paragrafo que abre o catalogo tem que dizer que a tabela
 *      NAO e o indice, e apontar onde o indice esta. Enquanto a frase mentir,
 *      a lista de baixo nao tem como estar certa.
 *   2. **A cobertura.** Toda peca do catalogo esta citada no README, ou tem
 *      linha em `OUT_OF_README` dizendo POR QUE nao esta. As duas respostas
 *      valem; o silencio, nao. E o mesmo acordo do `check:demo` e do
 *      `check:scripts`: a guarda nao consegue julgar se a peca merece linha,
 *      mas consegue exigir que alguem tenha julgado.
 *
 * `OUT_OF_README` **so encolhe**, como o `SEM_VITRINE` da vitrine e o `OUT`
 * dos scripts: peca que passou a ser citada e erro, e a guarda manda apagar a
 * linha. Lista de excecao que nao encolhe vira o lugar onde a divida mora sem
 * incomodar ninguem.
 *
 * A busca e por limite de palavra, pelo mesmo motivo do `check:demo`: `Card`
 * esta dentro de `CardHeader` e `Button` esta dentro de `ButtonGroup`. Sem o
 * limite, o `ButtonGroup` - que de fato nao esta citado - passaria verde para
 * sempre por causa das oito aparicoes de `Button`.
 *
 * Citada quer dizer em qualquer lugar do arquivo, e nao so na tabela. O
 * `RivoProvider` e o `MaskedInput` tem secao propria e nao tem linha de tabela,
 * e cobrar a tabela obrigaria a guarda a entender o desenho do README - que
 * muda - em vez do que ela sabe conferir: se o nome aparece para quem le.
 */
import { readdirSync } from "node:fs";

import { findParent } from "../apps/docs/src/parts";

const DOCS = ".design-sync/docs";
const README = "README.md";

/**
 * O que a frase de abertura do catalogo tem que dizer.
 *
 * Sao dois pedacos porque sao duas promessas: uma diz o que a tabela NAO e, a
 * outra diz onde esta o que ela nao e. Faltando qualquer uma, o leitor sai
 * achando que leu o catalogo inteiro.
 */
const HONEST = [
  { text: "não é o índice", why: "a tabela precisa dizer que nao e o catalogo inteiro" },
  {
    text: "https://ds.rivocode.com.br/llms.txt",
    why: "e para onde vai quem quer a lista completa, e ela e gerada",
  },
];

/**
 * A mesma fonte do `check:pecas` e do `check:demo`.
 *
 * `.design-sync/docs/` menos as partes, e o `findParent` de
 * `apps/docs/src/parts.ts` e quem decide o que e parte - o mesmo que a barra
 * lateral do site usa. Tres guardas contam peca, e contar diferente e o comeco
 * de toda contagem errada deste repositorio.
 */
function catalogPieces() {
  const names = readdirSync(DOCS)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""))
    .sort();

  return names.filter((name) => !findParent(name, names));
}

/**
 * As pecas que o README nao cita, e o motivo de cada uma.
 *
 * O motivo e para quem for decidir se ainda vale ficar de fora, entao ele diz o
 * que IMPEDE, e nao que esta faltando. Quatro coisas diferentes moram nesta
 * lista, e distingui-las e o trabalho inteiro: peca que a linha de uma irma ja
 * cobre, peca de grafico que a secao de graficos trata por contrato e nao por
 * repertorio, peca de nicho que ninguem procura numa pagina de instalacao, e
 * divida de verdade - familia que a tabela abre e deixa pela metade. Quarenta
 * e uma linhas iguais dizendo "falta citar" seriam a mesma coisa que nao ter
 * lista.
 */
const OUT_OF_README: Record<string, string> = {
  Autocomplete:
    "A irma cobre: o painel e o do `Combobox`, citado, e a linha dele ja diz lista longa com busca. O que ela tem de proprio - aceitar o que nao esta na lista - e uma frase da pagina dela, e nao uma escolha entre duas pecas.",
  ContextMenu:
    "A irma cobre: o conteudo e o do `Menu`, citado. O que muda e o gesto que abre, e gesto nao e o que a tabela distingue.",
  TimePicker:
    "A irma cobre, quando ela entrar: e o `TimeField` com painel, como o `DatePicker` e o campo de data com painel. Os dois entram na mesma linha ou em nenhuma.",
  ToastViewport:
    "A irma cobre: o aplicativo nunca a escreve, o `RivoProvider` a monta. O README ja explica isso em Fiacao de aviso, que e onde ela de fato aparece.",
  FilterChip:
    "A irma cobre: e uma ficha dentro do `FilterBar`. Cita-la sozinha seria listar a parte antes do todo, que ainda esta fora.",
  Kbd: "A irma cobre: nasce colada ao `Command`, no rodape da paleta e no atalho do menu. Entra junto com ele ou nao entra.",
  CheckboxGroup:
    "A irma cobre errado, e essa e a divida escondida aqui: a linha do `Checkbox` promete o estado misto do selecionar todos, que so o grupo faz. Ou o grupo ganha linha, ou a linha do `Checkbox` para de prometer o que ele nao entrega.",
  ChartDonut:
    "Grafico: a secao Graficos ensina o contrato - `ChartContainer`, cor por nome de serie, dica substituida inteira - e nao lista peca. Rosca, arco e linha miuda entram todas ou nenhuma, e o indice delas e a pagina do subcaminho.",
  ChartRadial:
    "Grafico: mesma secao e mesma razao da rosca. Ali se ensina a ponte com a Recharts, e nao o repertorio.",
  Sparkline:
    "Grafico, e depende de outra: sai de `@rivocode/ui/chart` e mora dentro de um `Stat`, que tambem esta fora. Ela so faz sentido na linha que descrever o numero de painel.",
  AspectRatio:
    "Nicho: moldura de proporcao. Nao ha decisao a explicar nem irma de quem se distinguir, e quem precisa dela ja sabe o nome - e para esse caso que o llms.txt existe.",
  Code: "Nicho: peca de uma palavra dentro de um paragrafo. Nao se parece com nada, entao nao ha o que a tabela resolva.",
  RelativeTime:
    "Nicho: `há 2 minutos` e uma decisao de escrita com moldura em volta. Ninguem abre um README de instalacao para descobrir se ela existe.",
  Clipboard: "Nicho: botao de copiar um dado. Nenhuma duvida de escolha para a tabela desfazer.",
  Indicator:
    "Nicho: a contagem por cima de outra coisa. Ela nunca aparece sozinha, e o que se escolhe e a coisa de baixo - o sino, a aba, o avatar.",
  Editable: "Nicho: edicao no lugar e idioma de uma tela so, e nao decisao de montagem de pagina.",
  ColorPicker:
    "Nicho: so aparece em construtor de tema. O lugar dela no README seria a secao Tema de cliente, e ali o assunto e contraste medido, e nao a peca que escolhe a cor.",
  Splitter:
    "Nicho: divisoria arrastavel aparece em ferramenta, e nao em tela de operacao, que e o que este README ensina a montar.",
  VirtualList:
    "Nicho: e otimizacao, e nao repertorio - o `DataTable` ja usa a mesma engrenagem por dentro. Quem chega nela chega por lentidao medida, e nao lendo catalogo.",
  NumberField:
    "Divida na tabela Campo, e em par: a linha que falta e a que distingue dela o `Slider` - passo e limite conhecidos contra faixa onde o numero exato nao importa.",
  Slider:
    "Divida na tabela Campo, a mesma linha do `NumberField`: as duas so valem citadas juntas, porque a escolha e entre elas.",
  TimeField:
    "Divida na tabela Campo: ha `DatePicker`, `DateRangePicker` e `Calendar` para data, e nada para hora. A tabela parece dizer que a biblioteca nao tem hora, e tem duas.",
  PasswordInput:
    "Divida na tabela Campo: todo projeto reconstroi o par campo-mais-olho, e e para evitar isso que ela existe. Nao cita-la e garantir a reconstrucao.",
  SearchInput:
    "Divida na tabela Campo, e ela mesma prova o custo: sem linha, quem le o README monta a lupa a mao com posicionamento absoluto - o arranjo que esta peca existe para substituir.",
  TagsInput:
    "Divida na tabela Campo: e o irmao do `Combobox` para valor que a pessoa escreve em vez de escolher, e a tabela existe justamente para separar irmaos.",
  Fieldset:
    "Divida: e o que agrupa os campos que a tabela lista, e a secao Formularios fala de `Form` e `FormField` sem dizer o que junta um endereco num bloco so.",
  OTPField:
    "Divida na tabela Campo: a decisao que ela carrega - colar o codigo inteiro espalha os digitos pelas casas - e exatamente o tipo de coisa que a tabela existe para contar.",
  FileUpload:
    "Divida na tabela Campo: a area de anexar e o campo que mais se reconstroi errado, e ela nao conhece rede de proposito, como o `DataTable` que o README ja elogia por isso.",
  Menubar:
    "Divida na tabela Navegacao: ela se parece com o `Menu`, citado, e a confusao entre os dois e a que a tabela existe para desfazer.",
  NavigationMenu:
    "Divida na tabela Navegacao, e a distincao e das mais pedidas: `Menu` lista acoes que se executam, esta lista lugares para onde ir.",
  Command:
    "Divida na tabela Navegacao: a paleta de comandos e das primeiras coisas que se procura num design system, e o README nao diz que existe.",
  Popconfirm:
    "Divida na tabela Flutuante: e a terceira resposta entre `Dialog` e `AlertDialog`, e a tabela cita os dois e para antes da que confirma sem escurecer a tela.",
  PreviewCard:
    "Divida na tabela Flutuante: e `Tooltip` e `Popover` ao pousar sobre um link, os dois citados, e nada ali diz qual usar para o resumo de um link.",
  Timeline:
    "Divida na tabela Dado: entrou no catalogo em 26/08/2026, no lote de sete pecas que abriu este buraco.",
  Tracker:
    "Divida na tabela Dado: a faixa de quadradinhos por periodo nao tem irma citada, entao ninguem adivinha o nome dela para procurar no indice.",
  Stat: "Divida: o numero de painel e a peca mais copiada a mao de qualquer design system, e e a que a tabela nao cita.",
  DescriptionList:
    "Divida na tabela Dado: e a folha de detalhes que vem depois da linha da listagem, e a tabela cita `Table`, `DataTable` e `Item` e para antes dela.",
  PageHeader:
    "Divida: e o topo que toda rota reescreve um pouco diferente, e a secao Tela de aplicacao monta uma tela inteira sem ele.",
  FilterBar:
    "Divida: a secao Listagem com estados de consulta monta o `DataTable` e nao diz o que fica em volta - a fileira de filtros, o limpar e a contagem que toda listagem remonta a mao.",
  QueryBoundary:
    "Divida, e no mesmo lugar: o `DataTable` resolve os quatro finais para tabela, e ela resolve para qualquer conteudo. Quem le a secao sai achando que so tabela tem estado de consulta.",
  ButtonGroup:
    "Divida na tabela Acao: `Toggle`, `ToggleGroup` e `Toolbar` estao citados, e o grupo de botoes irmaos nao - o mesmo que ja passou um release inteiro sendo confundido com parte do `Button`.",
};

const pieces = catalogPieces();
const readme = await Bun.file(README).text();

const problems: string[] = [];

for (const { text, why } of HONEST) {
  if (readme.includes(text)) continue;

  problems.push(
    `${README} nao diz mais "${text}", na frase que abre o catalogo.\n` +
      `    ${why}.\n` +
      "    A tabela cobre uma parte das pecas de proposito, e a frase e o unico lugar\n" +
      "    onde isso esta escrito. Sem ela, o leitor toma a tabela pelo catalogo.",
  );
}

const cited: string[] = [];
const declared: string[] = [];

for (const piece of pieces) {
  const named = new RegExp(`\\b${piece}\\b`);

  if (named.test(readme)) {
    cited.push(piece);

    if (OUT_OF_README[piece]) {
      problems.push(
        `\`${piece}\` esta em OUT_OF_README e JA e citada no ${README}.\n` +
          "    A divida foi paga: apague a linha dela da lista. Excecao que nao encolhe\n" +
          "    vira o lugar onde a peca invisivel se esconde.",
      );
    }
    continue;
  }

  if (OUT_OF_README[piece]) {
    declared.push(piece);
    continue;
  }

  problems.push(
    `\`${piece}\` nao aparece em lugar nenhum do ${README}.\n` +
      "    Ou ela ganha linha na tabela da familia dela - e a tabela diz a diferenca\n" +
      "    entre ela e a vizinha parecida, que e o trabalho do README -, ou ganha linha\n" +
      "    em OUT_OF_README, em scripts/check-cobertura-do-readme.ts, dizendo o que a\n" +
      "    impede. As duas respostas valem; o silencio, nao.",
  );
}

for (const piece of Object.keys(OUT_OF_README)) {
  if (!pieces.includes(piece)) {
    problems.push(
      `\`${piece}\` esta em OUT_OF_README e nao e peca do catalogo.\n` +
        `    Ou o nome mudou, ou a pagina em ${DOCS} sumiu. Apague ou corrija a linha:\n` +
        "    entrada morta faz a lista parecer maior do que a divida.",
    );
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problema(s) na cobertura do ${README}:\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  console.error(
    "O digito ja tem guarda desde que o README anunciou 55 pecas tendo 83. Esta\n" +
      "guarda cuida do que vem depois do digito: a lista embaixo dele cobria 49 das\n" +
      "90, e um numero verdadeiro em cima de uma lista pela metade nao acusa nada.",
  );
  process.exit(1);
}

console.log(
  `${cited.length} de ${pieces.length} pecas citadas no ${README}, e ${declared.length} ` +
    "declaradas fora, com o motivo de cada uma.",
);
