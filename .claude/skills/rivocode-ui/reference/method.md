# O método: do pedido à tela que se pode mostrar

Os outros arquivos ensinam o sistema. Este diz a **ordem**, e o que se confere
no fim de cada passo.

Tela bonita quase nunca é tela escrita melhor: é a mesma tela, passada mais
vezes. O que separa uma interface que parece desenhada de uma que parece gerada
não é talento nem token novo, é ter feito seis passadas em vez de uma.

## Conteúdo

- O laço, em seis passos
- Passo 1: a direção, numa frase
- Passo 2: o esqueleto
- Passo 3: o conteúdo verdadeiro
- Passo 4: as quatro passadas de acabamento
- Passo 5: olhar, nos dois temas e nas duas densidades
- Passo 6: medir
- O que faz uma tela parecer gerada
- O que faz uma tela parecer atual
- A conferência final

## O laço, em seis passos

| Passo | A pergunta que ele responde | Só termina quando |
|---|---|---|
| 1. Direção | que tela é esta, e para quem | cabe numa frase escrita |
| 2. Esqueleto | onde as coisas ficam | é um dos quatro de `layout.md`, sem mistura |
| 3. Conteúdo | o que está escrito nelas | o texto e os números são verdadeiros |
| 4. Acabamento | ritmo, tom, forma, movimento | as quatro passadas rodaram separadas |
| 5. Olhar | como está de fato | foi vista nos dois temas e nas duas densidades |
| 6. Medir | o que o olho não vê | contraste, foco e teclado conferidos |

Pular o 1 produz a média de todas as telas possíveis. Pular o 5 é o único
defeito desta lista que já chegou ao npm.

## Passo 1: a direção, numa frase

Antes da primeira linha, escreva uma frase que decida três coisas: **quem usa,
quanta cerimônia, e qual esqueleto**. "Painel de operação, denso, para quem
olha o dia inteiro" e "primeira tela do produto, com respiro, para quem chegou
agora" produzem telas diferentes com as mesmas peças.

Sem a frase, cada decisão isolada sai razoável e o conjunto sai sem
personalidade — que é exatamente o que se reconhece como gerado.

A frase não é enfeite: ela já decide.

| Quando a frase diz | Fica decidido |
|---|---|
| operação, o dia inteiro, muita linha | `density="compact"`, esqueleto 1 ou 2, nenhuma animação de entrada, sombra só no que flutua |
| cadastro, uma vez por semana | `density="comfortable"`, esqueleto 3, `max-w-3xl` centralizado |
| painel, para decidir | esqueleto 4, `font-display` no número, indicador antes de gráfico |
| marca, primeira visita | respiro dobrado, `animate-rise` escalonado, `shadow-glow` num CTA só |

**Uma direção por tela.** Painel de operação com hero animado não é as duas
coisas, é nenhuma.

## Passo 2: o esqueleto

Escolha um dos quatro de `layout.md` e monte só a estrutura: `Card` vazio,
grid, cabeçalho, barra. Ainda sem conteúdo final, mas já com a **quantidade
real** — quatro indicadores se são quatro, doze linhas se a tabela mostra doze.

Estrutura montada com três linhas de exemplo desaba quando chegam trinta, e o
que desaba é sempre a mesma coisa: `min-w-0` que faltou, filtro sem
`flex-wrap`, coluna que estica a página inteira.

## Passo 3: o conteúdo verdadeiro

Texto inventado esconde exatamente o que a passada seguinte precisa ver.

- **Português real**, nunca "Lorem" nem "Título 1". Frase falsa tem tamanho
  falso, e o quebra-linha da frase verdadeira aparece só na produção.
- **Números feios**: `R$ 1.284.930,00` e não `R$ 1.000,00`. Nome de quarenta
  caracteres ao lado de um de quatro. É o que revela o alinhamento e o corte.
- **Dinheiro abreviado** com `currencyShort` em indicador, eixo, legenda e
  dica. Nunca digitado como `R$ 12,4K`: isso mostra o resultado e esconde o
  mecanismo.
- **Os quatro finais** — dados, carregando, erro e vazio. Entregar só o caminho
  feliz é entregar metade da tela, e a metade que falta é a que o usuário vê no
  pior dia dele.

## Passo 4: as quatro passadas de acabamento

Uma passada é uma varredura do arquivo inteiro fazendo **uma** pergunta. Quatro
passadas separadas acham o que uma leitura "geral" não acha, porque a pergunta
geral não tem resposta errada.

| Passada | A pergunta, literal | O que ela costuma achar |
|---|---|---|
| Ritmo | quantos valores de espaço diferentes existem neste arquivo? | seis ou sete; deviam ser três |
| Tom | o que a pessoa veio ler está em `text-fg`, e só ele? | tudo em `text-fg`, ou tudo em `text-fg-muted` |
| Forma | o raio de dentro é menor que o de fora? | `rounded-lg` dentro de `rounded-lg` |
| Movimento | quantas coisas se mexem quando a tela abre? | três; devia ser uma, ou nenhuma |

A passada de ritmo é a que mais muda a tela por linha alterada. Padronizar seis
espaçamentos em três (`gap-2`, `gap-4`, `space-y-6`) conserta a sensação de
"quase certo" que nenhum defeito específico explicava.

## Passo 5: olhar, nos dois temas e nas duas densidades

É o passo que se pula, e o único que pega o que teste nenhum pega.

```bash
bun run demo && bun run serve
```

São quatro estados, e todos os quatro: `rivocode-dark` e `rivocode-light`,
cada um em `comfortable` e em `compact`. No projeto que consome, alterne no
`RivoProvider` e olhe:

```tsx
<RivoProvider theme="rivocode-light" density="compact">
  <InvoiceScreen />
</RivoProvider>
```

O que só aparece olhando:

- sombra que separa no claro e some no escuro, onde quem separa é a borda;
- texto que cabe em `comfortable` e quebra em `compact`;
- contraste que a conta aprova e o olho recusa, em texto miúdo sobre `subtle`;
- gráfico sem altura, que some sem erro;
- a segunda ação em `bg-accent` ao lado da primeira, que só se nota vendo.

Sete peças desta biblioteca foram publicadas no npm sem ninguém ter olhado para
nenhuma delas. Passaram em mais de mil testes. O passo que manda olhar foi
pulado, e nada acusou.

## Passo 6: medir

O olho não mede contraste e não navega por teclado.

```bash
npx rivocode-ui check-theme caminho/do/tema.css
```

Depois, na tela pronta:

- **Teclado até o fim.** `Tab` da primeira ao última parada, sem cair em
  armadilha e sem parada invisível. Anel de foco visível em todas.
- **Nome acessível** em todo controle: botão só de ícone tem `aria-label`,
  campo tem rótulo de verdade e não `placeholder`.
- **Ordem de títulos** sem salto: um `h1`, e nada de `h2` seguido de `h4`.
- **Cor nunca sozinha.** Toda situação sinalizada por tom leva a palavra junto.

`reference/a11y.md` tem a lista completa. Estes quatro são os que reprovam mais.

## O que faz uma tela parecer gerada

São sinais, não erros — cada um passa no `tsc` e no teste.

- Tudo no mesmo tom e no mesmo tamanho: sem hierarquia, o olho não sabe onde
  começar.
- Dois botões em `bg-accent` lado a lado: nenhuma ação é a primária.
- `Card` dentro de `Card` para destacar: as duas camadas se achatam.
- Seis valores de espaçamento sem motivo.
- Ícones de dois conjuntos na mesma tela, ou emoji no lugar de ícone.
- Só o caminho feliz, sem carregando, erro e vazio.
- Valor por extenso onde cabia abreviado, estourando a coluna.
- Tudo animado, ou animação em produto de operação.
- Tudo centralizado, inclusive o que se lê em fila.
- Texto de interface em inglês misturado ao português.

## O que faz uma tela parecer atual

O gosto de agora, escrito nos tokens que já existem aqui:

- **Superfície e borda no lugar de sombra pesada.** `bg-surface` sobre `bg-bg`
  com `border-border` sustenta a separação nos dois temas; `shadow-2` fica para
  o que de fato flutua.
- **Um número grande e o resto quieto.** `font-display` com
  `tracking-display` em `text-3xl` no valor que a tela existe para mostrar, e
  `text-fg-muted` em tudo que o explica.
- **Respiro largo entre seções, apertado dentro do controle.** `space-y-6`
  entre assuntos e `gap-2` entre ícone e texto, sem nada no meio.
- **Destaque por `bg-accent-subtle`**, não por mais uma camada de superfície
  nem por borda mais grossa.
- **Um gesto de movimento por tela**, e no lugar certo: `animate-rise`
  escalonado na entrada de uma landing, nada num painel.
- **Dado antes de desenho.** Indicador em cima porque responde em um segundo;
  o gráfico embaixo porque pede dez.
- **Estreito primeiro de verdade**, com a versão de celular escrita antes e
  `sm:`/`lg:` por cima.

## A conferência final

Antes de dizer que a tela está pronta:

- [ ] A direção do passo 1 ainda descreve o que está na tela.
- [ ] Nenhuma cor literal, nenhum `z-index` numérico, nenhuma altura cravada em
      controle.
- [ ] Toda peça usada existe no catálogo, e nenhuma prop foi inventada.
- [ ] Os quatro finais de toda listagem e de todo gráfico.
- [ ] Três valores de espaçamento, três tons de texto, uma ação primária.
- [ ] `min-w-0` em todo item de grid ou flex com conteúdo largo dentro.
- [ ] Vista nos dois temas e nas duas densidades.
- [ ] Percorrida por teclado, com foco visível do começo ao fim.
- [ ] `tsc` limpo.
