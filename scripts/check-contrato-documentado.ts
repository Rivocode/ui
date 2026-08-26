/**
 * Confere se o contrato cita tudo que os subcaminhos exportam.
 *
 * O `convencoes.md` e a primeira coisa que um agente le, e o subcaminho de
 * grafico ja tinha ficado tres versoes atras dele: `ChartXAxis`, `ChartDonut`,
 * `Sparkline`, `ChartRadial` e o gradiente existiam no pacote e nao no
 * contrato. O agente entao escrevia grafico com a API velha, ou inventava.
 *
 * Componente do pacote principal nao entra aqui: o indice em `/llms.txt` ja
 * enumera os 66, e ele e gerado. O que precisa de vigia e o texto escrito a
 * mao, e dele so a parte que promete uma lista.
 */
import { readdirSync, readFileSync } from "node:fs";

const CONTRACT_FILE = ".design-sync/conventions.md";
const SKILL_DIR = ".claude/skills/rivocode-ui";

const TARGETS = [
  { file: "src/chart/index.ts", name: "@rivocode/ui/chart" },
  { file: "src/form/index.ts", name: "@rivocode/ui/form" },
];

const contract = readFileSync(CONTRACT_FILE, "utf8");
/**
 * A skill inteira, e nao so o corpo dela.
 *
 * O corpo virou indice, e o detalhe de formulario e de grafico mora em
 * `reference/`. Lendo so o SKILL.md, a guarda passou a cobrar nomes que estao
 * documentados no arquivo ao lado.
 */
const skill = [
  readFileSync(`${SKILL_DIR}/SKILL.md`, "utf8"),
  ...readdirSync(`${SKILL_DIR}/reference`)
    .filter((file) => file.endsWith(".md"))
    .map((file) => readFileSync(`${SKILL_DIR}/reference/${file}`, "utf8")),
].join("\n");

/**
 * O que o subcaminho exporta de proprio.
 *
 * As reexportacoes da Recharts ficam de fora: elas sao listadas em bloco nos
 * dois textos, e cobrar uma a uma so criaria ruido a cada peca que a Recharts
 * ganhar.
 */
function exportsOf(file: string) {
  const source = readFileSync(file, "utf8");
  const withoutRecharts = source
    .replace(/export \{[\s\S]*?\} from "recharts";/g, "")
    // Comentario dentro do bloco de export nao e nome de export: sem tirar,
    // "// os nomes de antes" virava uma peca que a doc precisaria citar.
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");

  const names = new Set<string>();

  for (const block of withoutRecharts.matchAll(/export \{([\s\S]*?)\} from/g)) {
    for (const raw of block[1].split(",")) {
      const part = raw.trim();
      // Tipo nao precisa aparecer em texto de contrato: quem escreve tela usa a
      // peca, e o tipo chega pelo editor.
      if (!part || part.startsWith("type ")) continue;
      names.add(part);
    }
  }

  return [...names];
}

let misses = 0;

for (const target of TARGETS) {
  const names = exportsOf(target.file);
  const missingFromContract = names.filter((name) => !contract.includes(name));
  const missingFromSkill = names.filter((name) => !skill.includes(name));

  if (missingFromContract.length > 0) {
    console.error(`${CONTRACT_FILE} nao cita, de ${target.name}: ${missingFromContract.join(", ")}`);
    misses += missingFromContract.length;
  }
  if (missingFromSkill.length > 0) {
    console.error(`a skill nao cita, de ${target.name}: ${missingFromSkill.join(", ")}`);
    misses += missingFromSkill.length;
  }
}

if (misses > 0) {
  console.error(`\nO que um agente le ficou atras do que o pacote exporta.`);
  process.exit(1);
}

console.log(`contrato e skill citam tudo que os subcaminhos exportam.`);
