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
import { readFileSync } from "node:fs";

const CONTRATO = ".design-sync/conventions.md";
const SKILL = ".claude/skills/rivocode-ui/SKILL.md";

const ALVOS = [
  { arquivo: "src/chart/index.ts", nome: "@rivocode/ui/chart" },
  { arquivo: "src/form/index.ts", nome: "@rivocode/ui/form" },
];

const contrato = readFileSync(CONTRATO, "utf8");
const skill = readFileSync(SKILL, "utf8");

/**
 * O que o subcaminho exporta de proprio.
 *
 * As reexportacoes da Recharts ficam de fora: elas sao listadas em bloco nos
 * dois textos, e cobrar uma a uma so criaria ruido a cada peca que a Recharts
 * ganhar.
 */
function exportado(arquivo: string) {
  const fonte = readFileSync(arquivo, "utf8");
  const semRecharts = fonte.replace(/export \{[\s\S]*?\} from "recharts";/g, "");

  const nomes = new Set<string>();

  for (const bloco of semRecharts.matchAll(/export \{([\s\S]*?)\} from/g)) {
    for (const bruto of bloco[1].split(",")) {
      const parte = bruto.trim();
      // Tipo nao precisa aparecer em texto de contrato: quem escreve tela usa a
      // peca, e o tipo chega pelo editor.
      if (!parte || parte.startsWith("type ")) continue;
      nomes.add(parte);
    }
  }

  return [...nomes];
}

let faltas = 0;

for (const alvo of ALVOS) {
  const nomes = exportado(alvo.arquivo);
  const foraDoContrato = nomes.filter((nome) => !contrato.includes(nome));
  const foraDaSkill = nomes.filter((nome) => !skill.includes(nome));

  if (foraDoContrato.length > 0) {
    console.error(`${CONTRATO} nao cita, de ${alvo.nome}: ${foraDoContrato.join(", ")}`);
    faltas += foraDoContrato.length;
  }
  if (foraDaSkill.length > 0) {
    console.error(`a skill nao cita, de ${alvo.nome}: ${foraDaSkill.join(", ")}`);
    faltas += foraDaSkill.length;
  }
}

if (faltas > 0) {
  console.error(`\nO que um agente le ficou atras do que o pacote exporta.`);
  process.exit(1);
}

console.log(`contrato e skill citam tudo que os subcaminhos exportam.`);
