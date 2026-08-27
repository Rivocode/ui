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

`Date` obrigaria a inventar um dia para uma hora que não tem dia — e um dia
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

Nada é emitido, e o campo se marca inválido na mesma tecla — sem esperar o
`blur`, porque a pessoa ainda está olhando para o campo quando erra.

Ao sair do campo, o texto impossível volta para a última hora válida, como
`31/02` volta no `DatePicker`. A alternativa seria consertar o que a pessoa
digitou (`25:99` virando `23:59`), e consertar em silêncio é pior: ninguém
confere um valor que o campo "aceitou".

Enquanto se digita, `1` e `14` não acusam nada. Só o par completo e impossível
acende o campo — acusar prefixo é acusar quem ainda está escrevendo.

## Passo e janela

`step` é em minutos e governa **as setas**, não a validação. Seta para cima e
seta para baixo pousam na grade a partir da meia-noite, e não somam o passo
cru: com `step={15}`, `14:07` sobe para `14:15`, e não para `14:22`. Com o
campo vazio, a seta para cima começa na abertura da janela.

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

## No formulário nativo

Com `name`, um campo escondido carrega **a hora inteira**, e nunca o texto pela
metade: enviar `08` porque alguém apertou Enter no meio da digitação é o tipo
de dado que só aparece semanas depois, no relatório.

## Quando não usar

Para escolher a hora com o dedo, sem teclado, use `TimePicker` — é este campo
com um painel de horas e minutos, e no celular o painel vira folha de baixo.

Para data, `DatePicker`; para data e hora juntas, os dois lado a lado, cada um
guardando o seu texto.

Para duração ("2h30 de serviço"), nenhum dos dois: duração não é hora do dia,
e `NumberField` em minutos soma, compara e não tem meia-noite para atravessar.

Para hora escrita à mão sem regra nenhuma, o `MaskedInput` com molde `hora` põe
os dois pontos e para por aí — ele não conhece `25:99`, não conhece janela e
não tem seta.

## No React Native

Traduz, e continua sendo o campo de DIGITAR — quem marca ponto escreve `0800` mais rápido do que abre painel, e o teclado numérico do sistema é o idioma disso.

**As regras de valor atravessam inteiras.** `"HH:MM"` em 24h, vazio é `""`, e só hora completa avisa quem escuta. `25:99` não é consertado em silêncio para `23:59`: marca inválido na mesma tecla e volta ao último válido ao sair — consertar calado é pior, porque ninguém confere valor que o campo "aceitou". O `step` governa os passos e as opções, nunca a validação, então `14:07` com `step={30}` continua sendo hora legítima.

**O que se reescreve é a seta.** Seta não existe no toque, e `step` precisava continuar significando alguma coisa; em vez de inventar gesto, a peça veste o molde que a casa já tem para passo no dedo — `[−][campo][+]`, do `NumberField`, com 48pt em cada botão. Eles chamam o mesmo cálculo do web, então pousam na grade a partir da meia-noite.

Caem `defaultValue` (aqui tudo é controlado), `name` (formulário escondido não existe no React Native) e `size` (o `Input` nativo não tem vocabulário de tamanho).
