/**
 * Junta os `.d.ts` do bundle num arquivo so, para a documentacao levar as
 * tabelas de props junto quando for publicada.
 *
 * O `ds-bundle/` tem 14 MB entre imagens, fontes e vendor, e por isso fica
 * fora do Git. Mas as tabelas de props da documentacao saem dele: sem os tipos,
 * o site publicado mostraria a prosa de cada peca e nenhuma prop.
 *
 * O resultado e um JSON de 185 KB versionado dentro de `apps/docs`, que e a
 * unica parte do bundle que a documentacao precisa. Rode este script depois de
 * um sync novo.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";

const ORIGEM = "ds-bundle/components";
const DESTINO = "apps/docs/src/component-types.json";

function varrer(dir: string, dentro: Record<string, string> = {}) {
  for (const entrada of readdirSync(dir)) {
    const caminho = `${dir}/${entrada}`;

    if (statSync(caminho).isDirectory()) {
      varrer(caminho, dentro);
      continue;
    }

    if (entrada.endsWith(".d.ts")) {
      dentro[entrada.replace(/\.d\.ts$/, "")] = readFileSync(caminho, "utf8");
    }
  }

  return dentro;
}

let tipos: Record<string, string>;

try {
  tipos = varrer(ORIGEM);
} catch {
  console.error(`Nao achei ${ORIGEM}. Rode isto na raiz do repositorio, com o bundle presente.`);
  process.exit(1);
}

// Ordenado, para o arquivo nao mudar de linha a cada rodada e sujar o diff.
const ordenado = Object.fromEntries(Object.entries(tipos).sort(([a], [b]) => a.localeCompare(b)));

writeFileSync(DESTINO, `${JSON.stringify(ordenado, null, 2)}\n`);
console.log(`${Object.keys(ordenado).length} tipos em ${DESTINO}`);
