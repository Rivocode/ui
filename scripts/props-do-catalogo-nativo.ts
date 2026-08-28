/**
 * As props de cada peca do pacote NATIVO, lidas do compilador.
 *
 * O web ja tinha a sua tabela em `apps/docs/src/component-props.json`, e o
 * nativo nao tinha nenhuma. A falta aparecia escrita numa guarda: o
 * `check:skill` exclui `reference/native.md` da conferencia de props com o
 * bilhete "enquanto o @rivocode/ui-native nao gerar tabela propria, este
 * arquivo fica de fora". Enquanto isso for verdade, tudo que a doc do nativo
 * afirma sobre prop e afirmacao que ninguem confere.
 *
 * Este arquivo gera a tabela que faltava. Quem a consome hoje e o
 * `scripts/assinatura-nativa.ts`, que compara as duas assinaturas peca a peca.
 *
 * ## Por que ele NAO entra no `bun run check`
 *
 * Pelo mesmo motivo do `check:native:types`, e o motivo esta no
 * `native/tsconfig.check.json`: react e react-native sao peers, e o unico
 * lugar do repositorio onde estao instalados e `examples/native`, que nao e
 * workspace. `bun install --frozen-lockfile` na raiz nunca o instala.
 *
 * E nao e que ele falharia sem eles - seria pior, ele passaria MENTINDO.
 * Medido em 28/08/2026, apontando o tsconfig para um mundo sem react-native:
 * as 82 pecas continuaram saindo, e dez perderam props. `Omit<TextInputProps,
 * ...> & { value; onValueChange }` com `TextInputProps` sem resolver colapsa,
 * e o `PasswordInput` apareceu com uma prop so. Uma tabela dessas no gate
 * seria uma guarda verde medindo o vazio.
 *
 * Por isso o desenho e o mesmo dos tokens nativos: a tabela e ARTEFATO
 * COMITADO. Quem gera precisa do app de exemplo instalado, e quem confere so
 * precisa do JSON. O `--check` roda no job `nativo` da CI, ao lado do
 * `check:native:types`, que ja instala `examples/native`.
 *
 * Rodar de novo:
 *
 *   bun install --frozen-lockfile          dentro de examples/native
 *   bun run gen:props:nativo               escreve
 *   bun run check:props:nativo             so confere, para a CI
 */
import { API, SignatureKind, SymbolFlags } from "typescript/unstable/async";

import { countAtLeast } from "./varredura";

const RAIZ = process.cwd();
const TARGET = "apps/docs/src/native-props.json";
const PROJECT = "native/tsconfig.check.json";

/** Os cinco indices do pacote. Os mesmos que a tabela de paridade mede. */
const ENTRY_POINTS = [
  "native/src/index.ts",
  "native/src/form/index.ts",
  "native/src/chart/index.ts",
  "native/src/clipboard/index.ts",
  "native/src/file-upload/index.ts",
];

/**
 * O piso de pecas e de props.
 *
 * Sem ele o modo `--check` compara vazio com vazio no dia em que o tsconfig
 * mudar de nome ou o `paths` do exemplo parar de resolver, e sai verde. E a
 * mesma familia de defeito que o `scripts/varredura.ts` descreve, so que aqui
 * quem varre e o compilador.
 */
const PIECE_FLOOR = 60;
const PROP_FLOOR = 250;

export type NativeProp = {
  name: string;
  type: string;
  required: boolean;
  note?: string;
};

export type NativePiece = {
  /** O indice por onde a peca sai: a raiz, `/form`, `/chart`, `/clipboard`, `/file-upload`. */
  entry: string;
  props: NativeProp[];
};

function withoutUndefined(type: string, optional: boolean): string {
  if (!optional) return type;
  const clean = type.replace(/\s*\|\s*undefined\s*$/, "");
  return clean || type;
}

function firstSentence(text: string): string | undefined {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return undefined;
  const period = clean.indexOf(". ");
  return period === -1 ? clean : clean.slice(0, period + 1);
}

export async function readNativeCatalog(): Promise<Record<string, NativePiece>> {
  const api = new API({ cwd: RAIZ });
  const snapshot = await api.updateSnapshot({ openProjects: [`${RAIZ}/${PROJECT}`] });
  const project = (await snapshot.getProjects())[0];
  if (!project) throw new Error(`Nao consegui abrir o projeto de ${PROJECT}.`);

  const { checker, program } = project;
  const catalog: Record<string, NativePiece> = {};

  for (const entry of ENTRY_POINTS) {
    const file = await program.getSourceFile(`${RAIZ}/${entry}`);
    if (!file) throw new Error(`Nao achei ${entry}.`);

    const module = await checker.getSymbolAtLocation(file);
    if (!module) throw new Error(`${entry} nao resolveu como modulo.`);

    for (const [key, symbol] of await module.getExports()) {
      const name = String(key);
      if (!/^[A-Z]/.test(name) || catalog[name]) continue;

      const type = await checker.getTypeOfSymbol(symbol);
      if (!type) continue;

      const signatures = await checker.getSignaturesOfType(type, SignatureKind.Call);
      if (!signatures.length) continue;

      const parameter = await checker.getParameterType(signatures[0]!, 0);
      if (!parameter) continue;

      const props: NativeProp[] = [];

      for (const prop of await checker.getPropertiesOfType(parameter)) {
        // O que a peca declara, e nao o que ela herda de `ViewProps` e
        // `TextInputProps`: sao centenas de props de plataforma que dizem o
        // mesmo em toda peca, e o recorte e o mesmo que o catalogo do web faz
        // com o `@types/react`.
        const declaredIn = prop.declarations[0]?.path ?? "";
        if (!declaredIn.includes("/native/src/")) continue;

        const propType = await checker.getTypeOfSymbol(prop);
        const note = firstSentence(await prop.getDocumentationComment(checker));
        const optional = Boolean(prop.flags & SymbolFlags.Optional);
        const written = propType
          ? (await checker.typeToString(propType)).replace(/\s+/g, " ").trim()
          : "unknown";

        props.push({
          name: prop.name,
          type: withoutUndefined(written, optional),
          required: !optional,
          ...(note ? { note } : {}),
        });
      }

      props.sort((a, b) =>
        a.required === b.required ? a.name.localeCompare(b.name) : a.required ? -1 : 1,
      );

      catalog[name] = { entry, props };
    }
  }

  await api.close();

  return Object.fromEntries(Object.entries(catalog).sort(([a], [b]) => a.localeCompare(b)));
}

if (import.meta.main) {
  const catalog = await readNativeCatalog();
  const pieces = Object.keys(catalog).length;
  const total = Object.values(catalog).reduce((sum, piece) => sum + piece.props.length, 0);

  countAtLeast("pecas do pacote nativo", pieces, PIECE_FLOOR);
  countAtLeast("props do pacote nativo", total, PROP_FLOOR);

  const text = `${JSON.stringify(catalog, null, 2)}\n`;

  if (process.argv.includes("--check")) {
    const current = await Bun.file(TARGET)
      .text()
      .catch(() => "");

    if (current !== text) {
      console.error(`${TARGET} divergiu dos tipos. Rode: bun run gen:props:nativo`);

      const before: Record<string, NativePiece> = current ? JSON.parse(current) : {};
      for (const [piece, data] of Object.entries(catalog)) {
        const previous = new Set((before[piece]?.props ?? []).map((prop) => prop.name));
        const added = data.props.map((prop) => prop.name).filter((prop) => !previous.has(prop));
        const removed = [...previous].filter(
          (prop) => !data.props.some((current) => current.name === prop),
        );
        if (added.length) console.error(`  ${piece}: entrou ${added.join(", ")}`);
        if (removed.length) console.error(`  ${piece}: saiu ${removed.join(", ")}`);
      }
      process.exit(1);
    }

    console.log(`props do nativo em dia: ${pieces} pecas, ${total} props.`);
  } else {
    await Bun.write(TARGET, text);
    console.log(`${TARGET}: ${pieces} pecas, ${total} props.`);
  }
}
