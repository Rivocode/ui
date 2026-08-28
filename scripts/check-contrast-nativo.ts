/**
 * Guarda de contraste do tema de MAPA - a metade dos temas que o
 * `check-contrast` nao enxerga.
 *
 * O `check-contrast` le CSS: abre `src/tokens/themes/*.css`, resolve `var()` e
 * mede os pares. Acontece que o nativo nao tem CSS de tema. Na epoca, o
 * `RivoProvider` do `@rivocode/ui-native` recebia o tema de cliente como
 * objeto - os 45 papeis em `light` e em `dark` - e nenhuma linha do gate media
 * uma cor dele. O efeito e o que o relato descreve: um tema de cliente escrito
 * para o celular podia sair com texto ilegivel e o gate ficava verde, enquanto
 * o MESMO erro em CSS reprovava. Quem sentiu portou a conta a mao, fora do
 * repositorio, e conta feita a mao envelhece calada. A prop por objeto morreu
 * depois, e o par `light`/`dark` continua sendo a FORMA que esta guarda mede:
 * e o que o `bun run gen:native --tema` emite, e e por onde um tema de cliente
 * passa antes de virar CSS.
 *
 * A conta nao muda; a FORMA do dado muda, e foi onde a porta ficou aberta. O
 * gerador emite alfa como `rgba(212,243,74,0.14)`, que e o que o React Native
 * entende, e o `compose` do `check-contrast` so conhecia
 * `rgb(212 243 74 / 0.14)`. Medido antes de escrever esta guarda: ele devolvia
 * a string intacta e o `contrastRatio` respondia NaN. Por isso o `compose`
 * aprendeu as tres sintaxes em vez de esta guarda ganhar a sua - a conta da
 * WCAG mora num lugar so, e as duas guardas medem com o mesmo codigo.
 *
 * **Esse lugar e `src/lib/contrast.ts`, e nao mais `scripts/`.** A conta e o
 * motor deste arquivo sairam para la porque `scripts/` nao esta em `files` de
 * nenhum dos dois pacotes: enquanto ela ficou aqui, quem consome a biblioteca
 * nao tinha o que importar e portava tudo a mao. O que sobrou aqui e a GUARDA:
 * a lista de papeis do mapa da casa, a divida que ela nao arma, e o comando.
 * `checkThemeMap` continua exportado do modulo publicado, para quem for medir o
 * tema do CONSUMIDOR chamar a mesma tabela de pares em vez de porta-la a mao
 * outra vez, que foi o que deu origem a esta guarda.
 *
 * ## Os pares nao sao os mesmos, e isso e decisao
 *
 * O nativo nao e o web com outra sintaxe: e outro dedo. Par que so faz sentido
 * no ponteiro nao entra, e par que so existe no toque entra.
 *
 * Saem, e o motivo esta em cada linha de `WITHOUT_PAIR`: `ring` (nao ha foco
 * de teclado no toque), `accent-hover` e `line-hover` (nao ha ponteiro), e o
 * par da fronteira TRAVADA - aquele com piso E teto, o unico do web com os
 * dois -, porque `border-disabled` nao e usado uma vez sequer em `native/src`:
 * o desabilitado la e `opacity-50` na camada inteira, que e outra ideia e nao
 * um papel de cor.
 *
 * Entram quatro que so existem aqui:
 *
 * - **o rotulo do botao primario SOB O DEDO.** `active:bg-accent-active` troca
 *   o preenchimento enquanto a pessoa segura, e o rotulo continua na tela.
 *   Toque tem estado pressionado como o ponteiro tem hover, e este e o que a
 *   pessoa le parada.
 * - **alfa sobre alfa.** No `Calendar`, a celula do intervalo ja e `selected`
 *   e o dia sob o dedo recebe `selected` DE NOVO, uma View dentro da outra. O
 *   web nao empilha esses dois; aqui o texto se le sobre duas camadas, e a
 *   guarda compoe as duas antes de medir. A fronteira de hoje dentro do
 *   intervalo entra pelo mesmo motivo.
 * - **a camada a 90%.** Ver o bloco de `MAP_LAYER_PAIRS`, abaixo.
 * - **o pino do `Slider` dentro do trilho vazio.** O trilho e o mesmo
 *   `bg-skeleton` nos dois pacotes, mas o pino nao: no web ele e
 *   `border-accent bg-surface`, e aqui e um circulo de `bg-fg` com borda
 *   `border-border-strong`. Papeis diferentes no mesmo lugar da tela, entao o
 *   par e daqui e nao de la. Ver o bloco abaixo.
 *
 * ## Alfa composto: o React Native compoe igual? Quase, e o "quase" morde
 *
 * Medido, e nao suposto. Para o alfa do PROPRIO token a conta e identica a do
 * CSS - `alfa * cor + (1 - alfa) * fundo`, em sRGB, source-over. As tres
 * sintaxes conferem entre si no mesmo pixel: `rgb(212 243 74 / 0.14)`,
 * `rgba(212,243,74,0.14)` e a forma de oito digitos sobre o fundo escuro dao o
 * mesmo valor, as tres. E nao ha modo de mistura nem elevacao em `native/src`
 * para baguncar a ordem: as camadas sao as das Views, e so.
 *
 * O que NAO tem paralelo no CSS desta casa e o `opacity` do React Native. Ele
 * nao pinta um fundo translucido: ele achata a camada INTEIRA - preenchimento
 * e rotulo juntos - e compoe o resultado contra o que estiver atras. Ou seja,
 * o texto desbota junto com o fundo dele, e a razao entre os dois MUDA sem
 * nenhum token ter mudado. O `Button` destrutivo faz exatamente isso com
 * `active:opacity-90`: solto o rotulo mede 5,94:1 no tema claro, e sob o dedo
 * cai para 5,12:1; no escuro cai de 4,83:1 para 4,57:1, a 0,07 do minimo. Por
 * isso `MAP_LAYER_PAIRS` existe e mede o estado pressionado como um par
 * proprio: um tema de cliente com o vermelho um passo mais claro atravessa a
 * linha ali e em lugar nenhum mais. Os dois lados sao compostos contra o MESMO
 * fundo, e nao um sobre o outro: compor o texto sobre o preenchimento ja
 * desbotado e a conta errada, e ela erra para baixo - dava 4,44:1 onde a certa
 * da 5,12:1.
 *
 * ## Por que o controle marcado tem duas medidas
 *
 * O `Switch`, o `Checkbox` e o `RadioGroup` nao escrevem nada: quem le se eles
 * estao marcados le o trilho e a posicao do pino, a caixa cheia com o tique e
 * o circulo com o ponto. Enquanto os tres pintavam `accent`, o marcado media
 * 1,21:1 sobre a pagina no tema claro e 1,26:1 sobre o cartao, contra 3,33:1
 * do DESMARCADO, que e `border-strong`. Reprovava a 1.4.11 E reprovava ao
 * contrario, com o marcado menos visivel que o desmarcado. Era a divida que
 * esta guarda media sem armar, e a linha do `DEBT` saiu no dia em que as pecas
 * mudaram - nos dois pacotes, porque o defeito era o mesmo nos dois.
 *
 * Na chave a cor E a fronteira, e nao ha saida de desenho: o trilho e o do
 * sistema, e `Switch` do React Native aceita `trackColor` e mais nada. Borda
 * propria - o caminho que o web teria - nao existe neste lado, e por isso o
 * conserto dos dois foi o mesmo papel: `accent-text`, a lima um passo mais
 * escura, ja garantida em 4,5:1 pelos pares de texto. No tema escuro os dois
 * papeis apontam para o mesmo valor, entao o escuro nao muda um pixel. As duas
 * medidas sao o piso da norma, 3:1 sobre os TRES fundos em que o controle
 * pousa - `surface-raised` entrou junto com a caixa e o radio, que pousam
 * dentro do `Sheet` e do `Dialog` -, e o marcado pesando pelo menos o quanto
 * pesa o desmarcado, que e o defeito que o piso sozinho nao pega.
 *
 * A marca por DENTRO do preenchimento tem par proprio, e ele e o unico da casa
 * medido ao contrario: `surface-raised` sobre `accent-text`. Marcada, a caixa
 * do toque se enche de `accent-text` e o tique por cima e duas bordas em
 * `surface-raised`; o `RadioGroup` daqui nao enche o circulo - ele deixa o
 * miolo vazado, com o ponto em `accent-text` sobre o fundo da tela -, e por
 * isso o ponto dele ja esta coberto pelo par de cima e nao por este. Sem esta
 * linha nada diz que a marca dentro do acento tem que se ler, e um tema que
 * aproxime `surface-raised` do acento entrega uma caixa cheia e vazia ao mesmo
 * tempo. Mede 5,75:1 no claro e 13,91:1 no escuro, contra os 3 da norma.
 *
 * ## O pino do Slider, e a sombra que nunca pintou nada
 *
 * Em 27/08/2026 a classe `shadow-1` saiu do pino do `Slider` nativo. Ela nunca
 * gerou um byte - `shadow` nao existe no CSS do React Native, e o utilitario do
 * Tailwind nem podia ser gerado, porque a cadeia `--tw-shadow` derruba o
 * compilador -, entao o que saiu foi decoracao que nao chegava na tela.
 *
 * **A decisao de TIRAR em vez de implementar repousava num numero medido a
 * mao.** O pino se ve sem sombra porque `bg-fg` sobre o trilho `bg-skeleton`
 * mede 14,68:1 sobre a pagina e 15,23:1 sobre o cartao no tema claro, e 14,64:1
 * e 12,97:1 no escuro; e porque a borda `border-border-strong` sozinha, sem
 * contar o miolo, ja da 3,19:1 e 3,22:1 no claro e 3,53:1 e 3,40:1 no escuro. O
 * piso da 1.4.11 e 3. Com essa folga a sombra e enfeite, e a peca perde
 * exatamente nada ao ficar sem ela.
 *
 * Numero medido a mao e numero que a proxima pessoa nao tem. Enquanto nenhum
 * par media isso, um tema de cliente que aproximasse `fg` de `skeleton`
 * desfazia a decisao EM SILENCIO: o pino se dissolve dentro do trilho, e nada
 * acusa. E o que se perde na tela e o controle inteiro, porque o `Slider` do
 * toque nao escreve numero nenhum - `accessibilityValue` vai para o leitor de
 * tela, e o que o olho le e a POSICAO do circulo no trilho. Sem pino visivel
 * sobra o preenchimento `bg-accent`, que diz mais ou menos quanto ja foi, e nao
 * diz onde por o dedo para mudar.
 *
 * **Sao dois pares, e nao um, porque os dois numeros dizem coisas
 * diferentes.** A borda passa raspando - 3,19:1 e 0,19 acima do piso, e e o
 * lugar onde um tema de cliente tem quase nenhuma folga -, e e por isso que ela
 * entra, e nao por isso que ela ficaria de fora. O miolo passa com folga larga,
 * e entra porque ele e o numero em que a decisao da sombra se apoia: o par sem
 * folga guarda o TEMA, e o par com folga guarda a DECISAO. Armar so o apertado
 * deixaria a frase "o pino se ve sem sombra" sem nada por baixo dela.
 *
 * Dois fundos e nao tres, pelo mesmo motivo das fronteiras de estado e de
 * serie: o `Slider` daqui pousa na pagina e no cartao.
 *
 * **`skeleton` saiu do `WITHOUT_PAIR`, e a linha dele nao mudou de endereco.**
 * O papel serve a dois propositos com exigencias diferentes, e a linha antiga -
 * "bloco de carregamento, sem texto em cima" - descrevia so o primeiro. Como
 * bloco de espera do `Skeleton`, do `DataList` e do `QueryBoundary` ele
 * continua nao carregando texto nem fronteira, e continua sem par de TEXTO.
 * Como trilho vazio do `Slider` ele e o fundo de um controle que se identifica
 * so pela forma, e ali a 1.4.11 cobra 3:1. Manter a linha e medir o mesmo papel
 * imprimiria "sem par, por declaracao: skeleton" no mesmo relatorio que
 * imprime quatro medidas de `skeleton`, e
 * `test/contraste-do-consumidor.test.ts` cobra a soma: `MEASURED_ROLES` mais
 * `WITHOUT_PAIR` tem que dar exatamente os 45 papeis, e papel nos dois lugares
 * da 46. As duas listas sao disjuntas de proposito - papel e medido ou
 * declarado, nunca os dois -, e `MAP_ROLES` segue 45 porque ela e a UNIAO:
 * `skeleton` trocou de metade sem mudar o total.
 *
 * ## O que ela cobre, alem dos pares
 *
 * Papel FALTANDO reprova. O gerador so confere isso no caminho `--tema`; mapa
 * escrito a mao nunca passou por conferencia nenhuma, e papel ausente nao da
 * erro no celular - a peca herda a cor da RivoCode e o cliente descobre meses
 * depois. Papel NOVO tambem reprova enquanto ninguem disser o que fazer com
 * ele: todo papel tem que estar num par ou numa linha de `WITHOUT_PAIR` com o
 * motivo, senao ele entra no mapa sem ninguem medir.
 *
 * A conferencia dos papeis vale nos DOIS sentidos, e o segundo nasceu com a
 * mudanca de endereco. `MAP_ROLES` - a lista que o modulo publicado usa quando
 * quem chama nao passa papel nenhum - e DERIVADA das tabelas de pares mais o
 * `WITHOUT_PAIR`, e nao escrita a mao: uma segunda lista de 45 nomes seria o
 * proximo lugar a envelhecer calado. Entao a guarda confere que ela bate
 * exatamente com o que `native/tokens.ts` emite, nos dois sentidos - papel do
 * mapa que a tabela nao alcanca, e nome na tabela que nao e papel do mapa.
 *
 * ## Fora do repositorio
 *
 * Sem argumento, mede os dois temas da casa em `native/tokens.ts`. Com
 * argumento, mede o mapa que vier: `bun run check:contrast:nativo
 * acme.theme.ts` - que e o arquivo que `bun run gen:native --tema` escreve. O
 * mesmo mapa se mede sem clonar o repositorio, por
 * `rivocode-ui check-theme acme.theme.ts`, que chama este mesmo motor.
 */
import {
  MAP_ROLES,
  MEASURED_ROLES,
  WITHOUT_PAIR,
  checkThemeMap,
  type ColorMap,
  type ThemeMap,
  MAP_PAIRS,
  MAP_BOUNDARIES,
  MAP_LAYER_PAIRS,
  MAP_CHECKED_OVER,
} from "../src/lib/contrast";
import { tokens } from "../native/tokens";

/** Os 45 papeis do mapa, na ordem em que o gerador os emite. */
const ROLES = Object.keys(tokens.themes["rivocode-dark"]);

/**
 * A divida medida que esta guarda NAO arma, com o numero e o endereco do
 * conserto.
 *
 * Ela existe para o defeito que nao esta no tema e sim na peca: armar o par
 * deixaria o gate vermelho por algo que nenhum tema conserta sozinho, e calar
 * deixaria o numero sumir. Entao ela mede, mostra e nao arma.
 *
 * A lista esta VAZIA desde 27/08/2026, quando o trilho da chave ligada - a
 * unica entrada que ela ja teve - virou par armado, nos dois pacotes. O acordo
 * e o das outras listas da casa: ela SO ENCOLHE. Entrada que parou de reprovar
 * e erro, e a guarda manda apagar a linha - senao vira o lugar onde o defeito
 * mora.
 */
type Debt = { id: string; min: number; why: string; measure: (colors: ColorMap) => number };
const DEBT: Debt[] = [];

const maps: Array<[string, ThemeMap]> = [];
const files = process.argv.slice(2).filter((argument) => !argument.startsWith("-"));

if (files.length === 0) {
  maps.push([
    "rivocode",
    { light: tokens.themes["rivocode-light"], dark: tokens.themes["rivocode-dark"] },
  ]);
}

for (const file of files) {
  const path = file.startsWith("/") ? file : `${process.cwd()}/${file}`;
  const loaded = (await import(path)) as Record<string, unknown>;
  const found = Object.entries(loaded).filter(
    ([, value]) =>
      typeof value === "object" && value !== null && "light" in value && "dark" in value,
  );
  if (found.length === 0) {
    console.error(
      `${file}: nenhum export com \`light\` e \`dark\` - nao e um mapa de tema. Emita um com` +
        " `bun run gen:native --tema`.",
    );
    process.exit(1);
  }
  for (const [key, value] of found) maps.push([`${file}:${key}`, value as ThemeMap]);
}

let failed = 0;

const orphans = ROLES.filter((role) => !MEASURED_ROLES.includes(role) && !(role in WITHOUT_PAIR));
if (orphans.length > 0) {
  console.error(
    `${orphans.length} papel(eis) que nenhum par mede e que ninguem declarou:\n` +
      orphans.map((role) => `    ${role}`).join("\n") +
      "\n\n    Ou entra num par de src/lib/contrast.ts, ou ganha linha em" +
      "\n    `WITHOUT_PAIR` dizendo por que nao precisa. Papel sem par e cor" +
      "\n    que ninguem mede.",
  );
  failed++;
}

const invented = MAP_ROLES.filter((role) => !ROLES.includes(role));
if (invented.length > 0) {
  console.error(
    `${invented.length} nome(s) nas tabelas de src/lib/contrast.ts que o mapa nao tem:\n` +
      invented.map((role) => `    ${role}`).join("\n") +
      "\n\n    `MAP_ROLES` e derivada das tabelas, e e ela que o modulo publicado" +
      "\n    cobra de um tema de consumidor. Nome errado ali cobra um papel que" +
      "\n    o `RivoProvider` nunca le, e o tema do cliente reprova por nada.",
  );
  failed++;
}

for (const [name, map] of maps) {
  for (const finding of checkThemeMap(name, map, ROLES)) {
    if (!finding.ok) failed++;
    console.log(finding.line);
  }
}

// A divida: mede, mostra o numero e nao arma. Ela e SEMPRE medida no tema da
// casa, e nunca no mapa que veio por argumento: a divida e da RivoCode, e um
// cliente cujo acento passe nao paga divida nossa nem apaga linha nossa.
const house = [tokens.themes["rivocode-light"], tokens.themes["rivocode-dark"]];
const paid: string[] = [];
for (const item of DEBT) {
  const worst = Math.min(...house.map((colors) => item.measure(colors)));
  console.log(
    `\n  divida  ${item.id}  ${worst.toFixed(2)}:1 (min ${item.min})\n` +
      item.why.replace(/^/gm, "          "),
  );
  if (worst >= item.min) paid.push(item.id);
}

if (paid.length > 0) {
  console.error(
    `\n${paid.length} linha(s) do \`DEBT\` que nao acusam mais nada: ${paid.join(", ")}.` +
      "\n    Apague de scripts/check-contrast-nativo.ts - ou arme o par, se ele" +
      "\n    virou regra. Lista de excecao que nao encolhe vira o lugar onde o" +
      "\n    defeito mora.",
  );
  failed++;
}

if (failed > 0) {
  console.error(`\n${failed} problema(s) de contraste no tema de mapa.`);
  process.exit(1);
}
console.log(
  `\nContraste ok em ${maps.length} mapa(s), claro e escuro: ${MAP_PAIRS.length} pares de texto,` +
    ` ${MAP_BOUNDARIES.length} de 1.4.11, ${MAP_LAYER_PAIRS.length} de camada e` +
    ` ${MAP_CHECKED_OVER.length} do controle marcado, por esquema.` +
    ` Sem par, por declaracao: ${Object.keys(WITHOUT_PAIR).join(", ")}.`,
);
