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
const DESTINO = "apps/docs/src/component-props.json";

/** As entradas publicas do pacote. O que nao sai por elas nao e documentavel. */
const ENTRADAS = ["src/index.ts", "src/form/index.ts", "src/chart/index.ts"];

/**
 * O que todo componente repassa ao elemento raiz. Fica numa linha so no fim da
 * tabela, em vez de repetido em 165 paginas.
 */
const REPASSADAS = new Set(["className", "style", "id", "children"]);

export type PropDoCatalogo = {
  name: string;
  type: string;
  required: boolean;
  note?: string;
};

export type PecaDoCatalogo = {
  /** Se ela aceita os atributos do elemento raiz alem das props proprias. */
  forwardsRoot: boolean;
  props: PropDoCatalogo[];
};

/**
 * `boolean | undefined` numa linha que ja tem a coluna "Obrigatoria: nao" diz
 * a mesma coisa duas vezes, e a segunda ocupa a largura que o tipo precisa.
 */
function semUndefined(tipo: string, opcional: boolean): string {
  if (!opcional) return tipo;
  const limpo = tipo.replace(/\s*\|\s*undefined\s*$/, "");
  return limpo || tipo;
}

/** Uma linha so, sem quebra: a tabela da doc e a do site nao aceitam paragrafo. */
function primeiraLinha(texto: string): string | undefined {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (!limpo) return undefined;
  const ponto = limpo.indexOf(". ");
  return ponto === -1 ? limpo : limpo.slice(0, ponto + 1);
}

async function ler(): Promise<Record<string, PecaDoCatalogo>> {
  const api = new API({ cwd: RAIZ });
  const snapshot = await api.updateSnapshot({ openProjects: [`${RAIZ}/tsconfig.json`] });
  const projeto = (await snapshot.getProjects())[0];
  if (!projeto) throw new Error("Nao consegui abrir o projeto do tsconfig.json.");

  const { checker, program } = projeto;
  const catalogo: Record<string, PecaDoCatalogo> = {};

  for (const entrada of ENTRADAS) {
    const arquivo = await program.getSourceFile(`${RAIZ}/${entrada}`);
    if (!arquivo) throw new Error(`Nao achei ${entrada}.`);

    const modulo = await checker.getSymbolAtLocation(arquivo);
    if (!modulo) throw new Error(`${entrada} nao resolveu como modulo.`);

    for (const [chave, simbolo] of await modulo.getExports()) {
      const nome = String(chave);
      // Componente comeca com maiuscula. Hook e utilitario tem outra forma de
      // documentacao, e forcar os dois na mesma tabela mente sobre os dois.
      if (!/^[A-Z]/.test(nome) || catalogo[nome]) continue;

      const tipo = await checker.getTypeOfSymbol(simbolo);
      if (!tipo) continue;

      const assinaturas = await checker.getSignaturesOfType(tipo, SignatureKind.Call);
      if (!assinaturas.length) continue;

      const parametro = await checker.getParameterType(assinaturas[0]!, 0);
      if (!parametro) continue;

      const todas = await checker.getPropertiesOfType(parametro);
      const props: PropDoCatalogo[] = [];
      let forwardsRoot = false;

      for (const prop of todas) {
        const origem = prop.declarations[0]?.path ?? "";
        // O que vem do React e o elemento raiz: 280 atributos de HTML que
        // dizem o mesmo em toda peca. A presenca deles e a resposta do
        // forwardsRoot, e nao linha de tabela.
        const doReact = origem.includes("@types/react");
        if (doReact || REPASSADAS.has(prop.name)) {
          if (prop.name === "className") forwardsRoot = true;
          continue;
        }

        const tipoDaProp = await checker.getTypeOfSymbol(prop);
        const nota = primeiraLinha(await prop.getDocumentationComment(checker));
        const opcional = Boolean(prop.flags & SymbolFlags.Optional);
        const escrito = tipoDaProp
          ? (await checker.typeToString(tipoDaProp)).replace(/\s+/g, " ").trim()
          : "unknown";

        props.push({
          name: prop.name,
          type: semUndefined(escrito, opcional),
          required: !opcional,
          ...(nota ? { note: nota } : {}),
        });
      }

      // Obrigatoria antes de opcional, e alfabetica dentro de cada grupo: o
      // que quem chama precisa passar vem antes do que pode passar.
      props.sort((a, b) =>
        a.required === b.required ? a.name.localeCompare(b.name) : a.required ? -1 : 1,
      );

      catalogo[nome] = { forwardsRoot, props };
    }
  }

  await api.close();

  // Ordenado, para o arquivo nao trocar de linha a cada rodada e sujar o diff.
  return Object.fromEntries(Object.entries(catalogo).sort(([a], [b]) => a.localeCompare(b)));
}

if (import.meta.main) {
  const catalogo = await ler();
  const texto = `${JSON.stringify(catalogo, null, 2)}\n`;
  const conferir = process.argv.includes("--check");

  if (conferir) {
    const atual = await Bun.file(DESTINO)
      .text()
      .catch(() => "");

    if (atual !== texto) {
      console.error(`${DESTINO} divergiu dos tipos. Rode: bun run gen:props`);

      const antes: Record<string, PecaDoCatalogo> = atual ? JSON.parse(atual) : {};
      for (const [peca, dados] of Object.entries(catalogo)) {
        const velhas = new Set((antes[peca]?.props ?? []).map((p) => p.name));
        const novas = dados.props.map((p) => p.name).filter((p) => !velhas.has(p));
        const sumiram = [...velhas].filter((p) => !dados.props.some((atual) => atual.name === p));
        if (novas.length) console.error(`  ${peca}: entrou ${novas.join(", ")}`);
        if (sumiram.length) console.error(`  ${peca}: saiu ${sumiram.join(", ")}`);
      }
      process.exit(1);
    }

    const total = Object.values(catalogo).reduce((soma, peca) => soma + peca.props.length, 0);
    console.log(`props em dia: ${Object.keys(catalogo).length} pecas, ${total} props.`);
  } else {
    await Bun.write(DESTINO, texto);
    const total = Object.values(catalogo).reduce((soma, peca) => soma + peca.props.length, 0);
    console.log(`${DESTINO}: ${Object.keys(catalogo).length} pecas, ${total} props.`);
  }
}
