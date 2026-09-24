---
category: Formulário
---

# CurrencyInput

O campo de dinheiro em reais. O valor entra e sai em **centavos inteiros**
(`123456` é R$ 1.234,56), a digitação anda da direita para a esquerda como na
maquininha, e o "R$" fica desenhado ao lado, fora do valor.

```tsx
const [cents, setCents] = useState<number | null>(null)

<Field>
  <FieldLabel>Valor da cobrança</FieldLabel>
  <CurrencyInput value={cents} onValueChange={setCents} />
</Field>
```

Cada tecla empurra os dígitos para a esquerda: `1` mostra `0,01`, `12` mostra
`0,12`, `123456` mostra `1.234,56`. A pontuação sai do `Intl.NumberFormat` em
`pt-BR`, e o teclado do celular abre no numérico. Campo vazio é `null`, e não
zero: "não digitou" e "digitou zero" são respostas diferentes num formulário, e
o zero se digita com a tecla `0`.

**Guarde os centavos.** O servidor recebe inteiro, sem ponto flutuante no meio,
e a pontuação é assunto de tela. O campo para em doze dígitos, R$
9.999.999.999,99, que é onde o inteiro ainda cabe folgado.

## Colar

Colar substitui o valor, e o texto colado é lido como a pessoa o escreveria:
`R$ 1.234,56`, `1234,56`, `1.234,5` e `1234.56` entram como R$ 1.234,56, e
`150` entra como R$ 150,00. O separador de centavos é a vírgula ou o ponto que
tiver um ou dois dígitos depois; os outros são milhar. Texto sem número nenhum
não apaga o que estava.

## Sinal

Sem `allowNegative`, o `-` não entra, nem digitado nem colado. Com ele, o `-`
em qualquer ponto do campo põe o sinal, e um segundo `-` tira:

```tsx
<CurrencyInput value={adjustment} onValueChange={setAdjustment} allowNegative />
```

O teclado numérico do iPhone não tem o sinal, então com `allowNegative` o
campo abre o teclado de texto no web, e o de números e pontuação no nativo.

## Limites

`min` e `max` são em centavos. Fora deles o campo se marca inválido, com a
borda de perigo e `aria-invalid`, e **nada é corrigido sozinho**: trocar o
valor de dinheiro que a pessoa digitou, sem ela ver, é o pior erro que um campo
destes pode cometer. A mensagem que diz o limite é do formulário, como no
`TimeField`. Campo vazio não é inválido por causa de `min`: obrigatório é outra
regra, e também é do formulário.

```tsx
<CurrencyInput value={cents} onValueChange={setCents} min={1_000} max={500_000} />
```

## No formulário

O `forValue` do `@rivocode/ui/form` liga o campo ao React Hook Form: o
`onValueChange` já entrega o número que o schema espera.

```tsx
const schema = z.object({
  amount: z.number({ message: 'Informe o valor' }).int().min(100, 'O mínimo é R$ 1,00'),
})

const form = useZodForm(schema, { defaultValues: { amount: null } })

<FormField name="amount" label="Valor da cobrança">
  {(field) => <CurrencyInput {...forValue(field)} onBlur={field.onBlur} />}
</FormField>
```

O `forValue` não repassa o `onBlur`; passe à mão quando o schema valida ao
sair do campo. No formulário nativo do HTML, sem React Hook Form, o `name`
põe os centavos num campo escondido: o que chega ao servidor é `123456`, e não
`1.234,56`.

## Partes

`classNames` alcança cada nó pelo nome: `input` e `prefix` (o "R$").
`className` veste a raiz, que embrulha os dois.

## Quando não usar

- **Quantidade com passo**, como parcelas, itens ou dias de prazo, é
  `NumberField`: ali o valor anda de um em um pelos botões e pelas setas, e o
  que importa é o limite, não a pontuação.
- **Dinheiro que precisa de molde junto de outros moldes**, na mesma lista de
  campos gerada por configuração, é `MaskedInput` com `mask="moeda"`. Ele
  entrega o texto pontuado e o cru, e o centavo sai por `toCents()`; não tem
  sinal, limite nem colagem inteligente.
- **Valor que a tela só mostra** é texto formatado, e não campo desabilitado:
  use `currency()` numa célula ou no `Stat`.

## No React Native

Traduz, com a mesma conta: o valor em centavos, a digitação que anda da direita para a esquerda, o `-` que põe e tira o sinal e a leitura do texto colado moram num arquivo só, compartilhado pelos dois pacotes. O campo é controlado, como todo o nativo: `value` e `onValueChange` são obrigatórios.

O React Native não avisa quando a pessoa cola, então o campo lê a seleção de antes da troca para saber o que entrou por cima. Com `allowNegative`, o teclado passa a ser o de números e pontuação, que é o que tem o sinal no iPhone. Não há `name`: formulário escondido não existe no celular.
