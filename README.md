# @rivocode/ui

O design system da RivoCode. Componentes acessíveis sobre a Base UI, estilo
autoral em Tailwind v4, e tokens white-label: nenhum componente sabe qual é a
cor da marca, ele pergunta ao tema.

Isso é o que permite a mesma biblioteca vestir a RivoCode num projeto e o
cliente X em outro, sem editar componente nenhum.

## Instalação

O pacote é privado, no GitHub Packages. Todo projeto consumidor precisa de um
`.npmrc` na raiz, com um token que tenha permissão de leitura de pacotes:

```
@rivocode:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Depois:

```sh
bun add @rivocode/ui
bun add -d tailwindcss @tailwindcss/vite
```

React 19, React DOM 19 e Tailwind 4 são dependências de par, ou seja, quem manda
na versão é o projeto consumidor.

## As duas linhas de CSS

No arquivo de CSS do projeto:

```css
@import "tailwindcss";
@import "@rivocode/ui/preset";

@source '../node_modules/@rivocode/ui/dist';
```

A linha `@source` não é opcional e é a que mais quebra. Sem ela, o Tailwind do
projeto não varre os componentes da biblioteca, não gera as classes que eles
usam, e tudo aparece **sem estilo nenhum**, silenciosamente. Ajuste o caminho
relativo conforme a pasta do seu arquivo de CSS.

O `preset` traz os tokens, os dois temas e as fontes da marca. Se o projeto já
tem tipografia própria, importe apenas os arquivos de token e escreva o seu
tema, como descrito em "Tema de cliente".

## O Provider

```tsx
import { RivoProvider, Button } from "@rivocode/ui";

export function App() {
  return (
    <RivoProvider theme="rivocode-dark" density="comfortable">
      <Button>Acao primaria</Button>
    </RivoProvider>
  );
}
```

| Prop      | Valores                                     | Para que serve                                                     |
| --------- | ------------------------------------------- | ------------------------------------------------------------------ |
| `theme`   | `rivocode-dark`, `rivocode-light`, `system` | `system` segue a preferência do sistema operacional                |
| `density` | `comfortable`, `compact`                    | `compact` encolhe a altura de todo controle, para tela de operação |
| `scope`   | `global`, `local`                           | `global` veste a página inteira. `local` veste só esta árvore      |

Use `scope="local"` quando o design system entra num projeto que já existe e não
pode vazar estilo para o resto da página. Nesse modo o Provider também cria um
container próprio para diálogo, menu e dica, que renderizam fora da árvore e
sairiam sem tema se ficassem soltos no fim do documento.

## Vocabulário para o seu layout

O preset expõe os tokens como utilitários do Tailwind, então o layout que você
escreve fala a mesma língua dos componentes:

| Família       | Utilitários                                                                              |
| ------------- | ---------------------------------------------------------------------------------------- |
| Superfícies   | `bg-bg`, `bg-surface`, `bg-surface-raised`, `bg-overlay`                                 |
| Texto         | `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-fg-disabled`                         |
| Acento        | `bg-accent`, `text-accent-fg`, `text-accent-text`, `bg-accent-subtle`                    |
| Linhas e foco | `border-border`, `border-border-strong`, `ring-ring`                                     |
| Estados       | `bg-success`, `text-success-text`, `bg-danger-subtle`, e o mesmo para `warning` e `info` |
| Forma         | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-pill`                   |
| Tipografia    | `text-xs` a `text-3xl`, `font-sans`, `font-display`, `font-mono`                         |

**Preenchimento e texto são tokens diferentes de propósito.** `bg-danger` é o
vermelho que preenche um botão e recebe `text-danger-fg` por cima.
`text-danger-text` é o vermelho que se lê sobre o fundo da página. Nenhuma cor
serve bem para as duas coisas: a que tem contraste como texto não aguenta texto
branco por cima, e vice-versa. Vale o mesmo para o acento.

## Tema de cliente

Copie `src/tokens/themes/rivocode-light.css`, troque os valores, e rode a
guarda:

```sh
bun run check:contrast
```

Ela mede quarenta pares que carregam texto e falha se algum ficar abaixo de
4,5 para 1, ou de 7 para 1 no texto principal. Ela existe para transformar
"acho que está legível" em número.

## Desenvolvimento

```sh
bun install
bun run check   # lint, guarda de cor, guarda de contraste, testes
bun run shot    # gera a vitrine em demo/dist/vitrine.png
bun run serve   # abre a vitrine em http://127.0.0.1:4173
```

### `bun link` duplica o React

Ao desenvolver com `bun link`, o projeto consumidor puxa o React de dentro
desta pasta em vez do dele, e a página quebra com
`Cannot read properties of null (reading 'useState')`. Não é defeito do pacote:
o pacote publicado não carrega React dentro. É o link.

No `vite.config.ts` do projeto consumidor:

```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { dedupe: ["react", "react-dom"] },
});
```

## Notas

- A Base UI é o pacote `@base-ui/react`. O nome antigo,
  `@base-ui-components/react`, parou num candidato a lançamento e não deve ser
  usado.
- A publicação é manual e disparada por tag, nunca automática em push. Biblioteca
  que publica sozinha publica engano.
