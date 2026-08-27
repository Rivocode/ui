---
category: Formulário
---

# TimeField

Campo de hora digitável, em 24 horas.

Quem marca ponto, agenda consulta ou fecha janela de entrega digita `0800` mais
rápido do que abre qualquer painel. Por isso o campo existe sozinho: o
`TimePicker` é ele com um painel em cima, e não o contrário.

Os dois pontos entram sozinhos enquanto se digita, e o campo para em quatro
dígitos. Não existe AM/PM: o valor é sempre 24 horas, que é o que o backend
entende sem discussão.

## O valor é texto, e não Date

O valor é uma `string` no formato `"14:30"`, e o campo vazio é `""`.

`Date` obrigaria a inventar um dia para uma hora que não tem dia, e um dia
inventado carrega fuso, horário de verão e a virada de meia-noite junto. Quem
agenda "entrega às 14:30" quer exatamente esses cinco caracteres no banco, e é
isso que `onValueChange` entrega:

```tsx
const [entrada, setEntrada] = useState('08:00')

<TimeField value={entrada} onValueChange={setEntrada} />
```

**Só hora inteira avisa.** Digitar `14` não chama `onValueChange`, do mesmo
jeito que `03/03` não vira data no `DatePicker`. Quem escuta nunca recebe meia
hora, e por isso nunca precisa validar o que chega.

Três funções fazem a ponte e saem pelo pacote, porque tela que mostra hora fora
de um campo precisa das mesmas regras:

| Função | O que faz |
|---|---|
| `applyTimeMask(texto)` | A máscara enquanto se digita: põe os dois pontos e para em quatro dígitos |
| `parseTime(texto)` | `"HH:MM"` para minutos desde a meia-noite, e `undefined` para o que não é hora |
| `formatTime(minutos)` | Minutos para `"HH:MM"`, e string vazia quando não há hora |

## O que acontece com 25:99

Nada é emitido, e o campo se marca inválido na mesma tecla, sem esperar o
`blur`, porque a pessoa ainda está olhando para o campo quando erra.

Ao sair do campo, o texto impossível volta para a última hora válida, como
`31/02` volta no `DatePicker`. A alternativa seria consertar o que a pessoa
digitou (`25:99` virando `23:59`), e consertar em silêncio é pior: ninguém
confere um valor que o campo "aceitou".

Enquanto se digita, `1` e `14` não acusam nada. Só o par completo e impossível
acende o campo. Acusar prefixo é acusar quem ainda está escrevendo.

## Passo e janela

`step` é em minutos e governa **o passo**, não a validação. O passo pousa na
grade a partir da meia-noite e não soma o passo cru: com `step={15}`, `14:07`
sobe para `14:15`, e não para `14:22`. Com o campo vazio, o passo para cima
começa na abertura da janela.

Quem anda o passo é a seta ↑/↓ no teclado, e são os dois botões de mais e de
menos no celular: as duas portas chamam a mesma conta.

`min` e `max` desenham a janela de entrega ou o turno. Hora fora dela **chega
em quem escuta** e o campo se marca inválido: a pessoa digitou uma hora de
verdade, e apagar o trabalho dela esconde o erro em vez de mostrá-lo. A
mensagem é do formulário, que é quem sabe por que a janela é aquela.

```tsx
<Field>
  <FieldLabel>Horário da entrega</FieldLabel>
  <TimeField defaultValue="09:00" min="08:00" max="18:00" step={30} />
  <FieldDescription>Das 08:00 às 18:00, de meia em meia hora.</FieldDescription>
</Field>
```

Hora digitada fora da grade continua valendo: `14:07` com `step={30}` é uma
hora legítima, e recusá-la seria transformar uma conveniência de teclado em
regra de negócio.

Turno que atravessa a meia-noite (`min="22:00"` com `max="06:00"`) não é
suportado: a janela invertida é ignorada e o campo aceita o dia inteiro. Duas
horas sem data não conseguem dizer qual delas é do dia seguinte.

## O passo no dedo

**Abaixo de 640px o campo veste `[−][campo][+]`.** Os dois botões chamam o
mesmo cálculo das setas, então pousam na mesma grade e param na mesma janela.
Cada um tem 44px de largura, e a moldura não desce de 44px de altura em
densidade ou tamanho nenhum: é o alvo que a casa cobra do dedo, o mesmo 44 da
casa do dia no `Calendar` do celular.

Sem eles, `step` era inalcançável no toque. Não existe seta ↑/↓ num teclado de
telefone, então a única saída era abrir o `TimePicker`. O campo que existe
justamente para ponto eletrônico ficava, no celular, pior do que o painel que
ele deveria dispensar. O molde não é invenção: é o do `NumberField`, que é a
peça da casa que resolve passo desde sempre, e é o mesmo que o porte React
Native vestiu primeiro.

A moldura cresce de verdade, e não por halo transparente como no `Checkbox` ou
no `Slider`. Ali sobra espaço em volta do desenho para o halo tomar; aqui os
vizinhos do botão são o campo e a borda, e um halo por cima do campo roubaria
o toque que põe o cursor no texto.

**Por que só na tela estreita.** Na mesa o passo já tem porta, e ela não ocupa
pixel nenhum: a seta. Dois botões ao lado de cada horário viram ruído numa
agenda com quatro campos de hora: oito botões que ninguém aperta com o mouse.
O custo do que se recusou está pago em duas moedas, e as duas são pequenas:
quem estreita a janela do navegador na mesa ganha botões de que não precisa, e
a largura só se conhece depois da hidratação, então uma página renderizada no
servidor mostra o campo sem botões por um quadro antes de eles entrarem.

**Por que não uma prop.** Uma prop `steppers` deixaria o padrão como está, e o
padrão é justamente o defeito: quem escreve o formulário na mesa não descobre
sozinho que o campo perdeu o passo no telefone de quem o preenche. Prop de
opção conserta a tela de quem já sabe do problema; a tela de todo mundo
continua quebrada.

Dentro do `TimePicker` os botões não aparecem: lá o passo já tem porta no dedo,
que é o painel de horas e minutos, e ele é construído sobre o mesmo `step`.

## O que o leitor de tela recebe

**Os botões herdam o nome do campo.** Quatro botões numa agenda com "Entrada" e
"Saída" liam-se como dois "Aumentar" e dois "Diminuir", e quem ouve não sabia
qual horário estava mexendo. Agora o nome sai do rótulo do próprio campo, seja
ele um `FieldLabel`, um `label for` solto ou um `aria-label`: "Aumentar
Entrada" e "Aumentar Saída". Não é prop nova, é o rótulo que já está na tela.
Uma prop de nome repetiria o texto do rótulo em toda chamada, e o padrão de
quem esquecesse a prop continuaria sendo o defeito.

Campo sem rótulo nenhum continua com "Aumentar" e "Diminuir" secos: não há de
onde herdar, e inventar nome a partir do `placeholder` diria "Aumentar hh:mm".

**O passo é anunciado.** Apertar o botão muda a hora com o foco parado no
botão, e mudança fora do foco é silêncio: a pessoa apertava e não sabia se
tinha acontecido. Uma região viva discreta ao lado do campo diz a hora em que o
passo pousou, e a seta ↑/↓ no teclado passa pela mesma porta. A região nasce
junto com o campo, vazia, porque região que chega no mesmo quadro do texto não
dispara anúncio nenhum: o leitor observa a mudança de uma região que já estava
lá.

Digitar não anuncia. Quem digita já ouve o eco do próprio teclado, e repetir
`08:30` a cada dígito completo transforma o campo num campo que fala por cima
de quem escreve.

**Por que não `role="spinbutton"` no campo.** Ele parecia resolver as duas
coisas de uma vez, e medido no Chrome não resolve nenhuma. O `aria-valuetext` é
ignorado num campo editável: o Chrome expõe o texto do campo, com ou sem o
atributo, então a frase que se escreveria ali nunca chega ao leitor. O
`aria-valuenow` fica com a última hora válida enquanto a tela mostra `25:99`,
que é exatamente o conserto em silêncio que esta peça recusa. E o anúncio do
passo continuaria faltando, porque leitor de tela lê a mudança de valor do
widget que está com o foco, e o foco está no botão. Além disso o papel troca o
campo de "caixa de texto" para "botão giratório", e o campo aceita digitação
com máscara, que é justamente o que o papel não prevê.

## No formulário nativo

Com `name`, um campo escondido carrega **a hora inteira**, e nunca o texto pela
metade: enviar `08` porque alguém apertou Enter no meio da digitação é o tipo
de dado que só aparece semanas depois, no relatório.

## Quando não usar

Para escolher a hora sem digitar nada, use `TimePicker`: é este campo com um
painel de horas e minutos, e no celular o painel vira folha de baixo. Não é
mais ele quem resgata o passo no toque (este campo alcança o `step` sozinho),
e sim quem oferece a hora inteira pronta para escolher.

Para data, `DatePicker`; para data e hora juntas, os dois lado a lado, cada um
guardando o seu texto.

Para duração ("2h30 de serviço"), nenhum dos dois: duração não é hora do dia,
e `NumberField` em minutos soma, compara e não tem meia-noite para atravessar.

Para hora escrita à mão sem regra nenhuma, o `MaskedInput` com molde `hora` põe
os dois pontos e para por aí. Ele não conhece `25:99`, não conhece janela e não
tem passo: nem seta, nem botão.

## No React Native

Traduz, e continua sendo o campo de DIGITAR: quem marca ponto escreve `0800` mais rápido do que abre painel, e o teclado numérico do sistema é o idioma disso.

**As regras de valor atravessam inteiras.** `"HH:MM"` em 24h, vazio é `""`, e só hora completa avisa quem escuta. `25:99` não é consertado em silêncio para `23:59`: marca inválido na mesma tecla e volta ao último válido ao sair. Consertar calado é pior, porque ninguém confere valor que o campo "aceitou". O `step` governa os passos e as opções, nunca a validação, então `14:07` com `step={30}` continua sendo hora legítima.

**Os dois lados ganharam o botão de passo, e o nativo chegou primeiro.** Seta não existe no toque, e `step` precisava continuar significando alguma coisa; em vez de inventar gesto, a peça vestiu o molde que a casa já tem para passo no dedo, `[−][campo][+]` do `NumberField`. O web tinha o mesmo buraco num telefone, e o adotou depois: lá os botões só aparecem abaixo de 640px, porque na mesa a seta já é a porta e não ocupa pixel. Aqui eles estão sempre, porque mesa não existe. Os dois chamam o mesmo cálculo, então pousam na mesma grade a partir da meia-noite; a diferença é o alvo, 48pt aqui contra 44 lá.

Caem `defaultValue` (aqui tudo é controlado), `name` (formulário escondido não existe no React Native) e `size` (o `Input` nativo não tem vocabulário de tamanho).
