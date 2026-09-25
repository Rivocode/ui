---
category: Formulário
---

# Rating

Nota em estrelas: como foi o atendimento, quanto a pessoa gostou do produto, a
média que os outros deram. Serve para **escolher** a nota e para **exibir** a
média, e as duas coisas saem com a leitura de tela certa.

```tsx
const [nota, setNota] = useState(0)

<Rating value={nota} onValueChange={setNota} />
```

`value` é a nota, e `0` quer dizer nenhuma. Sem `value`, a peça guarda a nota
sozinha a partir de `defaultValue`. `max` diz quantas estrelas, e o padrão é
cinco.

## Para o leitor de tela e para o teclado

A escolha é um `radiogroup`, o padrão da APG para rating: cada estrela é uma
opção com o nome da nota ("1 estrela", "3 estrelas"), e o grupo se chama
"Avaliação". Um `aria-labelledby` apontando para a pergunta da tela toma o
lugar do nome padrão, e é o jeito certo quando a pergunta está escrita acima.

- **Tab** entra pela nota marcada, ou pela primeira quando ainda não há nota.
- **Setas** andam uma estrela (meia, com `allowHalf`) e param nas pontas. Em
  `rtl` a seta da esquerda é a que sobe, como a pessoa vê, e o preenchimento
  nasce da borda da direita.
- **Home** e **End** vão para a menor e para a maior nota.
- **Espaço** e **Enter** escolhem a estrela em foco.

Com o ponteiro em cima, as estrelas mostram a prévia da nota que o clique daria,
e a prévia some quando o ponteiro sai. A prévia não muda o `value`.

```tsx
<p id="pergunta">Como foi a entrega?</p>
<Rating aria-labelledby="pergunta" value={nota} onValueChange={setNota} />
```

## Meia estrela e limpar

`allowHalf` divide cada estrela em duas notas: a metade do início da leitura
(a esquerda, ou a direita em `rtl`) é a nota `n - 0,5`, e as setas andam de
meio em meio. As metades ganham nome próprio ("Meia estrela", "2,5 estrelas"),
uma opção cada para o leitor de tela. O alvo do ponteiro continua a estrela
inteira, com os mesmos 24px ou mais: a metade sai de onde o ponteiro caiu
dentro dela.

`clearable` faz o clique na nota já escolhida voltar a zero, e `onValueChange`
chega com `0`. Nasce desligado: na maioria das telas a nota, uma vez dada, só se
troca.

```tsx
<Rating allowHalf clearable value={nota} onValueChange={setNota} />
```

## A média, só leitura

`readOnly` exibe sem deixar escolher. Aceita qualquer fração (4,3 pinta 30% da
quinta estrela) e sai como **uma imagem só** para o leitor de tela, com o nome
"4,3 de 5". Cinco estrelas lidas uma a uma não dizem a média; a frase diz.

```tsx
<Rating readOnly value={4.3} size="sm" />
```

## Cor, tamanho e ícone

A estrela cheia pinta em `warning` e a vazia em `border-strong`. As duas são
fronteira de objeto gráfico, e as duas estão medidas a 3:1 sobre `bg`,
`surface` e `surface-raised`, nos dois temas. Desabilitada, a cheia vira
`fg-disabled` e a vazia `border-disabled`.

`size` troca a estrela (`sm`, `md`, `lg`), e a caixa de cada uma nunca fica
abaixo de 24px de alvo. `icon` troca o desenho por outro ícone do lucide, como
`<Heart />`: o cheio sai com `fill`, então o ícone precisa ter área.

`name` põe a nota num `input` escondido, para o `<form>` enviar junto.

## Partes

`classNames` alcança cada nó pelo nome: `item` (a caixa de cada estrela),
`empty` (o desenho vazio) e `filled` (o desenho cheio, recortado pela nota).

## Textos

`labels` troca o que o leitor de tela ouve: `group` (o nome do grupo), `item`
(a função que diz o nome de cada nota) e `value` (a função que diz a média no
modo só leitura).

## Quando não usar

- **Número que precisa ser exato** é `NumberField`. Estrela é opinião, e o
  intervalo é pequeno: nota de 0 a 10 com decimal não cabe em estrela.
- **Faixa contínua**, como desconto ou prazo, é `Slider`. O `Slider` arrasta
  por uma régua; o `Rating` escolhe entre poucos degraus que têm nome.
- **Escolha entre opções que não são nota** ("Ruim", "Bom", "Ótimo" escritos)
  é `RadioGroup`, ou `ToggleGroup` quando os botões ficam lado a lado. Estrela
  só funciona quando mais é melhor.
- **Medida do sistema**, como uso do plano ou força de senha, é `Meter`. O
  `Meter` mostra uma quantidade; o `Rating` mostra uma opinião.

## No React Native

Traduz, com os mesmos `max`, `allowHalf`, `clearable`, `readOnly` e `size`. O `value` é controlado, como em todo o pacote nativo, e sem `onValueChange` a peça só exibe.

**Para o leitor de tela, as estrelas são um controle só.** No web a escolha é um `radiogroup` com uma opção por estrela; aqui o grupo é `adjustable`, o mesmo contrato do `Slider`: o VoiceOver e o TalkBack dizem "Avaliação, 3 estrelas", e o gesto de subir e descer anda uma estrela (meia, com `allowHalf`). Cinco paradas de foco para uma nota seriam cinco toques de navegação para chegar ao botão de enviar.

**O alvo de toque de cada estrela é sempre 44pt.** O `size` troca só o desenho. Com `allowHalf`, o toque na metade de início da leitura dá a meia estrela: a da esquerda, ou a da direita quando o aparelho lê da direita para a esquerda. O preenchimento também começa desse lado, e o gesto de subir continua subindo a nota. Não há prévia: no toque não existe pousar.

A estrela padrão é o caractere ★ na cor do tema, porque o pacote não traz ícone. Para outro desenho, a função recebe a cor já resolvida, o tamanho e a camada: `icon={({ color, size }) => <Heart color={color} fill={color} size={size} />}`.

```tsx
<Rating value={nota} onValueChange={setNota} allowHalf />
```
