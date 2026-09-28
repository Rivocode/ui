/**
 * Language guard for code.
 *
 * The library writes to the screen in Portuguese and programs in English, and
 * the two used to get mixed: `PropsDeSelect` next to `ButtonProps`,
 * `const selecao` inside a file whose type is called `RowSelectionState`.
 * Whoever opens the file has to switch languages mid-line, and the public name
 * shipped half translated - which already cost two renames that broke the
 * contract.
 *
 * The rule: identifiers in English, always. Screen text stays in Portuguese,
 * which is where Portuguese serves.
 *
 * ## What it looks at
 *
 * The first version only matched DECLARATIONS - `const x`, `function x`,
 * `type X` - and so it let through the three most common ways a name is born
 * without a keyword in front:
 *
 *   - destructuring: `const [selection, setSelecaoInterna] = useState()`;
 *   - rest: `const { onChange, ...resto } = field`;
 *   - parameter, including the one in a public signature.
 *
 * The third was the expensive one. `onPageChange: (pagina: number) => void` is
 * a public prop: the parameter name goes into the `.d.ts`, comes out in the
 * props table the compiler generates and LEAKED into the published
 * documentation, where anyone reads `(pagina: number) => void` in a library
 * whose API is in English.
 *
 * ## How it knows the word is Portuguese
 *
 * Two ways, and the second exists because the first does not scale. The list
 * below knows the words this repository has already used - it does not know
 * Portuguese, and never will: `lado`, `busca` and `visto` only get in after
 * someone writes them. The suffix covers the rest without a list: no English
 * word ends in `-acao`, `-mento`, `-dade`, `-agem`, `-encia` or `-ivel`, so
 * `paginacao`, `deslocamento` and `disponivel` are caught the first time they
 * show up.
 */
import { scanAtLeast } from "./scan";

/** Where the rule applies: everything that is our code. */
const AREAS: [area: string, floor: number][] = [
  ["src/**/*.{ts,tsx}", 80],
  ["scripts/**/*.ts", 20],
  ["test/**/*.{ts,tsx}", 60],
  ["demo/*.tsx", 10],
  ["native/src/**/*.{ts,tsx}", 60],
  ["mcp/src/**/*.ts", 3],
  [".claude/skills/*/scripts/*.{ts,mts}", 1],
  ["apps/docs/src/**/*.{ts,tsx}", 20],
  ["apps/docs/*.ts", 1],
];

/**
 * The Portuguese words that have already shown up as identifiers here. Without
 * accents on purpose: identifiers carry no accents, and that is how they were
 * written.
 */
const PORTUGUESE = [
  "abertos",
  "acao",
  "acoes",
  "agentes",
  "ajuda",
  "alvos",
  "amostra",
  "antes",
  "aqui",
  "arquivo",
  "arvore",
  "assinaturas",
  "assistente",
  "atual",
  "aviso",
  "barra",
  "bloco",
  "blocos",
  "busca",
  "cabecalho",
  "caixa",
  "campo",
  "caractere",
  "catalogo",
  "celula",
  "centavos",
  "chave",
  "chaves",
  "circulo",
  "citado",
  "clientes",
  "colunas",
  "combina",
  "concluido",
  "conferir",
  "confirmar",
  "contrato",
  "controlado",
  "corpo",
  "dados",
  "descrever",
  "descricao",
  "destino",
  "dicionario",
  "digitos",
  "dividido",
  "entradas",
  "erro",
  "escrever",
  "escrito",
  "espia",
  "estado",
  "estados",
  "exemplo",
  "externo",
  "faixas",
  "faltando",
  "fatias",
  "filtro",
  "fim",
  "folha",
  "forma",
  "formas",
  "formulario",
  "fronteiras",
  "gatilho",
  "gerenciador",
  "grafico",
  "grupos",
  "guia",
  "icone",
  "inicio",
  "interna",
  "interno",
  "internos",
  "intervalo",
  "itens",
  "junto",
  "lado",
  "ler",
  "ligacoes",
  "linha",
  "linhas",
  "lista",
  "marca",
  "marcados",
  "meses",
  "misto",
  "modulo",
  "molde",
  "moldura",
  "montar",
  "mudar",
  "nomes",
  "nota",
  "notas",
  "novas",
  "novo",
  "numero",
  "onde",
  "opcao",
  "opcoes",
  "opcional",
  "ordem",
  "origem",
  "outros",
  "pagina",
  "paginas",
  "painel",
  "palavra",
  "palavras",
  "papel",
  "papeis",
  "parametro",
  "pasta",
  "peca",
  "pecas",
  "periodos",
  "pino",
  "pode",
  "porcento",
  "preso",
  "quantos",
  "rascunho",
  "receita",
  "repassadas",
  "resto",
  "reticencia",
  "retratos",
  "rodape",
  "rotulo",
  "selecao",
  "setores",
  "simbolo",
  "situacao",
  "situacoes",
  "sumiram",
  "tarja",
  "tema",
  "texto",
  "titulo",
  "traco",
  "trilha",
  "urgente",
  "valor",
  "valores",
  "varrer",
  "vazio",
  "veste",
  "visiveis",
  "visto",
  "vizinhos",
  "voltar",
];

/**
 * The endings only Portuguese produces.
 *
 * It serves the word nobody has listed yet, which is most of them. No English
 * word ends in `-acao`, `-mento`, `-dade`, `-agem`, `-encia`, `-ancia`,
 * `-ismo`, `-avel`, `-ivel` or `-inho`, so the false positive here is
 * theoretical, and the gain is concrete: `SEM_PAGINACAO`, `deslocamento` and
 * `disponivel` were caught the first time they showed up, without anyone
 * having foreseen any of the three.
 *
 * Six letters minimum so the suffix does not swallow a short word - `made`
 * ends in `-ade` but not in `-dade`, and the margin comes cheap.
 */
const PORTUGUESE_ENDING =
  /(?:acao|acoes|icao|icoes|ancia|encia|dade|mento|agem|ismo|avel|ivel|veis|inho|inha)$/;

/**
 * The debt left for later. Today: none.
 *
 * It was born with 22 lines - names the widened guard started flagging in
 * files another agent was rewriting at the same time. Leaving the guard off
 * until the dust settled would mean losing the guard; renaming on top of
 * someone else's work would mean losing the work. So the debt was written
 * down, with an address, and was paid in full later.
 *
 * The list stays here empty because the mechanism is what matters, not the
 * lines: the next collision between the guard and a file under construction
 * has a place to be noted without anyone reinventing the agreement. The
 * agreement is that it ONLY SHRINKS - an entry that no longer flags anything
 * is an error, and the guard says to delete the line. That is what keeps this
 * list from becoming the place where Portuguese names live.
 */
const DEBT = new Set<string>([]);

/**
 * The files that talk ABOUT Portuguese.
 *
 * An accent dictionary has `acao: "acao"` as data, not as a variable name -
 * flagging it would be the guard biting its own list. They are few and always
 * the same: the ones that translate, the ones that add accents, and the guard
 * itself.
 */
const DICTIONARIES = /check-names-in-english|scripts\/accents\.ts|accents\.test/;

/**
 * Erases everything that is prose from the code, preserving its length.
 *
 * Comments, strings and loose JSX text are where Portuguese is allowed - screen
 * text is Portuguese by contract - and they are exactly where the listed words
 * show up on purpose. Erasing by same-length substitution - a space per
 * character, line breaks intact - keeps every byte in place, and so the line
 * number is still the real file's.
 */
function withoutProse(code: string) {
  const chars = code.split("");
  const erase = (from: number, to: number) => {
    for (let at = from; at < to; at++) if (chars[at] !== "\n") chars[at] = " ";
  };

  for (const hit of code.matchAll(/\/\*[\s\S]*?\*\//g))
    erase(hit.index!, hit.index! + hit[0].length);
  for (const hit of code.matchAll(/\/\/[^\n]*/g)) erase(hit.index!, hit.index! + hit[0].length);

  // In two passes: a string is only a string after the comment is gone,
  // otherwise a quote inside a comment would open one that never closes.
  let clean = chars.join("");
  const inner = clean.split("");
  const eraseInner = (from: number, to: number) => {
    for (let at = from; at < to; at++) if (inner[at] !== "\n") inner[at] = " ";
  };

  for (const hit of clean.matchAll(/(["'`])(?:\\.|(?!\1)[\s\S])*?\1/g)) {
    eraseInner(hit.index! + 1, hit.index! + hit[0].length - 1);
  }

  clean = inner.join("");
  const last = clean.split("");
  // Loose JSX text: what sits between `>` and `<` with no brace in between.
  // Without this the `<p>Nenhuma pagina encontrada</p>` of a return is flagged.
  for (const hit of clean.matchAll(/>([^<>{}]*)</g)) {
    for (let at = hit.index! + 1; at < hit.index! + hit[0].length - 1; at++) {
      if (last[at] !== "\n") last[at] = " ";
    }
  }

  return last.join("");
}

/**
 * What comes after the colon is a TYPE, not a value.
 *
 * It is what separates `pagina: number` - a parameter, a name for people -
 * from `numero: "NF-001"` - the key of a data object, which may and should be
 * in Portuguese when the data is. Without this question the guard would flag
 * every demo fixture, and nobody would read its output again.
 */
const TYPE_AHEAD =
  /^\s*(?:readonly\s+)?(?:[A-Z([]|string\b|number\b|boolean\b|unknown\b|any\b|never\b|void\b|null\b|undefined\b|symbol\b|bigint\b|object\b|this\b|keyof\b|typeof\b|new\b)/;

/** Each way a name is born, and how to pull the name out of it. */
const BINDINGS = [
  /** `const x`, `function x`, `type X`. */
  {
    kind: "declaration",
    pattern: /\b(?:const|let|var|function|type|interface|class|enum)\s+([A-Za-z_$][\w$]*)/g,
  },
  /** `(pagina: number) => void`, and every type field. */
  { kind: "signature", pattern: /([A-Za-z_$][\w$]*)\s*\??\s*:/g, typed: true },
  /** `...resto`, in the parameter and in destructuring. */
  { kind: "rest", pattern: /\.\.\.([A-Za-z_$][\w$]*)/g },
  /** `const [a, setB] =` and `const { a, b: c } =`. */
  { kind: "pattern", pattern: /(?:const|let|var)\s*([[{][^=\n]*?[\]}])\s*=/g, split: true },
] as const;

/**
 * The word has to match whole, not by piece: `Format` is not `forma`,
 * `AlertDialog` is not `alerta`, and `formatDate` is not `data`. Matching by
 * piece turns the guard into a false-positive generator, and a guard that
 * cries wolf is turned off the following week.
 */
function portugueseWordIn(name: string): string | null {
  const parts = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s_]+/)
    .filter(Boolean);

  for (const part of parts) {
    const word = part.toLowerCase();
    if (PORTUGUESE.includes(word)) return word;
    if (word.length >= 6 && PORTUGUESE_ENDING.test(word)) return word;
  }
  return null;
}

/**
 * `const { pageIndex: atual, ...resto }` gives `atual` and `resto`: the local
 * name is the one after the colon when there is a rename, and the key when
 * there is not.
 */
function namesInPattern(pattern: string) {
  return pattern
    .split(",")
    .map((part) =>
      part
        .replace(/^[\s[{]+/, "")
        .replace(/[\s\]}]+$/, "")
        .replace(/^\.\.\./, "")
        .split(":")
        .pop()!
        .trim(),
    )
    .filter((name) => /^[A-Za-z_$][\w$]*$/.test(name));
}

const found: string[] = [];
const paid = new Set<string>();

for (const [area, floor] of AREAS) {
  for (const file of await scanAtLeast(area, floor, { dot: true })) {
    if (DICTIONARIES.test(file)) continue;

    const code = withoutProse(await Bun.file(file).text());
    const seen = new Set<string>();

    for (const binding of BINDINGS) {
      for (const hit of code.matchAll(binding.pattern)) {
        const after = code.slice(hit.index! + hit[0].length);
        if ("typed" in binding && !TYPE_AHEAD.test(after)) continue;

        const names = "split" in binding ? namesInPattern(hit[1]!) : [hit[1]!];

        for (const name of names) {
          if (seen.has(name)) continue;
          const word = portugueseWordIn(name);
          if (!word) continue;

          seen.add(name);
          const debt = `${file} ${name}`;
          if (DEBT.has(debt)) {
            paid.add(debt);
            continue;
          }

          const line = code.slice(0, hit.index!).split("\n").length;
          found.push(`  ${file}:${line}  ${name} (${word})`);
        }
      }
    }
  }
}

if (found.length > 0) {
  console.error(`${found.length} Portuguese identifier(s):\n`);
  for (const item of found) console.error(item);
  console.error(
    "\nThe library writes to the screen in Portuguese and programs in English." +
      "\nScreen text stays in Portuguese; the name does not." +
      "\n\nIn a public prop this does not stop at the file: the parameter name goes into" +
      "\nthe `.d.ts`, the props table and the documentation the site publishes.",
  );
  process.exit(1);
}

const stale = [...DEBT].filter((item) => !paid.has(item));
if (stale.length > 0) {
  console.error(`${stale.length} debt line(s) that no longer flag anything:\n`);
  for (const item of stale) console.error(`  "${item}",`);
  console.error(
    "\nThe name was renamed, and the debt was paid. Delete these line(s) from" +
      "\n`DEBT` in scripts/check-names-in-english.ts - an exception list that does" +
      "\nnot shrink becomes the place where the next Portuguese name hides.",
  );
  process.exit(1);
}

console.log(
  DEBT.size === 0
    ? "Every identifier in English, and no declared debt."
    : `Every identifier in English, except the ${DEBT.size} debts already declared.`,
);
