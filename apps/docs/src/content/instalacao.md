O `@rivocode/ui` é público no npm, sob licença MIT. Não precisa de token, nem
de `.npmrc`, nem de acesso à organização.

## 1. Instalar

O `lucide-react` vai junto na mesma linha, e não é enfeite: os componentes
importam ícone direto dele. O npm instala esse par sozinho, mas o pnpm e o
yarn não, e sem ele a `Sidebar`, a `Pagination` e o `DatePicker` quebram em
tempo de execução.

```bash
npm install @rivocode/ui lucide-react
pnpm add @rivocode/ui lucide-react
yarn add @rivocode/ui lucide-react
bun add @rivocode/ui lucide-react
```

E o Tailwind, como dependência de desenvolvimento:

```bash
npm install -D tailwindcss @tailwindcss/vite
```

React 19, React DOM 19 e Tailwind 4 são **dependências de par**: quem manda na
versão é o seu projeto, não a biblioteca. Isso evita a duplicação de React, que
quebra contexto e hooks de formas difíceis de diagnosticar.

Estes são opcionais, e só quem usa carrega o peso:

| Se você for usar        | Instale junto                                    |
| ----------------------- | ------------------------------------------------ |
| `@rivocode/ui/form`     | `react-hook-form`, `zod`, `@hookform/resolvers`   |
| `@rivocode/ui/chart`    | `recharts`                                        |

## 2. Ligar o Tailwind no build

Instalar o `@tailwindcss/vite` não basta: ele precisa entrar na lista de
plugins. Sem isso o build **passa sem erro nenhum** e gera um CSS sem uma
única classe da biblioteca, então a tela aparece crua e nada na saída explica
por quê.

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Em Next.js o caminho é o plugin do PostCSS, e não este.

## 3. As duas linhas de CSS

No arquivo de CSS do projeto:

```css
@import "tailwindcss";
@import "@rivocode/ui/preset";

@source '../node_modules/@rivocode/ui/dist';
```

**A linha `@source` não é opcional, e é a que mais quebra.** O Tailwind 4 só
gera a classe que encontra ao varrer arquivos. Sem essa linha ele não varre os
componentes da biblioteca, não gera as classes que eles usam, e a tela aparece
**sem estilo nenhum**, sem erro, sem aviso, sem pista. Ajuste o caminho
relativo conforme a pasta onde o seu CSS mora.

O `preset` traz as três camadas de token, os dois temas e as fontes da marca. Se
o seu projeto já tem tipografia própria, veja
[Temas e personalização](/temas) para importar só os tokens.

## 4. O Provider, uma vez

```tsx
import { RivoProvider } from '@rivocode/ui'
import './styles.css'

export function App() {
  return (
    <RivoProvider theme="rivocode-dark" density="comfortable">
      <SuaAplicacao />
    </RivoProvider>
  )
}
```

Sem ele nada tem estilo, e `Dialog`, `Menu`, `Select`, `Tooltip` e os avisos
lançam erro, todos leem o contexto dele. O Provider já monta por dentro o
provedor de dica, a fiação de aviso e um container de portal que leva o tema
junto. **Não monte nenhum deles à mão.**

## 5. Ensinar o seu agente

Se você programa com Claude Code, Cursor ou outro agente que leia skills, um
comando instala a que ensina esta biblioteca — o contrato, a escolha entre
peças parecidas e o vocabulário de ícones:

```bash
npx rivocode-ui skill
```

Ela entra em `.claude/skills/rivocode-ui` e a equipe recebe junto pelo Git.
Detalhes e alternativas em [Skill](/skill).

## Next.js

Os componentes são interativos e trazem `"use client"` na origem. O Provider
precisa viver num arquivo de cliente, normalmente um `providers.tsx` importado
pelo layout raiz:

```tsx
'use client'

import { RivoProvider } from '@rivocode/ui'

export function Providers({ children }: { children: React.ReactNode }) {
  return <RivoProvider theme="rivocode-dark">{children}</RivoProvider>
}
```

## Quando algo não aparece

| Sintoma                                   | Causa quase certa                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| Tela sem estilo nenhum, nem a sua         | o plugin do Tailwind não está na lista de plugins do `vite.config.ts`   |
| Suas classes pegam, as da biblioteca não  | falta a linha `@source`, ou o caminho relativo dela está errado          |
| `ChevronRight is not defined` ou similar  | falta o `lucide-react`: o pnpm e o yarn não instalam par sozinhos        |
| Erro de contexto ao abrir diálogo ou menu | árvore fora do `RivoProvider`                                            |
| Dois Reacts na página                     | React como dependência direta da biblioteca em vez de par, verifique o lockfile |
| Flutuante sem tema, solto no fim da página | `scope="local"` sem o container de portal do Provider                    |
