/**
 * O espelho da conta de contraste dentro do pacote nativo.
 *
 * A matematica e a tabela de pares moram em `src/lib/contrast.ts`, e de la elas
 * saem no `@rivocode/ui` porque o `tsdown` empacota `src/cli.ts` e o que o
 * grafo dele alcanca. O `@rivocode/ui-native` publica de outra forma: ele sai
 * como FONTE, e no tarball entra so o que esta fisicamente dentro de `native/`
 * - um import que suba acima da pasta resolve aqui e some la. Entao quem
 * instala apenas o pacote nativo nao alcanca `src/lib/contrast.ts` de jeito
 * nenhum, e o `checkThemeMap` - a funcao escrita justamente para o tema de
 * MAPA, que e a forma de tema que so o nativo tem - ficaria do lado de fora do
 * pacote que mais precisa dela.
 *
 * A saida e a que `native/tokens.ts` e `native/theme.css` ja usam, e nao um
 * segundo arquivo escrito a mao: fonte unica no web, espelho gerado e
 * versionado, e `bun run check` vermelho se o comitado divergir da fonte.
 * Espelhar a mao e como a copia do consumidor envelheceu calada - o `compose`
 * dele nao enxergava duas das tres sintaxes de alfa e o `contrastRatio`
 * respondia NaN, meses depois de o conserto ter entrado aqui.
 *
 * ## Por que a comparacao ignora espaco em branco
 *
 * O `.mjs` sai do `Bun.Transpiler`, que apaga os tipos e reimprime o codigo. O
 * que ele reimprime e estavel dentro de uma versao do Bun, e nao entre versoes
 * - e os quatro workflows desta casa instalam `bun-version: latest`. Uma
 * mudanca de formatacao do transpilador deixaria o gate vermelho na CI sem
 * ninguem ter tocado em uma linha do repositorio, e guarda que acusa o que nao
 * e defeito e desligada na segunda vez.
 *
 * Entao a guarda compara o CONTEUDO, sem espaco em branco. Ela continua pegando
 * o que importa - numero trocado, par apagado, arquivo editado a mao - e deixa
 * de pegar o que nao e nosso. Quem quiser o byte exato roda
 * `bun run gen:native:contrast`, que reescreve.
 */
import { checkThemeMap } from "../src/lib/contrast";

const SOURCE = "src/lib/contrast.ts";
const MIRROR = "native/scripts/contrast.mjs";

const BANNER = `/* Gerado de ${SOURCE} por bun run gen:native:contrast. Nao editar. */\n\n`;

const source = await Bun.file(SOURCE).text();
const wanted = BANNER + new Bun.Transpiler({ loader: "ts", target: "node" }).transformSync(source);

/** Sem espaco em branco: e o que a formatacao do transpilador pode mexer. */
const same = (one: string, other: string) => one.replace(/\s+/g, "") === other.replace(/\s+/g, "");

if (process.argv.includes("--check")) {
  const committed = await Bun.file(MIRROR)
    .text()
    .catch(() => "");

  if (!committed) {
    console.error(`${MIRROR} nao existe. Rode: bun run gen:native:contrast`);
    process.exit(1);
  }

  if (!same(committed, wanted)) {
    console.error(
      `${MIRROR} divergiu de ${SOURCE}. Rode: bun run gen:native:contrast\n\n` +
        `    O espelho e versionado porque o pacote nativo publica FONTE, e so\n` +
        `    sai no tarball o que esta dentro de native/.`,
    );
    process.exit(1);
  }

  const pkg = (await Bun.file("native/package.json").json()) as {
    files: string[];
    exports: Record<string, unknown>;
  };

  const problems: string[] = [];
  if (!pkg.files.includes("scripts")) {
    problems.push('    `files` nao inclui "scripts": o espelho nao entraria no tarball.');
  }
  if (pkg.exports["./contrast"] !== `./${MIRROR.replace("native/", "")}`) {
    problems.push(
      '    `exports` nao aponta "./contrast" para o espelho. Com o campo `exports`\n' +
        "    declarado, caminho fundo nao resolve: sem a linha, o arquivo viaja no\n" +
        "    tarball e ninguem consegue importa-lo.",
    );
  }

  if (problems.length > 0) {
    console.error(`native/package.json nao publica o espelho:\n${problems.join("\n")}`);
    process.exit(1);
  }

  // A prova de que o espelho MEDE, e nao so de que ele existe: o mesmo mapa
  // pelos dois caminhos tem que dar a mesma linha. Comparar texto pega o
  // arquivo editado; isto pega o arquivo que virou inerte.
  const { checkThemeMap: mirrored } = (await import(`../${MIRROR}`)) as {
    checkThemeMap: typeof checkThemeMap;
  };
  const { tokens } = await import("../native/tokens");
  const map = { light: tokens.themes["rivocode-light"], dark: tokens.themes["rivocode-dark"] };

  const here = checkThemeMap("prova", map).map((finding) => finding.line);
  const there = mirrored("prova", map).map((finding) => finding.line);

  if (here.join("\n") !== there.join("\n")) {
    console.error(
      `${MIRROR} responde diferente de ${SOURCE} no tema da casa.\n` +
        "    Rode: bun run gen:native:contrast",
    );
    process.exit(1);
  }

  console.log(`${MIRROR} em dia com ${SOURCE}, e mede igual: ${here.length} linha(s).`);
  process.exit(0);
}

await Bun.write(MIRROR, wanted);
console.log(`${MIRROR} escrito a partir de ${SOURCE}.`);
