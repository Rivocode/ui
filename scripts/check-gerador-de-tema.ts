/**
 * Guarda do gerador de tema do nativo - `rivocode-ui-native-theme`.
 *
 * O relato que fez o comando existir: um consumidor escreveu 220 linhas dentro
 * do app dele para vestir um cliente no React Native. Os 45 nomes de papel, os
 * pares de contraste, os minimos, a composicao de alfa e o formato de saida -
 * tudo isso e conhecimento da biblioteca, e estava morando fora dela. Pior: ele
 * portou a conta QUEBRADA. O `compose` da copia dele nao enxergava
 * `rgba(r,g,b,a)`, devolvia a string intacta, e o `contrastRatio` respondia
 * `NaN` - calado justo nos 12 dos 45 papeis que carregam alfa.
 *
 * O gerador fecha a porta pelo lado certo: o consumidor escreve so a paleta, e
 * a maquina emite o `@theme`. E ela RECUSA escrever tema que nao passa no
 * contraste, medindo com `native/scripts/contrast.mjs`, que e o mesmo motor do
 * `check:contrast:nativo`. Nao ha segunda conta.
 *
 * ## O que esta guarda cobra, e por que ela nao e o teste
 *
 * O teste (`test/gerador-de-tema-nativo.test.ts`) cobra o COMPORTAMENTO: as
 * recusas, a conta, o teto de dois temas. Esta guarda cobra o que envelhece
 * calado quando ninguem esta olhando para o gerador:
 *
 * 1. **A tabela de derivacao contra a lista de papeis.** A lista sai de
 *    `native/tokens.json`, que e GERADO do CSS por `bun run gen:native`. Papel
 *    novo em `src/tokens/` entra ali sozinho, o `check:native` fica verde, e o
 *    gerador publicado passa a nao saber vestir um tema completo. Do lado do
 *    consumidor isso vira uma recusa - que e o comportamento certo para ELE -,
 *    mas do nosso lado e uma versao que saiu sem o gerador acompanhar. Aqui o
 *    gate fica vermelho no commit que adiciona o papel, que e a hora em que a
 *    decisao "deriva de que?" custa cinco minutos em vez de uma versao.
 *
 *    Vale nos DOIS sentidos, como a conferencia de papeis do
 *    `check-contrast-nativo`: nome na tabela que nao e papel do mapa cobra do
 *    consumidor um papel que o `@theme` nunca le.
 *
 * 2. **A declaracao do binario.** `bin` sem a linha, ou `files` sem `scripts`,
 *    publica um comando que ninguem consegue rodar - e nada no `bun test`
 *    acusa, porque o pacote instalado nao e o que os testes importam.
 *
 * 3. **Uma passada verde de ponta a ponta**, com paleta de OITO sementes e mais
 *    nada. E o unico jeito de saber que as 37 derivacoes ainda produzem um tema
 *    que passa no contraste: elas sao alfa e mistura sobre cor que o consumidor
 *    escreveu, e um numero trocado na escada de alfa reprova um par sem mudar
 *    uma linha de codigo do gerador.
 */
import { mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GENERATOR = "native/scripts/build-theme.mjs";
const COMMAND = "rivocode-ui-native-theme";

const generator = (await import(`${import.meta.dir}/../${GENERATOR}`)) as {
  ROLES: string[];
  SEEDS: string[];
  DERIVED: string[];
  EXPLAIN: Record<string, string>;
};

const { ROLES, SEEDS, DERIVED, EXPLAIN } = generator;

const problems: string[] = [];

const pkg = (await Bun.file("native/package.json").json()) as {
  bin?: Record<string, string>;
  files?: string[];
};

if (pkg.bin?.[COMMAND] !== GENERATOR.replace("native/", "")) {
  problems.push(
    `native/package.json nao declara \`${COMMAND}\` em \`bin\`.\n` +
      `    Sem a linha, \`npx ${COMMAND}\` nao existe para quem instala, e o\n` +
      "    consumidor volta a escrever a conta a mao no app dele - que e o\n" +
      "    relato que fez este comando existir.",
  );
}

for (const needed of ["scripts", "tokens.json"]) {
  if (!pkg.files?.includes(needed)) {
    problems.push(
      `native/package.json nao publica \`${needed}\` em \`files\`.\n` +
        "    O gerador vive em `scripts/` e le a lista de papeis de `tokens.json`:\n" +
        "    sem os dois no pacote, o comando quebra na primeira linha, no\n" +
        "    computador de quem instalou.",
    );
  }
}

const executable = (statSync(GENERATOR).mode & 0o111) !== 0;
if (!executable) {
  problems.push(
    `${GENERATOR} nao tem bit de execucao.\n` +
      "    O npm preserva o modo do arquivo, e `bin` sem `+x` falha com\n" +
      "    `permission denied` - medido, e nao suposto: foi assim que a primeira\n" +
      "    chamada pelo `node_modules/.bin` deste comando terminou.",
  );
}

const known = new Set([...SEEDS, ...DERIVED]);
const orphans = ROLES.filter((role) => !known.has(role));
if (orphans.length > 0) {
  problems.push(
    `${orphans.length} papel(eis) de native/tokens.json que o gerador nao sabe vestir:\n` +
      orphans.map((role) => `    ${role}`).join("\n") +
      "\n\n    Ou entra em `SEEDS` - e passa a ser cobrado do consumidor -, ou ganha\n" +
      "    linha numa das tabelas de derivacao do gerador. Papel fora das duas sai\n" +
      "    numa versao nova como recusa na maquina de quem instalou.",
  );
}

const invented = [...known].filter((role) => !ROLES.includes(role));
if (invented.length > 0) {
  problems.push(
    `${invented.length} nome(s) nas tabelas do gerador que o mapa de papeis nao tem:\n` +
      invented.map((role) => `    ${role}`).join("\n") +
      "\n\n    O gerador cobra do consumidor o que esta nas tabelas dele. Nome errado\n" +
      "    ali cobra um papel que o `@theme` nunca le, e o tema do cliente reprova\n" +
      "    por nada.",
  );
}

const mute = DERIVED.filter((role) => (EXPLAIN[role]?.length ?? 0) < 10);
if (mute.length > 0) {
  problems.push(
    `${mute.length} papel(eis) derivado(s) sem uma linha dizendo de onde saem:\n` +
      mute.map((role) => `    ${role}`).join("\n") +
      "\n\n    O `--papeis` e a unica documentacao que anda junto com a versao\n" +
      "    instalada. Derivacao sem explicacao e cor que ninguem sabe de onde veio.",
  );
}

const bench = mkdtempSync(join(tmpdir(), "rivocode-gerador-de-tema-"));
const palette = join(bench, "semente.mjs");
const output = join(bench, "semente.theme.css");

writeFileSync(
  palette,
  "export const semente = {\n" +
    '  light: { bg: "#ffffff", surface: "#ffffff", fg: "#111111", accent: "#1d4ed8",' +
    ' success: "#0f6b52", warning: "#7a4a00", danger: "#b3261e", info: "#1d4ed8" },\n' +
    '  dark: { bg: "#101314", surface: "#191d1f", fg: "#f2f3f0", accent: "#8ab4f8",' +
    ' success: "#3ddc97", warning: "#f2b21c", danger: "#ff8a8a", info: "#8ab4f8" },\n' +
    "};\n",
);

const runtime = Bun.which("node") ?? "bun";
const shell = Bun.spawn([runtime, GENERATOR, palette, output], { stdout: "pipe", stderr: "pipe" });
const said =
  (await new Response(shell.stdout).text()) + (await new Response(shell.stderr).text());
const code = await shell.exited;

if (code !== 0) {
  problems.push(
    `A paleta de ${SEEDS.length} sementes nao gera mais um tema aprovado:\n` +
      said.replace(/^/gm, "    ") +
      "\n    A escada de alfa e as misturas do gerador derivam 37 papeis sobre cor\n" +
      "    que o consumidor escreveu. Se elas param de passar, a promessa do\n" +
      `    comando - "escreva ${SEEDS.length} papeis" - deixou de valer.`,
  );
} else {
  const css = await Bun.file(output).text();
  const emitted = [...css.matchAll(/^ {2}--color-([\w-]+):\s*(.+);$/gm)];
  const names = emitted.map(([, role]) => role!);

  const holes = ROLES.filter((role) => !names.includes(role));
  if (holes.length > 0) {
    problems.push(
      `${holes.length} papel(eis) que o gerador nao escreveu no \`@theme\`:\n` +
        holes.map((role) => `    ${role}`).join("\n") +
        "\n\n    Papel ausente do CSS nao da erro: a classe cai no valor do\n" +
        "    `@rivocode/ui-native/theme.css` importado antes, e a tela sai\n" +
        "    misturada - metade do cliente, metade nossa.",
    );
  }

  const strange = emitted
    .filter(([, , value]) => !/^(#[\da-f]{6}|rgba?\(|light-dark\()/i.test(value!.trim()))
    .map(([, role, value]) => `    ${role}: ${value}`);
  if (strange.length > 0) {
    problems.push(
      `${strange.length} valor(es) que o compilador nativo nao le:\n` +
        strange.join("\n") +
        "\n\n    O `react-native-css` crava a cor dentro da regra: o que sai daqui tem\n" +
        "    que ser sRGB literal, ou um `light-dark()` com dois sRGB dentro.",
    );
  }

  if (!css.includes("@theme {")) {
    problems.push(
      "O CSS gerado nao tem bloco `@theme`.\n" +
        "    E ele que o Tailwind 4 materializa, e e por isso que o tema do cliente\n" +
        "    sobrescreve o da RivoCode: dois `@theme` se juntam, e o ultimo vence.",
    );
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`${problem}\n`);
  process.exit(1);
}

console.log(
  `\`${COMMAND}\` em dia: ${SEEDS.length} sementes, ${DERIVED.length} papeis derivados,` +
    ` ${ROLES.length} no \`@theme\`. Uma paleta de ${SEEDS.length} valores por esquema` +
    " gera um tema aprovado no contraste, medido com o motor do check:contrast:nativo.",
);
