import { expect, test } from "bun:test";
import { Glob } from "bun";

import { contrastRatio, readTokens } from "../scripts/check-contrast";

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
 */
function blocksOf(code: string) {
  const blocks: string[] = [];
  for (let i = code.indexOf("cn("); i !== -1; i = code.indexOf("cn(", i + 1)) {
    let depth = 1;
    let end = i + 3;
    while (end < code.length && depth > 0) {
      if (code[end] === "(") depth += 1;
      else if (code[end] === ")") depth -= 1;
      end += 1;
    }
    blocks.push(code.slice(i, end));
  }
  return blocks;
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
    for (const block of blocksOf(code)) {
      const isField = block.includes("bg-surface") && /focus-(visible|within):ring-2/.test(block);
      if (isField && CONTROL_ROOT.test(block)) weak.push(file);
    }
  }

  expect(weak).toEqual([]);
});
