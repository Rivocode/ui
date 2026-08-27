/**
 * Guarda de contraste: le os arquivos de tema, resolve os tokens e falha se
 * algum par que carrega texto ficar abaixo do minimo da norma.
 */
const MIN_TEXT = 4.5;
const MIN_BODY = 7;

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r!) + 0.7152 * channel(g!) + 0.0722 * channel(b!);
}

export function contrastRatio(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
}

/**
 * Compoe uma cor com alfa sobre o fundo em que ela e desenhada.
 *
 * Os papeis `-subtle` sao alfa por cima da superficie, e medir o RGB cru deles
 * responde a pergunta errada: o que o olho ve e a mistura. Sem compor, o par
 * "texto de aviso sobre fundo de aviso" nem entra na conta.
 */
export function compose(value: string, background: string): string {
  const rgba = /^rgba?\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)\s*\)$/.exec(value.trim());
  if (!rgba) return value;

  const [r, g, b, alpha] = [+rgba[1]!, +rgba[2]!, +rgba[3]!, +rgba[4]!];
  const base = background.replace("#", "");
  const [br, bg, bb] = [0, 2, 4].map((i) => parseInt(base.slice(i, i + 2), 16));
  const mistura = (color: number, background: number) =>
    Math.round(alpha * color + (1 - alpha) * background);

  return `#${[mistura(r, br!), mistura(g, bg!), mistura(b, bb!)]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * Le `--rc-x: valor` e resolve um nivel de var(). Recebe a paleta concatenada
 * com o tema, porque o tema aponta para a paleta e ela vive em outro arquivo.
 */
export function readTokens(css: string): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const [, name, value] of css.matchAll(/(--rc-[\w-]+)\s*:\s*([^;]+);/g)) {
    raw[name!] = value!.trim();
  }
  const resolved: Record<string, string> = {};
  for (const [name, value] of Object.entries(raw)) {
    const ref = value.match(/^var\((--rc-[\w-]+)\)$/);
    resolved[name] = ref ? (raw[ref[1]!] ?? value) : value;
  }
  return resolved;
}

/**
 * Os pares que carregam texto e portanto precisam passar.
 *
 * `--rc-surface-raised` entra ao lado da pagina e do cartao porque ele nao e
 * so "cartao levantado": e o fundo do `floatingPanel`, e portanto o fundo real
 * do Menu, do Select, do Combobox, do Popover, do Tooltip, do Toast neutro e
 * da dica de grafico. Tudo que essas pecas escrevem se le ali e nao sobre a
 * pagina - o titulo de grupo do `MenuGroup` em `text-fg-subtle`, a marca do
 * `SelectItem` e do `ComboboxItem` em `text-accent-text`, o selo neutro em
 * `text-fg-muted`. Medir esse texto contra `--rc-bg` responde a pergunta
 * errada, e era assim que esses pares ficavam de fora da guarda.
 *
 * `bg-overlay` fica de fora de proposito: nenhuma peca escreve sobre a tarja.
 * Ela e so o escurecimento atras do Dialog, do AlertDialog, do Sheet e do
 * Command, e o conteudo deles pousa em `surface`, que ja e medido.
 */
const PAIRS: Array<[string, string, number]> = [
  ["--rc-fg", "--rc-bg", MIN_BODY],
  ["--rc-fg", "--rc-surface", MIN_BODY],
  ["--rc-fg", "--rc-surface-raised", MIN_BODY],
  ["--rc-fg-muted", "--rc-bg", MIN_TEXT],
  ["--rc-fg-muted", "--rc-surface", MIN_TEXT],
  ["--rc-fg-muted", "--rc-surface-raised", MIN_TEXT],
  ["--rc-fg-subtle", "--rc-bg", MIN_TEXT],
  ["--rc-fg-subtle", "--rc-surface", MIN_TEXT],
  ["--rc-fg-subtle", "--rc-surface-raised", MIN_TEXT],
  ["--rc-accent-text", "--rc-bg", MIN_TEXT],
  ["--rc-accent-text", "--rc-surface-raised", MIN_TEXT],
  // O acento escrito sobre a superficie da grade: o "+N mais" do EventCalendar
  // e o numero do dia de hoje. Os dois pousam em `surface`, e nao na pagina
  // nem no painel que flutua - era o unico dos tres fundos sem medida.
  ["--rc-accent-text", "--rc-surface", MIN_TEXT],
  ["--rc-accent-fg", "--rc-accent", MIN_TEXT],
  ["--rc-success-text", "--rc-bg", MIN_TEXT],
  ["--rc-warning-text", "--rc-bg", MIN_TEXT],
  ["--rc-danger-text", "--rc-bg", MIN_TEXT],
  ["--rc-info-text", "--rc-bg", MIN_TEXT],
  ["--rc-success-text", "--rc-surface", MIN_TEXT],
  ["--rc-warning-text", "--rc-surface", MIN_TEXT],
  ["--rc-danger-text", "--rc-surface", MIN_TEXT],
  ["--rc-info-text", "--rc-surface", MIN_TEXT],
  // O vermelho de ler dentro de um painel que flutua: o item de perigo do Menu
  // em repouso e o icone de aviso do Popconfirm, que pousam em
  // `surface-raised` e nao na pagina.
  ["--rc-danger-text", "--rc-surface-raised", MIN_TEXT],
  ["--rc-success-fg", "--rc-success", MIN_TEXT],
  ["--rc-warning-fg", "--rc-warning", MIN_TEXT],
  ["--rc-danger-fg", "--rc-danger", MIN_TEXT],
  ["--rc-info-fg", "--rc-info", MIN_TEXT],
];

/**
 * Os pares em que o fundo e alfa e precisa ser composto antes de medir.
 *
 * O Alert pinta `<estado>-subtle` por cima da pagina ou do cartao e escreve
 * `<estado>-text` em cima. Medir esse texto contra `--rc-bg` - que e o que os
 * pares acima fazem - responde outra pergunta, e deixa passar o par que a
 * pessoa realmente le.
 */
const COMPOSED_PAIRS: Array<[string, string, string, number]> = [
  ["--rc-info-text", "--rc-info-subtle", "--rc-bg", MIN_TEXT],
  ["--rc-info-text", "--rc-info-subtle", "--rc-surface", MIN_TEXT],
  ["--rc-success-text", "--rc-success-subtle", "--rc-bg", MIN_TEXT],
  ["--rc-success-text", "--rc-success-subtle", "--rc-surface", MIN_TEXT],
  ["--rc-warning-text", "--rc-warning-subtle", "--rc-bg", MIN_TEXT],
  ["--rc-warning-text", "--rc-warning-subtle", "--rc-surface", MIN_TEXT],
  ["--rc-danger-text", "--rc-danger-subtle", "--rc-bg", MIN_TEXT],
  ["--rc-danger-text", "--rc-danger-subtle", "--rc-surface", MIN_TEXT],
  ["--rc-accent-text", "--rc-accent-subtle", "--rc-bg", MIN_TEXT],
  ["--rc-accent-text", "--rc-accent-subtle", "--rc-surface", MIN_TEXT],

  // O item realcado dentro de um painel que flutua. `data-[highlighted]` pinta
  // `accent-subtle` por cima de `surface-raised` no Menu, no Select e no
  // Combobox, e o que se le ali e o texto do item mais a marca do escolhido.
  ["--rc-fg", "--rc-accent-subtle", "--rc-surface-raised", MIN_BODY],
  ["--rc-accent-text", "--rc-accent-subtle", "--rc-surface-raised", MIN_TEXT],
  // O mesmo item, no tom de perigo: "Excluir" realcado troca o fundo por
  // `danger-subtle`, ainda dentro do painel.
  ["--rc-danger-text", "--rc-danger-subtle", "--rc-surface-raised", MIN_TEXT],

  // O acento tenue tambem e fundo de texto fora do painel: a ficha do Combobox
  // e do TagsInput e o item ja escolhido do Command escrevem `text-fg` nele.
  ["--rc-fg", "--rc-accent-subtle", "--rc-bg", MIN_BODY],
  ["--rc-fg", "--rc-accent-subtle", "--rc-surface", MIN_BODY],

  // A celula de hoje no mes do EventCalendar: `selected` por cima da grade, e
  // o numero do dia escrito em acento em cima dela.
  ["--rc-accent-text", "--rc-selected", "--rc-surface", MIN_TEXT],

  // A linha escolhida da tabela, que e alfa por cima de onde a tabela pousa, e
  // o miolo do intervalo do Calendar, que pousa dentro do Popover.
  ["--rc-fg", "--rc-selected", "--rc-bg", MIN_BODY],
  ["--rc-fg", "--rc-selected", "--rc-surface", MIN_BODY],
  ["--rc-fg", "--rc-selected", "--rc-surface-raised", MIN_BODY],
];

/**
 * O que identifica um controle, e nao carrega texto.
 *
 * A WCAG 1.4.11 pede 3:1 para a fronteira de campo, caixa, chave e botao, e
 * para o anel de foco. Ate aqui o check media texto e parava ai - e era
 * exatamente nessa faixa que a biblioteca falhava, com a borda em 1,48.
 *
 * O fundo entra na lista porque a mesma borda e desenhada sobre a pagina, o
 * cartao e o cartao levantado, e ela precisa passar nos tres.
 */
const MIN_NAO_TEXTUAL = 3;
const BOUNDARIES: Array<[string, string, number]> = [
  ["--rc-border-strong", "--rc-bg", MIN_NAO_TEXTUAL],
  ["--rc-border-strong", "--rc-surface", MIN_NAO_TEXTUAL],
  ["--rc-border-strong", "--rc-surface-raised", MIN_NAO_TEXTUAL],
  ["--rc-ring", "--rc-bg", MIN_NAO_TEXTUAL],
  ["--rc-ring", "--rc-surface", MIN_NAO_TEXTUAL],
  // A linha do agora do EventCalendar: dois pixels atravessando a coluna do
  // dia, sem texto nenhum em cima. E objeto grafico que precisa ser percebido,
  // entao vale a mesma regra de 3:1 da fronteira de controle - e o acento nao
  // serve para isso, porque o lima sobre branco mede 1,15.
  ["--rc-danger", "--rc-surface", MIN_NAO_TEXTUAL],
];

/**
 * A fronteira de um controle TRAVADO: o unico par da casa com teto, e nao so
 * com piso.
 *
 * Um controle desmarcado, desabilitado e sem rotulo ao lado - a coluna de
 * selecao do DataTable e o caso real - nao tem de onde tirar o sinal a nao ser
 * da propria linha. O preenchimento do travado e `surface-raised`, e o guia de
 * temas garante por escrito que ele PODE ser igual a `surface`: no tema claro
 * da casa os dois sao branco puro (1,00:1) e no escuro param em 1,03:1. Como
 * `surface-raised` tambem e fundo de cartao levantado, de menu e de dica, la
 * dentro o preenchimento travado empata com o proprio fundo em 1,00:1 para
 * qualquer valor - subir o token nao e saida, e sim outra pintura.
 *
 * Dai as duas medidas. O piso impede a linha de sumir como o `--rc-border` some
 * (1,23:1 medido). O teto impede o defeito oposto, que era o estado anterior:
 * vestindo `border-strong` nos dois estados, o controle travado ficava
 * IDENTICO ao vivo, e "sem sinal nenhum" e o que este par existe para pegar. A
 * WCAG 1.4.11 dispensa componente inativo dos 3:1, e e essa folga que o token
 * ocupa de proposito.
 */
const MIN_DISABLED = 1.6;
/** Quantas vezes a fronteira viva precisa pesar mais que a travada. */
const LIVE_OVER_DISABLED = 1.4;
const DISABLED_OVER = ["--rc-bg", "--rc-surface", "--rc-surface-raised"];

/**
 * Cor de serie de grafico nao carrega texto, entao ela nao entra na regra de
 * 4,5:1. A norma pede 3:1 para objeto grafico que precisa ser percebido, e e
 * essa que vale aqui: uma linha de grafico que some no fundo nao e legivel de
 * outro jeito.
 */
const MIN_CHART = 3;
const SERIES = Array.from({ length: 8 }, (_, index) => `--rc-chart-${index + 1}`);

/** `--rc-fg-disabled` e isento: texto desabilitado nao entra na norma. */
if (import.meta.main) {
  const { Glob } = await import("bun");
  const palette = await Bun.file("src/tokens/palette.css").text();
  const files = await Array.fromAsync(new Glob("src/tokens/themes/*.css").scan("."));
  let failed = 0;

  for (const file of files.sort()) {
    const tokens = readTokens(palette + "\n" + (await Bun.file(file).text()));
    // Nem todo arquivo na pasta de temas e um tema: o de fontes, por exemplo,
    // so traz @import. Um tema de verdade sempre declara o fundo.
    if (!tokens["--rc-bg"]) continue;
    console.log(`\n${file}`);
    for (const [fg, bg, min] of [
      ...PAIRS,
      ...SERIES.flatMap(
        (serie) =>
          [
            [serie, "--rc-bg", MIN_CHART],
            [serie, "--rc-surface", MIN_CHART],
          ] as Array<[string, string, number]>,
      ),
    ]) {
      const a = tokens[fg];
      const b = tokens[bg];
      if (!a || !b) {
        console.log(`  FALTA  ${fg} sobre ${bg}`);
        failed++;
        continue;
      }
      // Todo token de PAIRS carrega texto, entao precisa virar hexadecimal.
      // Nao resolver e defeito da paleta ou do tema, nunca motivo para pular.
      if (!a.startsWith("#") || !b.startsWith("#")) {
        console.log(`  FALHA  ${fg} ou ${bg} nao resolveu para hexadecimal`);
        failed++;
        continue;
      }
      const ratio = contrastRatio(a, b);
      const ok = ratio >= min;
      if (!ok) failed++;
      console.log(
        `  ${ok ? "ok   " : "FALHA"} ${fg} sobre ${bg}  ${ratio.toFixed(2)}:1 (min ${min})`,
      );
    }

    // As fronteiras: a cor e desenhada sobre o proprio fundo em que ela vive,
    // entao o alfa se compoe com ele.
    for (const [line, over, min] of BOUNDARIES) {
      const color = tokens[line];
      const background = tokens[over];
      if (!color || !background) {
        console.log(`  FALTA  ${line} sobre ${over}`);
        failed++;
        continue;
      }

      const ratio = contrastRatio(compose(color, background), background);
      const ok = ratio >= min;
      if (!ok) failed++;
      console.log(
        `  ${ok ? "ok   " : "FALHA"} ${line} sobre ${over}  ${ratio.toFixed(2)}:1 (min ${min}, 1.4.11)`,
      );
    }

    // A fronteira travada, contra a viva. Duas contas por fundo, porque este
    // par e o unico que pode errar para os dois lados.
    for (const over of DISABLED_OVER) {
      const disabled = tokens["--rc-border-disabled"];
      const live = tokens["--rc-border-strong"];
      const background = tokens[over];
      if (!disabled || !live || !background) {
        console.log(`  FALTA  --rc-border-disabled sobre ${over}`);
        failed++;
        continue;
      }

      const ratio = contrastRatio(compose(disabled, background), background);
      const liveRatio = contrastRatio(compose(live, background), background);
      const visible = ratio >= MIN_DISABLED;
      const weaker = liveRatio / ratio >= LIVE_OVER_DISABLED;
      if (!visible || !weaker) failed++;
      console.log(
        `  ${visible && weaker ? "ok   " : "FALHA"} --rc-border-disabled sobre ${over}` +
          `  ${ratio.toFixed(2)}:1 (min ${MIN_DISABLED}, e a viva pesa` +
          ` ${(liveRatio / ratio).toFixed(2)}x, min ${LIVE_OVER_DISABLED}x)`,
      );
    }

    // Os pares de alfa: compoe o fundo antes de medir.
    for (const [fg, subtle, underName, min] of COMPOSED_PAIRS) {
      const text = tokens[fg];
      const alphaBackground = tokens[subtle];
      const under = tokens[underName];
      if (!text || !alphaBackground || !under) {
        console.log(`  FALTA  ${fg} sobre ${subtle}`);
        failed++;
        continue;
      }

      const background = compose(alphaBackground, under);
      const ratio = contrastRatio(text, background);
      const ok = ratio >= min;
      if (!ok) failed++;
      console.log(
        `  ${ok ? "ok   " : "FALHA"} ${fg} sobre ${subtle} em ${underName}  ${ratio.toFixed(2)}:1 (min ${min})`,
      );
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} par(es) abaixo do minimo.`);
    process.exit(1);
  }
  console.log("\nContraste ok em todos os temas.");
}
