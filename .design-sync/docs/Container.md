---
category: Estrutura
---

# Container

Centraliza o conteúdo da página numa largura máxima, com respiro dos dois
lados.

```tsx
<Container render={<main />} size="md">
  <PageHeader title="Novo cliente" />
  <form>…</form>
</Container>
```

São cinco passos, e cada um é uma largura que o site e as telas de exemplo já
usam:

| `size` | Largura máxima | Para quê                                         |
| ------ | -------------- | ------------------------------------------------ |
| `sm`   | 36rem          | formulário curto, tela de entrada                |
| `md`   | 48rem          | cadastro, configuração, texto corrido            |
| `lg`   | 72rem          | página com colunas; é o padrão                   |
| `xl`   | 80rem          | painel largo, listagem com filtro ao lado        |
| `full` | sem teto       | só o respiro lateral, para a tela que usa a largura toda |

O respiro lateral sai dos tokens de painel: `--rc-pad-panel-sm` no celular e
`--rc-pad-panel` a partir de 640px. Os dois encolhem na densidade compacta, então
a tela de operação ganha a mesma largura útil que ganha nos controles.

`render` troca o elemento sem mudar a largura. A região principal da página
costuma ser um `Container`, e escrevê-la como `<main>` dá a quem usa leitor de
tela o atalho para pular direto para o conteúdo.

## Quando não usar

- **Quando uma `div` com classe basta.** Uma largura que aparece numa tela só,
  e que não é nenhum dos cinco passos, é `mx-auto max-w-[40rem]`. A peça existe
  para as telas do produto concordarem entre si, e não para cobrir toda largura
  possível.
- **Dentro de um bloco.** O `Container` mede a página. Dentro de um `Card`, de
  uma folha ou de uma coluna do `Splitter`, o respiro já vem da moldura, e um
  segundo respiro lateral empurra o conteúdo para dentro duas vezes.
- **O topo da tela.** Título, trilha e ações são o `PageHeader`, que vai dentro
  do `Container`, e não no lugar dele.
- **Arrumar os filhos.** O `Container` só limita a largura. O vão entre os
  blocos é `Stack`, e as colunas são `Grid`.

## No React Native

Não porta, e não é fila. O `Container` limita a largura de uma página que pode ter 1920px, e o menor passo dele, `sm`, tem 36rem: mais largo que qualquer celular em pé. No toque ele seria só um respiro lateral, e o respiro de uma tela nativa não é de uma peça, é da tela: um `View` com `px-4` dentro da área segura, ou o `contentContainerClassName` do `ScrollArea`. Para arrumar o que vai dentro, `Stack` e `Grid` portam.
