# As decisões de design, e onde elas moram nos tokens

Este arquivo não ensina teoria de cor. Ele diz **qual token carrega qual
decisão** nesta biblioteca, para a escolha sair do vocabulário do sistema e não
de um valor inventado na hora.

## Conteúdo

- A regra que sustenta todas as outras: preencher ≠ escrever
- Os três planos de profundidade
- Hierarquia de texto com três tons
- Cor com significado, e quando não usar cor
- A paleta de gráfico, e por que ela é separada
- Tipografia: três famílias, três trabalhos
- Forma, sombra e movimento
- Foco e estados

## A regra que sustenta todas as outras: preencher ≠ escrever

Nenhuma cor serve para preencher um bloco **e** para escrever texto sobre o
fundo da página. São contrastes diferentes contra fundos diferentes, e é o erro
que mais aparece.

| Intenção | Par certo |
|---|---|
| Bloco preenchido com a cor | `bg-accent` + `text-accent-fg` |
| Texto colorido sobre a página | `text-accent-text`, sozinho |
| Bloco suave, de fundo | `bg-accent-subtle` + `text-fg` |

Vale igual para `success`, `warning`, `danger` e `info`. `bg-danger` pede
`text-danger-fg` por cima; `text-danger-text` é o vermelho que se lê sobre a
página.

Trocar os dois produz o defeito exato de texto na cor do próprio fundo, que não
é "contraste baixo": é invisível.

## Os três planos de profundidade

Profundidade aqui é superfície, não sombra. Use nesta ordem e não invente um
quarto plano.

| Token | O que é |
|---|---|
| `bg-bg` | o fundo da página, o plano mais ao fundo |
| `bg-surface` | cartão, painel, campo: o que se destaca do fundo |
| `bg-surface-raised` | o que salta do cartão: menu, dica, aviso, tecla |

`bg-overlay` é a tarja que escurece o resto quando algo modal abre. Não é plano,
é interrupção.

Empilhar `surface` dentro de `surface` para "destacar" achata os dois. Se algo
precisa de destaque dentro de um cartão, use borda ou `bg-accent-subtle`, não
mais uma camada.

## Hierarquia de texto com três tons

Três, e só três. A quarta variação vira ruído.

| Token | Papel |
|---|---|
| `text-fg` | o que a pessoa veio ler: valor, título, resposta |
| `text-fg-muted` | apoio: descrição, texto de linha, legenda de apoio |
| `text-fg-subtle` | metadado: legenda de eixo, cabeçalho de grupo, dica de ajuda |

`text-fg-disabled` não é um quarto tom, é um estado.

Rótulo de campo é a exceção, e ela é deliberada: `FieldLabel`, `Slider`,
`Progress` e `Meter` escrevem em `text-fg` com `font-medium`. O rótulo é o que
nomeia o controle, e nomear não é apoiar.

Hierarquia se faz primeiro por **tamanho e peso**, depois por tom. Um painel
onde tudo é `text-fg` cansa; um onde tudo é `text-fg-muted` não tem foco.

## Cor com significado, e quando não usar cor

`success`, `warning`, `danger` e `info` carregam significado. Não use nenhum
deles por gosto estético: verde que quer dizer "combina com a marca" apaga o
verde que quer dizer "deu certo".

**Cor nunca é o único sinal.** Um `Badge` de situação leva a palavra junto, e
não só o tom. Quem não distingue vermelho de verde é uma fatia grande de
qualquer base de usuários, e a impressão em preto e branco é o mesmo problema.

Para o acento: ele marca **uma** ação por tela. Duas ações em `bg-accent` lado a
lado não têm ação primária nenhuma. A segunda vai de `variant="secondary"` ou
`"outline"`.

## A paleta de gráfico, e por que ela é separada

`--color-chart-1` a `--color-chart-8` existem separadas do acento porque série
de gráfico precisa de coisas que cor de marca não dá: distinguir oito valores
lado a lado, sobreviver em fatia fina, e não sugerir "certo" ou "errado".

Use na ordem, ou nomeie no `config` da série. Não escolha uma porque combina.
Acima de seis séries a leitura acaba, e o problema passa a ser o gráfico
escolhido, não a cor.

`--color-chart-grid` é a malha. Ela é fraca de propósito: grade que compete com
a linha do dado inverte a leitura.

## Tipografia: três famílias, três trabalhos

| Classe | Para |
|---|---|
| `font-sans` | interface, texto corrido, rótulo |
| `font-display` | número grande, título de tela, valor de indicador |
| `font-mono` | o que se compara na vertical ou se lê caractere a caractere: valor em tabela, CNPJ, código, atalho |

Tamanho vai de `text-xs` a `text-3xl`. Salte degraus para criar hierarquia:
`text-sm` ao lado de `text-base` quase não se distingue, e a distinção era o
objetivo.

Altura de linha por token: `--rc-leading-tight` para número e título,
`--rc-leading-normal` para interface, `--rc-leading-relaxed` para parágrafo.

## Forma, sombra e movimento

Raio: `rounded-sm` em marcador miúdo, `rounded-md` em controle, `rounded-lg` em
cartão, `rounded-xl` em painel e diálogo, `rounded-pill` em etiqueta e botão
redondo. **Uma peça dentro da outra usa raio menor que o pai**, senão o canto
interno "vaza" visualmente do externo.

Sombra: `shadow-1`, `shadow-2`, `shadow-3`, em ordem de quanto a coisa flutua.
Cartão parado não precisa de sombra: no tema escuro a sombra some e o que
separa é a borda. Cada sombra já carrega um fio de 1px por fora, na cor certa
do tema: é o bisel que descola o flutuante do fundo, e convive com a
`border` que a peça já tem: um é o traço interno, o outro o contorno externo.

`shadow-glow` é a lanterna do acento, opt-in: hero de landing e CTA que merece
cerimônia. Nenhum componente liga sozinho, e produto de operação nunca usa.

Título display aperta a letra: `tracking-display` acompanha `font-display` em
`text-xl` para cima (os títulos de Card, Dialog e Sheet já vêm com ele);
`tracking-tight` serve para título menor. Corpo de texto fica em tracking 0.

Movimento: `--rc-duration-fast` para retorno de toque (cor de hover),
`--rc-duration-base` para o que entra e sai, `--rc-duration-sheet` para a folha.
Animar `width` e `height` custa layout; prefira `opacity`, `scale` e
`translate`. No Tailwind 4, `scale-*`, `translate-*` e `rotate-*` escrevem as
propriedades `scale`, `translate` e `rotate`, e não `transform`: com
`transition-[opacity,transform]` o painel aparece esmaecendo e a escala entra
de estalo. Nomeie a propriedade que muda (`transition-[opacity,scale]`) ou use
`transition-transform`, que cobre as quatro. A duração vem sempre do token,
`duration-fast` (ou `duration-[var(--rc-duration-fast)]`, que é o mesmo):
`transition-colors` sozinho cai nos 150ms do Tailwind, que não zeram com
"reduzir movimento". Animação em laço (`animate-spin`, `animate-pulse`) leva
`motion-reduce:animate-none` ao lado.

A curva também tem nome de intenção: `ease-rc` é o padrão, `ease-rc-enter` para
o que chega e `ease-rc-exit` para o que sai. As molas andam com a duração do
mesmo nome: `ease-rc-spatial duration-spatial` para posição e tamanho,
`ease-rc-expressive duration-expressive` quando o gesto merece ser notado, e
`ease-rc-effects duration-effects` para cor e opacidade, que não podem passar do
alvo.

Entrada de marca: `animate-rise` sobe um passo e assenta, `animate-fade` só
aparece. Escalone irmãos com `[animation-delay:80ms]`, 160, 240: isso é de
landing e hero, e não de tela de operação.

**As peças entram na montagem.** A regra antiga dizia que produto de operação
não anima entrada; o dono decidiu o contrário, e o critério agora é um só: a
entrada ajuda a perceber o que chegou ou o que mudou. O dado que chega entra (o
gráfico se desenha, a barra de progresso enche do zero, o aviso e o estado vazio
sobem 4px esmaecendo, a pastilha de contagem cresce, o corpo da tabela esmaece
ao sair do esqueleto). A moldura não entra: `Card`, `PageHeader`, `Sidebar`,
`Separator` e controle no estado inicial ficam parados, porque a tela inteira
piscando a cada navegação é ruído, e o `Switch` que desliza ao montar sugere uma
mudança que não aconteceu. As peças já trazem a entrada delas; os utilitários
estão aqui para o que você monta por fora:

| Classe | Efeito | Duração |
|---|---|---|
| `animate-enter` | esmaece e sobe 4px | `base` |
| `animate-appear` | só esmaece | `base` |
| `animate-pop` | cresce de 60% esmaecendo | `fast` |
| `animate-fill` | a barra enche do zero pela escala horizontal; junto com `origin-left` | `slow` |
| `animate-reveal` | aparece da esquerda para a direita, por recorte | `slow` |

As cinco terminam em `backwards`: vale o quadro de partida enquanto a animação
roda, e depois dela não sobra nada, então o estado final é sempre o do próprio
elemento, e se a animação não rodar o conteúdo continua lá. Roda uma vez por
montagem: re-render não repete, só um nó novo no DOM. Com
`prefers-reduced-motion` as durações zeram e nada entra animado. Para desligar
numa instância, `className="animate-none"`. E não ponha entrada em linha que
reordena nem em linha virtualizada: mover o nó no DOM reinicia a animação, e a
ordenação vira um pisca-pisca. O nível certo é o corpo da tabela ou a lista
inteira.

## Ícones

O conjunto é o **lucide-react**, peer obrigatória: mesmo traço, mesma grade,
e o `size` numérico dispensa classe. Nunca emoji no lugar de ícone, e nunca
um segundo conjunto misturado: dois traços diferentes na mesma tela parecem
duas marcas.

| Onde | Tamanho |
|---|---|
| Dentro de controle (`Button`, `Tab`, item de menu) | `size={16}` |
| Junto de texto `sm`/`xs` (célula, meta, eyebrow) | `size={14}` |
| Miúdo em linha apertada (hint do `Stat`, delta) | `size={13}` |
| Estado vazio (`icon` do `EmptyState`) | nenhum: a peça força 32px |

Ícone decorativo (que acompanha um texto que já diz tudo) leva
`aria-hidden="true"`. Ícone que é o único conteúdo de um botão exige
`aria-label` no botão, nunca no ícone. E alvo de toque continua sendo 24px no
mínimo: ícone menor cresce o botão e devolve o espaço com margem negativa,
como o hint do `Stat` faz.

### Ícone ou ilustração no estado vazio

O `EmptyState` tem dois espaços, e cada um serve a um vazio:

- **`icon`** para o vazio que acontece no meio do trabalho: filtro ou busca
  sem resultado, lista que a pessoa esvaziou, período sem movimento. Um ícone
  do lucide da tabela abaixo, e a peça o põe em 32px e `fg-subtle`.
- **`illustration`** para o vazio de primeira vez: a tela inicial que ainda não
  tem nada, o passo de onboarding. Tamanho livre, e toma o lugar do `icon`
  quando os dois vêm.

```tsx
<EmptyState
  icon={<Search />}
  title="Nenhum cliente com esse nome"
  description="Confira a grafia ou busque pelo CNPJ."
/>

<EmptyState
  illustration={<FirstInvoiceArt className="h-24 w-auto" />}
  title="Nenhuma nota"
  description="Emita a primeira para ela aparecer."
  action={<Button>Emitir nota</Button>}
/>
```

**A ilustração pinta com `currentColor` ou com classe de token**
(`fill-accent-subtle`, `stroke-fg-muted`), e nunca com cor literal: a mesma
tela veste vários clientes pelo tema, e um hexadecimal dentro do SVG fica igual
em todos eles e pode sumir no tema escuro. O invólucro já vem em
`text-fg-subtle`, então `currentColor` acompanha sozinho. Prefira SVG em linha
a `<img>`, que não acompanha tema nenhum. A biblioteca não tem kit de
ilustrações, de propósito: o espaço é o que ela garante, e o desenho é do
produto. No React Native, o `icon` aceita também uma função que recebe a cor e
o tamanho, e a ilustração pinta com os papéis de `useRivo().colors`.

### O vocabulário

Um conceito, um ícone. O lucide tem sinônimo para quase tudo (`Trash` e
`Trash2`, `Gear` e `Settings`), e cada sinônimo que entra é uma tela que
parece de outro produto. Esta é a tabela canônica; conceito novo entra aqui
antes de entrar no código.

| Conceito | Ícone |
|---|---|
| adicionar / criar | `Plus` |
| excluir | `Trash2` |
| editar | `Pencil` |
| buscar | `Search` |
| baixar / exportar | `Download` |
| enviar arquivo | `Upload` |
| copiar | `Copy` |
| confirmado / feito | `Check` |
| fechar / limpar | `X` |
| mais ações | `MoreHorizontal` |
| filtros finos | `SlidersHorizontal` |
| recarregar | `RefreshCw` |
| ver / prévia | `Eye` |
| link que sai do produto | `ExternalLink` |
| sair da conta | `LogOut` |
| abre um nível (item, breadcrumb) | `ChevronRight` |
| expande para baixo (select, accordion) | `ChevronDown` |
| página anterior / voltar | `ChevronLeft` |
| ordenável sem ordem | `ChevronsUpDown` |
| variação para cima / para baixo | `ArrowUpRight` / `ArrowDownRight` |
| documento / nota | `FileText` |
| pessoas / clientes | `Users` |
| ajustes do sistema | `Settings` |
| data | `CalendarDays` |
| painel | `LayoutDashboard` |
| explicação curta | `Info` |
| agente / IA | `Bot` |

## Foco e estados

Foco é `focus-visible:ring-2 focus-visible:ring-ring`, nunca `outline-none`
sozinho. Tirar o anel sem repor é o defeito de acessibilidade mais comum, e
quebra a navegação por teclado inteira.

| Estado | Como se mostra |
|---|---|
| hover | mudança de superfície, não de tamanho |
| selecionado | `bg-selected`, ou `bg-accent` quando é escolha única e forte |
| desabilitado | `text-fg-disabled` e sem ponteiro; nunca só opacidade |
| carregando | `bg-skeleton` na forma do conteúdo que vem, e não um giro no meio da tela |

A marca de lugar deve ter a **largura da coluna**, e não a do texto que vier:
assim a tela não pula quando os dados chegam.
