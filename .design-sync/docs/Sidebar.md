---
category: Navegação
---

# Sidebar

A barra lateral de uma tela de operação. Não é só um menu: é provedor de estado,
barra, busca, grupos, itens, submenu, rodapé, gatilho e a área da página ao
lado.

Fechada quer dizer coisas diferentes em cada largura. Na mesa, encolhida até a
coluna de ícones, com o nome de cada item virando dica ao passar o mouse. No
celular, fora da tela, e a barra vira a folha da lateral.

O atalho é Ctrl+B, ou Cmd+B no Mac, o mesmo do editor. Quem trabalha o dia
inteiro numa tela de operação abre e fecha isso dezenas de vezes.

## Encolhida, nada some

É onde quase toda barra lateral falha. Encolher para 3,5rem costuma esconder a
busca, cortar o título do grupo no meio da palavra e sumir com os submenus,
deixando parte do sistema sem caminho enquanto a barra estiver fechada.

Aqui cada peça sabe o que fazer nessa largura:

- `SidebarInput` vira o ícone da lupa, que abre a barra de volta. Um campo de
  texto de 3,5rem não aceita nem uma palavra.
- `SidebarMenuSub` vira um menu que salta ao lado, com os mesmos filhos.
  Indentar não cabe; esconder seria pior.
- `SidebarGroup` esconde o título. Sumir diz menos, mentir sobre o nome do
  grupo diz errado.
- `SidebarMenuItem` mostra só o ícone, com o nome na dica. Sem a dica, a coluna
  de ícones vira adivinhação, e é por isso que tanta barra encolhida só serve
  para quem já decorou o sistema.

## As peças

`SidebarProvider` guarda o estado e o atalho. `Sidebar` é a coluna, com
`side="left"` ou `"right"`. Dentro dela: `SidebarHeader`, `SidebarInput`,
`SidebarContent`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuItem`,
`SidebarMenuSub`, `SidebarSeparator`, `SidebarFooter`.

`SidebarMenuRow` com `SidebarMenuAction` dentro dá a uma linha o botão
secundário que aparece ao passar o mouse. `SidebarMenuSkeleton` ocupa o lugar
enquanto a navegação vem do servidor. `SidebarRail` é a faixa fina na borda que
abre e fecha ao ser clicada, e `SidebarTrigger` é o botão que faz o mesmo pelo
teclado.

`SidebarInset` é a área da página, ao lado da barra.
`SidebarBrand` é a marca no topo, e encolhe junto com a barra: aberta mostra o
nome ao lado do símbolo, na coluna de ícones mostra só o símbolo.


## O celular já vem resolvido

Nada disso precisa ser ligado na mão. Abaixo de 640px a barra vira folha, e a
folha começa **fechada**: `defaultOpen` fala da coluna do desktop, onde aberta
é o estado útil e a página continua inteira ao lado. No celular a mesma barra
cobre tudo, e abrir sozinha ao carregar tapa justamente a tela que a pessoa
veio ver.

Escolher um item também fecha a folha, que ali é a hora de sair da frente. Na
mesa ela não cobre nada, então continua aberta. `SidebarRail` some no celular,
porque arrastar uma borda de 1px com o dedo não é alvo.

Quando a aplicação precisa da mesma resposta, ela lê do mesmo lugar:

```tsx
const { isMobile, open, collapsed, toggle, close } = useSidebar()
```

Fora de um `SidebarProvider`, o mesmo corte vem do `useMobile()`:

```tsx
import { useMobile } from '@rivocode/ui'

const isMobile = useMobile()
```

Os dois respondem pela mesma media query que a barra e o calendário usam.
Escrever `640` de novo num canto da aplicação é como as duas metades da tela
acabam discordando sobre o que é celular. Dentro do provider prefira
`useSidebar().isMobile`, que evita um segundo assinante da mesma consulta.

No servidor os dois devolvem `false`, e não um palpite: a primeira pintura sai
igual à do desktop e se corrige no primeiro efeito, porque errar para o lado
estreito quebra o layout largo, e o contrário não.

## Quando não usar

Menos de cinco destinos cabem numa `Menubar` ou num `NavigationMenu` no topo, e
sobra a largura inteira para o conteúdo. A barra lateral paga por si quando a
lista cresce, ganha grupos e precisa de submenu.
