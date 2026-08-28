/**
 * Guarda dos nomes citados nos exemplos de `.design-sync/docs/`.
 *
 * A pagina do `ChartContainer` ensinou, por meses, a chamar um
 * `useAreaGradient('faturado')` que NUNCA existiu: a funcao real e
 * `areaGradient(id, name)`, e o mesmo exemplo ainda esquecia o `id`
 * obrigatorio do `<ChartAreaGradient>`. Quem copiava do site nao compilava, e
 * o paragrafo logo abaixo do bloco explicava justamente o `id` que o bloco nao
 * passava - a pagina se contradizia a dois centimetros de distancia.
 *
 * Nada acusava. O `check:doc` confere que peca e pagina existem uma para a
 * outra, o `check:skill` confere as props citadas na SKILL, e o
 * `check:previews` compila `.design-sync/previews/`. O corpo das paginas, que
 * e o que a pessoa copia, nao passava por compilador nenhum.
 *
 * Ela nao compila os blocos: confere que todo `useAlgo(` e toda tag `<Algo`
 * citados existam na SUPERFICIE PUBLICA dos dois pacotes. Nome de fora que nao
 * e nosso - o `useState` do React, o `<Svg>` do react-native-svg, o `<Link>`
 * do roteador - mora em `FOREIGN`, e essa lista e fechada de proposito: ela
 * nomeia o que vem de biblioteca de terceiro, e NUNCA abriga excecao nossa.
 * Peca nossa citada errada se conserta na pagina ou no `index.ts`, jamais
 * aqui. O `<App />` que a pagina desenha como sendo do leitor tem lista
 * propria, `READER_CODE`, para `FOREIGN` continuar auditavel como lista de
 * terceiro.
 *
 * SEGUNDO EPISODIO, no MESMO dia 28/08/2026, e ele e o motivo de este bloco
 * ter dobrado de tamanho. Nascida de manha contra o `useAreaGradient`, a
 * guarda foi auditada a tarde por duas leituras independentes, e as duas
 * acharam a mesma coisa por caminhos diferentes: ela media o ARQUIVO, e nao o
 * `.d.ts` que o cliente recebe.
 *
 * O conjunto de nomes validos saia de um varrimento de `export function|const|
 * class` em TODO `src/**` e `native/src/**`. Nome interno de arquivo caia no
 * mesmo saco que nome de entrada do pacote, e um `as` no `index.ts` era
 * invisivel para ela. Duas paginas estavam no ar assim:
 *
 * - `Toolbar.md` ensinava `<ToolbarRoot>`; `src/index.ts` exporta
 *   `ToolbarRoot as Toolbar`.
 * - `Fieldset.md` ensinava `<FieldsetRoot>`; `src/index.ts` exporta
 *   `FieldsetRoot as Fieldset`.
 *
 * Quem copiava do site quebrava no primeiro build, com o empacotador dizendo
 * que `ToolbarRoot` nao e exportado por `@rivocode/ui`, e a guarda ficava VERDE
 * por cima - ela enxergava o `export function ToolbarRoot` no arquivo da peca e
 * dava por respondida uma pergunta que nunca chegou a fazer.
 *
 * O segundo buraco era o que escondia o primeiro: a varredura de tag so olhava
 * `<(Chart|Rivo)[A-Z]\w*`. `<ToolbarRoot>` e `<FieldsetRoot>` nao comecam por
 * nenhum dos dois prefixos, entao passavam sem ser lidos. Guarda estreita nao
 * acha nada e parece limpa.
 *
 * O conserto e um so, e vale para os dois: o conjunto vem das ENTRADAS - as
 * tres do web e as do campo `exports` de `native/package.json` -, com o `as`
 * ja resolvido, e a varredura le `<[A-Z]\w*`, qualquer componente. E a familia
 * "assercao que passa sem medir" do CLAUDE.md: guarda verde nao e guarda que
 * mediu, e o jeito de saber e quebrar de proposito o que ela deveria pegar.
 */
import { countAtLeast, scanAtLeast } from "./varredura";

/**
 * O que vem de biblioteca de terceiro e a pagina cita de propria vontade.
 *
 * A Recharts NAO mora aqui: `src/chart/index.ts` reexporta `<AreaChart>`,
 * `<Bar>`, `<XAxis>` e companhia, entao eles ja sao superficie publica nossa e
 * a guarda os alcanca sozinha pela entrada. Entrada aqui e confissao de que o
 * nome nasceu FORA dos dois pacotes, e nunca atalho para peca nossa citada
 * errada - essa se conserta na pagina ou no `index.ts`.
 */
export const FOREIGN = new Set([
  "useState",
  "useEffect",
  "useMemo",
  "useRef",
  "useCallback",
  "useId",
  "useTransition",
  "useDeferredValue",
  "useSyncExternalStore",
  "useLayoutEffect",
  "useForm",
  "Link",
  "Svg",
  "TriangleAlert",
]);

/**
 * O componente que a pagina desenha como sendo do LEITOR, e nao do catalogo.
 *
 * `<App />` e `<Invoices />` sao o buraco onde a pessoa encaixa a tela dela: o
 * exemplo perderia o sentido se citasse uma peca nossa ali. Nao entram em
 * `FOREIGN` porque nao vem de biblioteca nenhuma, e a separacao e o que
 * mantem `FOREIGN` auditavel como lista de terceiro.
 */
export const READER_CODE = new Set(["App", "Invoices"]);

export const WEB_ENTRIES = ["src/index.ts", "src/chart/index.ts", "src/form/index.ts"];

/**
 * As entradas do nativo saem do proprio manifesto, e nao de uma lista aqui:
 * subcaminho novo em `native/package.json` entra na conta no mesmo commit.
 */
export async function nativeEntries(): Promise<string[]> {
  const manifest: { exports?: Record<string, string> } =
    await Bun.file("native/package.json").json();
  const paths = Object.values(manifest.exports ?? {}).filter((path) => path.endsWith(".ts"));

  countAtLeast("entradas `.ts` no campo `exports` de native/package.json", paths.length, 4);

  return paths.map((path) => `native/${path.replace(/^\.\//, "")}`);
}

/**
 * O nome que a entrada PUBLICA, com o `as` ja resolvido.
 *
 * So o que sai pela entrada conta: `export function ToolbarRoot` no arquivo da
 * peca nao e importavel se o `index.ts` a publica como `Toolbar`. Ela le o
 * texto de UMA entrada, e e pura de proposito - a decisao inteira desta guarda
 * cabe em duas funcoes sem disco, e `test/exemplo-da-doc.test.ts` quebra as
 * duas de proposito para ver se elas mordem.
 */
export function namesFromEntry(text: string): string[] {
  const names: string[] = [];

  for (const found of text.matchAll(/export\s+(?:function|const|class|type|interface)\s+(\w+)/g)) {
    names.push(found[1]!);
  }

  for (const block of text.matchAll(/export\s*(?:type\s*)?\{([^}]*)\}/g)) {
    for (const piece of block[1]!.split(",")) {
      const name = piece
        .trim()
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/)
        .pop();
      if (name) names.push(name.trim());
    }
  }

  return names;
}

export type Cited = { hooks: string[]; tags: string[] };

/**
 * O que um bloco `tsx` cita: hook chamado e tag montada.
 *
 * O `<` de generico vem colado num identificador - `useForm<Values>`,
 * `Array<Item>` -, e o de tag nunca vem. Sem essa borda a guarda leria
 * parametro de tipo como se fosse componente, e o barulho desligaria a guarda.
 */
export function citedNames(code: string): Cited {
  const hooks = [...code.matchAll(/\b(use[A-Z]\w*)\s*\(/g)].map((found) => found[1]!);
  const tags = [...code.matchAll(/(?:^|[^A-Za-z0-9_$\]])<([A-Z]\w*)/gm)].map((found) => found[1]!);

  return { hooks, tags };
}

/** Os blocos `tsx` de uma pagina, que e o que a pessoa copia. */
export function tsxBlocks(page: string): string[] {
  return [...page.matchAll(/```tsx\n([\s\S]*?)```/g)].map((block) => block[1]!);
}

export async function publicNames(entries: string[]): Promise<Set<string>> {
  const names = new Set<string>();

  for (const entry of entries) {
    for (const name of namesFromEntry(await Bun.file(entry).text())) names.add(name);
  }

  return names;
}

async function main() {
  const entries = [...WEB_ENTRIES, ...(await nativeEntries())];
  countAtLeast("entradas publicas dos dois pacotes", entries.length, 8);

  const exported = await publicNames(entries);
  countAtLeast("nomes publicados pelas entradas dos dois pacotes", exported.size, 300);

  const problems: string[] = [];

  for (const file of await scanAtLeast(".design-sync/docs/*.md", 100, { dot: true })) {
    const page = await Bun.file(file).text();

    for (const code of tsxBlocks(page)) {
      const { hooks, tags } = citedNames(code);

      for (const name of hooks) {
        if (!FOREIGN.has(name) && !exported.has(name)) {
          problems.push(
            `${file}: o exemplo chama \`${name}()\`, que nenhuma entrada dos dois pacotes exporta.`,
          );
        }
      }

      for (const name of tags) {
        if (!FOREIGN.has(name) && !READER_CODE.has(name) && !exported.has(name)) {
          problems.push(
            `${file}: o exemplo monta \`<${name}>\`, que nenhuma entrada dos dois pacotes exporta.`,
          );
        }
      }
    }
  }

  const unique = [...new Set(problems)];

  if (unique.length > 0) {
    console.error("Exemplo de doc citando nome que nao existe:\n");
    for (const problem of unique) console.error(`  ${problem}`);
    console.error(
      "\nE o codigo que a pessoa copia da pagina publicada, e o que vale e o nome\n" +
        "que sai pela ENTRADA do pacote - `ToolbarRoot` no arquivo da peca nao se\n" +
        "importa se o `index.ts` a publica como `Toolbar`. Corrija o exemplo, ou\n" +
        "exporte o nome - nao acrescente excecao: `FOREIGN` e so para nome de\n" +
        "biblioteca de terceiro.",
    );
    process.exit(1);
  }

  console.log(
    `Exemplos de .design-sync/docs conferidos contra ${exported.size} nomes publicados por ${entries.length} entradas dos dois pacotes.`,
  );
}

if (import.meta.main) await main();
