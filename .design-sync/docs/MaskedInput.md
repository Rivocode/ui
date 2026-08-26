---
category: Formulário
---

# MaskedInput

Campo com mascara guiada por molde: `9` e digito, `A` e letra, `*` e os dois, e
o resto e literal que a mascara poe sozinha.

Moldes prontos: `cpf`, `cnpj`, `cep`, `telefone`, `data`, `hora`, `placa`,
`cartao` e `moeda`. Aceita molde escrito na mao, como `99-99/9999`.

`onValueChange` entrega o texto pontuado e o cru. **Guarde o cru**: a pontuacao
muda com o tempo e o dado deixa de bater. O dinheiro sai também em centavos, por
`toCents()`, para o servidor receber inteiro em vez de ponto flutuante.

O telefone troca de molde entre o fixo e o celular sozinho.

## Os nove moldes

| Nome | Molde | Sai como |
|---|---|---|
| `cpf` | `999.999.999-99` | `123.456.789-01` |
| `cnpj` | `99.999.999/9999-99` | `12.345.678/0001-90` |
| `cep` | `99999-999` | `58000-000` |
| `telefone` | `(99) 99999-9999` | `(83) 99999-1234` |
| `data` | `99/99/9999` | `05/08/2026` |
| `hora` | `99:99` | `14:30` |
| `placa` | `AAA9A99` | `ABC1D23` |
| `cartao` | `9999 9999 9999 9999` | `4111 1111 1111 1111` |
| `moeda` | — | `2.480,00` |

`moeda` é o único sem molde: em dinheiro os centavos vêm primeiro e a casa anda
para a esquerda a cada dígito, o contrário de todo o resto. Os oito primeiros
vivem em `MASKS`, e `MaskName` é o nome de um deles — o tipo `Mask` da prop
aceita esse nome, `moeda`, ou um molde escrito à mão.

Nome de molde digitado errado não vira molde literal: `mask="dinheiro"` avisa no
console em desenvolvimento e deixa o texto passar cru, em vez de escrever
"dinheiro" dentro do campo, que foi o que a versão anterior fazia.

## As máscaras fora do campo

A mesma lógica sai como função, para o texto que a tela **mostra** e nunca
recebe digitação: a coluna de CPF de uma tabela, o CNPJ no cabeçalho de um
recibo, o telefone que voltou cru do servidor.

| Função | Para que |
|---|---|
| `applyMask(texto, mask)` | Aplica pelo nome do molde, molde cru ou `moeda` |
| `applyPattern(texto, molde)` | Aplica um molde direto, sem passar pelos nomes |
| `applyCurrencyMask(texto)` | Só o dinheiro, da direita para a esquerda |
| `unmask(texto)` | Tira a pontuação e devolve o que a pessoa digitou |
| `toCents(texto)` | `1.234,56` vira `123456`, sem ponto flutuante no meio |
| `phoneMask(texto)` | Diz qual dos dois moldes de telefone o texto pede |

```tsx
<TableCell>{applyMask(cliente.document, 'cnpj')}</TableCell>
```

`phoneMask` devolve um molde, e não um texto: o telefone brasileiro tem oito ou
nove casas depois do DDD e o molde muda no meio da digitação, então quem formata
telefone à mão pergunta a ele primeiro e passa a resposta para o `applyPattern`.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `MaskedInput` — o valor é só dígitos; a máscara é do campo, o dado não a carrega. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
