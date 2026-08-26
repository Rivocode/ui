import { expect, test } from "bun:test";

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
