/**
 * Guarda do alfa aplicado sobre cor ja aprovada.
 *
 * O `check:contrast` mede pares de token: `danger-fg` sobre `danger`,
 * `success-text` sobre `success-subtle`. Ele nao ve `opacity-70`. Entao a
 * conta aprovava o par PLENO e a peca pintava 70% dele, e a guarda ficava
 * verde sobre uma tela que reprovava.
 *
 * Foram tres defeitos, todos no tema claro, todos invisiveis para o gate:
 *
 *   - o xis de fechar do `Alert`, em `opacity-70` sobre `{tom}-subtle`, media
 *     2,77 no success e 2,66 no warning. A 1.4.11 pede 3;
 *   - o `hover:opacity-90` do Button destrutivo media 4,45, e AA pede 4,5. Era
 *     o unico variant cujo hover nao era token;
 *   - cinco pecas desabilitavam por `opacity-60` em vez de `text-fg-disabled`.
 *
 * O repositorio ja sabia. `test/contrato-das-irmas.test.tsx` cobra "nenhum dos
 * tres desabilita por opacidade" no Checkbox, no Radio e no Switch, e explica
 * este mesmo motivo - mas a regra virou teste de tres pecas em vez de guarda,
 * e as outras sete nunca foram olhadas.
 *
 * ## Por que so o web
 *
 * No `native/src` o desabilitado E `opacity-50`, na camada inteira, e isso esta
 * escrito e decidido em `WITHOUT_PAIR` de `src/lib/contrast.ts`: no toque nao
 * ha papel de cor para desabilitado. Cobrar o web ali reprovaria uma decisao,
 * e guarda que acusa decisao e desligada na segunda semana.
 *
 * ## O que ela cobra
 *
 * Cobertura nos dois sentidos. Toda ocorrencia de `opacity-<1..99>` em `src/`
 * tem que estar em `DECLARADAS`, com motivo; e toda linha de `DECLARADAS` que
 * nao acha mais a ocorrencia tem que sair. Quem declara um par de cor tem a
 * conta MEDIDA nos dois temas, com o alfa aplicado - nao basta escrever o
 * motivo. A lista so encolhe.
 */
import { compose, contrastRatio, readTokens } from "../src/lib/contrast";
import { countAtLeast, scanAtLeast } from "./varredura";

type Declarada = {
  /** Sufixo do arquivo, sem `src/`. */
  file: string;
  /** O alfa escrito na classe, de 1 a 99. */
  alpha: number;
  motivo: string;
  /** Quando ha cor para medir: o papel da frente e os fundos onde ele pousa. */
  front?: string;
  over?: string[];
  min?: number;
};

const DECLARADAS: Declarada[] = [
  {
    file: "chart/chart-legend.tsx",
    alpha: 30,
    motivo:
      "Marca de serie que a pessoa DESLIGOU. Nao ha texto na marca, e o estado ja e dito pelo `line-through` do rotulo ao lado: cor nao e o unico sinal.",
  },
  {
    file: "chart/chart-legend.tsx",
    alpha: 60,
    motivo:
      "Rotulo da serie desligada. E o mesmo caso do desabilitado, que a WCAG isenta, e vem com `line-through` junto.",
  },
  {
    file: "components/button.tsx",
    alpha: 80,
    motivo: "Botao carregando, com `aria-busy` e o giro ao lado dizendo o mesmo.",
    front: "--rc-fg-disabled",
    over: ["--rc-surface-raised"],
    min: 1.6,
  },
  {
    file: "components/color-picker.tsx",
    alpha: 60,
    motivo:
      "Amostra de cor desabilitada. O conteudo do botao E a cor, entao `text-fg-disabled` nao teria o que pintar, e o alfa e o unico jeito de dizer que ele nao responde.",
  },
];

const CLASSE = /(?<![\w-])opacity-(\d{1,2})(?![\d%])/g;

const files = await scanAtLeast("src/**/*.tsx", 60);
const achadas: Array<{ file: string; line: number; alpha: number }> = [];

for (const file of files) {
  const source = await Bun.file(file).text();
  source.split("\n").forEach((text, index) => {
    for (const [, alpha] of text.matchAll(CLASSE)) {
      const value = Number(alpha);
      if (value === 0) continue;
      achadas.push({ file: file.replace(/^src\//, ""), line: index + 1, alpha: value });
    }
  });
}

const problems: string[] = [];

for (const achada of achadas) {
  const declarada = DECLARADAS.find(
    (item) => item.file === achada.file && item.alpha === achada.alpha,
  );
  if (declarada) continue;

  problems.push(
    `src/${achada.file}:${achada.line} pinta \`opacity-${achada.alpha}\` e nao esta declarado.\n` +
      "    Alfa sobre cor de token rebaixa um par que o `check:contrast` aprovou pleno,\n" +
      "    e ele nao mede alfa: a guarda fica verde sobre uma tela que reprova. Ou o\n" +
      "    estado vira token (`text-fg-disabled`, `bg-surface-raised`), ou entra em\n" +
      "    DECLARADAS com o motivo e, havendo cor, com o par a medir.",
  );
}

for (const declarada of DECLARADAS) {
  const viva = achadas.some(
    (item) => item.file === declarada.file && item.alpha === declarada.alpha,
  );
  if (viva) continue;

  problems.push(
    `DECLARADAS ainda guarda \`opacity-${declarada.alpha}\` em src/${declarada.file}, que nao existe mais.\n` +
      "    A lista so encolhe: excecao que nao acusa mais e ruido, e ruido e o que\n" +
      "    faz a proxima pessoa parar de ler a lista. Apague a linha.",
  );
}

const palette = await Bun.file("src/tokens/palette.css").text();
const themes = await scanAtLeast("src/tokens/themes/*.css", 2);
let medidas = 0;

for (const file of themes) {
  const tokens = readTokens(palette + "\n" + (await Bun.file(file).text()));
  if (!tokens["--rc-bg"]) continue;

  for (const declarada of DECLARADAS) {
    if (!declarada.front || !declarada.over || declarada.min === undefined) continue;

    const front = tokens[declarada.front];
    if (!front) {
      problems.push(`${file}: o tema nao declara \`${declarada.front}\`, que DECLARADAS manda medir.`);
      continue;
    }

    for (const name of declarada.over) {
      const back = tokens[name];
      if (!back) {
        problems.push(`${file}: o tema nao declara \`${name}\`, que DECLARADAS manda medir.`);
        continue;
      }

      const alpha = declarada.alpha / 100;
      const rebaixada = compose(mixAlpha(front, alpha), back);
      const ratio = contrastRatio(rebaixada, back);
      medidas += 1;

      if (ratio < declarada.min) {
        problems.push(
          `${file}: \`${declarada.front}\` a ${declarada.alpha}% sobre \`${name}\` mede ${ratio.toFixed(2)}, ` +
            `abaixo do minimo ${declarada.min}.\n` +
            `    src/${declarada.file} pinta esse alfa. O par pleno passa, e e por isso que\n` +
            "    o `check:contrast` nao viu.",
        );
      }
    }
  }
}

/** O mesmo composto que o navegador faz, escrito como cor com alfa. */
function mixAlpha(value: string, alpha: number): string {
  const hex = value.trim();
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (match) {
    const to255 = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");
    return `${hex}${to255}`;
  }
  return hex.replace(/^rgb\(([^)]+)\)$/, (_, body: string) => `rgb(${body} / ${alpha})`);
}

if (problems.length > 0) {
  console.error(`${problems.length} problema(s) de alfa sobre cor:\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  console.error(
    "Alfa nao e um estado: e um desconto sobre um par que alguem ja mediu inteiro.\n" +
      "Estado de cor se escreve com token, que o `check:contrast` sabe medir.",
  );
  process.exit(1);
}

countAtLeast("medida de alfa em DECLARADAS", medidas, 1);

console.log(
  `${achadas.length} usos de opacidade parcial em src/, todos declarados, e ${medidas} medida(s) de alfa nos temas.`,
);
