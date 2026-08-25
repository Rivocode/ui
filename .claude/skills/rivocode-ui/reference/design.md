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
| `text-fg-muted` | apoio: descrição, rótulo de campo, texto de linha |
| `text-fg-subtle` | metadado: legenda de eixo, cabeçalho de grupo, dica de ajuda |

`text-fg-disabled` não é um quarto tom, é um estado.

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
`border` que a peça já tem — um é o traço interno, o outro o contorno externo.

`shadow-glow` é a lanterna do acento, opt-in: hero de landing e CTA que merece
cerimônia. Nenhum componente liga sozinho, e produto de operação nunca usa.

Título display aperta a letra: `tracking-display` acompanha `font-display` em
`text-xl` para cima (os títulos de Card, Dialog e Sheet já vêm com ele);
`tracking-tight` serve para título menor. Corpo de texto fica em tracking 0.

Movimento: `--rc-duration-fast` para retorno de toque (cor de hover),
`--rc-duration-base` para o que entra e sai, `--rc-duration-sheet` para a folha.
Animar `width` e `height` custa layout; prefira `opacity` e `transform`.

## Ícones

O conjunto é o **lucide-react**, peer obrigatória: mesmo traço, mesma grade,
e o `size` numérico dispensa classe. Nunca emoji no lugar de ícone, e nunca
um segundo conjunto misturado — dois traços diferentes na mesma tela parecem
duas marcas.

| Onde | Tamanho |
|---|---|
| Dentro de controle (`Button`, `Tab`, item de menu) | `size={16}` |
| Junto de texto `sm`/`xs` (célula, meta, eyebrow) | `size={14}` |
| Miúdo em linha apertada (hint do `Stat`, delta) | `size={13}` |

Ícone decorativo — que acompanha um texto que já diz tudo — leva
`aria-hidden="true"`. Ícone que é o único conteúdo de um botão exige
`aria-label` no botão, nunca no ícone. E alvo de toque continua sendo 24px no
mínimo: ícone menor cresce o botão e devolve o espaço com margem negativa,
como o hint do `Stat` faz.

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
