---
category: Formulário
---

# TimePicker

O `TimeField` com o painel de escolher a hora.

Mesmo valor, mesmo formato, mesmo teclado: tudo que a página do `TimeField` diz
sobre `"14:30"`, sobre `25:99`, sobre `step`, `min` e `max` continua valendo
aqui. O que esta peça acrescenta é o relógio no canto do campo, e o que ele
abre.

```tsx
const [entrega, setEntrega] = useState('09:00')

<TimePicker value={entrega} onValueChange={setEntrega} min="08:00" max="18:00" step={30} />
```

## Duas colunas, e não uma lista

O painel tem uma coluna de horas e uma de minutos, e não uma lista única de
horários. Uma lista só parece mais simples até `step={5}`, quando ela vira 288
linhas para rolar; em duas colunas são 24 e 12, e a hora é sempre a primeira
decisão.

Os minutos vêm de `60 / step`, então o passo é mais legível quando divide 60 —
1, 5, 15 e 30 são os que a peça foi desenhada para servir.

**A hora não fecha o painel; o minuto fecha.** O minuto é a última decisão, e
fechar antes dela obrigaria a reabrir o painel na metade das escolhas. Escolher
outra hora preserva o minuto que já estava escolhido: quem troca 14:30 por 16
quer 16:30, e não 16:00 — inclusive quando o minuto foi digitado fora da grade,
porque `14:07` foi escolha de alguém. Se a hora nova jogar o horário para fora
da janela, ele encosta no limite dela em vez de sair.

A seta do teclado anda a coluna e leva a seleção junto, sem fechar nada; Enter
e o clique fecham quando estão no minuto. Ao abrir, a coluna já rola até a hora
escolhida.

## A janela recorta o painel

`min` e `max` tiram do painel o que está fora: com `min="08:00"` e `max="10:00"`
a coluna de horas vai de 08 a 10, e às 10 sobra só o minuto `00`. Recortar é
melhor do que oferecer e reclamar depois — a janela de entrega é uma regra da
loja, e não um erro da pessoa.

A janela **recorta a grade, não a desloca**: com `min="08:10"` e `step={15}`, o
primeiro horário oferecido é `08:15`. A grade sai sempre da meia-noite, para
que `08:15` signifique a mesma coisa em toda a tela. Quem precisa de `08:10`
digita no campo, que aceita.

## No celular, o painel é folha

A 390px o painel não cabe ancorado no campo, então ele sobe de baixo como
`Sheet`, pelo mesmo `CalendarPanel` que o `DatePicker` usa. As duas colunas
dividem a largura inteira, e cada opção tem a altura de um controle da casa —
alvo de dedo, e não de mouse. Da largura `sm` para cima o painel volta a ser
`Popover` ancorado no campo, alinhado pela direita.

## Partes

O `className` veste a moldura que junta campo e relógio, porque é ela que tem a
largura. O resto entra por parte:

| Parte | O que é |
|---|---|
| `field` | o campo de digitar |
| `trigger` | o botão do relógio, dentro do campo |
| `panel` | o painel flutuante, ou a folha no celular |
| `column` | cada uma das duas colunas roláveis |
| `option` | cada hora e cada minuto |

```tsx
<TimePicker className="w-56" classNames={{ column: 'max-h-40', option: 'font-mono' }} />
```

Os textos que o leitor de tela ouve entram por `labels`, e cada um tem o próprio
padrão — trocar um não apaga os outros:

```tsx
<TimePicker labels={{ open: 'Escolher o horário da coleta', title: 'Horário da coleta' }} />
```

## Quando não usar

Se a tela é de operação — ponto eletrônico, apontamento de horas, importação
conferida linha a linha —, use `TimeField`. Quem digita o dia inteiro não abre
painel, e o relógio no canto só ocupa a largura do campo.

Se os horários são poucos e fixos ("manhã, tarde, noite", ou as quatro janelas
que a transportadora atende), use `Select`: ali as opções têm nome, e nome diz
mais do que `08:00 – 12:00` escrito em duas colunas.

Para data, `DatePicker`; para intervalo de datas, `DateRangePicker`. Esta peça
não conhece dia nenhum, de propósito.

## No React Native

Traduz como gatilho mais **folha de baixo**, que é a decisão da casa para painel no celular. Duas colunas roláveis pela mesma razão do web, que pesa mais aqui: `step={5}` numa lista única são 288 linhas para rolar com o polegar. Cada opção tem 48pt, acima dos 44pt exigidos, e a coluna rola até a hora escolhida a cada abertura.

**A diferença de estrutura, e ela não é estética:** no web o relógio mora DENTRO do campo; aqui não. Um `TextInput` dentro de um `Pressable` engole o toque do pai, e o gatilho precisa ser um alvo único para o leitor de tela. Todo picker nativo da casa (`DatePicker`, `DateRangePicker`, `Select`, `Combobox`, `TreeSelect`) já é gatilho mais folha, e a divisão sai mais limpa do que no web: `TimeField` é digitação, `TimePicker` é toque.

A hora não fecha a folha e preserva o minuto; o minuto fecha. O `labels` perde `open` e `title`, porque aqui o `label` obrigatório já nomeia o gatilho E titula a folha — o mesmo arranjo do `DateRangePicker`.
