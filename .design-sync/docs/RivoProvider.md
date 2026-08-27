---
category: Fundação
---

# RivoProvider

Raiz obrigatória. Sem ele nada tem estilo.

`theme`: `rivocode-dark` (padrão), `rivocode-light` ou `system`.
`density`: `comfortable` (padrão) ou `compact`, que encolhe todo controle.
`scope`: `global` veste a página inteira; `local` veste só esta árvore e pinta o
fundo, para quando o design system entra num projeto que já existe.

Carrega por dentro o provedor de dica, a fiação de aviso e o container de portal
que leva o tema junto. Não monte nenhum deles à mão.

## Os tipos do tema

`RivoTheme` são os dois temas de casa, `rivocode-dark` e `rivocode-light`.
`RivoThemeSetting` é o que a prop `theme` aceita: os dois de casa, `system`, ou
o nome do tema de um cliente. `RivoResolvedTheme` é o tema depois que `system`
já virou um dos dois.

A união aceita nome livre de propósito. Sem isso, vestir um cliente terminava
num erro de tipo, e o projeto começava escrevendo `as` no ponto de entrada do
sistema, que é o pior lugar possível para ensinar que casting é normal.

`RivoDensity` é `comfortable` ou `compact`. Os dois tipos aparecem quando a
escolha vem de fora, de uma preferência salva ou da configuração do cliente:

```tsx
const [theme, setTheme] = useState<RivoThemeSetting>('system')
const density: RivoDensity = usuario.prefereCompacto ? 'compact' : 'comfortable'

<RivoProvider theme={theme} density={density}>
```

## Sentido da escrita

`dir="rtl"` espelha o que depende de lado: qual seta abre o submenu, para onde o
`Select` alinha, de onde a folha lateral entra e para onde o gesto de fechar
vai. O provider escreve o `dir` no elemento raiz e no container de portal, então
o que renderiza em portal também vira.

O layout continua com você, e pelas classes lógicas do Tailwind: `ps-*` e `pe-*`
no lugar de `pl-*` e `pr-*`, `text-start` no lugar de `text-left`. Componente
espelhado dentro de página que ainda mede da esquerda fica pior do que página
inteira sem espelhar nenhum.

## Ler o que o provider decidiu

`useRivoContext()` devolve o tema já resolvido, a densidade e o container de
portal. Serve para a tela que precisa concordar com a escolha (o logotipo que
troca entre claro e escuro, o mapa de terceiro que recebe a cor por prop, o
portal de uma peça de fora que precisa nascer vestida):

```tsx
const { theme, density, portalContainer } = useRivoContext()
```

Fora do provider ele lança erro, com o nome do provider na mensagem. É de
propósito: o silêncio aqui vira uma tela sem estilo que ninguém sabe explicar.

## No React Native

Traduz, e ganha uma prop que no web não existe: `fonts`. No navegador as três famílias chegam pelo CSS de tokens; no celular não há CSS de fonte, e carregar arquivo de fonte é decisão do app, não da biblioteca. O app carrega com o `expo-font` e declara os nomes uma vez (`<RivoProvider fonts={{ sans: 'Manrope', display: 'Poppins', mono: 'JetBrainsMono' }}>`), e o catálogo inteiro passa a vesti-los. Sem a prop, tudo sai na fonte do sistema e nada quebra. Passe junto o `isFontLoaded={isLoaded}` do `expo-font`: nome de fonte ausente falha calado no React Native, e é esse retorno que faz o provider avisar em `__DEV__`.
