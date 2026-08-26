/**
 * Guarda de promessa: nenhuma pagina pode documentar peca que nao existe.
 *
 * O FileUpload foi publicado com a pagina inteira escrita - props, arraste,
 * validacao de accept e maxSize - e o componente ausente do pacote. Quem
 * seguia a doc quebrava em tempo de build; um agente lendo o indice propunha a
 * peca com confianca. E o cruzamento que descobre isso roda em segundos.
 *
 * A checagem vale nos dois sentidos, porque as duas falhas sao silenciosas:
 * pagina sem export e uma promessa que ninguem cumpre, e export sem pagina e
 * uma peca que ninguem acha.
 *
 * O segundo lado tem excecao declarada: parte que so existe dentro de outra
 * peca e documentada na pagina dela.
 */
import { Glob } from "bun";

const DOCS = ".design-sync/docs";
const ENTRY_POINTS = ["src/index.ts", "src/form/index.ts", "src/chart/index.ts"];

/**
 * O que nao e peca e por isso nao tem pagina propria: hook, utilitario, e o
 * tipo que acompanha a peca - `ButtonProps` mora na pagina do Button.
 */
const NOT_A_PIECE = (name: string) => /^(use[A-Z]|[a-z])/.test(name) || name.endsWith("Props");

const exported = new Set<string>();

for (const entry of ENTRY_POINTS) {
  const source = await Bun.file(entry).text();

  // Reexport de terceiro nao promete pagina nossa: quem documenta a Recharts e
  // a Recharts.
  // `[^}]` e nao `[\s\S]*?`: o nao-guloso atravessava do primeiro bloco de
  // export ate o da Recharts e engolia tudo no meio - oito pecas apareciam
  // como pagina sem codigo.
  const ours = source.replace(/export \{[^}]*\} from "recharts";/g, "");

  for (const block of ours.matchAll(/export \{([\s\S]*?)\} from/g)) {
    for (const raw of block[1]!.split(",")) {
      const part = raw.trim();
      // Comentario dentro do bloco nao e export, e tipo nao e peca.
      if (!part || part.startsWith("//") || part.startsWith("type ")) continue;

      // `ToolbarRoot as Toolbar`: o nome publico e o depois do `as`, e e ele
      // que a pagina documenta.
      exported.add(part.split(/\s+as\s+/).pop()!.trim());
    }
  }

  for (const [, name] of ours.matchAll(/export (?:const|function|class) (\w+)/g)) {
    exported.add(name!);
  }
}

const documented: string[] = [];
for await (const file of new Glob("*.md").scan(DOCS)) {
  documented.push(file.replace(/\.md$/, ""));
}

const promised = documented.filter((name) => !exported.has(name));
/*
 * Parte nao precisa de pagina propria: `CardHeader` e documentado na pagina do
 * `Card`, e e assim que o indice para agents lista as duas. O que ela precisa
 * e estar dita em algum lugar - `SidebarMenuItem` na pagina da Sidebar, o
 * `MASKS` na do MaskedInput. A pergunta que importa nao e "tem pagina", e sim
 * "quem procurar acha".
 */
const prose = (
  await Promise.all(documented.map((name) => Bun.file(`${DOCS}/${name}.md`).text()))
).join("\n");

const silent = [...exported].filter(
  (name) =>
    !NOT_A_PIECE(name) &&
    !documented.includes(name) &&
    !new RegExp(`\\b${name}\\b`).test(prose),
);

if (promised.length > 0) {
  console.error(`${promised.length} pagina(s) documentando peca que nao existe:\n`);
  for (const name of promised.sort()) console.error(`  ${DOCS}/${name}.md`);
  console.error("\nPublique a peca, ou tire a pagina: a doc esta prometendo o que ninguem cumpre.");
  process.exit(1);
}

if (silent.length > 0) {
  console.error(`${silent.length} peca(s) exportada(s) e sem pagina:\n`);
  for (const name of silent.sort()) console.error(`  ${name}`);
  console.error(
    `\nEscreva ${DOCS}/<Peca>.md, ou cite a peca na pagina de quem a compoe -` +
      "\nsem isso ela so existe para quem le o .d.ts.",
  );
  process.exit(1);
}

console.log(`${documented.length} paginas, todas com codigo por tras, e nenhuma peca muda.`);
