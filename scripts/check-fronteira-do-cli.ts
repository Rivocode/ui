/**
 * Guarda da fronteira da FERRAMENTA: o que existe para o `rivocode-ui` nao
 * pode entrar no bundle de quem usa a biblioteca.
 *
 * O `tsdown` tem quatro entradas, e `src/cli.ts` e uma delas. Isso quer dizer
 * que tudo que o CLI alcanca pousa em `dist/cli.js`, e nada disso pesa para
 * quem escreve `import { Button } from "@rivocode/ui"` - desde que nenhum
 * modulo alcancado pelos indices da biblioteca importe a mesma coisa. A palavra
 * "desde que" e a guarda: no dia em que isto foi medido a separacao era
 * verdadeira por ACIDENTE, e nao por regra. Nada impedia um
 * `import { contrastRatio } from "../lib/contrast"` dentro de um componente, e
 * a partir dele a tabela dos 45 papeis, os minimos e a prosa de cada par
 * viajariam para o navegador de todo mundo, uma vez por aplicacao.
 *
 * A conta de contraste e o caso que fez esta guarda existir. Ela acabou de sair
 * de `scripts/` - que nao esta em `files` de nenhum dos dois pacotes, e por
 * isso obrigava cada consumidor a portar a conta a mao - para `src/lib`, que e
 * publicado. O ganho e real e o risco e novo: em `scripts/` era fisicamente
 * impossivel um componente importar aquilo, e em `src/lib` passou a ser uma
 * linha. Mudanca que troca "impossivel" por "ninguem faria isso" pede guarda,
 * senao a prova de hoje envelhece calada.
 *
 * ## Ela le o grafo, e nao a pasta
 *
 * Proibir o import a partir de `src/components/**` pegaria o caminho obvio e
 * deixaria os outros: um `src/lib/x.ts` inocente importando a conta, e um
 * componente importando o `x`, e a conta esta no bundle sem ninguem ter escrito
 * o nome dela num componente. Entao a pergunta que a guarda faz e a mesma que o
 * empacotador faz - o modulo e ALCANCAVEL a partir de `src/index.ts`,
 * `src/form/index.ts` ou `src/chart/index.ts`? - e a resposta vem com o caminho
 * inteiro, para quem quebrou saber por onde.
 *
 * A segunda regra e o contrario da primeira, e existe para a guarda nao virar
 * decoracao: o modulo tem que continuar alcancavel a partir de `src/cli.ts`.
 * Modulo que ninguem alcanca passa nesta guarda com louvor, e o jeito mais
 * facil de deixar a primeira regra sempre verde e a ferramenta parar de usar o
 * que ela deveria usar.
 *
 * ## A terceira regra mede o artefato
 *
 * As duas de cima leem fonte, que e o que o gate tem. Como `bun run build` roda
 * depois do gate, o `dist/` de uma construcao anterior costuma estar ali - e
 * quando esta, a guarda procura em `dist/index.js` uma frase que so existe
 * dentro do modulo de ferramenta. E a unica das tres que responde pela pergunta
 * de verdade, que nao e "quem importa quem" e sim "o que o cliente baixa".
 * Sem `dist/`, ela diz que nao rodou em vez de calar.
 */
/**
 * O modulo de ferramenta, por que ele e ferramenta, e a frase que o denuncia
 * dentro do artefato.
 *
 * A `mark` e uma string literal, e nao um nome de funcao: nome sobrevive ao
 * empacotamento com sorte, e literal sobrevive sempre.
 */
export const TOOL_ONLY: Array<{ file: string; mark: string; why: string }> = [
  {
    file: "src/lib/contrast.ts",
    mark: "trilho, caixa e círculo marcados",
    why: "A conta da WCAG e as tabelas de pares. Servem ao `check-theme` e as duas guardas de contraste; nenhuma peca mede contraste em tempo de execucao, e a tabela dos 45 papeis com a prosa de cada par nao tem o que fazer no navegador de quem usa um Button.",
  },
  {
    file: "src/lib/theme-check.ts",
    mark: "Papel de tema sem consequência",
    why: "As consequencias escritas de cada papel faltando - paragrafos de portugues, um por papel. E material de diagnostico do CLI, e o que ele diagnostica e um tema que ainda nao subiu.",
  },
  {
    file: "src/tokens/theme-roles.ts",
    mark: "--rc-text-hero",
    why: "O catalogo de papeis que o `gen:temas` escreve a partir do CSS. Em tempo de execucao o navegador ja tem os papeis: eles sao o proprio CSS carregado. A lista existe para o CLI cobrar o tema de quem instala.",
  },
];

const LIBRARY = ["src/index.ts", "src/form/index.ts", "src/chart/index.ts"];
const TOOL = "src/cli.ts";

function importsOf(code: string) {
  const source = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  const found: string[] = [];
  for (const hit of source.matchAll(/(?:\bfrom|\bimport|\brequire)\s*\(?\s*["']([^"']+)["']/g)) {
    if (hit[1]!.startsWith(".")) found.push(hit[1]!);
  }
  return found;
}

async function resolve(from: string, request: string) {
  const base = new URL(request, `file:///${from}`).pathname.slice(1);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
    if (await Bun.file(candidate).exists()) return candidate;
  }
  return undefined;
}

/** De onde cada arquivo alcancado foi alcancado, para o caminho sair inteiro. */
async function reach(entries: string[]) {
  const from = new Map<string, string | undefined>();
  const queue: string[] = [];

  for (const entry of entries) {
    if (from.has(entry)) continue;
    from.set(entry, undefined);
    queue.push(entry);
  }

  while (queue.length > 0) {
    const file = queue.shift()!;
    const code = await Bun.file(file)
      .text()
      .catch(() => "");

    for (const request of importsOf(code)) {
      const target = await resolve(file, request);
      if (!target || from.has(target)) continue;
      from.set(target, file);
      queue.push(target);
    }
  }

  return from;
}

// A guarda so tem sentido se as entradas existirem: um caminho errado aqui
// deixaria as tres regras verdes sobre nada.
for (const entry of [...LIBRARY, TOOL]) {
  if (!(await Bun.file(entry).exists())) {
    console.error(
      `${entry} nao existe. As entradas desta guarda tem que ser as mesmas do` +
        " tsdown.config.ts, senao ela fica verde sobre nada.",
    );
    process.exit(1);
  }
}

const library = await reach(LIBRARY);
const tool = await reach([TOOL]);

const problems: string[] = [];

for (const item of TOOL_ONLY) {
  if (!(await Bun.file(item.file).exists())) {
    problems.push(
      `  ${item.file} nao existe mais.\n` +
        "    Apague a linha do `TOOL_ONLY` desta guarda, ou aponte para o novo\n" +
        "    endereco. Lista de excecao que nao encolhe vira o lugar onde o\n" +
        "    codigo morto mora.",
    );
    continue;
  }

  if (library.has(item.file)) {
    const path: string[] = [];
    for (let at: string | undefined = item.file; at; at = library.get(at)) path.unshift(at);
    problems.push(
      `  ${item.file} entrou no bundle da biblioteca:\n` +
        path.map((step, index) => `    ${"  ".repeat(index)}${step}`).join("\n") +
        `\n    ${item.why}`,
    );
  }

  if (!(await Bun.file(item.file).text()).includes(item.mark)) {
    problems.push(
      `  ${item.file} nao contem mais "${item.mark}".\n` +
        "    A `mark` e o que esta guarda procura em dist/index.js. Frase que\n" +
        "    saiu da fonte nunca aparece no bundle, e a linha fica verde sem\n" +
        "    olhar nada. Aponte para uma frase que o arquivo ainda tenha.",
    );
  }

  if (!tool.has(item.file)) {
    problems.push(
      `  ${item.file} nao e alcancado por ${TOOL}.\n` +
        "    Ou a ferramenta parou de usar o modulo - e ele e codigo morto -, ou\n" +
        "    a linha do `TOOL_ONLY` esta velha. Modulo que ninguem alcanca passa\n" +
        "    nesta guarda sem ela ter olhado nada.",
    );
  }
}

const bundle = await Bun.file("dist/index.js")
  .text()
  .catch(() => "");

if (bundle) {
  for (const item of TOOL_ONLY) {
    if (bundle.includes(item.mark)) {
      problems.push(
        `  dist/index.js carrega "${item.mark}", que so existe em ${item.file}.\n` +
          `    ${item.why}`,
      );
    }
  }
}

if (problems.length > 0) {
  console.error(
    `${problems.length} vazamento(s) de codigo de ferramenta para a biblioteca:\n\n` +
      problems.join("\n\n"),
  );
  console.error(
    "\nO `tsdown` tem `src/cli.ts` como entrada separada: o que so o CLI alcanca" +
      "\npousa em dist/cli.js e nao pesa para ninguem. Basta um import a partir de" +
      "\num modulo que os indices alcancam para desfazer isso, e o unico sintoma e" +
      "\no tamanho do bundle de quem instalou.",
  );
  process.exit(1);
}

const names = TOOL_ONLY.map((item) => item.file).join(", ");
const measured = bundle
  ? "e nenhuma frase deles esta em dist/index.js"
  : "e dist/index.js nao existe agora, entao a medida do artefato nao rodou - a leitura do grafo acima ja responde o mesmo pelo fonte";

console.log(`Fora do bundle da biblioteca, e dentro do ${TOOL}: ${names} - ${measured}.`);
