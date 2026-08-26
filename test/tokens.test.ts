import { expect, test } from "bun:test";

import { compose, contrastRatio, readTokens } from "../scripts/check-contrast";

const read = (p: string) => Bun.file(p).text();

/** As camadas que todo tema herda: paleta, escala e forma. */
const base = async () =>
  [
    await read("src/tokens/palette.css"),
    await read("src/tokens/scales.css"),
    await read("src/tokens/forma.css"),
  ].join("\n");

test("todo token que o contrato referencia existe nos dois temas", async () => {
  const contract = await read("src/tokens/contract.css");
  const referenced = [...contract.matchAll(/var\((--rc-[\w-]+)\)/g)].map((m) => m[1]!);
  expect(referenced.length).toBeGreaterThan(20);

  const shared = await base();
  const dark = readTokens(shared + (await read("src/tokens/themes/rivocode-dark.css")));
  const light = readTokens(shared + (await read("src/tokens/themes/rivocode-light.css")));

  const missing = referenced.filter((t) => !dark[t] || !light[t]);
  expect(missing).toEqual([]);
});

test("nenhum componente le da paleta crua", async () => {
  const { Glob } = await import("bun");
  const files = await Array.fromAsync(
    new Glob("src/{components,provider}/**/*.{ts,tsx}").scan("."),
  );
  for (const file of files) {
    expect(await Bun.file(file).text()).not.toContain("--rc-p-");
  }
});

test("a densidade compacta encolhe todo controle", async () => {
  const scales = readTokens(await read("src/tokens/scales.css"));
  expect(scales["--rc-control-md"]).toBeDefined();
});

test("o acento do tema claro passa como texto, e a lima crua nao passaria", async () => {
  const shared = await base();
  const light = readTokens(shared + (await read("src/tokens/themes/rivocode-light.css")));
  expect(contrastRatio(light["--rc-accent-text"]!, light["--rc-bg"]!)).toBeGreaterThan(4.5);
  expect(contrastRatio("#d4f34a", light["--rc-bg"]!)).toBeLessThan(2);
});

test("a densidade compacta alcanca painel, item de lista, caixa e dia", async () => {
  const scales = await Bun.file("src/tokens/scales.css").text();
  const compacta = scales.slice(scales.indexOf('[data-rc-density="compact"]'));

  for (const token of ["--rc-pad-panel", "--rc-item-y", "--rc-box", "--rc-day"]) {
    expect(compacta).toContain(token);
  }
});

test("nenhum componente do catalogo usa medida de controle fixa em pixel", async () => {
  const { Glob } = await import("bun");
  const suspeitos: string[] = [];

  for await (const path of new Glob("src/components/*.tsx").scan(".")) {
    const fonte = await Bun.file(path).text();
    // Altura de controle, lado de caixa de marcar e respiro de painel devem
    // sair de token. Pixel solto aqui e densidade que nao chega.
    if (/size-\[(1[6-9]|2\d)px\]|h-\[(3[0-9]|4[0-8])px\]/.test(fonte)) {
      suspeitos.push(path);
    }
  }

  expect(suspeitos).toEqual([]);
});

test("o aviso se le sobre o proprio fundo de aviso, e nao so sobre a pagina", async () => {
  // O Alert pinta <estado>-subtle sobre a pagina e escreve <estado>-text em
  // cima. O par que a pessoa le e esse, e nao o texto contra --rc-bg: sem
  // compor o alfa antes de medir, o tema claro passava com 4,39.
  const shared = await base();

  for (const theme of ["rivocode-light", "rivocode-dark"]) {
    const t = readTokens(shared + (await read(`src/tokens/themes/${theme}.css`)));
    for (const state of ["info", "success", "warning", "danger"]) {
      const background = compose(t[`--rc-${state}-subtle`]!, t["--rc-bg"]!);
      const ratio = contrastRatio(t[`--rc-${state}-text`]!, background);
      expect(`${theme} ${state} ${ratio >= 4.5}`).toBe(`${theme} ${state} true`);
    }
  }
});

test("a fronteira do controle alcanca os 3:1 que a norma pede", async () => {
  // WCAG 1.4.11: o que identifica um controle precisa de 3:1 contra o que
  // esta atras. Aqui o alfa e composto antes de medir, senao a conta e sobre
  // uma cor que ninguem ve.
  const shared = await base();

  for (const theme of ["rivocode-light", "rivocode-dark"]) {
    const t = readTokens(shared + (await read(`src/tokens/themes/${theme}.css`)));
    for (const over of ["--rc-bg", "--rc-surface", "--rc-surface-raised"]) {
      const background = t[over]!;
      const border = compose(t["--rc-border-strong"]!, background);
      const ratio = contrastRatio(border, background);
      expect(`${theme} ${over} ${ratio >= 3}`).toBe(`${theme} ${over} true`);
    }

    // O hover precisa continuar sendo mais forte do que o repouso, senao a
    // resposta ao mouse some junto.
    const atRest = contrastRatio(
      compose(t["--rc-border-strong"]!, t["--rc-surface"]!),
      t["--rc-surface"]!,
    );
    const hover = contrastRatio(
      compose(t["--rc-line-hover"]!, t["--rc-surface"]!),
      t["--rc-surface"]!,
    );
    expect(`${theme} hover>atRest ${hover > atRest}`).toBe(`${theme} hover>atRest true`);
  }
});

test("o anel de foco tambem alcanca 3:1, nos dois fundos", async () => {
  const shared = await base();

  for (const theme of ["rivocode-light", "rivocode-dark"]) {
    const t = readTokens(shared + (await read(`src/tokens/themes/${theme}.css`)));
    for (const over of ["--rc-bg", "--rc-surface"]) {
      const ratio = contrastRatio(compose(t["--rc-ring"]!, t[over]!), t[over]!);
      expect(`${theme} ${over} ${ratio >= 3}`).toBe(`${theme} ${over} true`);
    }
  }
});

test("forma e movimento vivem em arquivo proprio, que o tema pode redefinir", async () => {
  // Canto reto, movimento seco e rotulo espacado sao os tres sinais visuais
  // que mais mudam entre uma marca e outra, e estavam do lado errado da
  // fronteira: dentro da escala global, junto com densidade - que e outra
  // coisa e tem dono proprio.
  const shape = await read("src/tokens/forma.css");
  const scales = await read("src/tokens/scales.css");

  for (const token of [
    "--rc-radius-sm",
    "--rc-radius-md",
    "--rc-radius-lg",
    "--rc-radius-xl",
    "--rc-radius-pill",
    "--rc-duration-fast",
    "--rc-duration-base",
    "--rc-ease",
    "--rc-tracking-display",
  ]) {
    expect(`${token} em forma.css: ${shape.includes(`${token}:`)}`).toBe(`${token} em forma.css: true`);
    expect(`${token} fora de scales.css: ${!scales.includes(`${token}:`)}`).toBe(
      `${token} fora de scales.css: true`,
    );
  }
});

test("o preset importa a forma antes dos temas, senao o tema nao vence", async () => {
  // :root e [data-rc-theme="x"] tem a mesma especificidade, entao quem decide
  // e a ordem do arquivo. Importar a forma depois do tema faria o padrao da
  // casa apagar a escolha do cliente, em silencio.
  const preset = await read("src/preset.css");
  const shapeAt = preset.indexOf("tokens/forma.css");
  const themeAt = preset.indexOf("tokens/themes/rivocode-dark.css");

  expect(shapeAt).toBeGreaterThan(-1);
  expect(shapeAt).toBeLessThan(themeAt);
});

test("a densidade continua sendo da densidade, e nao do tema", async () => {
  // O contrario do de cima: altura de controle e respiro seguem no arquivo de
  // escala, porque quem decide isso e o data-rc-density.
  const scales = await read("src/tokens/scales.css");

  expect(scales).toContain("--rc-control-md:");
  expect(scales).toContain("--rc-pad-panel:");
});

test("nenhuma peca nativa le o tema direto, sem passar pelo contexto", async () => {
  // Peca que pinta por fora da classe - o trilho do Switch, o giro do Button -
  // precisa ler `colors` do contexto. Lendo `tokens.themes[...]` ela pega
  // sempre o tema de casa, e a tela do cliente sai com metade das cores dele e
  // metade da lima da RivoCode. O provider e a unica excecao: e ele quem
  // resolve qual tema vale.
  const { Glob } = await import("bun");
  const offenders: string[] = [];

  for await (const file of new Glob("native/src/**/*.{ts,tsx}").scan(".")) {
    if (file.endsWith("provider.tsx")) continue;
    const code = await Bun.file(file).text();
    if (/tokens\.themes\[/.test(code)) offenders.push(file);
  }

  expect(offenders).toEqual([]);
});

test("o acabamento opcional nasce neutro nos dois temas de casa", async () => {
  // Gradiente de acento, brilho de acento e vidro da tarja sao papeis que o
  // tema pode preencher, e os dois temas de casa deixam vazios. Vazio aqui e
  // `none`, e nao a ausencia de valor: `--rc-accent-image: ;` e declaracao
  // legal em CSS, mas a substituicao produz `background-image: ;`, que e
  // invalido em tempo de valor computado - a declaracao ainda vence a cascata
  // e cai em `unset`. Para background-image isso da `none` por sorte, por ela
  // nao ser herdada; num papel herdado a mesma escrita traria o valor do pai.
  // `none` diz a mesma coisa e diz em voz alta.
  //
  // Os tres tambem precisam existir nos DOIS temas: variavel CSS herda, entao
  // um `scope="local"` com o tema da casa dentro da arvore de um cliente que
  // pinta gradiente herdaria o gradiente dele se a casa nao zerasse.
  const finish = ["--rc-accent-image", "--rc-accent-shadow", "--rc-overlay-filter"];

  for (const theme of ["rivocode-light", "rivocode-dark"]) {
    const css = await read(`src/tokens/themes/${theme}.css`);
    for (const role of finish) {
      expect(`${theme} ${role} neutro: ${css.includes(`${role}: none;`)}`).toBe(
        `${theme} ${role} neutro: true`,
      );
    }
  }
});

test("o contrato compoe o acabamento por cima do papel, sem roubar o utilitario", async () => {
  // A composicao vive na camada de contrato porque e ela que traduz papel em
  // classe. Duas coisas a mantem inofensiva, e as duas sao testadas aqui:
  //
  // `@layer utilities` - regra fora de camada vence QUALQUER camada, entao um
  // `background-image` solto derrubaria ate o `bg-linear-to-r` de quem quisesse
  // o proprio gradiente.
  //
  // `:where()` - especificidade zero, entao dentro da mesma camada qualquer
  // utilitario de classe (0,1,0) ganha. O tema propoe o acabamento; a classe
  // de quem escreve a tela desfaz.
  const contract = await read("src/tokens/contract.css");

  expect(contract).toContain("@layer utilities {");
  for (const rule of [":where(.bg-accent", ":where(.bg-overlay)"]) {
    expect(`${rule} em :where: ${contract.includes(rule)}`).toBe(`${rule} em :where: true`);
  }

  for (const role of ["--rc-accent-image", "--rc-accent-shadow", "--rc-overlay-filter"]) {
    // Fallback no proprio var(): tema de cliente que ignora os tres nao
    // precisa declarar nada, e o gesto simplesmente nao acontece.
    expect(`${role} com fallback: ${contract.includes(`var(${role}, none)`)}`).toBe(
      `${role} com fallback: true`,
    );
  }
});

test("o acabamento do acento nao pinta o botao desabilitado", async () => {
  // O Button neutraliza o primario desabilitado de proposito - a lima
  // desbotada parece defeito - mas ele faz isso trocando background-COLOR. Um
  // gradiente pintado por cima de `.bg-accent` sobreviveria a essa troca e o
  // desabilitado voltaria a vestir a marca. O `data-loading` fica de fora da
  // excecao pelo mesmo motivo que ele fica no Button: carregando tambem
  // desabilita, e ali a cor precisa continuar sendo a da acao.
  const contract = await read("src/tokens/contract.css");
  const rule = contract.slice(contract.indexOf(":where(.bg-accent"));

  expect(rule.slice(0, rule.indexOf(")) {") + 4)).toContain(":disabled:not([data-loading])");
});
