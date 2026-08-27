import { expect, test } from "bun:test";
import { Glob } from "bun";

import { contrastRatio, readTokens } from "../src/lib/contrast";

test("branco sobre preto da o maximo de 21 para 1", () => {
  expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1);
});

test("a lima sobre o fundo escuro da 15,06 para 1", () => {
  expect(contrastRatio("#d4f34a", "#0f1113")).toBeCloseTo(15.06, 1);
});

test("a cor de texto desabilitado fica abaixo do minimo", () => {
  expect(contrastRatio("#6c737b", "#0f1113")).toBeLessThan(4.5);
});

test("resolve um token de tema que aponta para a paleta", () => {
  const tokens = readTokens(
    ":root { --rc-p-lima-500: #d4f34a; }\n" +
      "[data-rc-theme='x'] { --rc-accent: var(--rc-p-lima-500); }",
  );
  expect(tokens["--rc-accent"]).toBe("#d4f34a");
});

test("a ordem das cores nao muda a razao", () => {
  expect(contrastRatio("#d4f34a", "#0f1113")).toBeCloseTo(contrastRatio("#0f1113", "#d4f34a"), 5);
});

test("o pacote publicado leva o CHANGELOG junto", async () => {
  // Numa biblioteca em 0.x, com o pacote ja tendo trocado nomes publicos duas
  // vezes, quem tem uma versao velha instalada precisa poder ler o que mudou
  // sem sair do node_modules. O arquivo existia no repo e ficava de fora do
  // que o npm empacota.
  const pkg = await Bun.file("package.json").json();

  expect(pkg.files).toContain("CHANGELOG.md");
  expect(await Bun.file("CHANGELOG.md").exists()).toBe(true);
});

test("a versao escrita no codigo e a mesma do pacote", async () => {
  // `version` sai na API publica, e um numero errado ali e pior que numero
  // nenhum: quem depura por ele conclui a coisa errada sobre o que tem
  // instalado. Sao dois arquivos, e os dois envelhecem juntos.
  const pkg = await Bun.file("package.json").json();
  const index = await Bun.file("src/index.ts").text();

  expect(index).toContain(`export const version = "${pkg.version}";`);
});

test("cada pacote tem CHANGELOG proprio, e ele viaja junto", async () => {
  // O nativo publica FONTE e ja trocou tres nomes de prop. Sem o CHANGELOG
  // dentro do tarball, quem tem a versao velha instalada nao tem de onde
  // partir - e o agent de migracao, que le exatamente esse arquivo, tambem
  // nao.
  for (const dir of [".", "native"]) {
    const pkg = await Bun.file(`${dir}/package.json`).json();
    expect(`${pkg.name} declara CHANGELOG: ${pkg.files.includes("CHANGELOG.md")}`).toBe(
      `${pkg.name} declara CHANGELOG: true`,
    );
    expect(`${pkg.name} tem CHANGELOG: ${await Bun.file(`${dir}/CHANGELOG.md`).exists()}`).toBe(
      `${pkg.name} tem CHANGELOG: true`,
    );
  }
});

test("a tag de cada pacote aponta para a versao dele", async () => {
  // Dois pacotes, dois gatilhos: `v*` e do web e `native-v*` e do nativo. Sem
  // o prefixo, uma tag publicaria o pacote errado - ou pior, o certo com o
  // numero do outro.
  const web = await Bun.file(".github/workflows/release.yml").text();
  const native = await Bun.file(".github/workflows/release-native.yml").text();

  expect(web).toContain('tags: ["v*"]');
  expect(native).toContain('tags: ["native-v*"]');
  expect(native).toContain("native/package.json");
});

/*
 * A fronteira de um controle de formulario e o que diz "aqui se digita", e o
 * WCAG 1.4.11 cobra 3:1 dela. Quem cumpre a promessa e o `--rc-border-strong`;
 * o `--rc-border` e linha de arranjo, e no tema escuro sai em 1,1:1 - visivel
 * para quem enxerga bem, invisivel para o resto.
 *
 * O `check:contrast` nao pega isso porque mede o token e nao quem o usa: os
 * dois passam, cada um na promessa que fizeram. Esta guarda olha o outro lado.
 */
const CONTROL_ROOT = /"[^"]*\bborder border-border(?!-strong)/;

/**
 * O bloco `cn(...)` inteiro, com os parenteses balanceados - a classe de um
 * controle nasce picada em varias strings, e olhar uma de cada vez perderia a
 * metade que importa.
 *
 * Vem com a posicao no arquivo porque as guardas de foco precisam saber QUEM
 * veste o bloco, e isso mora no `<Tag` logo acima dele.
 */
function blocksOf(code: string) {
  const blocks: { text: string; at: number }[] = [];
  for (let i = code.indexOf("cn("); i !== -1; i = code.indexOf("cn(", i + 1)) {
    let depth = 1;
    let end = i + 3;
    while (end < code.length && depth > 0) {
      if (code[end] === "(") depth += 1;
      else if (code[end] === ")") depth -= 1;
      end += 1;
    }
    blocks.push({ text: code.slice(i, end), at: i });
  }
  return blocks;
}

/**
 * Alem do `cn()`, a classe escrita direta no atributo: metade dos
 * `outline-none` da biblioteca mora em `className="..."` sem funcao nenhuma em
 * volta, e uma guarda que so olhasse `cn()` perderia justamente esses.
 */
function classAttributesOf(code: string) {
  return [...code.matchAll(/className="[^"]*"/g)].map((hit) => ({
    text: hit[0],
    at: hit.index!,
  }));
}

/** A linha de uma posicao, para a mensagem apontar onde doi. */
function lineAt(code: string, at: number) {
  return code.slice(0, at).split("\n").length;
}

/**
 * Quem veste o bloco: o nome da peca da Base UI no `<Tag` mais proximo acima,
 * ou o nome da constante quando o bloco e um `const X = cn(...)` reaproveitado.
 */
function ownerOf(code: string, at: number) {
  const before = code.slice(0, at);
  const assigned = /(?:const|let)\s+([A-Za-z0-9_]+)\s*=\s*$/.exec(before.slice(-120));
  if (assigned) return assigned[1]!;

  const tag = [...before.matchAll(/<([A-Za-z][\w.]*)/g)].pop();
  return tag?.[1] ?? "?";
}

test("a fronteira de um controle de formulario nunca veste a borda fraca", async () => {
  // O recorte e estreito de proposito, e e o que separa campo de cartao: uma
  // superficie de campo (`bg-surface`), com borda inteira em volta e anel de
  // foco proprio. Cartao nao tem anel; divisoria interna e `border-r` e nao
  // `border`; amostra de cor e botao de pagina nao tem `bg-surface`. Nenhum
  // dos tres entra aqui, e todos eles usam o border comum com razao.
  const weak: string[] = [];

  for await (const file of new Glob("src/components/*.tsx").scan(".")) {
    const code = await Bun.file(file).text();
    for (const { text: block } of blocksOf(code)) {
      const isField = block.includes("bg-surface") && /focus-(visible|within):ring-2/.test(block);
      if (isField && CONTROL_ROOT.test(block)) weak.push(file);
    }
  }

  expect(weak).toEqual([]);
});

/* ---------------------------------------------------------------------------
 * Guarda do contorno apagado sem reposicao.
 *
 * `outline-none` nao e "sem estilo": e a remocao ativa do unico sinal de foco
 * que o navegador da de graca. Quem apaga tem que repor, e quatro pecas nao
 * repunham - o gatilho de menu, o painel de aba, a superficie do grafico e o
 * exemplo publicado da barra de menus. Todas passavam no `check:contrast`, que
 * mede COR e nao mede ausencia; e todas so apareciam com o Tab numa mao e a
 * arvore de acessibilidade na outra.
 *
 * O que a guarda cobra e a reposicao no MESMO bloco de classe: o anel pode ser
 * `focus-visible:`, `focus:`, `focus-within:` ou o `data-[highlighted]:` que a
 * Base UI acende no item de menu percorrido pela seta.
 * ------------------------------------------------------------------------- */

/**
 * Onde as duas guardas de classe olham: a biblioteca e os exemplos publicados.
 *
 * O exemplo conta tanto quanto a peca - quem le a documentacao copia o que ve,
 * e foi assim que a barra de menus saiu sem anel de foco em toda organizacao
 * que a montou.
 */
const AREAS = ["src/**/*.tsx", ".design-sync/previews/*.tsx"];

/** Alguma coisa acende quando o foco chega. */
const FOCUS_PAINTS =
  /focus-visible|focus-within|has-\[input:focus|focus:|data-\[highlighted\]|data-\[selected\]/;

/**
 * O que o Tab nao alcanca, e por isso nao deve nada a 2.4.7.
 *
 * `Popup`, `Positioner`, `Portal`, `Backdrop` e `Viewport` sao a casca do que
 * flutua: quem manda foco para dentro deles e a Base UI, por codigo, e um anel
 * em volta de um dialogo inteiro so acrescentaria ruido.
 *
 * `ContextMenuTrigger` esta aqui por um motivo diferente e vale conferir se a
 * Base UI mudar: ela o renderiza como `div` sem `tabIndex`
 * (`context-menu/trigger/ContextMenuTrigger.js`), entao o `outline-none` dele
 * e letra morta - nao ha foco para apagar.
 *
 * `input` e o campo de texto: quem mostra o foco ali e o cursor piscando, e
 * nesta biblioteca o anel e desenhado pela moldura em volta
 * (`has-[input:focus-visible]` no TagsInput, `focus-within` no InputGroup).
 */
const OUT_OF_TAB_ORDER =
  /(Popup|Positioner|Portal|Backdrop|Viewport|floatingPanel)$|^input$|Input$|ContextMenu\.Trigger$/;

/*
 * A guarda nasceu com uma divida declarada numa lista: o `PopoverTrigger`
 * repetia a forma do `MenuTrigger` - `cn("outline-none", className)` - e o
 * arquivo pertencia a outro trabalho em curso na mesma arvore. Ele foi
 * consertado, a lista esvaziou e saiu junto: lista de excecao que sobrevive a
 * ultima excecao nao guarda nada, so ensina que ha um lugar onde se pode
 * escrever o proximo `outline-none` nu.
 */

test("quem apaga o contorno do foco repoe alguma coisa no lugar", async () => {
  const naked: string[] = [];

  // `dot: true` porque os exemplos publicados moram em `.design-sync/`, e sem
  // isso o Glob pula a pasta inteira em silencio - a guarda passaria verde
  // exatamente sobre o arquivo que a auditoria pegou.
  for (const area of AREAS) {
    for await (const file of new Glob(area).scan({ cwd: ".", dot: true })) {
      const code = await Bun.file(file).text();

      for (const { text, at } of [...blocksOf(code), ...classAttributesOf(code)]) {
        if (!/\boutline-none\b/.test(text) || FOCUS_PAINTS.test(text)) continue;

        const owner = ownerOf(code, at);
        if (OUT_OF_TAB_ORDER.test(owner)) continue;

        naked.push(
          `${file}:${lineAt(code, at)}  <${owner}> apaga o contorno do foco e nao repoe nenhum`,
        );
      }
    }
  }

  expect(naked).toEqual([]);
});

/* ---------------------------------------------------------------------------
 * Guarda do `motion-reduce` derrotado pela especificidade.
 *
 * `data-[indeterminate]:animate-indeterminate` compila como
 * `.classe[data-indeterminate]` - (0,2,0). `motion-reduce:animate-none`
 * compila como `.classe` dentro de uma media query - (0,1,0), porque media
 * query nao soma especificidade. O segundo NUNCA ganha do primeiro, em nenhuma
 * ordem, e a barra indeterminada girou meses na cara de quem pediu menos
 * movimento com a classe certa escrita ali do lado.
 *
 * E a mesma familia do `check:grupos`: o seletor existe, gera CSS, e nao casa
 * nunca. O conserto e repetir a variante de dado na regra de movimento -
 * `motion-reduce:data-[indeterminate]:animate-none` -, que iguala a
 * especificidade e vence pela ordem.
 * ------------------------------------------------------------------------- */

/** `motion-reduce:animate-none`, `motion-reduce:transition-none`. */
const CALM = /(?:^|["'\s])motion-reduce:([a-z]+)-none(?=["'\s]|$)/g;

/** `data-[indeterminate]:animate-indeterminate`, `data-[open]:duration-500`. */
const UNDER_DATA = /data-\[[^\]]+\]:([a-z]+)-[a-z0-9[]/g;

test("nenhum motion-reduce perde a especificidade para uma variante de dado", async () => {
  const defeated: string[] = [];

  for (const area of AREAS) {
    for await (const file of new Glob(area).scan({ cwd: ".", dot: true })) {
      const code = await Bun.file(file).text();

      for (const { text, at } of [...blocksOf(code), ...classAttributesOf(code)]) {
        const calm = new Set([...text.matchAll(CALM)].map((hit) => hit[1]!));
        if (calm.size === 0) continue;

        // So o que esta sob variante de dado disputa: o mesmo grupo de
        // propriedade escrito solto (`animate-spin` no Spinner) empata em
        // especificidade e perde pela ordem, que e o certo.
        const guarded = new Set([...text.matchAll(UNDER_DATA)].map((hit) => hit[1]!));

        for (const property of calm) {
          if (guarded.has(property)) {
            defeated.push(
              `${file}:${lineAt(code, at)}  motion-reduce:${property}-none nunca casa:` +
                ` perde de data-[...]:${property}-* por especificidade`,
            );
          }
        }
      }
    }
  }

  expect(defeated).toEqual([]);
});
