O `@rivocode/ui` é público no npm, sob licença MIT. Não precisa de token, nem
de `.npmrc`, nem de acesso à organização.

## 1. Instalar

```sh
bun add @rivocode/ui
bun add -d tailwindcss @tailwindcss/vite
```

React 19, React DOM 19 e Tailwind 4 são **dependências de par**: quem manda na
versão é o seu projeto, não a biblioteca. Isso evita a duplicação de React, que
quebra contexto e hooks de formas difíceis de diagnosticar.

Recursos opcionais pedem os pares deles, e só quem usa carrega o peso:

| Se você for usar        | Instale junto                                    |
| ----------------------- | ------------------------------------------------ |
| `@rivocode/ui/form`     | `react-hook-form`, `zod`, `@hookform/resolvers`   |
| `@rivocode/ui/chart`    | `recharts`                                        |
| Ícones nos exemplos     | `lucide-react`                                    |

## 2. As duas linhas de CSS

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

## 3. O Provider, uma vez

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

## Vindo do GitHub Packages

Até a versão `0.1.0` o pacote era privado, e todo projeto consumidor tinha um
`.npmrc` com esta linha:

```
@rivocode:registry=https://npm.pkg.github.com
```

**Remova.** Mapeamento de escopo tem precedência sobre o registro padrão, então
enquanto ela existir o `bun add @rivocode/ui` continua buscando no GitHub
Packages, e não encontra as versões novas. O token também deixa de ser
necessário.

## Quando algo não aparece

| Sintoma                                   | Causa quase certa                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| Tela sem estilo nenhum                    | falta a linha `@source`, ou o caminho relativo dela está errado          |
| `404` ao instalar o escopo `@rivocode`    | um `.npmrc` antigo ainda aponta o escopo para o GitHub Packages          |
| Erro de contexto ao abrir diálogo ou menu | árvore fora do `RivoProvider`                                            |
| Dois Reacts na página                     | React como dependência direta da biblioteca em vez de par, verifique o lockfile |
| Flutuante sem tema, solto no fim da página | `scope="local"` sem o container de portal do Provider                    |
