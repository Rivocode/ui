---
category: Estrutura
---

# PageHeader

O topo que toda rota reescreve um pouco diferente: trilha, título, descrição
e as ações da tela, na mesma hierarquia em todas as páginas.

O título sai num `<h1>` por padrão — cabeçalho de página é o topo dela, e
começar a página num `h2` deixa um buraco que o leitor de tela sente. A
trilha entra pelo slot `breadcrumb`, com o `Breadcrumb` da casa; as ações
entram por `actions` e ficam à direita, quebrando de linha no estreito antes
de espremer o título.

## Quando o cabeçalho não é o topo

`titleAs` baixa o título para `h2` ou `h3` sem mexer no desenho — nível
semântico e tamanho visual são coisas diferentes, e o título continua o mesmo
`text-2xl` em qualquer nível.

```tsx
<PageHeader titleAs="h2" title="Notas fiscais" />
```

Use quando o `PageHeader` não é o começo da página: a aplicação já tem o `h1`
no shell, a peça está dentro de uma região, ou é um exemplo dentro de outra
página — como os desta aqui, que saem em `h2` justamente por isso. Dois `h1`
na mesma página não dão erro em lugar nenhum: quem navega por título de nível
1 é que cai no lugar errado.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `PageHeader` — `title`, `description`, `badge` e `actions` como props. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
