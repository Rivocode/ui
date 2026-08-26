/**
 * As props de cada peca, lidas do compilador.
 *
 * A tabela de props e a parte da documentacao que apodrece primeiro, e ate
 * aqui ela saia de um snapshot de `.d.ts` que o sync do bundle deixou para
 * tras: o arquivo dizia `from @rivocode/ui@0.1.0`, e o site publicava as props
 * daquela versao. O que se perdia era sistematico, e nao caso a caso - o
 * snapshot nao trazia callback nenhum, entao metade das pecas controladas
 * aparecia sem `onValueChange`, sem `onOpenChange`, sem `onCheckedChange`. E
 * peca que mudou de forma desde entao aparecia como "nao tem prop propria",
 * tendo.
 *
 * Aqui quem responde e o proprio checker: para cada export que e componente,
 * o tipo do primeiro parametro, sem o que vem de `@types/react` - que e o
 * elemento raiz, e mora numa linha so no fim da tabela.
 *
 * `--check` falha quando o JSON versionado divergir dos tipos, e e ele que
 * entra no `bun run check`: assim a doc nao pode mais divergir em silencio.
 */
import { API, SignatureKind, SymbolFlags } from "typescript/unstable/async";

const RAIZ = process.cwd();
const TARGET = "apps/docs/src/component-props.json";

/** As entradas publicas do pacote. O que nao sai por elas nao e documentavel. */
const ENTRY_POINTS = ["src/index.ts", "src/form/index.ts", "src/chart/index.ts"];

/**
 * O que todo componente repassa ao elemento raiz. Fica numa linha so no fim da
 * tabela, em vez de repetido em 165 paginas.
 */
const FORWARDED = new Set(["className", "style", "id", "children"]);

export type CatalogProp = {
  name: string;
  type: string;
  required: boolean;
  note?: string;
  /**
   * A versao em que a prop apareceu no catalogo.
   *
   * Nao e escrita a mao: `--desde <versao>` carimba, no lancamento, tudo que
   * ainda nao tem carimbo. Assim a primeira versao em que a prop existiu e a
   * que fica registrada, e ninguem precisa lembrar de anotar - lembrar e
   * exatamente o que ninguem faz.
   *
   * Prop sem carimbo e prop que ainda nao saiu em versao nenhuma.
   */
  since?: string;
};

export type CatalogPiece = {
  /** Se ela aceita os atributos do elemento raiz alem das props proprias. */
  forwardsRoot: boolean;
  props: CatalogProp[];
};

/**
 * `boolean | undefined` numa linha que ja tem a coluna "Obrigatoria: nao" diz
 * a mesma coisa duas vezes, e a segunda ocupa a largura que o tipo precisa.
 */
function withoutUndefined(type: string, optional: boolean): string {
  if (!optional) return type;
  const clean = type.replace(/\s*\|\s*undefined\s*$/, "");
  return clean || type;
}

/** Uma linha so, sem quebra: a tabela da doc e a do site nao aceitam paragrafo. */
function firstSentence(text: string): string | undefined {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return undefined;
  const period = clean.indexOf(". ");
  return period === -1 ? clean : clean.slice(0, period + 1);
}

/**
 * Os carimbos que ja existem, lidos do proprio JSON comitado. Sem isto cada
 * geracao apagaria a memoria de quando cada prop nasceu.
 */
const previous: Record<string, CatalogPiece> = await Bun.file(TARGET)
  .json()
  .catch(() => ({}));

const stamped = (piece: string, prop: string) =>
  previous[piece]?.props.find((current) => current.name === prop)?.since;

async function readCatalog(): Promise<Record<string, CatalogPiece>> {
  const api = new API({ cwd: RAIZ });
  const snapshot = await api.updateSnapshot({ openProjects: [`${RAIZ}/tsconfig.json`] });
  const projeto = (await snapshot.getProjects())[0];
  if (!projeto) throw new Error("Nao consegui abrir o projeto do tsconfig.json.");

  const { checker, program } = projeto;
  const catalog: Record<string, CatalogPiece> = {};

  for (const entrada of ENTRY_POINTS) {
    const file = await program.getSourceFile(`${RAIZ}/${entrada}`);
    if (!file) throw new Error(`Nao achei ${entrada}.`);

    const module = await checker.getSymbolAtLocation(file);
    if (!module) throw new Error(`${entrada} nao resolveu como modulo.`);

    for (const [key, symbol] of await module.getExports()) {
      const name = String(key);
      // Componente comeca com maiuscula. Hook e utilitario tem outra forma de
      // documentacao, e forcar os dois na mesma tabela mente sobre os dois.
      if (!/^[A-Z]/.test(name) || catalog[name]) continue;

      const type = await checker.getTypeOfSymbol(symbol);
      if (!type) continue;

      const signatures = await checker.getSignaturesOfType(type, SignatureKind.Call);
      if (!signatures.length) continue;

      const parameter = await checker.getParameterType(signatures[0]!, 0);
      if (!parameter) continue;

      const all = await checker.getPropertiesOfType(parameter);
      const props: CatalogProp[] = [];
      let forwardsRoot = false;

      for (const prop of all) {
        const declaredIn = prop.declarations[0]?.path ?? "";
        // O que vem do React e o elemento raiz: 280 atributos de HTML que
        // dizem o mesmo em toda peca. A presenca deles e a resposta do
        // forwardsRoot, e nao linha de tabela.
        const fromReact = declaredIn.includes("@types/react");
        if (fromReact || FORWARDED.has(prop.name)) {
          if (prop.name === "className") forwardsRoot = true;
          continue;
        }

        const propType = await checker.getTypeOfSymbol(prop);
        const note = firstSentence(await prop.getDocumentationComment(checker));
        const optional = Boolean(prop.flags & SymbolFlags.Optional);
        const written = propType
          ? (await checker.typeToString(propType)).replace(/\s+/g, " ").trim()
          : "unknown";

        // O carimbo e memoria, e nao derivado do tipo: o compilador nao sabe
        // quando a prop nasceu, entao ele sobrevive de uma geracao a outra
        // vindo do proprio JSON comitado.
        const since = stamped(name, prop.name);

        props.push({
          name: prop.name,
          type: withoutUndefined(written, optional),
          required: !optional,
          ...(note ? { note: note } : {}),
          ...(since ? { since } : {}),
        });
      }

      // Obrigatoria antes de opcional, e alfabetica dentro de cada grupo: o
      // que quem chama precisa passar vem antes do que pode passar.
      props.sort((a, b) =>
        a.required === b.required ? a.name.localeCompare(b.name) : a.required ? -1 : 1,
      );

      catalog[name] = { forwardsRoot, props };
    }
  }

  await api.close();

  // Ordenado, para o arquivo nao trocar de linha a cada rodada e sujar o diff.
  return Object.fromEntries(Object.entries(catalog).sort(([a], [b]) => a.localeCompare(b)));
}

if (import.meta.main) {
  const catalog = await readCatalog();

  /*
   * O carimbo de lancamento.
   *
   * `bun run gen:props --desde 0.5.0` escreve a versao em toda prop que ainda
   * nao tem uma. E o unico momento em que a informacao existe: durante o
   * desenvolvimento ninguem sabe em que versao a prop vai sair, e adivinhar
   * produz um numero errado que a doc publica com confianca.
   */
  const stampArg = process.argv.indexOf("--desde");
  if (stampArg !== -1) {
    const version = process.argv[stampArg + 1];
    if (!version) {
      console.error("Falta a versao: bun run gen:props --desde 0.5.0");
      process.exit(1);
    }

    let stampedNow = 0;
    for (const piece of Object.values(catalog)) {
      for (const prop of piece.props) {
        if (prop.since) continue;
        prop.since = version;
        stampedNow++;
      }
    }

    await Bun.write(TARGET, `${JSON.stringify(catalog, null, 2)}\n`);
    console.log(`${stampedNow} prop(s) carimbada(s) com ${version}.`);
    process.exit(0);
  }
  const text = `${JSON.stringify(catalog, null, 2)}\n`;
  const checking = process.argv.includes("--check");

  if (checking) {
    const current = await Bun.file(TARGET)
      .text()
      .catch(() => "");

    if (current !== text) {
      console.error(`${TARGET} divergiu dos tipos. Rode: bun run gen:props`);

      const before: Record<string, CatalogPiece> = current ? JSON.parse(current) : {};
      for (const [piece, data] of Object.entries(catalog)) {
        const previous = new Set((before[piece]?.props ?? []).map((p) => p.name));
        const added = data.props.map((p) => p.name).filter((p) => !previous.has(p));
        const removed = [...previous].filter((p) => !data.props.some((current) => current.name === p));
        if (added.length) console.error(`  ${piece}: entrou ${added.join(", ")}`);
        if (removed.length) console.error(`  ${piece}: saiu ${removed.join(", ")}`);
      }
      process.exit(1);
    }

    const total = Object.values(catalog).reduce((sum, piece) => sum + piece.props.length, 0);
    console.log(`props em dia: ${Object.keys(catalog).length} pecas, ${total} props.`);
  } else {
    await Bun.write(TARGET, text);
    const total = Object.values(catalog).reduce((sum, piece) => sum + piece.props.length, 0);
    console.log(`${TARGET}: ${Object.keys(catalog).length} pecas, ${total} props.`);
  }
}
