/**
 * Guarda de contraste: le os arquivos de tema, resolve os tokens e falha se
 * algum par que carrega texto ficar abaixo do minimo da norma.
 *
 * ## A conta nao mora mais aqui
 *
 * Ela mora em `src/lib/contrast.ts`, e sai no pacote publicado. Enquanto ela
 * vivia neste arquivo, `scripts/` nao estava em `files` de nenhum dos dois
 * pacotes: quem consome a biblioteca e quer medir o tema do proprio cliente
 * nao tinha o que importar, e portava a conta a mao. Um consumidor real
 * escreveu 220 linhas para isso - nomes de papel, pares, minimos e composicao
 * de alfa -, e portou o `compose` no dia em que ele estava quebrado: a funcao
 * nao enxergava `rgba(r,g,b,a)` nem a forma de oito digitos, devolvia a string
 * intacta, e o `contrastRatio` respondia NaN. DOZE dos 45 papeis carregam
 * alfa. O conserto entrou aqui e a copia dele envelheceu calada, que e o custo
 * exato de matematica de biblioteca morando fora do pacote.
 *
 * Este arquivo continua sendo a GUARDA - quem varre `src/tokens/themes/*.css`
 * e reprova o gate. A tabela de pares e o motor sairam; o motivo de cada par
 * ficou aqui embaixo, porque em `src/` a regra da casa e que so JSDoc de prop
 * publica sobrevive, e este texto nao caberia la.
 *
 * ## Por que cada par existe
 *
 * **`CSS_PAIRS` - os pares que carregam texto.**
 * `--rc-surface-raised` entra ao lado da pagina e do cartao porque ele nao e
 * so "cartao levantado": e o fundo do `floatingPanel`, e portanto o fundo real
 * do Menu, do Select, do Combobox, do Popover, do Tooltip, do Toast neutro e
 * da dica de grafico. Tudo que essas pecas escrevem se le ali e nao sobre a
 * pagina - o titulo de grupo do `MenuGroup` em `text-fg-subtle`, a marca do
 * `SelectItem` e do `ComboboxItem` em `text-accent-text`, o selo neutro em
 * `text-fg-muted`. Medir esse texto contra `--rc-bg` responde a pergunta
 * errada, e era assim que esses pares ficavam de fora da guarda.
 *
 * `--rc-accent-text` sobre `--rc-surface` e o acento escrito na superficie da
 * grade: o "+N mais" do EventCalendar e o numero do dia de hoje. Os dois
 * pousam em `surface`, e nao na pagina nem no painel que flutua - era o unico
 * dos tres fundos sem medida. `--rc-danger-text` sobre `--rc-surface-raised` e
 * o vermelho de ler dentro de um painel que flutua: o item de perigo do Menu
 * em repouso e o icone de aviso do Popconfirm.
 *
 * `bg-overlay` fica de fora de proposito: nenhuma peca escreve sobre a tarja.
 * Ela e so o escurecimento atras do Dialog, do AlertDialog, do Sheet e do
 * Command, e o conteudo deles pousa em `surface`, que ja e medido.
 * `--rc-fg-disabled` e isento: texto desabilitado nao entra na norma.
 *
 * **`CSS_COMPOSED_PAIRS` - o fundo e alfa e precisa ser composto antes.**
 * O Alert pinta `<estado>-subtle` por cima da pagina ou do cartao e escreve
 * `<estado>-text` em cima. Medir esse texto contra `--rc-bg` responde outra
 * pergunta, e deixa passar o par que a pessoa realmente le. `data-[highlighted]`
 * pinta `accent-subtle` por cima de `surface-raised` no Menu, no Select e no
 * Combobox, e o que se le ali e o texto do item mais a marca do escolhido; no
 * tom de perigo, "Excluir" realcado troca o fundo por `danger-subtle`. O
 * acento tenue tambem e fundo de texto fora do painel: a ficha do Combobox e
 * do TagsInput e o item ja escolhido do Command escrevem `text-fg` nele. A
 * celula de hoje no mes do EventCalendar e `selected` por cima da grade, com o
 * numero do dia em acento em cima; a linha escolhida da tabela e alfa por cima
 * de onde a tabela pousa, e o miolo do intervalo do Calendar pousa dentro do
 * Popover.
 *
 * **`CSS_BOUNDARIES` - o que identifica um controle e nao carrega texto.**
 * A WCAG 1.4.11 pede 3:1 para a fronteira de campo, caixa, chave e botao, e
 * para o anel de foco. Ate certo ponto o check media texto e parava ai - e era
 * exatamente nessa faixa que a biblioteca falhava, com a borda em 1,48. O
 * fundo entra tres vezes porque a mesma borda e desenhada sobre a pagina, o
 * cartao e o cartao levantado, e ela precisa passar nos tres. A linha do agora
 * do EventCalendar entra aqui tambem: dois pixels atravessando a coluna do
 * dia, sem texto nenhum em cima. E objeto grafico que precisa ser percebido, e
 * o acento nao serve para isso, porque o lima sobre branco mede 1,15.
 *
 * Uma das linhas mede AO CONTRARIO, e e a unica que faz isso:
 * `--rc-surface-raised` sobre `--rc-accent-text` e a marca por DENTRO do
 * preenchimento - o tique do `Checkbox`, o traco do estado indeterminado, o
 * ponto do `Radio` e o miolo do pino do `Slider`. Marcados, a caixa e o
 * circulo se enchem de `accent-text`, e o preenchimento do `Slider` e a mesma
 * lima; o que a pessoa le em cima dela e `surface-raised`. Nenhum par media
 * isso: `surface-raised` so era medido como FUNDO, e `accent-text` so como
 * frente, entao a unica combinacao em que os dois se encostam era exatamente a
 * que ninguem olhava. A razao e simetrica, e o numero empata com o da fronteira
 * marcada - 5,75:1 no claro e 13,91:1 no escuro -, mas o papel e outro, e e
 * pelo papel que a linha existe: sem ela, nada nesta casa diz que a marca
 * dentro do acento tem que se ler. Um tema que aproxime `surface-raised` do
 * acento entrega uma caixa cheia e vazia ao mesmo tempo, e "cheia sem tique" e
 * indistinguivel de "cheia com tique" para quem precisa saber se marcou.
 *
 * **As duas ultimas linhas medem uma PILHA, e sao as unicas que fazem isso.**
 * O segundo membro da linha aceita lista, e a lista se resolve de baixo para
 * cima, como no lado do mapa. Elas existem porque o trilho do `Slider` nao e
 * uma cor: `--rc-skeleton` carrega alfa nos dois temas da casa, e o cinza que a
 * pessoa ve depende do que esta embaixo dele. Medir contra o token cru mediria
 * uma cor que nenhum pixel tem - e do lado do texto essa mesma pergunta ja
 * tinha resposta, que e `CSS_COMPOSED_PAIRS`; do lado da 1.4.11 nao tinha.
 *
 * **`CSS_DISABLED_OVER` - a fronteira de um controle TRAVADO.** O unico par da
 * casa com teto, e nao so com piso. Um controle desmarcado, desabilitado e sem
 * rotulo ao lado - a coluna de selecao do DataTable e o caso real - nao tem de
 * onde tirar o sinal a nao ser da propria linha. O preenchimento do travado e
 * `surface-raised`, e o guia de temas garante por escrito que ele PODE ser
 * igual a `surface`: no tema claro da casa os dois sao branco puro (1,00:1) e
 * no escuro param em 1,03:1. Como `surface-raised` tambem e fundo de cartao
 * levantado, de menu e de dica, la dentro o preenchimento travado empata com o
 * proprio fundo em 1,00:1 para qualquer valor - subir o token nao e saida, e
 * sim outra pintura. Dai as duas medidas. O piso (`MIN_DISABLED`) impede a
 * linha de sumir como o `--rc-border` some (1,23:1 medido). O teto
 * (`LIVE_OVER_DISABLED`) impede o defeito oposto, que era o estado anterior:
 * vestindo `border-strong` nos dois estados, o controle travado ficava
 * IDENTICO ao vivo, e "sem sinal nenhum" e o que este par existe para pegar. A
 * WCAG 1.4.11 dispensa componente inativo dos 3:1, e e essa folga que o token
 * ocupa de proposito.
 *
 * **`CSS_CHECKED` - o controle MARCADO, nas tres pecas que o pintam.** A unica
 * medida da casa em que o piso da norma nao bastava. O `Switch`, o `Checkbox`
 * e o `Radio` nao escrevem nada: quem le se eles estao marcados le o trilho e
 * a posicao do pino, a caixa cheia com o tique, o circulo cheio com o ponto, e
 * mais nada. Enquanto os tres pintavam `accent`, o marcado media 1,21:1 sobre
 * a pagina no tema claro e 1,26:1 sobre o cartao - contra 3,33:1 do
 * DESMARCADO, que e `border-strong`. Ou seja: reprovava a 1.4.11 e reprovava
 * ao contrario, com o estado marcado menos visivel que o desmarcado. Nenhum
 * par media isso porque `accent` so era medido como fundo de TEXTO, e ali quem
 * carrega o contraste e o `accent-fg` por cima. Dai as duas medidas: o piso da
 * norma sobre os fundos em que o controle pousa, e o marcado pesando pelo
 * menos o quanto pesa o desmarcado. Tema que passe nos 3:1 e ainda deixe o
 * marcado mais apagado que o desmarcado esta dizendo o contrario do que a peca
 * faz. As tres pintam `--rc-accent-text`, e nao `--rc-accent`, porque no tema
 * claro NENHUMA lima clara alcanca 3:1 sobre branco - o teto e 1,54:1 no
 * `accent-active`. `accent-text` e a mesma lima um passo mais escura, ja
 * garantida em 4,5:1 pelos pares de texto, e no tema escuro os dois papeis sao
 * o mesmo valor: o escuro nao muda um pixel.
 *
 * O terceiro fundo, `--rc-surface-raised`, entrou com a caixa e o circulo. A
 * chave pousa na pagina e no cartao; a caixa marcada e o radio marcado pousam
 * tambem DENTRO do Dialog, do Popover, do Menu e do Sheet, e o fundo real de
 * todos esses e o `floatingPanel`. Medido, a fronteira marcada da 5,75:1 no
 * claro e 13,91:1 no escuro, contra 3,33:1 e 3,57:1 do desmarcado - passa com
 * folga, e nao e por isso que a linha existe. Ela existe porque hoje o unico
 * numero que cobre esse fundo e o par de TEXTO a 4,5:1, e ele cobre por
 * acidente: a intencao de 1.4.11 - identificar um controle que nao escreve
 * nada - nao estava declarada em lugar nenhum, e acidente nao segura tema
 * nenhum. Quem clarear `accent-text` um passo no proximo tema de cliente
 * atravessa os 3:1 e a 1.4.11 sem nada acusar, e o defeito volta na mesma
 * familia de pecas de onde acabou de sair.
 *
 * **O nome dizia `SWITCH`, e passou a mentir em um dia.** O par nasceu para o
 * trilho, e no dia seguinte cobria tres pecas: chave, caixa e radio, os tres
 * consertados com o mesmo troco de papel. Medido antes de renomear, o custo
 * eram DOIS arquivos escritos a mao - a fonte `src/lib/contrast.ts` e a linha
 * de contagem de `check-contrast-nativo.ts`, o unico lugar fora dela que
 * importava a constante - mais o espelho `native/scripts/contrast.mjs`, que e
 * gerado e nao se conta. Nenhum README, nenhuma pagina do site e nenhuma
 * referencia da skill cita esses nomes: o que a doc manda importar de
 * `@rivocode/ui-native/contrast` e `checkThemeMap`, `contrastRatio` e
 * `compose`, e nenhum dos tres mudou. Com esse custo na mao a escolha foi
 * renomear para `CSS_CHECKED` / `CSS_UNCHECKED` / `CSS_CHECKED_OVER` e
 * `MAP_CHECKED` / `MAP_UNCHECKED` / `MAP_CHECKED_OVER` - "checked" e o estado
 * que a ARIA da aos tres, e nao um nome inventado para caber. Nome de par e o
 * que a proxima pessoa le antes de decidir se o par ja cobre a peca dela;
 * `SWITCH` teria mandado ela armar um quarto par que ja existia, e a fila de
 * pares duplicados comeca assim.
 *
 * ## O pino do Slider do web, e o par que nasceu no commit do conserto
 *
 * Em 27/08/2026 `skeleton` saiu do `WITHOUT_PAIR` de `src/lib/contrast.ts`,
 * porque o pino do `Slider` NATIVO ganhou par: `fg` sobre `skeleton` e
 * `border-strong` sobre `skeleton`, sobre a pagina e sobre o cartao, a 3:1 da
 * 1.4.11. Naquele dia nada disso entrou em `CSS_BOUNDARIES`, e nao foi
 * esquecimento - armar a linha antes de a peca mudar deixaria o gate vermelho
 * por algo que nenhum tema resolve. O numero ficou escrito aqui com data, e o
 * acordo era que o par nascia no mesmo commit em que a peca mudasse. A peca
 * mudou, e este e o commit.
 *
 * O trilho e o mesmo `bg-skeleton` nos dois pacotes. O pino nao: la ele e
 * `bg-fg` com `border-border-strong`, e aqui ele era `border-accent
 * bg-surface`. Copiar o par do nativo para esta tabela mediria dois papeis que
 * nesta metade da casa nunca se encostam - o `Slider` do web nao pinta `fg` em
 * lugar nenhum do controle -, e par que mede o que a peca nao pinta e o jeito
 * mais rapido de deixar o gate verde sobre nada.
 *
 * **Medido o que a peca pintava, o pino nao alcancava 3:1 em lugar nenhum do
 * tema claro.** Sobre o trilho, o miolo `bg-surface` dava 1,23:1 na pagina e
 * 1,18:1 no cartao, e a borda `border-accent` dava 1,03:1 e 1,06:1. Fora do
 * trilho - o circulo tem 16px e o trilho 6px, entao ele sobra cinco pixels para
 * cima e cinco para baixo - a borda sobre a pagina dava 1,21:1 e 1,26:1, e o
 * miolo era branco sobre branco, 1,04:1 e 1,00:1. O proprio preenchimento
 * `bg-accent` sobre o trilho dava 1,03:1 e 1,06:1, ou seja: no claro nem
 * "quanto ja foi" se lia por cor, porque o trilho cheio e o vazio tinham o
 * mesmo peso. No escuro tudo passava com folga - a borda sobre o trilho dava
 * 12,98:1 e 11,50:1 -, entao era defeito so do claro.
 *
 * E a familia que a tabela acima ja conhece: o lima sobre branco mede 1,15, e o
 * teto de qualquer lima clara sobre branco e 1,54:1 no `accent-active`. Nenhum
 * tema conserta isso, porque o defeito nao esta no tema e sim no papel que o
 * pino vestia - e o conserto e o mesmo que a chave, a caixa e o radio levaram,
 * em duas trocas: o acento vira `accent-text`, e o miolo do pino vira
 * `surface-raised`. Medido depois, no claro a borda e o preenchimento dao
 * 4,69:1 sobre o trilho na pagina e 4,87:1 no cartao, a borda sobre a pagina
 * sobe de 1,21:1 para 5,55:1 e de 1,26:1 para 5,75:1, e o miolo dentro do
 * preenchimento da 5,75:1. No escuro `accent-text` e `accent` sao o MESMO
 * valor: 12,98:1 e 11,50:1, os numeros de antes, e o escuro nao muda um pixel.
 *
 * **A borda do pino e o preenchimento ficam da mesma cor, e isso e escolha.**
 * Vestir `border-strong` no pino separaria os dois - a borda daria 3,19:1 e
 * 3,22:1 sobre o trilho -, mas cairia para 1,90:1 sobre o proprio
 * preenchimento, e o contorno se perderia justamente na metade CHEIA do
 * trilho, que e o lado onde o pino sempre encosta. Com `accent-text` nos dois,
 * quem separa o pino do preenchimento e o MIOLO, e ele e medido:
 * `surface-raised` sobre `accent-text`, 5,75:1 no claro e 13,91:1 no escuro. O
 * arco do circulo ainda sobra cinco pixels para fora do trilho, entao o
 * contorno tambem continua se lendo contra a pagina.
 *
 * **As duas linhas novas, e o que se perde na tela se cada uma cair.**
 * `--rc-accent-text` sobre `--rc-skeleton` em `--rc-bg` e em `--rc-surface`
 * medem DUAS coisas com o mesmo numero, porque a borda do pino e o
 * preenchimento vestem o mesmo papel: se cairem, o trilho cheio empata com o
 * vazio - a pessoa deixa de saber quanto ja foi - e o contorno do pino se
 * dissolve dentro do trilho, que e o defeito medido acima voltando inteiro. A
 * terceira medida que a peca precisa e `--rc-surface-raised` sobre
 * `--rc-accent-text`, e ela ja existia pelo tique do `Checkbox`: agora carrega
 * tambem o miolo do pino, e se cair o pino vira uma mancha da cor do
 * preenchimento e a pessoa perde ONDE ele esta. Nao ha linha repetida para
 * isso, porque par duplicado nao mede duas vezes - ele so imprime duas.
 *
 * O pino FORA do trilho ja tinha cobertura, e por isso nao virou linha aqui:
 * `CSS_CHECKED` mede `accent-text` sobre os tres fundos a 3:1, que e a borda
 * do pino sobre a pagina e sobre o cartao. E o miolo do pino sobre o trilho
 * VAZIO nao e par, e nao por descuido: branco sobre cinza claro da 1,23:1 e
 * 1,18:1, e nenhum tema conserta isso sem escurecer o miolo. Quem delimita o
 * pino ali e a borda, exatamente como na caixa DESMARCADA do `Checkbox`, onde
 * tambem so a borda e medida.
 *
 * ## Que cor a conta sabe ler, e por que essas
 *
 * Ate 27/08/2026 ela lia sRGB e mais nada: hexadecimal de 6 e 8 digitos,
 * `rgb()` e `rgba()`. O custo estava escrito em voz alta e nunca foi cobrado -
 * a paleta do Tailwind 4 e escrita em `oklch()`, entao quem vestia um cliente
 * copiando cor de la, que e o caminho mais comum que existe, ouvia **"sem
 * medida"** em vez de um numero. O tema nao ficava verde por acidente, o que e
 * bom, mas a porta estava fechada para a sintaxe moderna padrao, e o gerador de
 * tema nativo recusava antes de medir.
 *
 * Agora ela le, e converte para sRGB antes de medir:
 *
 * - hexadecimal de 3, 4, 6 e 8 digitos;
 * - `rgb()` e `rgba()`, nas duas sintaxes de alfa, com numero ou percentual;
 * - `hsl()`, `hsla()` e `hwb()`, com angulo em `deg`, `rad`, `grad` ou `turn`;
 * - `lab()` e `lch()`, que sao CIE Lab com branco D50 - o caminho passa por
 *   XYZ D50, adaptacao de Bradford para D65, e dai para sRGB linear;
 * - `oklab()` e `oklch()`, que passam por OKLab, LMS, XYZ D65, sRGB linear e a
 *   curva de gama, cada etapa com a constante propria da especificacao;
 * - `color()` nos espacos predefinidos do CSS: `srgb`, `srgb-linear`,
 *   `display-p3`, `a98-rgb`, `prophoto-rgb`, `rec2020`, `xyz`, `xyz-d65` e
 *   `xyz-d50`.
 *
 * Duas coisas continuam sem medida, e nenhuma das duas por falta de conversao.
 * `color-mix()` nao e uma cor: e uma conta cujo resultado depende do espaco de
 * interpolacao, do metodo de matiz, de quanto sobra de cada lado e do que
 * estiver aninhado dentro dela. Nome de cor da CSS - `rebeccapurple` - pediria
 * a tabela de nomes inteira dentro do pacote, para servir a um caso que nenhum
 * tema de cliente usa. As duas reprovam, e a mensagem diz qual das duas e.
 *
 * ## As matrizes foram provadas contra o navegador, e nao contra si mesmas
 *
 * Conta de espaco de cor erra calada: uma constante trocada devolve uma cor
 * plausivel, e a razao sai bonita. Entao a fonte da verdade nao e este
 * repositorio. Cada valor foi pintado num canvas de um pixel num Chrome sem
 * cabeca e lido de volta com `getImageData`, que e a conversao do proprio
 * navegador. Foram 328 cores - as 284 formas de `oklch()` da paleta do
 * Tailwind 4 mais 44 escritas a mao, uma por familia e por sintaxe de alfa:
 * 315 iguais ao pixel do navegador, 13 a 1 em 255 por arredondamento, nenhuma
 * acima disso. `getComputedStyle` nao serve de prova aqui: o Chrome devolve
 * `oklch(...)` intacto, e nao a cor resolvida.
 *
 * A primeira rodada pegou o defeito que a prova existe para pegar. O
 * `rec2020` saia com 42 em 255 de erro no canal vermelho, por um denominador
 * errado numa das nove fracoes da matriz. O que fechou a duvida foi a conta que
 * qualquer matriz de espaco RGB tem que obedecer: aplicada a `1 1 1` ela
 * devolve o branco do espaco. As de `display-p3`, `a98-rgb` e `rec2020` tem que
 * dar o D65, e a de `prophoto-rgb` o D50 - a errada dava `0,879` onde o D65 tem
 * `1,089`. A tabela de 26 cores com o pixel do navegador ficou congelada em
 * `test/contraste-do-consumidor.test.ts`.
 *
 * ## Gamut: a conta mede o pixel que a tela mostra, e diz que cortou
 *
 * `oklch()` descreve cor que o sRGB nao alcanca, e isso nao e caso de canto:
 * **82 das 286 cores nomeadas da paleta do Tailwind 4 - 29% - caem fora**, em
 * todas as dezessete familias cromaticas, e `red-500` e `blue-500` estao nessa
 * faixa. Recusar seria a saida mais facil e diria menos: fecharia a porta
 * justamente para as cores mais copiadas que existem, que e a dor que este
 * trabalho existe para resolver.
 *
 * Entao a conta corta canal por canal e mede o valor cortado. Nao e escolha de
 * gosto, e o que a tela faz: medido contra o Chrome, cortar por canal reproduz
 * o pixel do navegador em 79 das 82 cores da paleta, e as outras tres a 1 em
 * 255. A reducao de croma preservando matiz - o algoritmo da especificacao -
 * erra em ate 123 em 255 contra o mesmo navegador, porque quem rasteriza nao
 * roda aquele algoritmo. Medir o valor cortado e medir o que a pessoa ve.
 *
 * Cortar sem dizer seria outra coisa, e por isso as duas guardas emitem uma
 * linha de `nota` nomeando cada papel fora do gamut e o valor em que ele foi
 * medido. A nota nao reprova - o numero e real -, e ela so aparece quando ha o
 * que dizer, entao a saida dos temas da casa, que sao hexadecimais, nao muda um
 * caractere.
 *
 * ## Alfa nos espacos novos
 *
 * DOZE dos 45 papeis carregam alfa, e foi ali que a copia do consumidor
 * envelheceu calada. `oklch(0.7 0.15 145 / 0.4)` compoe pelo mesmo caminho de
 * `rgb(r g b / 0.4)`, de `rgba(r,g,b,0.4)` e da forma de oito digitos: a cor
 * vira sRGB primeiro, e a composicao segue sendo `alfa * cor + (1 - alfa) *
 * fundo` por canal. Percentual no lugar do numero - `/ 40%` - chega no mesmo
 * pixel.
 *
 * **`CSS_SERIES` - cor de serie de grafico.** Nao carrega texto, entao nao
 * entra na regra de 4,5:1. A norma pede 3:1 para objeto grafico que precisa
 * ser percebido, e e essa que vale aqui: uma linha de grafico que some no
 * fundo nao e legivel de outro jeito.
 */
import { checkThemeCss, readTokens } from "../src/lib/contrast";
import { countAtLeast, scanAtLeast } from "./varredura";

const palette = await Bun.file("src/tokens/palette.css").text();
const files = await scanAtLeast("src/tokens/themes/*.css", 2);
let failed = 0;
let measured = 0;

for (const file of files) {
  const tokens = readTokens(palette + "\n" + (await Bun.file(file).text()));
  // Nem todo arquivo na pasta de temas e um tema: o de fontes, por exemplo,
  // so traz @import. Um tema de verdade sempre declara o fundo.
  if (!tokens["--rc-bg"]) continue;
  measured += 1;

  for (const finding of checkThemeCss(file, tokens)) {
    if (!finding.ok) failed++;
    console.log(finding.line);
  }
}

if (failed > 0) {
  console.error(`\n${failed} par(es) abaixo do minimo.`);
  process.exit(1);
}

countAtLeast("tema com `--rc-bg` declarado em `src/tokens/themes/`", measured, 2);

console.log(`\nContraste ok nos ${measured} temas de src/tokens/themes/.`);
