/**
 * Os numeros do `docs/ESTADO.md`, escritos pelas guardas que os medem.
 *
 * O ESTADO e o retrato do repositorio: versao de cada manifesto, passos do
 * gate, testes, pares de contraste, props, gzip de cada entrada, paridade com
 * o nativo, retratos, listas de divida. Ele foi escrito a mao em 25/09/2026, e
 * em 07/10 quase todo numero dele estava errado - 37 passos em vez de 38,
 * `@rivocode/ui` 1.0.0 em vez de 1.2.2, 3096 testes em vez de 3368 - sem nada
 * acusar. Precisou de uma pessoa rodar o gate inteiro e reescrever a mao. E o
 * mais irritante: cada um desses numeros JA saia de uma guarda, que o imprimia
 * no terminal a cada `bun run check`. O arquivo duplicava a saida delas sem
 * conferir nada.
 *
 * Agora o que esta entre `<!-- gerado: <bloco> -->` e `<!-- /gerado -->` sai
 * daqui, como `component-props.json` sai do `gen:props`. O texto fora dos
 * marcadores - decisao, historia, o que precisa de rede - continua a mao, com
 * a data em que foi medido.
 *
 * ## De onde vem cada numero
 *
 * De cada guarda, rodada pelo MESMO comando do `scripts.check`, com
 * `RC_MEDIDA` apontando para um arquivo onde ela escreve o que acabou de medir
 * (`scripts/medida.ts`). Nao ha segunda conta feita aqui ao lado: se houvesse,
 * ela poderia discordar da guarda, e o ESTADO voltaria a dizer uma coisa
 * enquanto o gate mede outra. Tambem nao se le a frase do terminal - frase
 * muda de redacao, e regex sobre ela e a proxima verificacao que passa sem
 * medir. Guarda que sai com erro, ou que sai verde sem entregar medida, para
 * a corrida com o nome dela.
 *
 * O unico numero que nao vem de guarda e o de passos do gate, que e a
 * contagem do proprio `scripts.check`.
 *
 * ## O que NAO entra
 *
 * Versao no npm, tag do `origin`, segredo do GitHub: precisam de rede, e o
 * gate nao pode depender dela. Ficam a mao, com a data. O total de `expect` da
 * suite tambem nao: nenhuma guarda o mede, e conta-lo exigiria rodar a suite
 * inteira uma segunda vez.
 *
 * Rodar:
 *
 *   bun run gen:estado      reescreve os blocos
 *   bun run check:estado    so confere, para o gate
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { Measure } from "./medida";

const TARGET = "docs/ESTADO.md";

const GUARDS = [
  "check:props",
  "check:nomes",
  "check:comentarios",
  "check:colors",
  "check:opacidade",
  "check:contrast",
  "check:contrast:nativo",
  "check:native:contrast",
  "check:temas",
  "check:doc",
  "check:exemplos",
  "check:readme",
  "check:classes",
  "check:grupos",
  "check:chart",
  "check:cli",
  "check:tamanho",
  "check:skill",
  "check:lista-skill",
  "check:tema:nativo",
  "check:compartilhado",
  "check:paridade",
  "check:assinatura",
  "check:pecas",
  "check:demo",
  "check:retratos",
  "check:receita",
  "check:scripts",
  "check:piso",
  "check:testes",
  "check:mcp",
] as const;

type Guard = (typeof GUARDS)[number];
type Measures = Record<Guard, Measure>;

/* --------------------------------------------------------------------------
 * Medir
 * ----------------------------------------------------------------------- */

async function measureAll(): Promise<Measures> {
  const folder = mkdtempSync(join(tmpdir(), "rc-estado-"));
  const failures: string[] = [];

  try {
    const results = await Promise.all(
      GUARDS.map(async (guard) => {
        const target = join(folder, `${guard.replaceAll(":", "-")}.json`);
        const run = Bun.spawn(["bun", "run", guard], {
          env: { ...process.env, RC_MEDIDA: target },
          stdout: "pipe",
          stderr: "pipe",
        });
        const [code, out, err] = await Promise.all([
          run.exited,
          new Response(run.stdout).text(),
          new Response(run.stderr).text(),
        ]);

        if (code !== 0) {
          failures.push(`\`${guard}\` saiu com ${code}:\n${(err || out).trim()}`);
          return [guard, {}] as const;
        }

        const text = await Bun.file(target)
          .text()
          .catch(() => undefined);
        if (text === undefined) {
          failures.push(
            `\`${guard}\` saiu verde e nao entregou medida.\n` +
              "    A guarda tem que chamar `report` de scripts/medida.ts antes da frase final;\n" +
              "    sem isso o ESTADO escreveria um numero que ninguem mediu.",
          );
          return [guard, {}] as const;
        }

        return [guard, JSON.parse(text) as Measure] as const;
      }),
    );

    if (failures.length > 0) {
      console.error(`${failures.length} guarda(s) sem medida para o ${TARGET}:\n`);
      for (const failure of failures) console.error(`  ${failure}\n`);
      process.exit(1);
    }

    return Object.fromEntries(results) as Measures;
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}

/* --------------------------------------------------------------------------
 * Escrever
 * ----------------------------------------------------------------------- */

type Align = "left" | "right";

function table(header: string[], rows: string[][], align: Align[] = []) {
  const widths = header.map((cell, column) =>
    Math.max(cell.length, 3, ...rows.map((row) => row[column]!.length)),
  );
  const pad = (cell: string, column: number) =>
    align[column] === "right" ? cell.padStart(widths[column]!) : cell.padEnd(widths[column]!);
  const line = (cells: string[]) => `| ${cells.map(pad).join(" | ")} |`;
  const rule = widths.map((width, column) =>
    align[column] === "right" ? `${"-".repeat(width - 1)}:` : "-".repeat(width),
  );

  return [line(header), `| ${rule.join(" | ")} |`, ...rows.map(line)].join("\n");
}

const code = (text: string) => `\`${text}\``;
const kb = (bytes: number) => (bytes / 1024).toFixed(1).replace(".", ",");
const plain = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "");

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

function names(list: string[], limit = 6) {
  if (list.length === 0) return "vazia";
  if (list.length <= limit) return list.map(code).join(", ");
  return `${list.slice(0, 3).map(code).join(", ")} e mais ${list.length - 3}`;
}

function gateSteps() {
  const manifest = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };
  const steps = manifest.scripts.check!.split("&&").map((step) => step.trim());
  if (steps.at(-1) !== "bun test") {
    console.error("O `scripts.check` nao termina mais em `bun test`, e o ESTADO conta assim.");
    process.exit(1);
  }
  return steps.length;
}

const BLOCKS: Record<string, (m: Measures) => string> = {
  packages: (m) => {
    const versions = m["check:mcp"] as { web: string; native: string; mcp: string };
    return table(
      ["Pacote", "Onde", "Manifesto"],
      [
        [code("@rivocode/ui"), code("src/"), versions.web],
        [code("@rivocode/ui-native"), code("native/"), versions.native],
        [code("@rivocode/ui-mcp"), code("mcp/"), versions.mcp],
      ],
    );
  },

  catalog: (m) => {
    const { pieces, documents, families } = m["check:pecas"] as {
      pieces: number;
      documents: number;
      families: Record<string, string[]>;
    };
    const rows = Object.entries(families)
      .map(([family, list]) => [plain(family), list.sort()] as const)
      .sort(([a, one], [b, other]) => other.length - one.length || a.localeCompare(b))
      .map(([family, list]) => [family, String(list.length), list.join(", ")]);

    return (
      `**${pieces} pecas** e **${documents} documentos** em \`.design-sync/docs/\`. ` +
      `A diferenca sao as **${documents - pieces} partes**.\n\n` +
      table(["Familia", "Qtd", "Pecas"], rows, ["left", "right", "left"])
    );
  },

  frontiers: (m) => {
    const { frontiers } = m["check:chart"] as { frontiers: number };
    return (
      `\`check:chart\` guarda **${frontiers} fronteiras** de subcaminho, nos dois pacotes, e ` +
      "`check:contrato` cobra que todo export de subcaminho esteja no `conventions.md` E na skill."
    );
  },

  native: (m) => {
    const { pieces, queue } = m["check:paridade"] as {
      pieces: Array<{ piece: string; state: string; native: string; note: string }>;
      queue: string[];
    };
    const of = (state: string) => pieces.filter((row) => row.state === state);
    const turned = of("vira")
      .map((row) => `${code(row.piece)} -> ${code(row.native)}`)
      .join(", ");
    const refused = of("nao");

    return (
      `Das ${pieces.length} pecas: **${of("traduz").length} traduzem** com o mesmo nome, ` +
      `**${of("vira").length} viram** outra (${turned}), ` +
      `**${refused.length} nao portam** por decisao escrita, e **${of("fila").length} estao na fila**. ` +
      `\`FILA_DECLARADA\` tem ${queue.length} ${plural(queue.length, "entrada", "entradas")}.\n\n` +
      `As ${refused.length} que nao portam, com a nota de cada uma em \`scripts/paridade-nativo.ts\`:\n\n` +
      table(
        ["Peca", "Por que nao"],
        refused.map((row) => [row.piece, plain(row.note)]),
      )
    );
  },

  signature: (m) => {
    const { rows, pieces, nativePieces, nativeProps } = m["check:assinatura"] as Record<
      string,
      number
    >;
    return (
      `\`check:assinatura\` confere **${rows} divergencias de assinatura em ${pieces} pecas** ` +
      `contra os dois catalogos de props - o do nativo, \`apps/docs/src/native-props.json\` ` +
      `(${nativePieces} pecas, ${nativeProps} props), e artefato comitado.`
    );
  },

  shared: (m) => {
    const { mirrored, copies } = m["check:compartilhado"] as {
      mirrored: number;
      copies: string[];
    };
    return (
      `**${mirrored} arquivos** espelhados de \`src/shared/\` e \`src/hooks/common/\` em ` +
      `\`native/\`, e ${copies.length} copias declaradas.`
    );
  },

  gate: (m) => {
    const steps = gateSteps();
    const tests = m["check:testes"] as { tests: number; files: number };
    const props = m["check:props"] as { entries: number; props: number };
    const colors = m["check:colors"] as { files: number };
    const opacity = m["check:opacidade"] as { uses: number; alphaMeasures: number };
    const contrast = m["check:contrast"] as {
      themes: number;
      pairsPerTheme: number[];
      fixedPairs: number;
    };
    const nativeContrast = m["check:contrast:nativo"] as {
      text: number;
      boundaries: number;
      layers: number;
      tinted: number;
      checked: number;
      withoutPair: string[];
    };
    const mirror = m["check:native:contrast"] as { lines: number };
    const themes = m["check:temas"] as { tokens: number; required: number };
    const doc = m["check:doc"] as { pages: number };
    const examples = m["check:exemplos"] as { names: number; entries: number };
    const readme = m["check:readme"] as { cited: number; pieces: number; declared: string[] };
    const classes = m["check:classes"] as { files: number };
    const groups = m["check:grupos"] as { groups: number };
    const cli = m["check:cli"] as { files: string[] };
    const size = m["check:tamanho"] as {
      entries: Array<{ name: string; bytes: number; limit: number }>;
    };
    const skill = m["check:skill"] as { props: number; nativeFiles: string[] };
    const skillList = m["check:lista-skill"] as { files: number };
    const nativeTheme = m["check:tema:nativo"] as {
      seeds: number;
      derived: number;
      theme: number;
    };
    const parity = m["check:paridade"] as { pieces: unknown[] };
    const count = m["check:pecas"] as { pieces: number };
    const demo = m["check:demo"] as {
      onStage: number;
      pieces: number;
      declared: string[];
      pages: number;
    };
    const shots = m["check:retratos"] as {
      sections: number;
      areas: number;
      cells: number;
      markers: number;
    };
    const recipe = m["check:receita"] as { files: number; directives: number; peers: number };

    const perTheme = [...new Set(contrast.pairsPerTheme)].join(" e ");
    const share = (entry: { bytes: number; limit: number }) =>
      Math.round((entry.bytes / entry.limit) * 100);
    const root = size.entries.find((entry) => entry.name === ".")!;
    const button = size.entries.find((entry) => entry.name.startsWith("Button"))!;
    const shares = size.entries.map(share);
    const closest = [...size.entries]
      .sort((a, b) => share(b) - share(a))
      .slice(0, 3)
      .map((entry) => `${code(entry.name === "." ? "." : entry.name)} em ${share(entry)}%`)
      .join(", ");
    const base = (file: string) => file.replace(/^.*\//, "").replace(/\.tsx?$/, "");

    const rows: Array<[string, string]> = [
      [
        "check:props",
        `${props.entries} entradas (pecas e partes), ${props.props} props; prop propria que colide com atributo herdado reprova`,
      ],
      ["check:colors", `${colors.files} arquivos sem cor literal fora de \`src/tokens/\``],
      [
        "check:opacidade",
        `${opacity.uses} usos de opacidade parcial, todos declarados, ${opacity.alphaMeasures} medidas de alfa`,
      ],
      [
        "check:contrast",
        `${perTheme} pares por tema, nos ${contrast.themes} temas, mais ${contrast.fixedPairs} de \`scales.css\``,
      ],
      [
        "check:contrast:nativo",
        `por esquema: ${nativeContrast.text} de texto, ${nativeContrast.boundaries} de 1.4.11, ` +
          `${nativeContrast.layers} de camada, ${nativeContrast.tinted} sobre tinta de serie, ` +
          `${nativeContrast.checked} do marcado; ${nativeContrast.withoutPair.length} papeis sem par`,
      ],
      [
        "check:native:contrast",
        `espelho \`native/scripts/contrast.mjs\` em dia, ${mirror.lines} linhas medidas iguais`,
      ],
      [
        "check:temas",
        `${themes.tokens} tokens de tema e forma, ${themes.required} papeis obrigatorios`,
      ],
      ["check:doc", `${doc.pages} paginas, todas com codigo`],
      [
        "check:exemplos",
        `nomes dos blocos \`tsx\` contra ${examples.names} nomes publicados por ${examples.entries} entradas`,
      ],
      [
        "check:readme",
        `${readme.cited} de ${readme.pieces} pecas citadas, ` +
          (readme.declared.length === 0
            ? "nenhuma declarada fora"
            : `${readme.declared.length} ${plural(readme.declared.length, "declarada", "declaradas")} fora`),
      ],
      ["check:classes", `${classes.files} arquivos, toda classe gera regra, sem lista de excecao`],
      [
        "check:grupos",
        `${groups.groups} grupos declarados, cada um consumido e cada consumo declarado; declaracao sem consumo reprova`,
      ],
      [
        "check:cli",
        `${cli.files.length} arquivos de mesa (${cli.files.map((file) => code(base(file))).join(", ")}) fora do grafo da biblioteca`,
      ],
      [
        "check:tamanho",
        `raiz ${kb(root.bytes)} de ${kb(root.limit)} KB gzip; \`Button\` sozinho ${kb(button.bytes)} de ${kb(button.limit)} KB; ` +
          `todas as entradas entre ${Math.min(...shares)}% e ${Math.max(...shares)}% do limite`,
      ],
      [
        "check:skill",
        `${skill.props} props citadas nos exemplos da skill, todas existentes; ` +
          `${skill.nativeFiles.map(code).join(", ")} contra a tabela do nativo`,
      ],
      [
        "check:lista-skill",
        `${skillList.files} arquivos de referencia, no indice e no laco \`curl\` do site`,
      ],
      [
        "check:tema:nativo",
        `${nativeTheme.seeds} sementes, ${nativeTheme.derived} derivados, ${nativeTheme.theme} no \`@theme\``,
      ],
      ["check:paridade", `${parity.pieces.length} pecas: a tabela e as paginas dizem o mesmo`],
      ["check:pecas", `${count.pieces}, igual ao README, ao \`package.json\` e a meta do site`],
      [
        "check:demo",
        `${demo.onStage} de ${demo.pieces} na vitrine, ${demo.declared.length} ${plural(demo.declared.length, "declarada", "declaradas")} fora` +
          (demo.declared.length ? ` (${demo.declared.map(code).join(", ")})` : "") +
          `, em ${demo.pages} paginas`,
      ],
      [
        "check:retratos",
        `${shots.sections} retratos de secao sobre ${shots.areas} areas, ${shots.cells} quadrados, ${shots.markers} marcadores no demo`,
      ],
      [
        "check:receita",
        `${recipe.files} arquivos, ${recipe.directives} diretivas de CSS, ${recipe.peers} peers, e nenhum Babel nos dois`,
      ],
    ];

    return (
      `\`bun run check\` sao **${steps} passos** - ${steps - 1} verificacoes mais \`bun test\` -, ` +
      "em sequencia, parando no primeiro que falhar.\n\n" +
      `A suite: **${tests.tests} testes em ${tests.files} arquivos**, a mesma conta que a home ` +
      "exibe (`TESTS` em `apps/docs/src/pages/home.tsx`, cobrado por `check:testes`).\n\n" +
      table(
        ["Guarda", "O que ela mede"],
        rows.map(([guard, said]) => [code(guard), said]),
      ) +
      `\n\nAs entradas mais perto do teto do \`check:tamanho\`: ${closest}.`
    );
  },

  shots: (m) => {
    const { shots, sections } = m["check:retratos"] as { shots: number; sections: number };
    return (
      `\`bun run shot\` tira **${shots} retratos** - ${shots - sections} de vitrine e ` +
      `${sections} de secao, as entradas de \`demo/assinaturas.json\`.`
    );
  },

  debts: (m) => {
    const opacity = m["check:opacidade"] as { declared: string[] };
    const byFile = new Map<string, number>();
    for (const item of opacity.declared) {
      const file = item.split(" ")[0]!;
      byFile.set(file, (byFile.get(file) ?? 0) + 1);
    }
    const opacityWho = [...byFile]
      .map(([file, total]) => (total > 1 ? `${code(file)} (${total})` : code(file)))
      .join(", ");

    const lists: Array<[string, Guard, string[], string?]> = [
      ["DEBT", "check:comentarios", (m["check:comentarios"] as { debt: string[] }).debt],
      ["DEBT", "check:nomes", (m["check:nomes"] as { debt: string[] }).debt],
      ["DEBT", "check:contrast:nativo", (m["check:contrast:nativo"] as { debt: string[] }).debt],
      ["FILA_DECLARADA", "check:paridade", (m["check:paridade"] as { queue: string[] }).queue],
      ["OUT", "check:piso", (m["check:piso"] as { out: string[] }).out],
      ["OUT_OF_README", "check:readme", (m["check:readme"] as { declared: string[] }).declared],
      ["SEM_VITRINE", "check:demo", (m["check:demo"] as { declared: string[] }).declared],
      ["DECLARADAS", "check:opacidade", opacity.declared, opacityWho],
      ["OUT", "check:scripts", (m["check:scripts"] as { out: string[] }).out],
      [
        "COPIA_DECLARADA",
        "check:compartilhado",
        (m["check:compartilhado"] as { copies: string[] }).copies,
      ],
    ];

    return table(
      ["Lista", "Guarda", "Tamanho", "Quem esta nela"],
      lists.map(([list, guard, items, who]) => [
        code(list),
        code(guard),
        String(items.length),
        who ?? names(items),
      ]),
      ["left", "left", "right", "left"],
    );
  },
};

/* --------------------------------------------------------------------------
 * Rodar
 * ----------------------------------------------------------------------- */

const MARKER = /<!-- gerado: ([a-z-]+) -->\n[\s\S]*?<!-- \/gerado -->/g;

const before = readFileSync(TARGET, "utf8");
const found = [...before.matchAll(MARKER)].map((match) => match[1]!);
const problems: string[] = [];

for (const name of Object.keys(BLOCKS)) {
  const times = found.filter((one) => one === name).length;
  if (times !== 1) {
    problems.push(
      `o bloco \`${name}\` aparece ${times} vez(es) em ${TARGET}, e tem que aparecer uma.\n` +
        `    Escreva \`<!-- gerado: ${name} -->\` e \`<!-- /gerado -->\` em linhas proprias onde ele mora.`,
    );
  }
}
for (const name of found) {
  if (!(name in BLOCKS)) {
    problems.push(`${TARGET} tem o marcador \`${name}\`, que nenhum bloco deste script escreve.`);
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`  ${problem}\n`);
  process.exit(1);
}

const measures = await measureAll();
const after = before.replace(
  MARKER,
  (_, name: string) => `<!-- gerado: ${name} -->\n${BLOCKS[name]!(measures)}\n<!-- /gerado -->`,
);

if (process.argv.includes("--check")) {
  if (after !== before) {
    const was = before.split("\n");
    const now = after.split("\n");
    console.error(`${TARGET} diz um numero que as guardas nao medem mais:\n`);
    for (let index = 0; index < Math.max(was.length, now.length); index++) {
      if (was[index] === now[index]) continue;
      if (was[index] !== undefined) console.error(`  - ${was[index]}`);
      if (now[index] !== undefined) console.error(`  + ${now[index]}`);
    }
    console.error(
      "\nRode `bun run gen:estado` e comite o resultado. O texto fora dos marcadores" +
        "\ne a mao, e o de dentro sai das guardas: editar dentro deles a mao e o que" +
        "\nfez o ESTADO de 25/09 envelhecer calado.",
    );
    process.exit(1);
  }
  console.log(
    `${TARGET} em dia: ${found.length} blocos, escritos pelo que ${GUARDS.length} guardas mediram agora.`,
  );
} else {
  if (after !== before) writeFileSync(TARGET, after);
  console.log(`${TARGET}: ${found.length} blocos escritos a partir de ${GUARDS.length} guardas.`);
}
