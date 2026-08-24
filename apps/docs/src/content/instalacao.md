O `@rivocode/ui` é um pacote privado, publicado no GitHub Packages. Isso muda o
primeiro passo: antes de instalar, o seu computador precisa provar ao GitHub que
pode baixar da organização.

## 1. Um token de leitura

Em `github.com/settings/tokens`, crie um token **classic** com o escopo
`read:packages`. Se o repositório for privado, marque `repo` junto, sem ele o
registry recusa mesmo com o escopo de pacote.

Quem só instala precisa de `read:packages`. `write:packages` é para quem publica.

## 2. O arquivo `.npmrc`

Duas linhas. A primeira diz onde procurar o escopo `@rivocode`; a segunda é a
credencial:

```
@rivocode:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=SEU_TOKEN
```

**Onde colocar.** No `~/.npmrc` da sua máquina, e não no `.npmrc` do projeto: o
do projeto vai para o Git, e o token vaza junto. Se preferir manter no projeto
por causa da equipe, use a forma com variável e deixe o valor fora do
repositório:

```
@rivocode:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

**Em CI, não use token pessoal.** Dentro de uma GitHub Action o `GITHUB_TOKEN`
nativo já lê pacotes da própria organização, não expira e não precisa de
rotação:

```yaml
- run: bun install
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 3. Instalar

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

## 4. As duas linhas de CSS

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

## 5. O Provider, uma vez

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

## Quando algo não aparece

| Sintoma                                   | Causa quase certa                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| Tela sem estilo nenhum                    | falta a linha `@source`, ou o caminho relativo dela está errado          |
| `401` ou `403` no install                 | `.npmrc` sem token, token vencido, ou faltando `repo` em pacote privado  |
| Erro de contexto ao abrir diálogo ou menu | árvore fora do `RivoProvider`                                            |
| Dois Reacts na página                     | React como dependência direta da biblioteca em vez de par, verifique o lockfile |
| Flutuante sem tema, solto no fim da página | `scope="local"` sem o container de portal do Provider                    |
