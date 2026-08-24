# @rivocode/ui, fundação: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a fundação de `@rivocode/ui`: arquitetura de tokens em três camadas, os dois temas da marca, o Provider, e cinco componentes que provam o contrato.

**Architecture:** Repositório novo `Rivocode/ui`, pacote publicado privado no GitHub Packages. Comportamento e acessibilidade vêm da Base UI v1, o estilo é autoral em Tailwind v4. Componentes leem apenas tokens semânticos `--rc-*`, e um arquivo de tema preenche esses tokens, o que permite trocar a marca inteira sem tocar em componente.

**Tech Stack:** bun, React 19, TypeScript, Tailwind CSS v4, `@base-ui/react` v1, `tsdown`, `cva`, `tailwind-merge`, `bun test` com `happy-dom`, oxlint, oxfmt, GitHub Actions.

**Spec:** `docs/2026-08-24-rivocode-ui-fundacao-design.md`

## Global Constraints

Estas valem para toda tarefa, sem repetição.

- **Caminho do repositório novo:** `/Users/emanuelbacalhau/projects/rivocode/ui`
- **Caminho do site:** `/Users/emanuelbacalhau/projects/rivocode/rivocode.com`
- **Nome do pacote:** `@rivocode/ui`, versão inicial `0.1.0`, `"private": false` mas `publishConfig.registry` apontando para o GitHub Packages
- **Runtime:** bun 1.3 ou superior. Nunca usar npm, yarn ou pnpm neste repositório
- **Dependências de par:** `react@^19`, `react-dom@^19`, `tailwindcss@^4`, `lucide-react@^1`
- **Dependência real:** `@base-ui/react@^1.6`, `class-variance-authority`, `clsx`, `tailwind-merge`
- **Sem travessão:** nenhum `` nem `` em código, comentário, documentação, mensagem de commit ou texto visível. Usar vírgula, dois pontos, parênteses ou ponto
- **Sem cor literal fora de `src/tokens`:** nenhum `#hex`, `rgb(`, `rgba(`, `hsl(` ou `oklch(` em `src/primitives`, `src/provider` ou `src/lib`
- **Sem `z-index` literal:** empilhamento sempre por `var(--rc-z-*)`
- **Contraste mínimo:** 4,5:1 para texto, 7:1 para texto principal
- **Idioma:** identificadores, nomes de arquivo e nomes de token em inglês. Comentário, documentação e mensagem de commit em português
- **Commit a cada tarefa concluída**, nunca commits que juntam duas tarefas

## Estrutura de arquivos

| Arquivo                                | Responsabilidade                                                       |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `package.json`                         | nome, exports, dependências de par, scripts                            |
| `tsdown.config.ts`                     | build de ESM e `.d.ts`                                                 |
| `bunfig.toml`                          | registra o preload de teste                                            |
| `test/setup.ts`                        | registra o happy-dom no bun test                                       |
| `src/tokens/palette.css`               | camada 1, valores crus com prefixo `--rc-p-`                           |
| `src/tokens/contract.css`              | camada 2, o mapeamento `@theme inline` do Tailwind                     |
| `src/tokens/themes/rivocode-dark.css`  | camada 3, tema escuro                                                  |
| `src/tokens/themes/rivocode-light.css` | camada 3, tema claro                                                   |
| `src/tokens/scales.css`                | raio, tipografia, densidade, empilhamento, movimento                   |
| `src/styles.css`                       | ponto de entrada da CSS, importa tudo acima e os estilos de componente |
| `src/lib/cn.ts`                        | junta classes resolvendo conflito do Tailwind                          |
| `src/provider/rivo-provider.tsx`       | tema, escopo, densidade, container de portal                           |
| `src/provider/use-rivo-context.ts`     | leitura do contexto pelos componentes                                  |
| `src/primitives/button.tsx`            | Button                                                                 |
| `src/primitives/card.tsx`              | Card                                                                   |
| `src/primitives/badge.tsx`             | Badge                                                                  |
| `src/primitives/field.tsx`             | Field e Input                                                          |
| `src/primitives/dialog.tsx`            | Dialog                                                                 |
| `src/index.ts`                         | barrel de exports                                                      |
| `scripts/check-no-literal-colors.ts`   | guarda: cor literal fora dos tokens                                    |
| `scripts/check-contrast.ts`            | guarda: contraste dos temas                                            |
| `.github/workflows/ci.yml`             | lint, guardas e testes em cada push                                    |

---

### Task 1: Criar o repositório e o esqueleto do pacote

Entrega: `bun run build` produz `dist/index.js` e `dist/index.d.ts`, `bun test` roda e passa, `bun run lint` passa.

**Files:**

- Create: `/Users/emanuelbacalhau/projects/rivocode/ui/package.json`
- Create: `/Users/emanuelbacalhau/projects/rivocode/ui/tsconfig.json`
- Create: `/Users/emanuelbacalhau/projects/rivocode/ui/tsdown.config.ts`
- Create: `/Users/emanuelbacalhau/projects/rivocode/ui/bunfig.toml`
- Create: `/Users/emanuelbacalhau/projects/rivocode/ui/test/setup.ts`
- Create: `/Users/emanuelbacalhau/projects/rivocode/ui/src/index.ts`
- Create: `/Users/emanuelbacalhau/projects/rivocode/ui/.gitignore`
- Test: `/Users/emanuelbacalhau/projects/rivocode/ui/test/smoke.test.ts`

**Interfaces:**

- Produces: `src/index.ts` como único barrel do pacote. Toda tarefa seguinte exporta a partir dele.

- [ ] **Step 1: Confirmar com o usuário antes de criar o repositório remoto**

Criar repositório é ação externa e irreversível na conta dele. Perguntar, com estas palavras, antes de rodar qualquer `gh`:

"Vou criar o repositório privado `Rivocode/ui` no GitHub. Posso?"

Só seguir com resposta afirmativa. Se ele recusar, criar apenas o diretório local e o git local, e seguir o plano inteiro sem o remoto.

- [ ] **Step 2: Criar o diretório e o git local**

```bash
mkdir -p /Users/emanuelbacalhau/projects/rivocode/ui
cd /Users/emanuelbacalhau/projects/rivocode/ui
git init -b main
```

- [ ] **Step 3: Confirmar o nome real do pacote da Base UI antes de instalar**

O nome do pacote mudou durante a fase beta. Confirmar qual resolve:

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui
bun info @base-ui/react version 2>/dev/null || bun info @base-ui-components/react version
```

Anotar o nome que respondeu. Se for `@base-ui-components/react`, usar esse nome em toda importação deste plano no lugar de `@base-ui/react`, e registrar a troca no README.

- [ ] **Step 4: Escrever o `package.json`**

```json
{
  "name": "@rivocode/ui",
  "version": "0.1.0",
  "type": "module",
  "sideEffects": ["*.css"],
  "files": ["dist"],
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./styles.css": "./dist/styles.css",
    "./preset": "./dist/preset.css"
  },
  "publishConfig": { "registry": "https://npm.pkg.github.com" },
  "scripts": {
    "build": "tsdown && bun run build:css",
    "build:css": "tailwindcss -i src/styles.css -o dist/styles.css",
    "test": "bun test",
    "lint": "oxlint",
    "format": "oxfmt",
    "check": "bun run lint && bun run check:colors && bun run check:contrast && bun test",
    "check:colors": "bun run scripts/check-no-literal-colors.ts",
    "check:contrast": "bun run scripts/check-contrast.ts"
  },
  "peerDependencies": {
    "react": "^19",
    "react-dom": "^19",
    "tailwindcss": "^4",
    "lucide-react": "^1"
  },
  "dependencies": {
    "@base-ui/react": "^1.6",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.6.0"
  }
}
```

- [ ] **Step 5: Instalar as dependências de desenvolvimento**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui
bun add @base-ui/react class-variance-authority clsx tailwind-merge
bun add -d typescript tsdown oxlint oxfmt tailwindcss @tailwindcss/cli \
  @types/react @types/react-dom @types/bun \
  @testing-library/react @testing-library/dom @happy-dom/global-registrator
bun add -d --peer react react-dom lucide-react
```

- [ ] **Step 6: Escrever a configuração**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "types": ["bun"]
  },
  "include": ["src", "test", "scripts"]
}
```

`tsdown.config.ts`:

```ts
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  dts: true,
  clean: true,
  external: ["react", "react-dom", "lucide-react"],
});
```

`bunfig.toml`:

```toml
[test]
preload = ["./test/setup.ts"]
```

`test/setup.ts`:

```ts
// Registra um DOM no bun test, que roda sem navegador por padrao.
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
```

`.gitignore`:

```
node_modules
dist
*.log
.DS_Store
```

- [ ] **Step 7: Escrever o teste de fumaça, que deve falhar**

`test/smoke.test.ts`:

```ts
import { expect, test } from 'bun:test'
import { render, screen } from '@testing-library/react'

import { version } from '../src/index'

test('o pacote expoe a versao da fundacao', () => {
  expect(version).toBe('0.1.0')
})

test('o ambiente de teste tem DOM', () => {
  render(<p>ok</p>)
  expect(screen.getByText('ok')).toBeDefined()
})
```

Renomear o arquivo para `test/smoke.test.tsx`, já que ele tem JSX.

- [ ] **Step 8: Rodar o teste e confirmar que falha**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun test
```

Esperado: FALHA, com erro de módulo não encontrado em `../src/index`.

- [ ] **Step 9: Escrever a implementação mínima**

`src/index.ts`:

```ts
export const version = "0.1.0";
```

- [ ] **Step 10: Rodar o teste e confirmar que passa**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun test
```

Esperado: 2 passes.

- [ ] **Step 11: Confirmar que o build funciona**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun run tsdown && ls dist
```

Esperado: `dist/index.js` e `dist/index.d.ts` existem. O script `build` completo ainda vai falhar no `build:css` porque `src/styles.css` só nasce na Task 3, o que é esperado.

- [ ] **Step 12: Criar o repositório remoto e commitar**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui
gh repo create Rivocode/ui --private --source=. --remote=origin
git add -A
git commit -m "chore: esqueleto do pacote @rivocode/ui"
git push -u origin main
```

Se o Step 1 foi recusado, pular o `gh repo create` e o `push`, e apenas commitar local.

---

### Task 2: As duas guardas e o CI

Entrega: dois scripts que falham quando a regra é quebrada, mais um CI que os roda. Eles nascem antes dos tokens de propósito, para que nenhuma violação chegue a existir.

**Files:**

- Create: `scripts/check-no-literal-colors.ts`
- Create: `scripts/check-contrast.ts`
- Create: `.github/workflows/ci.yml`
- Test: `test/guards.test.ts`

**Interfaces:**

- Produces: `scripts/check-contrast.ts` exporta `contrastRatio(a: string, b: string): number`, usado pelo teste e pela Task 4.

- [ ] **Step 1: Escrever o teste da razão de contraste, que deve falhar**

`test/guards.test.ts`:

```ts
import { expect, test } from "bun:test";

import { contrastRatio, readTokens } from "../scripts/check-contrast";

test("branco sobre preto da o maximo de 21 para 1", () => {
  expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1);
});

test("a lima sobre o fundo escuro da 15,06 para 1", () => {
  expect(contrastRatio("#d4f34a", "#0f1113")).toBeCloseTo(15.06, 1);
});

test("a cor de texto desabilitado fica abaixo do minimo", () => {
  expect(contrastRatio("#6c737b", "#0f1113")).toBeLessThan(4.5);
});

test("resolve um token de tema que aponta para a paleta", () => {
  const tokens = readTokens(
    ":root { --rc-p-lima-500: #d4f34a; }\n" +
      "[data-rc-theme='x'] { --rc-accent: var(--rc-p-lima-500); }",
  );
  expect(tokens["--rc-accent"]).toBe("#d4f34a");
});

test("a ordem das cores nao muda a razao", () => {
  expect(contrastRatio("#d4f34a", "#0f1113")).toBeCloseTo(contrastRatio("#0f1113", "#d4f34a"), 5);
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun test test/guards.test.ts
```

Esperado: FALHA, módulo `../scripts/check-contrast` não encontrado.

- [ ] **Step 3: Escrever o verificador de contraste**

`scripts/check-contrast.ts`:

```ts
/**
 * Guarda de contraste: le os arquivos de tema, resolve os tokens e falha se
 * algum par que carrega texto ficar abaixo do minimo da norma.
 */
const MIN_TEXT = 4.5;
const MIN_BODY = 7;

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

/**
 * Le `--rc-x: valor` e resolve um nivel de var(). Recebe a paleta concatenada
 * com o tema, porque o tema aponta para a paleta e ela vive em outro arquivo.
 */
export function readTokens(css: string): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const [, name, value] of css.matchAll(/(--rc-[\w-]+)\s*:\s*([^;]+);/g)) {
    raw[name] = value.trim();
  }
  const resolved: Record<string, string> = {};
  for (const [name, value] of Object.entries(raw)) {
    const ref = value.match(/^var\((--rc-[\w-]+)\)$/);
    resolved[name] = ref ? (raw[ref[1]] ?? value) : value;
  }
  return resolved;
}

/** Os pares que carregam texto e portanto precisam passar. */
const PAIRS: Array<[string, string, number]> = [
  ["--rc-fg", "--rc-bg", MIN_BODY],
  ["--rc-fg", "--rc-surface", MIN_BODY],
  ["--rc-fg-muted", "--rc-bg", MIN_TEXT],
  ["--rc-fg-muted", "--rc-surface", MIN_TEXT],
  ["--rc-fg-subtle", "--rc-bg", MIN_TEXT],
  ["--rc-fg-subtle", "--rc-surface", MIN_TEXT],
  ["--rc-accent-text", "--rc-bg", MIN_TEXT],
  ["--rc-accent-fg", "--rc-accent", MIN_TEXT],
  ["--rc-success", "--rc-bg", MIN_TEXT],
  ["--rc-warning", "--rc-bg", MIN_TEXT],
  ["--rc-danger", "--rc-bg", MIN_TEXT],
  ["--rc-info", "--rc-bg", MIN_TEXT],
  ["--rc-success-fg", "--rc-success", MIN_TEXT],
  ["--rc-warning-fg", "--rc-warning", MIN_TEXT],
  ["--rc-danger-fg", "--rc-danger", MIN_TEXT],
  ["--rc-info-fg", "--rc-info", MIN_TEXT],
];

/** `--rc-fg-disabled` e isento: texto desabilitado nao entra na norma. */
if (import.meta.main) {
  const { Glob } = await import("bun");
  const palette = await Bun.file("src/tokens/palette.css").text();
  const files = await Array.fromAsync(new Glob("src/tokens/themes/*.css").scan("."));
  let failed = 0;

  for (const file of files.sort()) {
    const tokens = readTokens(palette + "\n" + (await Bun.file(file).text()));
    console.log(`\n${file}`);
    for (const [fg, bg, min] of PAIRS) {
      const a = tokens[fg];
      const b = tokens[bg];
      if (!a || !b) {
        console.log(`  FALTA  ${fg} sobre ${bg}`);
        failed++;
        continue;
      }
      // Todo token de PAIRS carrega texto, entao precisa virar hexadecimal.
      // Nao resolver e defeito da paleta ou do tema, nunca motivo para pular.
      if (!a.startsWith("#") || !b.startsWith("#")) {
        console.log(`  FALHA  ${fg} ou ${bg} nao resolveu para hexadecimal`);
        failed++;
        continue;
      }
      const ratio = contrastRatio(a, b);
      const ok = ratio >= min;
      if (!ok) failed++;
      console.log(
        `  ${ok ? "ok   " : "FALHA"} ${fg} sobre ${bg}  ${ratio.toFixed(2)}:1 (min ${min})`,
      );
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} par(es) abaixo do minimo.`);
    process.exit(1);
  }
  console.log("\nContraste ok em todos os temas.");
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun test test/guards.test.ts
```

Esperado: 5 passes.

- [ ] **Step 5: Escrever a guarda de cor literal**

`scripts/check-no-literal-colors.ts`:

```ts
/**
 * Guarda do white-label: cor so pode existir em src/tokens. Um hexadecimal
 * dentro de um componente amarra a biblioteca a uma marca, e e a coisa mais
 * facil de fazer sem perceber.
 */
import { Glob } from "bun";

const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|oklch|oklab|lab|lch)\(/;
const Z_INDEX = /z-index\s*:\s*-?\d+|\bz-\[?-?\d+\]?\b/;

const files = await Array.fromAsync(
  new Glob("src/{primitives,provider,lib}/**/*.{ts,tsx,css}").scan("."),
);

let failed = 0;
for (const file of files.sort()) {
  const lines = (await Bun.file(file).text()).split("\n");
  lines.forEach((line, i) => {
    if (COLOR.test(line)) {
      console.error(`${file}:${i + 1}  cor literal: ${line.trim()}`);
      failed++;
    }
    if (Z_INDEX.test(line)) {
      console.error(`${file}:${i + 1}  empilhamento literal: ${line.trim()}`);
      failed++;
    }
  });
}

if (failed > 0) {
  console.error(
    `\n${failed} violacao(oes). Cor vive em src/tokens, empilhamento usa var(--rc-z-*).`,
  );
  process.exit(1);
}
console.log(`Guarda de cor literal ok em ${files.length} arquivo(s).`);
```

- [ ] **Step 6: Provar que a guarda pega uma violação de verdade**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui
mkdir -p src/primitives
printf 'export const wrong = "#ff0000"\n' > src/primitives/scratch.ts
bun run scripts/check-no-literal-colors.ts; echo "saida: $?"
```

Esperado: imprime `src/primitives/scratch.ts:1  cor literal:` e sai com código 1.

```bash
rm src/primitives/scratch.ts
bun run scripts/check-no-literal-colors.ts; echo "saida: $?"
```

Esperado: sai com código 0.

- [ ] **Step 7: Escrever o CI**

`.github/workflows/ci.yml`:

```yaml
name: ci

on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run lint
      - run: bun run check:colors
      - run: bun test
      # O contraste so tem tema para conferir a partir da Task 4.
      - run: bun run check:contrast
        if: hashFiles('src/tokens/themes/*.css') != ''
```

- [ ] **Step 8: Commitar**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui
git add -A
git commit -m "feat: guardas de cor literal e de contraste, mais o CI"
```

---

### Task 3: As três camadas de token e os dois temas

Entrega: `bun run check:contrast` passa nos dois temas, e um teste garante que todo token do contrato existe em ambos. As três camadas nascem juntas porque nenhuma faz sentido sozinha.

**Files:**

- Create: `src/tokens/palette.css`
- Create: `src/tokens/scales.css`
- Create: `src/tokens/contract.css`
- Create: `src/tokens/themes/rivocode-dark.css`
- Create: `src/tokens/themes/rivocode-light.css`
- Create: `src/styles.css`
- Create: `src/preset.css`
- Create: `scripts/build-preset.ts`
- Modify: `package.json` (script `build:css`)
- Test: `test/tokens.test.ts`

**Interfaces:**

- Produces: os nomes de token `--rc-*` listados abaixo. Todo componente das tarefas seguintes consome apenas estes nomes, e nunca a paleta.
- Produces: os seletores `[data-rc-theme='rivocode-dark']`, `[data-rc-theme='rivocode-light']` e `[data-rc-density='compact']`, que a Task 4 aplica.

- [ ] **Step 1: Escrever o teste de completude do contrato, que deve falhar**

Este teste é a rede que pega o erro mais comum de design system com dois temas: alguém adiciona um token, preenche num tema, esquece no outro, e a tela clara nasce quebrada meses depois.

`test/tokens.test.ts`:

```ts
import { expect, test } from "bun:test";

import { contrastRatio, readTokens } from "../scripts/check-contrast";

const read = (p: string) => Bun.file(p).text();

const base = async () =>
  (await read("src/tokens/palette.css")) + "\n" + (await read("src/tokens/scales.css"));

test("todo token que o contrato referencia existe nos dois temas", async () => {
  const contract = await read("src/tokens/contract.css");
  const referenced = [...contract.matchAll(/var\((--rc-[\w-]+)\)/g)].map((m) => m[1]);
  expect(referenced.length).toBeGreaterThan(20);

  const shared = await base();
  const dark = readTokens(shared + (await read("src/tokens/themes/rivocode-dark.css")));
  const light = readTokens(shared + (await read("src/tokens/themes/rivocode-light.css")));

  const faltando = referenced.filter((t) => !dark[t] || !light[t]);
  expect(faltando).toEqual([]);
});

test("nenhum componente le da paleta crua", async () => {
  const { Glob } = await import("bun");
  const files = await Array.fromAsync(
    new Glob("src/{primitives,provider}/**/*.{ts,tsx}").scan("."),
  );
  for (const file of files) {
    expect(await Bun.file(file).text()).not.toContain("--rc-p-");
  }
});

test("a densidade compacta encolhe todo controle", async () => {
  const scales = readTokens(await read("src/tokens/scales.css"));
  expect(scales["--rc-control-md"]).toBeDefined();
});

test("o acento do tema claro passa como texto, e a lima crua nao passaria", async () => {
  const shared = await base();
  const light = readTokens(shared + (await read("src/tokens/themes/rivocode-light.css")));
  expect(contrastRatio(light["--rc-accent-text"], light["--rc-bg"])).toBeGreaterThan(4.5);
  expect(contrastRatio("#d4f34a", light["--rc-bg"])).toBeLessThan(2);
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun test test/tokens.test.ts
```

Esperado: FALHA, arquivo `src/tokens/palette.css` não existe.

- [ ] **Step 3: Escrever a camada 1, a paleta crua**

`src/tokens/palette.css`:

```css
/* ---------------------------------------------------------------------------
 * Camada 1: valores crus. Nenhum componente le daqui, so os arquivos de tema.
 * Um cliente com marca propria traz a paleta dele e ignora esta.
 * ------------------------------------------------------------------------- */

:root {
  /* Lima, a marca */
  --rc-p-lima-300: #e6ff7a;
  --rc-p-lima-500: #d4f34a;
  --rc-p-lima-600: #bfdd3a;
  --rc-p-lima-700: #4a7100;

  /* Grafite, as superficies escuras */
  --rc-p-graphite-900: #0f1113;
  --rc-p-graphite-800: #14171a;
  --rc-p-graphite-700: #171a1d;

  /* Papel, as superficies claras */
  --rc-p-white: #ffffff;
  --rc-p-paper: #fbfbfa;

  /* Cinzas de texto */
  --rc-p-gray-100: #f2f3f0;
  --rc-p-gray-300: #b9bfc6;
  --rc-p-gray-500: #8b9199;
  --rc-p-gray-600: #6c737b;
  --rc-p-gray-700: #5b6169;

  /* Estados. O sucesso puxa para o teal para nao competir com a lima. */
  --rc-p-teal-400: #3ddc97;
  --rc-p-teal-700: #0f766e;
  --rc-p-amber-400: #f2b21c;
  --rc-p-amber-700: #a15c00;
  --rc-p-red-400: #ff6b6b;
  --rc-p-red-700: #c0261f;
  --rc-p-blue-400: #6aa9ff;
  --rc-p-blue-700: #1d4ed8;
}
```

- [ ] **Step 4: Escrever as escalas, que não dependem de tema**

`src/tokens/scales.css`:

```css
/* ---------------------------------------------------------------------------
 * Escalas: forma, tipografia, empilhamento, movimento e densidade. Sao iguais
 * em todo tema, porque descrevem estrutura e nao marca.
 * ------------------------------------------------------------------------- */

:root {
  /* Forma. O padrao do produto e o canto sobrio, a pilula e variante. */
  --rc-radius-sm: 6px;
  --rc-radius-md: 8px;
  --rc-radius-lg: 12px;
  --rc-radius-xl: 16px;
  --rc-radius-pill: 999px;

  /* Tipografia de produto, densa e previsivel. */
  --rc-text-xs: 12px;
  --rc-text-sm: 13px;
  --rc-text-base: 14px;
  --rc-text-md: 16px;
  --rc-text-lg: 18px;
  --rc-text-xl: 20px;
  --rc-text-2xl: 24px;
  --rc-text-3xl: 30px;

  --rc-leading-tight: 1.25;
  --rc-leading-normal: 1.5;
  --rc-leading-relaxed: 1.7;

  --rc-font-sans: "Manrope Variable", system-ui, sans-serif;
  --rc-font-display: "Poppins", "Manrope Variable", sans-serif;
  --rc-font-mono: "JetBrains Mono Variable", ui-monospace, monospace;

  /* Empilhamento. Definir isto agora e o que evita o z-index 9999 depois. */
  --rc-z-base: 0;
  --rc-z-sticky: 100;
  --rc-z-dropdown: 200;
  --rc-z-overlay: 300;
  --rc-z-dialog: 400;
  --rc-z-popover: 500;
  --rc-z-toast: 600;
  --rc-z-tooltip: 700;

  /* Movimento */
  --rc-duration-fast: 120ms;
  --rc-duration-base: 200ms;
  --rc-duration-slow: 320ms;
  --rc-ease: cubic-bezier(0.2, 0, 0, 1);

  /* Foco */
  --rc-ring-width: 2px;
  --rc-ring-offset: 2px;
}

/* Densidade confortavel, o padrao. */
:root,
[data-rc-density="comfortable"] {
  --rc-control-sm: 32px;
  --rc-control-md: 40px;
  --rc-control-lg: 48px;
  --rc-control-pad-sm: 10px;
  --rc-control-pad-md: 14px;
  --rc-control-pad-lg: 18px;
}

/* Densidade compacta, para tela de operacao. */
[data-rc-density="compact"] {
  --rc-control-sm: 28px;
  --rc-control-md: 32px;
  --rc-control-lg: 38px;
  --rc-control-pad-sm: 8px;
  --rc-control-pad-md: 10px;
  --rc-control-pad-lg: 14px;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --rc-duration-fast: 0ms;
    --rc-duration-base: 0ms;
    --rc-duration-slow: 0ms;
  }
}
```

- [ ] **Step 5: Escrever a camada 2, o contrato**

`src/tokens/contract.css`:

```css
/* ---------------------------------------------------------------------------
 * Camada 2: o contrato. Liga o vocabulario de utilitarios do Tailwind aos
 * tokens semanticos. E o unico lugar que traduz `bg-surface` em `--rc-surface`.
 *
 * Todo nome aqui vira utilitario: --color-surface produz bg-surface,
 * text-surface e border-surface. Vale dentro da biblioteca e no layout que o
 * projeto consumidor escreve, que e o ponto do preset.
 * ------------------------------------------------------------------------- */

@theme inline {
  --color-bg: var(--rc-bg);
  --color-surface: var(--rc-surface);
  --color-surface-raised: var(--rc-surface-raised);
  --color-overlay: var(--rc-overlay);

  --color-fg: var(--rc-fg);
  --color-fg-muted: var(--rc-fg-muted);
  --color-fg-subtle: var(--rc-fg-subtle);
  --color-fg-disabled: var(--rc-fg-disabled);

  --color-accent: var(--rc-accent);
  --color-accent-hover: var(--rc-accent-hover);
  --color-accent-active: var(--rc-accent-active);
  --color-accent-fg: var(--rc-accent-fg);
  --color-accent-text: var(--rc-accent-text);
  --color-accent-subtle: var(--rc-accent-subtle);

  --color-border: var(--rc-border);
  --color-border-strong: var(--rc-border-strong);
  --color-ring: var(--rc-ring);

  --color-success: var(--rc-success);
  --color-success-fg: var(--rc-success-fg);
  --color-success-subtle: var(--rc-success-subtle);
  --color-warning: var(--rc-warning);
  --color-warning-fg: var(--rc-warning-fg);
  --color-warning-subtle: var(--rc-warning-subtle);
  --color-danger: var(--rc-danger);
  --color-danger-fg: var(--rc-danger-fg);
  --color-danger-subtle: var(--rc-danger-subtle);
  --color-info: var(--rc-info);
  --color-info-fg: var(--rc-info-fg);
  --color-info-subtle: var(--rc-info-subtle);

  --radius-sm: var(--rc-radius-sm);
  --radius-md: var(--rc-radius-md);
  --radius-lg: var(--rc-radius-lg);
  --radius-xl: var(--rc-radius-xl);
  --radius-pill: var(--rc-radius-pill);

  --text-xs: var(--rc-text-xs);
  --text-sm: var(--rc-text-sm);
  --text-base: var(--rc-text-base);
  --text-md: var(--rc-text-md);
  --text-lg: var(--rc-text-lg);
  --text-xl: var(--rc-text-xl);
  --text-2xl: var(--rc-text-2xl);
  --text-3xl: var(--rc-text-3xl);
  /* Marketing, so para quem constroi pagina de venda. */
  --text-display: var(--rc-text-display);
  --text-hero: var(--rc-text-hero);

  --font-sans: var(--rc-font-sans);
  --font-display: var(--rc-font-display);
  --font-mono: var(--rc-font-mono);

  --shadow-1: var(--rc-shadow-1);
  --shadow-2: var(--rc-shadow-2);
  --shadow-3: var(--rc-shadow-3);

  --ease-rc: var(--rc-ease);
}
```

- [ ] **Step 6: Escrever o tema escuro**

Todo valor abaixo foi medido. As razões estão no spec e são reconferidas pela guarda.

`src/tokens/themes/rivocode-dark.css`:

```css
/* Camada 3: o tema escuro da RivoCode, o padrao. */

[data-rc-theme="rivocode-dark"] {
  --rc-bg: var(--rc-p-graphite-900);
  --rc-surface: var(--rc-p-graphite-800);
  --rc-surface-raised: var(--rc-p-graphite-700);
  --rc-overlay: rgb(0 0 0 / 0.62);

  --rc-fg: var(--rc-p-gray-100);
  --rc-fg-muted: var(--rc-p-gray-300);
  --rc-fg-subtle: var(--rc-p-gray-500);
  --rc-fg-disabled: var(--rc-p-gray-600);

  --rc-accent: var(--rc-p-lima-500);
  --rc-accent-hover: var(--rc-p-lima-300);
  --rc-accent-active: var(--rc-p-lima-600);
  --rc-accent-fg: var(--rc-p-graphite-900);
  --rc-accent-text: var(--rc-p-lima-500);
  --rc-accent-subtle: rgb(212 243 74 / 0.14);

  --rc-border: rgb(255 255 255 / 0.09);
  --rc-border-strong: rgb(255 255 255 / 0.14);
  --rc-ring: var(--rc-p-lima-500);

  --rc-success: var(--rc-p-teal-400);
  --rc-success-fg: var(--rc-p-graphite-900);
  --rc-success-subtle: rgb(61 220 151 / 0.14);
  --rc-warning: var(--rc-p-amber-400);
  --rc-warning-fg: var(--rc-p-graphite-900);
  --rc-warning-subtle: rgb(242 178 28 / 0.14);
  --rc-danger: var(--rc-p-red-400);
  --rc-danger-fg: var(--rc-p-graphite-900);
  --rc-danger-subtle: rgb(255 107 107 / 0.14);
  --rc-info: var(--rc-p-blue-400);
  --rc-info-fg: var(--rc-p-graphite-900);
  --rc-info-subtle: rgb(106 169 255 / 0.14);

  /* Passos de marketing. Vivem no tema da marca, nao no nucleo: um sistema de
   * gestao nao deveria nem enxergar um titulo de 88 pixels. */
  --rc-text-display: clamp(32px, 4.2vw, 54px);
  --rc-text-hero: clamp(44px, 6.6vw, 88px);

  --rc-shadow-1: 0 1px 2px rgb(0 0 0 / 0.4);
  --rc-shadow-2: 0 6px 18px rgb(0 0 0 / 0.44);
  --rc-shadow-3: 0 14px 36px rgb(0 0 0 / 0.5);

  color-scheme: dark;
}
```

- [ ] **Step 7: Escrever o tema claro**

A lima continua preenchendo, mas quem carrega texto é `--rc-accent-text`. Essa separação é a razão de o tema claro funcionar.

`src/tokens/themes/rivocode-light.css`:

```css
/* Camada 3: o tema claro da RivoCode. */

[data-rc-theme="rivocode-light"] {
  --rc-bg: var(--rc-p-paper);
  --rc-surface: var(--rc-p-white);
  --rc-surface-raised: var(--rc-p-white);
  --rc-overlay: rgb(15 17 19 / 0.42);

  --rc-fg: var(--rc-p-graphite-800);
  --rc-fg-muted: var(--rc-p-gray-700);
  --rc-fg-subtle: var(--rc-p-gray-600);
  --rc-fg-disabled: var(--rc-p-gray-500);

  /* A lima preenche, com texto escuro por cima: 15,06 para 1. */
  --rc-accent: var(--rc-p-lima-500);
  --rc-accent-hover: var(--rc-p-lima-300);
  --rc-accent-active: var(--rc-p-lima-600);
  --rc-accent-fg: var(--rc-p-graphite-900);
  /* Como texto a lima daria 1,6 para 1, entao aqui ela e escurecida. */
  --rc-accent-text: var(--rc-p-lima-700);
  --rc-accent-subtle: rgb(212 243 74 / 0.22);

  --rc-border: rgb(15 17 19 / 0.1);
  --rc-border-strong: rgb(15 17 19 / 0.18);
  --rc-ring: var(--rc-p-lima-700);

  --rc-success: var(--rc-p-teal-700);
  --rc-success-fg: var(--rc-p-white);
  --rc-success-subtle: rgb(15 118 110 / 0.1);
  --rc-warning: var(--rc-p-amber-700);
  --rc-warning-fg: var(--rc-p-white);
  --rc-warning-subtle: rgb(161 92 0 / 0.1);
  --rc-danger: var(--rc-p-red-700);
  --rc-danger-fg: var(--rc-p-white);
  --rc-danger-subtle: rgb(192 38 31 / 0.1);
  --rc-info: var(--rc-p-blue-700);
  --rc-info-fg: var(--rc-p-white);
  --rc-info-subtle: rgb(29 78 216 / 0.1);

  --rc-text-display: clamp(32px, 4.2vw, 54px);
  --rc-text-hero: clamp(44px, 6.6vw, 88px);

  --rc-shadow-1: 0 1px 2px rgb(15 17 19 / 0.06);
  --rc-shadow-2: 0 6px 18px rgb(15 17 19 / 0.08);
  --rc-shadow-3: 0 14px 36px rgb(15 17 19 / 0.12);

  color-scheme: light;
}
```

- [ ] **Step 8: Escrever os dois pontos de entrada de CSS**

`src/preset.css`, o que o projeto consumidor importa para ganhar o vocabulário:

```css
/* O vocabulario da RivoCode para o Tailwind do projeto consumidor. */
@import "./tokens/palette.css";
@import "./tokens/scales.css";
@import "./tokens/contract.css";
@import "./tokens/themes/rivocode-dark.css";
@import "./tokens/themes/rivocode-light.css";
```

`src/styles.css`, a folha completa da biblioteca:

```css
@import "tailwindcss";

/* O Tailwind precisa varrer os componentes para gerar as classes que eles usam. */
@source './primitives';
@source './provider';

@import "./preset.css";
```

- [ ] **Step 9: Escrever o gerador do preset achatado**

O consumidor recebe um arquivo só, sem `@import` relativo que possa não resolver do lado dele.

`scripts/build-preset.ts`:

```ts
/**
 * Achata os arquivos de token num unico dist/preset.css. O consumidor importa
 * um arquivo e pronto, sem depender de como o bundler dele resolve @import
 * relativo dentro de node_modules.
 */
const ORDER = [
  "src/tokens/palette.css",
  "src/tokens/scales.css",
  "src/tokens/contract.css",
  "src/tokens/themes/rivocode-dark.css",
  "src/tokens/themes/rivocode-light.css",
];

const parts: string[] = ["/* @rivocode/ui: tokens e temas. Gerado, nao editar. */"];
for (const file of ORDER) {
  parts.push(`\n/* ${file} */\n${await Bun.file(file).text()}`);
}

await Bun.write("dist/preset.css", parts.join("\n"));
console.log(`dist/preset.css gerado a partir de ${ORDER.length} arquivos.`);
```

Atualizar o script no `package.json`:

```json
"build:css": "tailwindcss -i src/styles.css -o dist/styles.css && bun run scripts/build-preset.ts"
```

- [ ] **Step 10: Rodar os testes e a guarda de contraste**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui
bun test test/tokens.test.ts
bun run check:contrast
```

Esperado no teste: 4 passes.
Esperado na guarda: os dois temas listados, todo par com `ok`, e a linha final `Contraste ok em todos os temas.`

Se algum par falhar, o valor é que está errado, nunca o mínimo. Escurecer ou clarear o token na paleta e rodar de novo.

- [ ] **Step 11: Confirmar que a CSS compila**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun run build:css && ls -la dist/*.css
```

Esperado: `dist/styles.css` e `dist/preset.css` existem, e `grep -c "rc-accent" dist/preset.css` retorna mais de 5.

- [ ] **Step 12: Commitar**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui
git add -A
git commit -m "feat: tokens em tres camadas e os dois temas da marca"
```

---

### Task 4: `cn` e o `RivoProvider`

Entrega: o Provider aplica tema e densidade em modo global ou escopado, e expõe um container de portal que carrega o tema. Sem isso, todo componente com portal nasce sem estilo no modo escopado.

**Files:**

- Create: `src/lib/cn.ts`
- Create: `src/provider/rivo-provider.tsx`
- Modify: `src/index.ts`
- Test: `test/provider.test.tsx`

**Interfaces:**

- Produces: `cn(...inputs: ClassValue[]): string`
- Produces: `RivoProvider`, com props `theme?: 'rivocode-dark' | 'rivocode-light' | 'system'`, `density?: 'comfortable' | 'compact'`, `scope?: 'global' | 'local'`, `className?: string`, `children: ReactNode`
- Produces: `useRivoContext(): { theme: RivoTheme; density: RivoDensity; portalContainer: HTMLElement | null }`, consumido pelo Dialog da Task 9
- Produces: os tipos `RivoTheme` e `RivoDensity`

- [ ] **Step 1: Escrever os testes, que devem falhar**

`test/provider.test.tsx`:

```tsx
import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider, useRivoContext } from "../src/provider/rivo-provider";

function Espia() {
  const { theme, density, portalContainer } = useRivoContext();
  return (
    <span data-testid="espia" data-portal={portalContainer ? "sim" : "nao"}>
      {theme}/{density}
    </span>
  );
}

test("o modo global marca o tema no elemento raiz do documento", () => {
  render(
    <RivoProvider scope="global" theme="rivocode-dark">
      <p>ola</p>
    </RivoProvider>,
  );
  expect(document.documentElement.dataset.rcTheme).toBe("rivocode-dark");
  expect(document.documentElement.dataset.rcDensity).toBe("comfortable");
});

test("o modo escopado marca o proprio elemento e nao toca no documento", () => {
  document.documentElement.removeAttribute("data-rc-theme");
  render(
    <RivoProvider scope="local" theme="rivocode-light" density="compact">
      <p>ola</p>
    </RivoProvider>,
  );
  const escopo = document.querySelector('[data-rc-theme="rivocode-light"]');
  expect(escopo).not.toBeNull();
  expect(escopo?.getAttribute("data-rc-density")).toBe("compact");
  expect(document.documentElement.dataset.rcTheme).toBeUndefined();
});

test("o contexto entrega tema, densidade e container de portal", () => {
  render(
    <RivoProvider theme="rivocode-dark" density="compact">
      <Espia />
    </RivoProvider>,
  );
  expect(screen.getByTestId("espia").textContent).toBe("rivocode-dark/compact");
  expect(screen.getByTestId("espia").dataset.portal).toBe("sim");
});

test("o container de portal carrega o tema, senao o dialogo sai sem estilo", () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <p>ola</p>
    </RivoProvider>,
  );
  const portais = document.body.querySelectorAll(
    ':scope > [data-rc-portal][data-rc-theme="rivocode-light"]',
  );
  expect(portais.length).toBe(1);
});

test("usar o contexto fora do Provider da um erro que explica o que fazer", () => {
  expect(() => render(<Espia />)).toThrow(/RivoProvider/);
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun test test/provider.test.tsx
```

Esperado: FALHA, módulo `../src/provider/rivo-provider` não encontrado.

- [ ] **Step 3: Escrever o `cn`**

`src/lib/cn.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes condicionais resolvendo conflitos do Tailwind. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Escrever o Provider**

`src/provider/rivo-provider.tsx`:

```tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { cn } from "../lib/cn";

export type RivoTheme = "rivocode-dark" | "rivocode-light";
export type RivoDensity = "comfortable" | "compact";

type RivoContextValue = {
  theme: RivoTheme;
  density: RivoDensity;
  /**
   * Onde dialogo, menu e dica renderizam. No modo escopado os tokens vivem num
   * elemento nosso, e um portal no fim do body sairia sem tema. Este container
   * carrega os mesmos atributos, entao o portal continua vestido.
   */
  portalContainer: HTMLElement | null;
};

const RivoContext = createContext<RivoContextValue | null>(null);

export function useRivoContext(): RivoContextValue {
  const value = useContext(RivoContext);
  if (!value) {
    throw new Error(
      "Componente do @rivocode/ui usado fora do RivoProvider. Envolva a arvore com <RivoProvider>.",
    );
  }
  return value;
}

export type RivoProviderProps = {
  children: ReactNode;
  /** `system` segue a preferencia do sistema operacional. */
  theme?: RivoTheme | "system";
  density?: RivoDensity;
  /**
   * `global` veste a pagina inteira, para projeto novo. `local` veste apenas
   * esta arvore, para quando o DS entra num projeto herdado do cliente e nao
   * pode vazar para o resto.
   */
  scope?: "global" | "local";
  className?: string;
};

function resolveSystemTheme(): RivoTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "rivocode-dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "rivocode-light"
    : "rivocode-dark";
}

export function RivoProvider({
  children,
  theme = "rivocode-dark",
  density = "comfortable",
  scope = "global",
  className,
}: RivoProviderProps) {
  const [systemTheme, setSystemTheme] = useState<RivoTheme>(resolveSystemTheme);
  const resolved: RivoTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const update = () => setSystemTheme(query.matches ? "rivocode-light" : "rivocode-dark");
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [theme]);

  useEffect(() => {
    if (scope !== "global") return;
    const root = document.documentElement;
    root.dataset.rcTheme = resolved;
    root.dataset.rcDensity = density;
  }, [scope, resolved, density]);

  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const node = document.createElement("div");
    node.dataset.rcPortal = "";
    document.body.appendChild(node);
    setPortalContainer(node);
    return () => {
      node.remove();
    };
  }, []);

  useEffect(() => {
    if (!portalContainer) return;
    portalContainer.dataset.rcTheme = resolved;
    portalContainer.dataset.rcDensity = density;
  }, [portalContainer, resolved, density]);

  const value = useMemo<RivoContextValue>(
    () => ({ theme: resolved, density, portalContainer }),
    [resolved, density, portalContainer],
  );

  return (
    <RivoContext.Provider value={value}>
      {scope === "local" ? (
        <div
          data-rc-theme={resolved}
          data-rc-density={density}
          className={cn("bg-bg font-sans text-fg", className)}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </RivoContext.Provider>
  );
}
```

- [ ] **Step 5: Exportar no barrel**

`src/index.ts`:

```ts
export const version = "0.1.0";

export { cn } from "./lib/cn";
export {
  RivoProvider,
  useRivoContext,
  type RivoDensity,
  type RivoProviderProps,
  type RivoTheme,
} from "./provider/rivo-provider";
```

- [ ] **Step 6: Rodar os testes e confirmar que passam**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun test
```

Esperado: todos os testes passam, incluindo os 5 do Provider.

Se `o modo escopado` falhar porque o teste anterior deixou o atributo no documento, o problema é o teste e não o código: o `removeAttribute` no começo do caso já cobre isso.

- [ ] **Step 7: Rodar as guardas**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun run check:colors
```

Esperado: `Guarda de cor literal ok`.

- [ ] **Step 8: Commitar**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui
git add -A
git commit -m "feat: RivoProvider com tema, densidade, escopo e container de portal"
```

---

### Task 5: `Button`

Entrega: o primeiro componente visível, com quatro variantes, três tamanhos, a variante de forma em pílula e estado de carregamento.

**Files:**

- Create: `src/primitives/button.tsx`
- Modify: `src/index.ts`
- Test: `test/button.test.tsx`

**Interfaces:**

- Produces: `Button`, componente que aceita todas as props de `<button>` mais `variant`, `size`, `shape`, `loading`
- Produces: `buttonVariants`, usado por outros componentes que precisam parecer botão sem ser um
- Produces: `type ButtonProps`

- [ ] **Step 1: Escrever os testes, que devem falhar**

`test/button.test.tsx`:

```tsx
import { expect, test } from "bun:test";
import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { Button } from "../src/primitives/button";

test("renderiza o rotulo", () => {
  render(<Button>Falar no WhatsApp</Button>);
  expect(screen.getByRole("button", { name: "Falar no WhatsApp" })).toBeDefined();
});

test("a variante padrao e a primaria", () => {
  render(<Button>Enviar</Button>);
  expect(screen.getByRole("button").className).toContain("bg-accent");
});

test("a variante destrutiva usa o token de perigo, nunca um vermelho literal", () => {
  render(<Button variant="destructive">Excluir</Button>);
  const classes = screen.getByRole("button").className;
  expect(classes).toContain("bg-danger");
  expect(classes).not.toMatch(/#[0-9a-f]{3,6}/i);
});

test("a forma pilula troca o raio, e o padrao do produto nao e pilula", () => {
  const { rerender } = render(<Button>Padrao</Button>);
  expect(screen.getByRole("button").className).toContain("rounded-md");

  rerender(<Button shape="pill">Marketing</Button>);
  expect(screen.getByRole("button").className).toContain("rounded-pill");
});

test("o tamanho vem do token de densidade, nao de uma altura cravada", () => {
  render(<Button size="lg">Grande</Button>);
  expect(screen.getByRole("button").className).toContain("--rc-control-lg");
});

test("encaminha a ref para o elemento nativo", () => {
  const ref = createRef<HTMLButtonElement>();
  render(<Button ref={ref}>Ok</Button>);
  expect(ref.current?.tagName).toBe("BUTTON");
});

test("desabilitado nao dispara clique", () => {
  let cliques = 0;
  render(
    <Button
      disabled
      onClick={() => {
        cliques++;
      }}
    >
      Ok
    </Button>,
  );
  fireEvent.click(screen.getByRole("button"));
  expect(cliques).toBe(0);
});

test("carregando desabilita, anuncia ocupado e esconde o giro do leitor de tela", () => {
  render(<Button loading>Salvando</Button>);
  const botao = screen.getByRole("button");
  expect(botao.getAttribute("aria-busy")).toBe("true");
  expect((botao as HTMLButtonElement).disabled).toBe(true);
  expect(botao.querySelector('[aria-hidden="true"]')).not.toBeNull();
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun test test/button.test.tsx
```

Esperado: FALHA, módulo `../src/primitives/button` não encontrado.

- [ ] **Step 3: Escrever o Button**

Nota de projeto: este componente não usa a Base UI. Um botão nativo já tem toda a semântica e o comportamento de teclado corretos, e envolver isso em abstração só adiciona peso. A Base UI entra onde ela ganha o lugar dela, que é `Field` e `Dialog`.

`src/primitives/button.tsx`:

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef, Ref } from "react";

import { cn } from "../lib/cn";

export const buttonVariants = cva(
  cn(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "font-sans font-medium",
    "transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:pointer-events-none disabled:opacity-60",
  ),
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active",
        secondary: "border border-border-strong bg-surface text-fg hover:bg-surface-raised",
        ghost: "text-fg-muted hover:bg-accent-subtle hover:text-fg",
        destructive: "bg-danger text-danger-fg hover:opacity-90",
      },
      size: {
        sm: "h-[var(--rc-control-sm)] px-[var(--rc-control-pad-sm)] text-sm",
        md: "h-[var(--rc-control-md)] px-[var(--rc-control-pad-md)] text-base",
        lg: "h-[var(--rc-control-lg)] px-[var(--rc-control-pad-lg)] text-md",
      },
      shape: {
        default: "rounded-md",
        pill: "rounded-pill",
      },
    },
    defaultVariants: { variant: "primary", size: "md", shape: "default" },
  },
);

export type ButtonProps = ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Desabilita e anuncia ocupado enquanto uma acao esta em andamento. */
    loading?: boolean;
    ref?: Ref<HTMLButtonElement>;
  };

export function Button({
  className,
  variant,
  size,
  shape,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, shape }), className)}
    >
      {loading && (
        <span
          aria-hidden="true"
          className={cn(
            "size-4 animate-spin rounded-pill border-2 border-current",
            "border-t-transparent",
          )}
        />
      )}
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Exportar no barrel**

Acrescentar em `src/index.ts`:

```ts
export { Button, buttonVariants, type ButtonProps } from "./primitives/button";
```

- [ ] **Step 5: Rodar os testes e confirmar que passam**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun test test/button.test.tsx
```

Esperado: 8 passes.

- [ ] **Step 6: Rodar as guardas e o build**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui
bun run check:colors && bun run build
```

Esperado: guarda ok, e `dist/styles.css` passa a conter as classes do botão. Conferir:

```bash
grep -c "bg-accent" dist/styles.css
```

Esperado: pelo menos 1. Se der 0, o `@source` do `src/styles.css` não está alcançando `src/primitives`.

- [ ] **Step 7: Commitar**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui
git add -A
git commit -m "feat: Button com quatro variantes, tres tamanhos e forma em pilula"
```

---

### Task 6: `Card`

Entrega: a peça que prova as superfícies. É onde a diferença entre `bg`, `surface` e `surface-raised` aparece, e onde o tema claro costuma denunciar erro de elevação.

**Files:**

- Create: `src/primitives/card.tsx`
- Modify: `src/index.ts`
- Test: `test/card.test.tsx`

**Interfaces:**

- Produces: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, todos aceitando as props de `<div>` mais `className`
- Produces: `type CardProps`, com `elevation?: 'flat' | 'raised'`

- [ ] **Step 1: Escrever os testes, que devem falhar**

`test/card.test.tsx`:

```tsx
import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../src/primitives/card";

test("o cartao usa a superficie e a borda do tema", () => {
  render(<Card data-testid="cartao">conteudo</Card>);
  const classes = screen.getByTestId("cartao").className;
  expect(classes).toContain("bg-surface");
  expect(classes).toContain("border-border");
  expect(classes).toContain("rounded-lg");
});

test("a elevacao levantada troca a superficie e ganha sombra", () => {
  render(
    <Card data-testid="cartao" elevation="raised">
      conteudo
    </Card>,
  );
  const classes = screen.getByTestId("cartao").className;
  expect(classes).toContain("bg-surface-raised");
  expect(classes).toContain("shadow-2");
});

test("o titulo sai como cabecalho de verdade, nao como div estilizada", () => {
  render(
    <Card>
      <CardHeader>
        <CardTitle>Resumo do mes</CardTitle>
        <CardDescription>Agosto de 2026</CardDescription>
      </CardHeader>
      <CardContent>corpo</CardContent>
      <CardFooter>rodape</CardFooter>
    </Card>,
  );
  expect(screen.getByRole("heading", { name: "Resumo do mes" }).tagName).toBe("H3");
  expect(screen.getByText("Agosto de 2026").className).toContain("text-fg-muted");
});

test("a classe passada por quem usa sobrescreve a do componente", () => {
  render(<Card data-testid="cartao" className="rounded-xl" />);
  const classes = screen.getByTestId("cartao").className;
  expect(classes).toContain("rounded-xl");
  expect(classes).not.toContain("rounded-lg");
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun test test/card.test.tsx
```

Esperado: FALHA, módulo não encontrado.

- [ ] **Step 3: Escrever o Card**

`src/primitives/card.tsx`:

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";

export const cardVariants = cva("rounded-lg border border-border", {
  variants: {
    elevation: {
      flat: "bg-surface",
      raised: "bg-surface-raised shadow-2",
    },
  },
  defaultVariants: { elevation: "flat" },
});

export type CardProps = ComponentPropsWithoutRef<"div"> & VariantProps<typeof cardVariants>;

export function Card({ className, elevation, ...props }: CardProps) {
  return <div {...props} className={cn(cardVariants({ elevation }), className)} />;
}

export function CardHeader({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={cn("flex flex-col gap-1 p-5 pb-3", className)} />;
}

export function CardTitle({ className, ...props }: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      {...props}
      className={cn("font-display text-xl leading-[var(--rc-leading-tight)] text-fg", className)}
    />
  );
}

export function CardDescription({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p {...props} className={cn("text-sm text-fg-muted", className)} />;
}

export function CardContent({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={cn("px-5 py-3 text-base text-fg", className)} />;
}

export function CardFooter({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      className={cn("flex items-center gap-3 border-t border-border p-5 pt-3", className)}
    />
  );
}
```

- [ ] **Step 4: Exportar no barrel**

Acrescentar em `src/index.ts`:

```ts
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
  type CardProps,
} from "./primitives/card";
```

- [ ] **Step 5: Rodar e confirmar que passa**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun test test/card.test.tsx && bun run check:colors
```

Esperado: 4 passes e guarda ok.

- [ ] **Step 6: Commitar**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui
git add -A
git commit -m "feat: Card com cabecalho, corpo, rodape e duas elevacoes"
```

---

### Task 7: `Badge`

Entrega: a peça que estreia as cores de estado. É o teste mais direto de que a paleta nova convive com a lima nos dois temas.

**Files:**

- Create: `src/primitives/badge.tsx`
- Modify: `src/index.ts`
- Test: `test/badge.test.tsx`

**Interfaces:**

- Produces: `Badge`, com `tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'` e `size?: 'sm' | 'md'`
- Produces: `type BadgeProps`

- [ ] **Step 1: Escrever os testes, que devem falhar**

`test/badge.test.tsx`:

```tsx
import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Badge } from "../src/primitives/badge";

test("o tom padrao e neutro", () => {
  render(<Badge>Rascunho</Badge>);
  expect(screen.getByText("Rascunho").className).toContain("text-fg-muted");
});

const TONS = [
  ["success", "text-success"],
  ["warning", "text-warning"],
  ["danger", "text-danger"],
  ["info", "text-info"],
] as const;

for (const [tom, esperado] of TONS) {
  test(`o tom ${tom} usa o token de estado`, () => {
    render(<Badge tone={tom}>{tom}</Badge>);
    expect(screen.getByText(tom).className).toContain(esperado);
  });
}

test("nenhum tom carrega cor literal", () => {
  render(<Badge tone="danger">Erro</Badge>);
  expect(screen.getByText("Erro").className).not.toMatch(/#[0-9a-f]{3,6}|rgb\(/i);
});

test("o selo e sempre pilula, porque selo nao e botao", () => {
  render(<Badge>Ativo</Badge>);
  expect(screen.getByText("Ativo").className).toContain("rounded-pill");
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun test test/badge.test.tsx
```

Esperado: FALHA, módulo não encontrado.

- [ ] **Step 3: Escrever o Badge**

Decisão de projeto: o selo é a única peça que fica em pílula por padrão. Pílula em botão de formulário parece brinquedo, mas selo em canto reto parece etiqueta de sistema antigo. Forma segue função.

`src/primitives/badge.tsx`:

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";

export const badgeVariants = cva(
  cn(
    "inline-flex items-center gap-1.5 rounded-pill border font-sans font-medium",
    "whitespace-nowrap",
  ),
  {
    variants: {
      tone: {
        neutral: "border-border bg-surface-raised text-fg-muted",
        accent: "border-border-strong bg-accent-subtle text-accent-text",
        success: "border-border bg-success-subtle text-success",
        warning: "border-border bg-warning-subtle text-warning",
        danger: "border-border bg-danger-subtle text-danger",
        info: "border-border bg-info-subtle text-info",
      },
      size: {
        sm: "h-5 px-2 text-xs",
        md: "h-6 px-2.5 text-sm",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export type BadgeProps = ComponentPropsWithoutRef<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span {...props} className={cn(badgeVariants({ tone, size }), className)} />;
}
```

- [ ] **Step 4: Exportar no barrel**

Acrescentar em `src/index.ts`:

```ts
export { Badge, badgeVariants, type BadgeProps } from "./primitives/badge";
```

- [ ] **Step 5: Rodar e confirmar que passa**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun test test/badge.test.tsx && bun run check:colors
```

Esperado: 7 passes e guarda ok.

- [ ] **Step 6: Commitar**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui
git add -A
git commit -m "feat: Badge com os seis tons de estado"
```

---

### Task 8: `Field` e `Input`

Entrega: o campo de formulário com rótulo, ajuda e erro ligados por acessibilidade. Aqui a Base UI ganha o lugar dela: a ligação entre rótulo, controle, descrição e mensagem de erro é chata de acertar à mão e fácil de quebrar sem perceber.

**Files:**

- Create: `src/primitives/field.tsx`
- Modify: `src/index.ts`
- Test: `test/field.test.tsx`

**Interfaces:**

- Produces: `Field` (raiz, aceita `invalid`, `disabled`, `name`), `FieldLabel`, `Input`, `FieldDescription`, `FieldError`
- Produces: `type InputProps`, com `size?: 'sm' | 'md' | 'lg'`
- Consumes: `@base-ui/react/field`, confirmado na Task 1 Step 3

- [ ] **Step 1: Escrever os testes, que devem falhar**

`test/field.test.tsx`:

```tsx
import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Field, FieldDescription, FieldError, FieldLabel, Input } from "../src/primitives/field";

test("o rotulo fica ligado ao controle, entao a busca por rotulo acha o campo", () => {
  render(
    <Field name="email">
      <FieldLabel>Email</FieldLabel>
      <Input placeholder="voce@empresa.com" />
    </Field>,
  );
  const campo = screen.getByLabelText("Email");
  expect(campo.tagName).toBe("INPUT");
});

test("a descricao acompanha o campo para o leitor de tela", () => {
  render(
    <Field name="cnpj">
      <FieldLabel>CNPJ</FieldLabel>
      <Input />
      <FieldDescription>Somente numeros</FieldDescription>
    </Field>,
  );
  const campo = screen.getByLabelText("CNPJ");
  const descrito = campo.getAttribute("aria-describedby");
  expect(descrito).toBeTruthy();
  expect(document.getElementById(descrito!.split(" ")[0])?.textContent).toContain(
    "Somente numeros",
  );
});

test("campo invalido anuncia o erro e mostra a mensagem", () => {
  render(
    <Field name="email" invalid>
      <FieldLabel>Email</FieldLabel>
      <Input />
      <FieldError match>Email obrigatorio</FieldError>
    </Field>,
  );
  expect(screen.getByLabelText("Email").getAttribute("aria-invalid")).toBe("true");
  expect(screen.getByText("Email obrigatorio")).toBeDefined();
});

test("a mensagem de erro usa o token de perigo", () => {
  render(
    <Field name="email" invalid>
      <FieldLabel>Email</FieldLabel>
      <Input />
      <FieldError match>Email obrigatorio</FieldError>
    </Field>,
  );
  expect(screen.getByText("Email obrigatorio").className).toContain("text-danger");
});

test("a altura do campo vem do token de densidade", () => {
  render(
    <Field name="x">
      <FieldLabel>X</FieldLabel>
      <Input size="sm" />
    </Field>,
  );
  expect(screen.getByLabelText("X").className).toContain("--rc-control-sm");
});

test("o campo tem anel de foco declarado, porque teclado nao e opcional", () => {
  render(
    <Field name="x">
      <FieldLabel>X</FieldLabel>
      <Input />
    </Field>,
  );
  expect(screen.getByLabelText("X").className).toContain("focus-visible:ring-ring");
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun test test/field.test.tsx
```

Esperado: FALHA, módulo não encontrado.

- [ ] **Step 3: Escrever o Field e o Input**

`src/primitives/field.tsx`:

```tsx
"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export const inputVariants = cva(
  cn(
    "w-full rounded-md border border-border bg-surface text-fg",
    "placeholder:text-fg-subtle",
    "transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:cursor-not-allowed disabled:text-fg-disabled",
    "data-[invalid]:border-danger",
  ),
  {
    variants: {
      size: {
        sm: "h-[var(--rc-control-sm)] px-[var(--rc-control-pad-sm)] text-sm",
        md: "h-[var(--rc-control-md)] px-[var(--rc-control-pad-md)] text-base",
        lg: "h-[var(--rc-control-lg)] px-[var(--rc-control-pad-lg)] text-md",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type FieldProps = ComponentProps<typeof BaseField.Root>;

export function Field({ className, ...props }: FieldProps) {
  return <BaseField.Root {...props} className={cn("flex flex-col gap-1.5", className)} />;
}

export function FieldLabel({ className, ...props }: ComponentProps<typeof BaseField.Label>) {
  return (
    <BaseField.Label
      {...props}
      className={cn("font-sans text-sm font-medium text-fg", className)}
    />
  );
}

/**
 * O input nativo tem um atributo `size` que e numero, e ele colidiria com a
 * variante de tamanho. O nativo sai, porque ninguem usa e a variante e a que
 * carrega o significado aqui.
 */
export type InputProps = Omit<ComponentProps<typeof BaseField.Control>, "size"> &
  VariantProps<typeof inputVariants>;

export function Input({ className, size, ...props }: InputProps) {
  return <BaseField.Control {...props} className={cn(inputVariants({ size }), className)} />;
}

export function FieldDescription({
  className,
  ...props
}: ComponentProps<typeof BaseField.Description>) {
  return <BaseField.Description {...props} className={cn("text-xs text-fg-subtle", className)} />;
}

export function FieldError({ className, ...props }: ComponentProps<typeof BaseField.Error>) {
  return <BaseField.Error {...props} className={cn("text-xs text-danger", className)} />;
}
```

- [ ] **Step 4: Exportar no barrel**

Acrescentar em `src/index.ts`:

```ts
export {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  inputVariants,
  type FieldProps,
  type InputProps,
} from "./primitives/field";
```

- [ ] **Step 5: Rodar e confirmar que passa**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun test test/field.test.tsx
```

Esperado: 6 passes.

Se o teste da descrição falhar porque a Base UI usa outro atributo, ler o DOM renderizado com `screen.debug()` antes de mudar o teste. O comportamento correto é o `aria-describedby` apontar para a descrição, e é isso que deve valer.

- [ ] **Step 6: Commitar**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui
git add -A
git commit -m "feat: Field e Input com rotulo, ajuda e erro ligados"
```

---

### Task 9: `Dialog`

Entrega: o componente que fecha o buraco da fundação. Ele renderiza em portal, e é aqui que se prova que o modo escopado do Provider funciona de verdade.

**Files:**

- Create: `src/primitives/dialog.tsx`
- Modify: `src/index.ts`
- Test: `test/dialog.test.tsx`

**Interfaces:**

- Produces: `Dialog` (raiz), `DialogTrigger`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`
- Consumes: `useRivoContext().portalContainer` da Task 4
- Consumes: `@base-ui/react/dialog`

- [ ] **Step 1: Escrever os testes, que devem falhar**

`test/dialog.test.tsx`:

```tsx
import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../src/primitives/dialog";
import { RivoProvider } from "../src/provider/rivo-provider";

function Exemplo() {
  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogTitle>Excluir projeto</DialogTitle>
        <DialogDescription>Esta acao nao pode ser desfeita.</DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

test("o dialogo aberto mostra titulo e descricao", () => {
  render(
    <RivoProvider>
      <Exemplo />
    </RivoProvider>,
  );
  expect(screen.getByText("Excluir projeto")).toBeDefined();
  expect(screen.getByText("Esta acao nao pode ser desfeita.")).toBeDefined();
});

test("no modo escopado o dialogo renderiza dentro do container que carrega o tema", () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <Exemplo />
    </RivoProvider>,
  );
  const container = document.querySelector('[data-rc-portal][data-rc-theme="rivocode-light"]');
  expect(container).not.toBeNull();
  expect(container!.contains(screen.getByText("Excluir projeto"))).toBe(true);
});

test("o empilhamento vem da escala, nunca de um numero cravado", () => {
  render(
    <RivoProvider>
      <Exemplo />
    </RivoProvider>,
  );
  const popup = screen.getByRole("dialog");
  expect(popup.className).toContain("--rc-z-dialog");
  expect(popup.className).not.toMatch(/z-\d+/);
});

test("o dialogo exige o Provider e diz isso claramente", () => {
  expect(() => render(<Exemplo />)).toThrow(/RivoProvider/);
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun test test/dialog.test.tsx
```

Esperado: FALHA, módulo não encontrado.

- [ ] **Step 3: Escrever o Dialog**

Detalhe que decide se isto funciona ou não: a `Portal` da Base UI trata `container={null}` como "não renderize nada" e `container={undefined}` como "renderize no body". O container do Provider só existe depois do primeiro efeito, então antes disso ele é `null`. Passar `null` direto faria o diálogo sumir na primeira renderização. Por isso o `?? undefined`.

`src/primitives/dialog.tsx`:

```tsx
"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { useRivoContext } from "../provider/rivo-provider";

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

export type DialogContentProps = ComponentProps<typeof BaseDialog.Popup> & {
  children: ReactNode;
};

export function DialogContent({ className, children, ...props }: DialogContentProps) {
  const { portalContainer } = useRivoContext();

  return (
    <BaseDialog.Portal container={portalContainer ?? undefined}>
      <BaseDialog.Backdrop
        className={cn(
          "fixed inset-0 z-[var(--rc-z-overlay)] bg-overlay",
          "transition-opacity duration-[var(--rc-duration-base)] ease-[var(--rc-ease)]",
        )}
      />
      <BaseDialog.Popup
        {...props}
        className={cn(
          "fixed top-1/2 left-1/2 z-[var(--rc-z-dialog)] w-[min(32rem,calc(100vw-2rem))]",
          "-translate-x-1/2 -translate-y-1/2",
          "rounded-xl border border-border bg-surface p-6 shadow-3",
          "font-sans text-fg outline-none",
          className,
        )}
      >
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      {...props}
      className={cn("font-display text-xl leading-[var(--rc-leading-tight)] text-fg", className)}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Description>) {
  return (
    <BaseDialog.Description {...props} className={cn("mt-2 text-base text-fg-muted", className)} />
  );
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cn("mt-6 flex items-center justify-end gap-3", className)} />;
}
```

- [ ] **Step 4: Exportar no barrel**

Acrescentar em `src/index.ts`:

```ts
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  type DialogContentProps,
} from "./primitives/dialog";
```

- [ ] **Step 5: Rodar e confirmar que passa**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun test test/dialog.test.tsx
```

Esperado: 4 passes.

Se o caso do modo escopado falhar, ler o DOM com `screen.debug(document.body)` e conferir onde o popup foi parar. Se ele estiver direto no `body`, o `container` não chegou, e o defeito está no Provider e não no Dialog.

- [ ] **Step 6: Rodar a suíte inteira e as duas guardas**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun run check
```

Esperado: lint ok, guarda de cor ok, guarda de contraste ok, todos os testes passando.

- [ ] **Step 7: Commitar**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui
git add -A
git commit -m "feat: Dialog em portal que carrega o tema no modo escopado"
```

---

### Task 10: Vitrine local e verificação visual

Entrega: uma página que mostra as cinco peças nos dois temas e nas duas densidades, mais um screenshot. É por aqui que o Emanuel revisa, olhando, e não lendo tabela de contraste.

**Files:**

- Create: `demo/demo.tsx`
- Create: `demo/demo.css`
- Create: `demo/index.html`
- Create: `scripts/shot.ts`
- Modify: `package.json` (scripts `demo` e `shot`)
- Modify: `.gitignore` (ignorar `demo/dist`)

**Interfaces:**

- Consumes: tudo que o barrel exporta até aqui

- [ ] **Step 1: Escrever a vitrine**

`demo/demo.tsx`:

```tsx
import { createRoot } from "react-dom/client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  RivoProvider,
  type RivoDensity,
  type RivoTheme,
} from "../src/index";

function Amostra({ theme, density }: { theme: RivoTheme; density: RivoDensity }) {
  return (
    <RivoProvider scope="local" theme={theme} density={density} className="p-8">
      <p className="mb-6 font-mono text-xs tracking-widest text-fg-subtle uppercase">
        {theme} / {density}
      </p>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Button>Primario</Button>
        <Button variant="secondary">Secundario</Button>
        <Button variant="ghost">Fantasma</Button>
        <Button variant="destructive">Excluir</Button>
        <Button shape="pill">Pilula</Button>
        <Button loading>Salvando</Button>
        <Button disabled>Desabilitado</Button>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Badge>Rascunho</Badge>
        <Badge tone="accent">Novo</Badge>
        <Badge tone="success">Pago</Badge>
        <Badge tone="warning">Vencendo</Badge>
        <Badge tone="danger">Vencido</Badge>
        <Badge tone="info">Em analise</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumo do mes</CardTitle>
            <CardDescription>Agosto de 2026</CardDescription>
          </CardHeader>
          <CardContent>Doze notas processadas, tres pendentes de aprovacao.</CardContent>
          <CardFooter>
            <Button size="sm">Ver detalhes</Button>
            <Button size="sm" variant="ghost">
              Exportar
            </Button>
          </CardFooter>
        </Card>

        <Card elevation="raised">
          <CardHeader>
            <CardTitle>Novo cliente</CardTitle>
            <CardDescription>Dados basicos do cadastro</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field name="empresa">
              <FieldLabel>Empresa</FieldLabel>
              <Input placeholder="RivoCode Tecnologia" />
              <FieldDescription>Razao social como no CNPJ</FieldDescription>
            </Field>
            <Field name="email" invalid>
              <FieldLabel>Email</FieldLabel>
              <Input placeholder="voce@empresa.com" />
              <FieldError match>Informe um email valido</FieldError>
            </Field>
          </CardContent>
        </Card>
      </div>
    </RivoProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <div>
    <Amostra theme="rivocode-dark" density="comfortable" />
    <Amostra theme="rivocode-dark" density="compact" />
    <Amostra theme="rivocode-light" density="comfortable" />
    <Amostra theme="rivocode-light" density="compact" />
  </div>,
);
```

`demo/demo.css`:

```css
@import "tailwindcss";

@source '../src/primitives';
@source '../src/provider';
@source '.';

@import "../src/preset.css";
```

`demo/index.html`:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>@rivocode/ui</title>
    <link rel="stylesheet" href="./dist/demo.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./dist/demo.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Acrescentar os scripts**

No `package.json`:

```json
"demo": "bun build demo/demo.tsx --outdir demo/dist && tailwindcss -i demo/demo.css -o demo/dist/demo.css",
"shot": "bun run demo && bun run scripts/shot.ts"
```

E no `.gitignore`, acrescentar `demo/dist`.

- [ ] **Step 3: Escrever o capturador de tela**

`scripts/shot.ts`:

```ts
/** Fotografa a vitrine, para revisao visual sem abrir navegador na mao. */
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const alvo = new URL("../demo/index.html", import.meta.url).pathname;

const proc = Bun.spawn([
  CHROME,
  "--headless",
  "--disable-gpu",
  "--hide-scrollbars",
  "--force-device-scale-factor=2",
  "--screenshot=demo/dist/vitrine.png",
  "--window-size=1200,2400",
  alvo,
]);

await proc.exited;
console.log(proc.exitCode === 0 ? "demo/dist/vitrine.png" : "falhou ao fotografar");
```

- [ ] **Step 4: Gerar e olhar**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun run shot
```

Esperado: `demo/dist/vitrine.png` existe. Abrir a imagem e conferir, nesta ordem:

1. Nenhum bloco sem estilo, o que denunciaria CSS não carregada
2. O tema claro tem fundo claro de verdade, e o escuro fundo escuro
3. Os botões da linha compacta são visivelmente mais baixos que os da confortável
4. O selo de perigo é legível nos dois temas
5. A mensagem de erro do campo aparece em vermelho do tema, e a borda do campo inválido também
6. O botão carregando gira

- [ ] **Step 5: Mostrar ao usuário e coletar reação**

Entregar a imagem e perguntar em português claro, sem jargão, o que parece errado. Correções visuais dele têm prioridade sobre gosto meu. Registrar cada pedido antes de aplicar, e aplicar um por vez.

- [ ] **Step 6: Commitar**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui
git add -A
git commit -m "feat: vitrine local das cinco pecas nos dois temas"
```

---

### Task 11: Empacotamento e prova de consumo

Entrega: a prova de que outro projeto instala o pacote e recebe componente estilizado. Esta é a última coisa que pode dar errado, e ela dá errado calada: o pacote publica, instala, e os componentes aparecem sem estilo.

**Files:**

- Create: `README.md` no repositório da biblioteca
- Modify: `package.json` se algum export estiver errado
- Create: projeto descartável em `~/.cache/rc-ui-consumer`

**Interfaces:**

- Consumes: `dist/index.js`, `dist/styles.css`, `dist/preset.css`

Nota sobre o spec: o critério de aceitação 7 falava em provar o consumo dentro da landing. Um projeto novo e vazio é prova mais dura, porque a landing tem tema Tailwind próprio que poderia mascarar token faltando. A migração da landing continua sendo o ciclo 3.

- [ ] **Step 1: Construir e conferir o conteúdo do pacote**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui
bun run build
bun pm pack --dry-run
```

Esperado: a listagem inclui `dist/index.js`, `dist/index.d.ts`, `dist/styles.css` e `dist/preset.css`, e não inclui `src`, `test`, `demo` nem `node_modules`.

- [ ] **Step 2: Registrar o link local**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun link
```

- [ ] **Step 3: Criar o projeto consumidor descartável**

```bash
rm -rf ~/.cache/rc-ui-consumer
mkdir -p ~/.cache/rc-ui-consumer/src
cd ~/.cache/rc-ui-consumer
bun init -y
bun add react react-dom
bun add -d tailwindcss @tailwindcss/cli
bun link @rivocode/ui
```

`~/.cache/rc-ui-consumer/src/app.css`:

```css
@import "tailwindcss";
@import "@rivocode/ui/preset";

@source '../node_modules/@rivocode/ui/dist';
```

`~/.cache/rc-ui-consumer/src/app.tsx`:

```tsx
import { createRoot } from "react-dom/client";
import { Badge, Button, RivoProvider } from "@rivocode/ui";

createRoot(document.getElementById("root")!).render(
  <RivoProvider scope="global" theme="rivocode-dark">
    {/* Layout escrito pelo projeto consumidor, com o vocabulario do preset. */}
    <main className="min-h-screen bg-bg p-10 font-sans text-fg">
      <h1 className="mb-6 font-display text-3xl">Consumo do @rivocode/ui</h1>
      <div className="flex items-center gap-3">
        <Button>Acao primaria</Button>
        <Badge tone="success">Funcionando</Badge>
      </div>
    </main>
  </RivoProvider>,
);
```

- [ ] **Step 4: Provar que o consumo funciona**

```bash
cd ~/.cache/rc-ui-consumer
bun build src/app.tsx --outdir dist
bunx @tailwindcss/cli -i src/app.css -o dist/app.css
grep -c "rc-accent" dist/app.css
grep -c "bg-accent" dist/app.css
```

Esperado: ambos maiores que zero. O primeiro prova que os tokens chegaram pelo preset. O segundo prova que o Tailwind do consumidor gerou a classe que o componente da biblioteca usa, que é exatamente o que o `@source` resolve e o que quebra calado quando ele falta.

Se o segundo der zero, a linha `@source` está com caminho errado. Documentar o caminho certo no README, porque todo projeto de cliente vai precisar dele.

- [ ] **Step 5: Escrever o README da biblioteca**

`README.md`, com estas seções, cada uma com comando real e testado nos passos acima:

1. O que é, em três linhas
2. Instalação, incluindo o `.npmrc` com o token do GitHub Packages que todo projeto consumidor precisa
3. As duas linhas de CSS (`@import '@rivocode/ui/preset'` e o `@source`), com o aviso de que sem o `@source` os componentes aparecem sem estilo
4. O `RivoProvider`, com os modos global e escopado, e quando usar cada um
5. A lista de tokens semânticos, para quem for escrever layout novo
6. Como criar um tema de cliente: copiar `rivocode-light.css`, trocar os valores, rodar `bun run check:contrast`
7. O nome real do pacote da Base UI, conforme confirmado na Task 1 Step 3

- [ ] **Step 6: Publicar em modo de ensaio**

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui
bun publish --dry-run
```

Esperado: sai sem erro e mostra o destino `npm.pkg.github.com`. **Não publicar de verdade neste ciclo.** A publicação real acontece quando o primeiro projeto de cliente for consumir, e ela é disparada por tag, nunca automática.

- [ ] **Step 7: Limpar e commitar**

```bash
rm -rf ~/.cache/rc-ui-consumer
cd /Users/emanuelbacalhau/projects/rivocode/ui
git add -A
git commit -m "docs: README com instalacao, tokens e como criar tema de cliente"
git push -u origin main
```

---

## Fim do ciclo 1

Ao terminar a Task 11, a fundação está de pé e os quatro critérios que importam estão verificáveis por comando:

```bash
cd /Users/emanuelbacalhau/projects/rivocode/ui && bun run check && bun run shot
```

O ciclo 2 (catálogo completo), o ciclo 3 (migração da landing, incluindo os 13 usos de `muted-4` abaixo do mínimo) e o ciclo 4 (site de documentação e sync com o claude.ai/design) ganham cada um seu próprio spec e seu próprio plano.
