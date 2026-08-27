---
category: Estrutura
---

# FilterBar

A fileira dos filtros aplicados, o botão de limpar e a contagem: as três
coisas que toda listagem remonta à mão em volta do `DataTable`.

Ela **não gerencia consulta**. Não sabe o que é uma página, um `queryKey` nem
um `refetch`, pela mesma razão que o `DataTable` não conhece React Query:
estado de consulta é arquitetura de aplicação, e a casa decidiu deixá-lo de
fora. A peça recebe `filters`, apresenta o que recebeu e avisa quando alguma
coisa saiu.

```tsx
const [filters, setFilters] = useState<AppliedFilter[]>([
  { id: 'status', label: 'Situação', value: 'Em aberto' },
  { id: 'customer', label: 'Cliente', value: 'Clínica São Lucas' },
])

<FilterBar filters={filters} onFiltersChange={setFilters} />
```

`onFiltersChange` recebe **o que sobrou**, no xis e no limpar. É o mesmo par
do `onValueChange` do `TagsInput`, e sozinho ele já basta. `onRemove` existe
ao lado dele para quem precisa saber *qual* filtro saiu, e recebe o objeto
inteiro; `onClear` dispara antes do `onFiltersChange([])`, para a telemetria
que conta "quantas vezes alguém desiste de tudo".

Cada filtro é `{ id, label, value }`. O `id` é a chave estável: é por ele que
a peça remove, e não por índice. O `label` é o campo (`Cliente`) e o `value` é
o escolhido (`Clínica São Lucas`); os dois juntos são o que o leitor de tela
ouve no xis, porque "Remover" repetido quatro vezes não distingue nada.

## A linha fica, mesmo vazia

Sem filtro nenhum a barra **continua ocupando a linha**, com "Nenhum filtro
aplicado" em texto apagado. A tela que pula quando o primeiro filtro entra é um
defeito conhecido, e o `Tracker` do React Native já pagou por ele: lá a linha
de leitura existe desde o primeiro quadro justamente para o espaço ficar
reservado e nada saltar no primeiro toque. Aqui é a mesma conta, e ela custa
uma altura de controle (`--rc-control-sm`), a mesma da densidade escolhida no
provider, e não um número cravado.

Quem realmente não pode gastar a linha passa `reserve={false}`. **O aviso ao
leitor de tela continua montado mesmo assim**: uma região viva precisa existir
*antes* da mudança para anunciá-la, e uma barra que se desmonta ao perder o
último filtro anunciaria o silêncio.

## Quando os filtros não cabem

A 390px, três filtros não cabem. A barra **rola na horizontal dentro da própria
moldura**, com o "limpar" ancorado fora do trecho que rola.

Não quebra linha porque a altura da barra passaria a depender de quantos
filtros existem: quatro fichas de "Cliente: Clínica São Lucas" viram quatro
linhas, e a listagem (que é o conteúdo) desce para fora da dobra. A barra é
moldura, e moldura que cresce até metade da tela deixou de ser moldura.

Não colapsa em "+3" porque a barra existe justamente para dizer que o resultado
está filtrado. Filtro escondido atrás de um contador é a origem do chamado
"sumiram meus dados", e desdobrá-lo pediria uma segunda superfície flutuante
para uma fileira de fichas.

Cada ficha corta o valor com reticências em 10rem, então um valor comprido
encolhe a si mesmo em vez de empurrar os vizinhos para fora do alcance. O
teclado chega a todos: o navegador rola até o xis que recebe foco.

Quando **nenhum xis é alcançável** (barra só de filtros travados, ou barra
`disabled`) **e** a fileira **realmente transborda**, o trecho que rola vira
uma parada de tabulação, senão o teclado não teria como chegar ao que está fora
da vista. As duas condições são necessárias, e por um tempo só a primeira era
cobrada. O preço saiu em paradas que não levavam a lugar nenhum: `disabled`,
cujo propósito é *tirar* controles do caminho enquanto a consulta refaz,
**acrescentava** uma; e uma fileira de filtros travados que cabia inteira na
linha (`scrollWidth` igual ao `clientWidth`, medido em Chrome) virava outra,
sem ter um pixel para rolar. Tabular para dentro de uma lista que não sai do
lugar é tabular para lugar nenhum.

Sendo parada, ela **tem nome**: "Filtros aplicados: role para ver todos", o
`label` da fileira mais o que fazer ali. Sem nome, o leitor de tela anuncia
"lista" e deixa a pessoa adivinhar onde caiu. O texto se troca por
`labels.scroll`, que recebe o `label` e devolve a frase.

## A borda esmaece quando há mais

Rolar resolve o alcance e não resolve o aviso, e por um tempo a peça só teve a
primeira metade. Medido em Chrome, com seis filtros de razão social: a 390px
cabia **uma ficha e meia**, e a segunda era cortada no meio da letra
(`Emissão 01/`), num corte reto, sem reticências e sem nada dizendo que havia
mais cinco. Na largura de mesa o mesmo corte caía na quinta ficha. A ironia é
que a peça tinha recusado o "+3" para não esconder filtro atrás de contador, e
acabou escondendo filtro sem contador nenhum.

Reticências não resolvem, porque **quem corta é o rolador, e não a ficha**: o
truncamento em 10rem da `FilterChip` já tinha acontecido antes, dentro da
pílula, e a borda da moldura corta o que sobrou.

A borda que tem conteúdo escondido atrás **esmaece** (`mask-image`, 1,5rem de
dissolução) e some sozinha quando não há mais o que rolar daquele lado: no
começo só a direita, no meio as duas, no fim só a esquerda, e nenhuma quando
tudo coube. Nada sai da fileira: as seis fichas continuam lá, alcançáveis pelo
arrasto e pela tabulação, que é a decisão que esta seção defende desde o
começo.

O esmaecido foi escolhido por ser a única pista que **não custa largura**, e
largura é exatamente o que falta numa linha de 390px que já divide espaço com o
"limpar":

- **Setas de rolar** comeriam uns 56px de alvo justamente na largura onde o
  problema é pior, e serviriam só ao ponteiro: o dedo já arrasta e o teclado
  já tabula. Ainda precisariam da mesma medida de rolagem que o esmaecido usa,
  então não substituem o custo: somam a ele.
- **Um contador "+3"** ao lado do limpar duplicaria uma contagem que já está na
  tela (é o mesmo motivo pelo qual o contador separado não existe), e "+3" é o
  vocabulário do colapso: quem o vê tenta clicar esperando desdobrar a fileira,
  que é a segunda superfície flutuante recusada acima.

**O botão não mente.** "Limpar 6 filtros" ao lado de três fichas visíveis conta
os filtros **aplicados**, que é a pergunta que importa antes de tocar nele, e
era a única coisa verdadeira na tela. O que faltava não era corrigir o 6: era a
fileira admitir que estava cortada. Lidos juntos, os dois fecham a conta: seis
aplicados, três à vista, o resto continua para a direita.

O esmaecido não come o anel de foco. O trecho que rola leva `scroll-padding` da
mesma 1,5rem, então o xis que recebe foco sempre para depois da dissolução; e
quando a fileira é só de filtros travados e o rolador vira a parada de
tabulação, o esmaecido sai enquanto ele está focado, para o anel aparecer
inteiro.

Por `classNames.list` a medida se redesenha (`mask-r-from-*`), para quem quiser
outra dissolução.

## O foco depois de tirar um filtro

O xis que recebe o toque **sai do DOM junto com a ficha**, e o foco ia junto:
medido em Chrome, o `activeElement` voltava para o `<body>` a cada remoção. A
região viva anunciava "5 filtros aplicados" na hora certa, e o anúncio chegava
de lugar nenhum: numa barra de seis, seis reinícios no topo do documento para
quem navega por teclado.

A peça escolhe onde o foco pousa, nesta ordem:

1. **o xis da ficha seguinte**, que é a que ocupou o lugar da que saiu. É o que
   deixa tirar seis filtros seguidos sem soltar o teclado;
2. **o "limpar"**, quando a que saiu era a última da fileira;
3. **o xis da ficha anterior**, quando não há limpar (`clearFrom={Infinity}`,
   ou contagem que caiu abaixo da régua);
4. **o trecho que rola** (ou a raiz `role="group"`, quando o último filtro saiu
   e a fileira inteira desmontou). Nos dois casos o `tabindex="-1"` é posto na
   hora e devolvido no `blur`: pouso de emergência não deixa parada de
   tabulação nova para trás.

Controle travado não entra na conta. A barra que fica `disabled` no mesmo passo
da remoção (a consulta já refazendo) teria mandado o foco para um xis que não
pode recebê-lo, que é o `<body>` de novo por outro caminho; nesse caso o pouso
salta para o primeiro degrau que aceita foco.

**O foco só se move se ele estava na fileira.** Quem clicou com o ponteiro
tendo o cursor em outro lugar da página não é puxado para dentro da barra.

## O limpar aparece a partir de dois

Com um filtro só, o xis da própria ficha faz exatamente o mesmo, à mesma
distância do dedo: um segundo controle para o mesmo efeito não ensina nada e
ainda come 110px de uma linha de 390px. O botão passa a valer quando "tirar um
por um" vira trabalho.

Ele mostra a contagem ("Limpar 3 filtros") e é lá que a contagem visível
mora. Um contador separado disputaria a largura escassa com as fichas, que são
a contagem já visível; no botão ele dobra de função e diz o tamanho do estrago
antes do toque. Para outra régua, `clearFrom={1}` deixa o botão sempre, e
`clearFrom={Infinity}` tira-o de vez.

## Filtro que o app trava

`removable: false` mostra o filtro sem xis. É o escopo que a aplicação impõe
(a filial da pessoa, o tenant, o ano fiscal aberto): ele **precisa** aparecer,
porque explica o resultado, e sair dele não é escolha de quem lê. Hoje esse
filtro costuma ser simplesmente omitido, e aí a lista mente sobre o próprio
recorte.

## Enquanto a consulta refaz

`disabled` trava todos os xis e o limpar de uma vez. É o estado em que a lista
já foi pedida de novo e ainda não voltou: sem ele, o segundo toque dispara uma
consulta que a primeira ainda vai sobrescrever.

## O nome da fileira

`label` é a única porta do nome, e o padrão é "Filtros aplicados". Passar
`aria-label` direto **é recusado pelo tipo**, não por preciosismo: até a 0.7.0
ele compilava, renderizava e era engolido em silêncio, porque o `{...props}` de
quem chama era espalhado *antes* do `aria-label` da peça. `<FilterBar
aria-label="Filtros da listagem" />` continuava se anunciando "Filtros
aplicados", e nada acusava: o defeito só aparece com um leitor de tela ligado.

Aceitar e ignorar era a pior das três saídas. Entre as duas honestas (deixar
quem chama vencer, ou proibir), a peça proíbe, porque `label` já existia
exatamente para isso e porque **o mesmo texto batiza duas coisas**: a fileira e
o trecho que rola, quando ele vira parada de tabulação. Duas portas dariam dois
nomes ao mesmo lugar, e a parada herdaria o nome antigo. Quem precisa apontar
para um título que já está na tela usa `aria-labelledby`, que a peça não
sobrescreve.

## As partes

`classNames` veste cada nó pelo nome: `list` é o trecho que rola, `item` é o
`<li>` de cada filtro, `chip` é a raiz da ficha, `clear` é o botão de limpar e
`empty` é o texto da linha guardada. Sem eles a única saída seria `[&_li]`, que
amarra a sua tela à árvore interna da peça.

A fileira sai como `<ul>` com `role="list"` explícito. O `list-style: none` do
preflight tira a semântica de lista no Safari, e é ela que faz o leitor de tela
anunciar "3 itens" sem que ninguém conte nada.

## Quando não usar

Quando as opções são poucas, fixas e cabem à vista, use `ToggleGroup`: escolher
e desescolher acontece no mesmo lugar, num toque, e não há o que resumir depois.
A `FilterBar` é para o caso oposto: o filtro foi escolhido em outro lugar
(um `Combobox`, um `DateRangePicker`, uma folha inteira de filtros) e a
listagem precisa dizer o que sobrou valendo.

Quando o filtro é o próprio texto que a pessoa digita, use `TagsInput`: lá a
lista nasce do campo e o campo é a peça. Aqui a peça não tem campo nenhum, de
propósito.

## No React Native

Traduz, e é onde a peça vale mais: listagem no celular é onde filtro dói. As decisões de desenho já tinham sido tomadas pensando em 390px, então quase tudo atravessa: rola na horizontal, não quebra linha e não colapsa em `+3`.

**O limpar fica FORA do que rola.** Se ele rolasse junto, o controle que existe para desfazer tudo seria o único que exige rolar até o fim para achar. Ele ancora à direita da fileira, e o `size="sm"` do `Button` nativo já entrega o alvo de 44pt sozinho.

**A linha reservada passa a ser medida em dedo.** No web ela guarda a altura de `--rc-control-sm`; aqui guarda 44pt, que é uma altura de alvo de toque. Não há token de controle do lado de cá. A fileira tem a mesma altura vazia e cheia, pelo mesmo motivo do `Tracker`: a tela não pode pular quando o primeiro filtro entra.

A região viva é um `Text` único que acumula as duas funções, em vez dos dois nós do web: duplicar abriria um `gap` morto na fileira. **Limite de plataforma declarado:** `accessibilityLiveRegion` é do Android; no iOS o anúncio automático não existe sem `announceForAccessibility`, que nenhuma peça do catálogo usa hoje.

**RTL foi verificado, e a maior parte o próprio React Native resolve.** A fileira e a ficha já são espelhadas pelo Yoga quando a locale é da direita para a esquerda, e o repouso da rolagem já para na borda onde a leitura começa: inverter de novo seria o erro clássico de espelhar duas vezes. O `contentOffset` que chega ao JavaScript é sempre distância física a partir da esquerda, nos dois sentidos e nas duas plataformas, então a régua marca o lado físico que tem conteúdo além dele, e não troca de lado.

O que precisou de conta foi o valor de REPOUSO. O código guardava zero até chegar o primeiro evento de rolagem: verdade em LTR, falso em RTL, onde o repouso é o fim do conteúdo. No iOS o defeito durava para sempre enquanto ninguém arrastasse, porque em repouso ele não emite evento nenhum, e a régua aparecia do lado errado.

**A borda esmaece no web; aqui ela é uma régua.** `mask-image` não existe no React Native, e um esmaecido de verdade só sairia de duas formas. Um peer novo (`expo-linear-gradient`, `MaskedView`), que uma barra de filtros não pode cobrar, porque no celular peer é módulo nativo a ligar e reconstruir. Ou um gradiente pintado NA cor da superfície de trás, que a peça não tem como saber: no tema escuro, `surface` sobre `bg` vira um borrão claro por cima das fichas. O gradiente em si até estava ao alcance, porque o `react-native-css` compila `linear-gradient` para o `experimental_backgroundImage` que o RN traz de fábrica; o que falta é a máscara, e sem ela não há alfa por pixel.

O que ficou: uma régua de 1pt em `border-strong` encostada na borda que tem conteúdo escondido, que aparece e some sozinha conforme a rolagem, não custa largura nenhuma e não come o arrasto que começa nela. É a mesma pista, mais dura, e é o mesmo `inset 1px` com que o `DataTable` marca a coluna congelada no web.

Caem `classNames` por parte (não há `[&_li]` de que fugir sem DOM) e a parada de tabulação do web, porque não há foco de teclado aqui.
