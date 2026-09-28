/**
 * O juiz da bancada da CI: compara a arvore de base com a da cabeca, as duas
 * medidas na MESMA maquina, e diz o que piorou.
 *
 * A bancada existe desde 24/09/2026 e resolve um impasse que deixava o
 * `bun run a11y` e o `bun run visual` fora de qualquer CI. As duas guardas
 * medem contra uma referencia absoluta - a lista vazia de problemas, e as
 * assinaturas comitadas - e as duas referencias nao valem no ubuntu:
 *
 * - As assinaturas nasceram no macOS. Fonte e antialias mudam entre sistemas,
 *   e a mesma arvore medida no linux sai diferente do comitado sem ninguem ter
 *   mexido em nada. Comparar la seria vermelho permanente, e vermelho
 *   permanente e desligado na segunda semana.
 * - O `bun run a11y` sai vermelho em toda arvore de hoje: ele acusa o que as
 *   pecas TEM, e a lista ainda nao zerou. No gate, ele pararia o `check` de
 *   todo mundo.
 *
 * As saidas obvias falham cada uma de um lado. Assinatura por plataforma
 * comitada envelhece a cada Chrome novo do runner, que o GitHub troca sem
 * avisar. Tolerancia por quadrado alta o bastante para calar o antialias cala
 * junto a trilha quadrada do `Progress`, que marcava 3 de cinza numa moldura
 * de pagina (ver `check-retratos.ts`). E deixar o visual so na maquina e o
 * estado que o `check:scripts` descreve: a guarda que so roda quando alguem
 * lembra.
 *
 * A comparacao DIFERENCIAL troca a referencia absoluta pela base. Mesma
 * maquina, mesmo Chrome, mesmas fontes, mesmo minuto: tudo que e plataforma
 * cancela, e o que sobra e o que o commit mudou. A plataforma nunca deixa isto
 * vermelho, e um retrato que o commit mudou nunca passa sem alguem ter aceito.
 *
 * ## Quem aceita
 *
 * Mudanca de retrato e aceita pelo mesmo gesto de sempre: quem mudou a tela
 * roda `bun run shot && bun run visual --aceitar` na maquina, olha, e comita o
 * `demo/assinaturas.json`. A entrada daquele retrato mudar entre a base e a
 * cabeca e a prova de que alguem olhou - e retrato que mudou no linux sem a
 * entrada ter mudado e mudanca que ninguem viu. A etiqueta `retrato-aceito` no
 * PR e a valvula para o caso que a regra nao cobre: diferenca que so aparece
 * no linux.
 *
 * Acessibilidade nao tem aceite: problema que a cabeca tem a mais que a base e
 * regressao, e o conserto e na peca. Problema que a cabeca tem a MENOS so e
 * relatado - a lista encolher e o que se quer.
 *
 * ## Medir e condicao
 *
 * Arvore que nao mediu nada nao e arvore sem problema. Por isso ha piso de
 * paginas auditadas e de retratos comparados, e arquivo de medida que falta
 * derruba a corrida em vez de virar lista vazia.
 */
import { compareSignatures } from "./retratos";

export type AccessibilityReport = { pages: string[]; problems: Record<string, number> };

export type Signatures = Record<string, number[]>;

export type ShotReport = { signatures: Signatures; refused: string[] };

export type AccessibilityVerdict = {
  worse: { key: string; before: number; after: number }[];
  better: { key: string; before: number; after: number }[];
  problems: string[];
};

export function compareAccessibility(
  base: AccessibilityReport,
  head: AccessibilityReport,
  floor: number,
): AccessibilityVerdict {
  const problems: string[] = [];
  if (head.pages.length < floor) {
    problems.push(
      `a cabeca auditou ${head.pages.length} pagina(s), e o piso e ${floor}: a medida se perdeu, e lista vazia de pagina nao e lista vazia de problema`,
    );
  }

  const keys = new Set([...Object.keys(base.problems), ...Object.keys(head.problems)]);
  const worse: AccessibilityVerdict["worse"] = [];
  const better: AccessibilityVerdict["better"] = [];

  for (const key of [...keys].sort()) {
    const before = base.problems[key] ?? 0;
    const after = head.problems[key] ?? 0;
    if (after > before) worse.push({ key, before, after });
    if (after < before) better.push({ key, before, after });
  }

  return { worse, better, problems };
}

export type ShotInput = {
  base: ShotReport;
  head: ShotReport;
  committedBase: Signatures;
  committedHead: Signatures;
};

export type ShotVerdict = {
  compared: number;
  unaccepted: string[];
  accepted: string[];
  lost: string[];
  fresh: string[];
  problems: string[];
};

function sameSignature(a: number[] | undefined, b: number[] | undefined) {
  if (!a || !b) return a === b;
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function compareShots(input: ShotInput, floor: number): ShotVerdict {
  const { base, head, committedBase, committedHead } = input;
  const verdict: ShotVerdict = {
    compared: 0,
    unaccepted: [],
    accepted: [],
    lost: [],
    fresh: [],
    problems: [],
  };

  const acceptedByCommit = (name: string) =>
    !sameSignature(committedBase[name], committedHead[name]);

  for (const name of Object.keys(head.signatures).sort()) {
    const before = base.signatures[name];
    const after = head.signatures[name]!;
    if (!before) {
      verdict.fresh.push(name);
      continue;
    }

    verdict.compared++;
    const diff = compareSignatures(name, before, after);
    if (!diff.frame && diff.cells === 0) continue;

    const what = diff.frame
      ? `${name} - ${diff.frame}`
      : `${name} - ${diff.cells} de ${diff.total} quadrados, pior ${diff.worst}`;
    if (acceptedByCommit(name)) verdict.accepted.push(what);
    else verdict.unaccepted.push(what);
  }

  for (const name of Object.keys(base.signatures).sort()) {
    if (name in head.signatures) continue;
    if (!(name in committedHead)) {
      verdict.accepted.push(`${name} - saiu da vitrine e da assinatura comitada`);
      continue;
    }
    verdict.lost.push(name);
  }

  if (verdict.compared < floor) {
    verdict.problems.push(
      `${verdict.compared} retrato(s) comparado(s), e o piso e ${floor}: a medida se perdeu, e zero diferenca de zero retrato nao e retrato igual`,
    );
  }

  return verdict;
}

async function readJson<T>(path: string): Promise<T> {
  const file = Bun.file(path);
  if (!(await file.exists())) {
    console.error(
      `${path} nao existe: um dos lados nao foi medido. A bancada nao compara` +
        " medida com ausencia de medida, porque o resultado seria verde por falta de dado.",
    );
    process.exit(1);
  }
  return (await file.json()) as T;
}

function option(name: string) {
  const at = process.argv.indexOf(name);
  const value = at === -1 ? undefined : process.argv[at + 1];
  if (!value) {
    console.error(
      `Uso: bun run scripts/comparacao-da-bancada.ts --base <pasta> --cabeca <pasta> [--retrato-aceito]` +
        `\nCada pasta tem acessibilidade.json, retratos.json e assinaturas.json. Faltou ${name}.`,
    );
    process.exit(1);
  }
  return value;
}

const PAGE_FLOOR = 15;
const SHOT_FLOOR = 30;

if (import.meta.main) {
  const baseDir = option("--base");
  const headDir = option("--cabeca");
  const labelAccepts = process.argv.includes("--retrato-aceito");

  const accessibility = compareAccessibility(
    await readJson<AccessibilityReport>(`${baseDir}/acessibilidade.json`),
    await readJson<AccessibilityReport>(`${headDir}/acessibilidade.json`),
    PAGE_FLOOR,
  );

  const headShots = await readJson<ShotReport>(`${headDir}/retratos.json`);
  const shots = compareShots(
    {
      base: await readJson<ShotReport>(`${baseDir}/retratos.json`),
      head: headShots,
      committedBase: await readJson<Signatures>(`${baseDir}/assinaturas.json`),
      committedHead: await readJson<Signatures>(`${headDir}/assinaturas.json`),
    },
    SHOT_FLOOR,
  );

  const lines: string[] = ["## Bancada: base contra cabeca, na mesma maquina", ""];
  const failures: string[] = [...accessibility.problems, ...shots.problems];

  lines.push("### Acessibilidade", "");
  if (accessibility.worse.length === 0) lines.push("Nenhum problema a mais que a base.");
  for (const { key, before, after } of accessibility.worse) {
    lines.push(`- piorou: \`${key}\` de ${before} para ${after}`);
  }
  for (const { key, before, after } of accessibility.better) {
    lines.push(`- melhorou: \`${key}\` de ${before} para ${after}`);
  }
  if (accessibility.worse.length > 0) {
    failures.push(
      `${accessibility.worse.length} problema(s) de acessibilidade que a base nao tinha. Rode \`bun run a11y\` na maquina: o conserto e na peca.`,
    );
  }

  lines.push("", "### Retratos", "", `${shots.compared} retrato(s) comparado(s).`);
  for (const what of shots.unaccepted) lines.push(`- mudou sem aceite: ${what}`);
  for (const what of shots.accepted) lines.push(`- mudou, aceito pela assinatura comitada: ${what}`);
  for (const name of shots.lost) lines.push(`- a cabeca nao fotografou: ${name}`);
  for (const name of shots.fresh) lines.push(`- novo, sem base para comparar: ${name}`);
  for (const refused of headShots.refused) lines.push(`- recusado na cabeca: ${refused}`);

  const unacceptedCount = shots.unaccepted.length + shots.lost.length;
  if (unacceptedCount > 0) {
    if (labelAccepts) {
      lines.push("", "A etiqueta `retrato-aceito` do PR aceita as mudancas acima.");
    } else {
      failures.push(
        `${unacceptedCount} retrato(s) mudaram sem a assinatura comitada mudar junto.` +
          " Olhe na maquina e aceite: bun run shot && bun run visual --aceitar, e comite o" +
          " demo/assinaturas.json. Diferenca que so aparece no linux: etiqueta `retrato-aceito` no PR.",
      );
    }
  }

  if (failures.length > 0) {
    lines.push("", "### Por que ficou vermelho", "");
    for (const failure of failures) lines.push(`- ${failure}`);
  }

  const report = lines.join("\n");
  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await Bun.write(
      process.env.GITHUB_STEP_SUMMARY,
      `${await Bun.file(process.env.GITHUB_STEP_SUMMARY)
        .text()
        .catch(() => "")}${report}\n`,
    );
  }

  process.exit(failures.length > 0 ? 1 : 0);
}
