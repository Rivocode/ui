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
 * Medindo a arvore inteira quando isto foi escrito, era o UNICO nome inventado
 * em 177 paginas. Guarda barata para um material que, no resto, estava certo -
 * e um exemplo que nao compila e o que faz alguem desconfiar do material todo.
 *
 * Ela nao compila os blocos: confere que todo `useAlgo(` e todo `<ChartAlgo`
 * ou `<RivoAlgo` citado exista como export dos dois pacotes. Nome de fora que
 * nao e nosso - o `useState` do React - mora em `FOREIGN`, e essa lista e
 * fechada de proposito: ela nomeia o que vem de biblioteca de terceiro, e nao
 * abriga excecao nossa.
 */
import { scanAtLeast } from "./varredura";

const FOREIGN = new Set([
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
]);

const exported = new Set<string>();

for (const file of await scanAtLeast(["src/**/*.{ts,tsx}", "native/src/**/*.{ts,tsx}"], 150)) {
  const text = await Bun.file(file).text();

  for (const found of text.matchAll(/export\s+(?:function|const|class)\s+(\w+)/g)) {
    exported.add(found[1]!);
  }
  for (const block of text.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const piece of block[1]!.split(",")) {
      const name = piece.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop();
      if (name) exported.add(name.trim());
    }
  }
}

const problems: string[] = [];

for (const file of await scanAtLeast(".design-sync/docs/*.md", 100, { dot: true })) {
  const text = await Bun.file(file).text();

  for (const block of text.matchAll(/```tsx\n([\s\S]*?)```/g)) {
    const code = block[1]!;

    for (const found of code.matchAll(/\b(use[A-Z]\w*)\s*\(/g)) {
      const name = found[1]!;
      if (!FOREIGN.has(name) && !exported.has(name)) {
        problems.push(`${file}: o exemplo chama \`${name}()\`, que nenhum dos dois pacotes exporta.`);
      }
    }

    for (const found of code.matchAll(/<((?:Chart|Rivo)[A-Z]\w*)/g)) {
      const name = found[1]!;
      if (!exported.has(name)) {
        problems.push(`${file}: o exemplo monta \`<${name}>\`, que nenhum dos dois pacotes exporta.`);
      }
    }
  }
}

const unique = [...new Set(problems)];

if (unique.length > 0) {
  console.error("Exemplo de doc citando nome que nao existe:\n");
  for (const problem of unique) console.error(`  ${problem}`);
  console.error(
    "\nE o codigo que a pessoa copia da pagina publicada. Corrija o exemplo, ou\n" +
      "exporte o nome - nao acrescente excecao: `FOREIGN` e so para nome de\n" +
      "biblioteca de terceiro.",
  );
  process.exit(1);
}

console.log(
  `Exemplos de .design-sync/docs conferidos contra ${exported.size} nomes exportados dos dois pacotes.`,
);
