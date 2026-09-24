---
category: Estrutura
---

# AppShell

O esqueleto da aplicação: cabeçalho fixo, barra lateral, conteúdo, e, quando
a tela pede, uma coluna ao lado e um rodapé. É a primeira peça de uma
aplicação nova, e a que dá a cada região o landmark certo sem ninguém
precisar lembrar.

```tsx
<AppShell
  sidebar={
    <SidebarContent>
      <SidebarMenu>
        <SidebarMenuItem href="/notas" active>Notas fiscais</SidebarMenuItem>
        <SidebarMenuItem href="/clientes">Clientes</SidebarMenuItem>
      </SidebarMenu>
    </SidebarContent>
  }
  header={<SearchInput placeholder="Buscar notas" />}
  container
>
  <PageHeader title="Notas fiscais" />
</AppShell>
```

## As regiões, e o que o leitor de tela ouve

| Prop       | Sai como                   | Landmark                                   |
| ---------- | -------------------------- | ------------------------------------------ |
| `header`   | `<header>`, fixo no topo   | banner                                     |
| `sidebar`  | `<nav>` dentro do `Sidebar` | navigation, "Navegação principal"         |
| `children` | `<main>`                   | main                                       |
| `aside`    | `<aside>`                  | complementary, "Informações complementares" |
| `footer`   | `<footer>`                 | contentinfo                                |

Cada região só existe quando a prop vem. A `<aside>` que o `Sidebar` desenha
por dentro sai com `role="none"`: a barra lateral é navegação, e anunciá-la
também como complementar daria duas regiões para a mesma coisa.

**O primeiro foco da página é o link "Pular para o conteúdo".** Ele fica
escondido até receber o foco, aparece no canto de cima, e leva o foco ao
`<main>` sem mudar o endereço da página, o que não atrapalha o router. Quem
navega por teclado deixa de atravessar a barra inteira em toda tela nova.

## A barra lateral

`sidebar` recebe o miolo do `Sidebar` da casa (`SidebarHeader`,
`SidebarContent`, `SidebarMenu`, `SidebarFooter`), e a casca monta o resto: o
`SidebarProvider` na raiz, o `Sidebar` com o `<nav>` dentro, e o
`SidebarTrigger` na frente do cabeçalho. Tudo o que a barra já faz continua
valendo: encolhe até a coluna de ícones na mesa, abre e fecha por Ctrl+B, e **no
celular vira a folha** que desliza da borda, fechada ao carregar e fechada de
novo quando a pessoa escolhe um destino.

`defaultOpen`, `open`, `onOpenChange` e `shortcut` vão direto para o
`SidebarProvider`. `sidebarSide="right"` põe a barra do outro lado. O
`useSidebar()` funciona em qualquer lugar dentro da casca.

## O conteúdo

Sem `container`, o conteúdo encosta nas bordas do `<main>`: é o que uma
listagem de ponta a ponta quer. Com `container`, ele vai num `Container` da
casa, com a largura máxima, o respiro lateral e o respiro de cima e de baixo
do painel. `true` usa o `lg`; um tamanho (`sm`, `md`, `xl`, `full`) escolhe
outro.

`aside` fica à direita do conteúdo a partir de `lg`, na largura da barra
lateral, e embaixo do conteúdo antes disso. `footer` fecha a coluna.

## Dentro de uma caixa

A casca ocupa a janela: a barra lateral gruda na altura da tela e a página
rola na janela. `contained` troca a janela pela caixa do pai, e a barra e a
coluna de conteúdo passam a rolar por dentro. É o jeito de montar a casca num
painel, num `Splitter` ou num exemplo de documentação.

```tsx
<div className="h-[32rem]">
  <AppShell contained sidebar={menu} header={busca}>…</AppShell>
</div>
```

## Partes

`classNames` alcança cada nó pelo nome: `skipLink`, `sidebar`, `column` (a
coluna à direita da barra), `header`, `body` (a linha do conteúdo e da coluna
ao lado), `main`, `aside` e `footer`.

## Textos

`labels` troca o texto do link de pular (`skipLink`) e os nomes que o leitor de
tela anuncia para a navegação (`navigation`) e para a coluna ao lado (`aside`).
`mainId` fixa o `id` do `<main>`, quando outra parte da página precisa apontar
para ele.

## Quando não usar

- **O topo de uma tela** é `PageHeader`. A casca é a aplicação inteira e
  aparece uma vez; o `PageHeader` é o título, a trilha e as ações de cada
  rota, e mora dentro do `children` dela.
- **Só a barra lateral, num layout que você já tem** é o `Sidebar` com o
  `SidebarProvider` e o `SidebarInset`. A casca é o `Sidebar` mais as outras
  regiões; se as outras já existem, ela sobra.
- **Largura de leitura sem esqueleto de aplicação** (página de login,
  formulário público) é `Container`. Ali não há navegação para organizar.
- **Painéis lado a lado que a pessoa redimensiona** é `Splitter`. A `aside`
  da casca tem largura fixa e não se arrasta.

## No React Native

Não porta, por decisão. No celular o esqueleto da aplicação não é desenhado pela biblioteca de componentes: é o router (Expo Router, React Navigation) que monta a tab bar, o drawer, a barra de título de cada tela e a área segura, com o gesto de voltar, o histórico e o estado de cada aba de graça. Uma casca nossa por cima disso seria um segundo esqueleto disputando as mesmas bordas da tela.

O que a casca do web resolve para a acessibilidade também já vem do sistema: o VoiceOver e o TalkBack anunciam a tab bar e o título da tela, e não existe link de pular para quem navega pelo toque. O topo de cada tela continua sendo o `PageHeader`, que traduz.
