---
category: Formulário
---

# MaskedInput

Campo com mascara guiada por molde: `9` e digito, `A` e letra, `*` e os dois, e
o resto e literal que a mascara poe sozinha.

Moldes prontos: `cpf`, `cnpj`, `cep`, `telefone`, `data`, `hora`, `placa`,
`cartao`, `boleto` e `moeda`. Aceita molde escrito na mao, como `99-99/9999`.

`onValueChange` entrega o texto pontuado e o cru. **Guarde o cru**: a pontuacao
muda com o tempo e o dado deixa de bater. O dinheiro sai também em centavos, por
`toCents()`, para o servidor receber inteiro em vez de ponto flutuante.

O telefone troca de molde entre o fixo e o celular sozinho, e o boleto também:
a linha começa no molde de banco, de 47 dígitos, e passa para o de convênio, de
48 em quatro blocos (`84630000000-3 29990296202-4 …`), quando o primeiro dígito
é 8, que é como toda conta de consumo e todo tributo começam. Os 44 dígitos do
código de barras, colados de um leitor óptico ou de um PDF, ficam sem
pontuação: eles não são a linha, e a pontuação de 47 casas neles mentiria.

O CNPJ aceita letra: desde julho de 2026 a Receita emite CNPJ alfanumérico,
com letra ou dígito nas doze primeiras casas e dígito nos dois verificadores. A
letra sobe a caixa sozinha, e o CNPJ só de números continua saindo igual. Por
isso o `cnpj` abre o teclado de texto no celular, e não o numérico.

## Os dez moldes

| Nome | Molde | Sai como |
|---|---|---|
| `cpf` | `999.999.999-99` | `123.456.789-01` |
| `cnpj` | `**.***.***/****-99` | `12.345.678/0001-90`, `12.ABC.345/01DE-35` |
| `cep` | `99999-999` | `58000-000` |
| `telefone` | `(99) 99999-9999` | `(83) 99999-1234` |
| `data` | `99/99/9999` | `05/08/2026` |
| `hora` | `99:99` | `14:30` |
| `placa` | `AAA9A99` | `ABC1D23` |
| `cartao` | `9999 9999 9999 9999` | `4111 1111 1111 1111` |
| `boleto` | `99999.99999 99999.999999 99999.999999 9 99999999999999` | `00190.00009 01149.718601 68524.522114 6 75860000102656` |
| `moeda` | - | `2.480,00` |

`moeda` é o único sem molde: em dinheiro os centavos vêm primeiro e a casa anda
para a esquerda a cada dígito, o contrário de todo o resto. Os nove primeiros
vivem em `MASKS`, e `MaskName` é o nome de um deles. O tipo `Mask` da prop
aceita esse nome, `moeda`, ou um molde escrito à mão.

O cru de `moeda` são os dígitos do que está na tela, com o zero da frente:
`0,05` entrega `005`, e `12,00` entrega `1200`. Os dois últimos são sempre os
centavos, e o nativo entrega o mesmo texto.

Nome de molde digitado errado não vira molde literal: `mask="dinheiro"` avisa no
console em desenvolvimento e deixa o texto passar cru, em vez de escrever
"dinheiro" dentro do campo, que foi o que a versão anterior fazia.

## Conferir o documento

A máscara põe a pontuação, e não diz se o número existe. Quem confere é
`isValidCpf` e `isValidCnpj`, pelos dígitos verificadores. Os dois aceitam o
texto com ou sem pontuação, e o `isValidCnpj` já faz a conta do CNPJ
alfanumérico: cada letra vale o código dela menos 48.

CNH, título de eleitor, PIS, RENAVAM e placa têm a sua: `isValidCnh`,
`isValidVoterId`, `isValidPis`, `isValidRenavam` e `isValidPlate`. A linha
digitável do boleto se confere com `isValidBoletoLine`, e `parseBoleto` lê
dela o banco, o valor em centavos e o vencimento. O guia
[Documentos brasileiros](/documentos-brasileiros) diz o que cada conta confere.

```tsx
const schema = z.object({
  cnpj: z.string().refine(isValidCnpj, 'CNPJ inválido'),
})
```

Valide ao sair do campo, e não a cada tecla: o documento pela metade é sempre
inválido, e acusar quem ainda está digitando é ruído.

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
| `phonePatternFor(texto)` | Diz qual dos dois moldes de telefone o texto pede |

```tsx
<TableCell>{applyMask(cliente.document, 'cnpj')}</TableCell>
```

`phonePatternFor` devolve um molde, e não um texto: o telefone brasileiro tem oito ou
nove casas depois do DDD e o molde muda no meio da digitação, então quem formata
telefone à mão pergunta a ele primeiro e passa a resposta para o `applyPattern`.

## No React Native

Traduz, com os mesmos moldes: os nomes prontos (`cpf`, `cnpj`, `cep`, `data`, `hora`, `placa`, `cartao`, `telefone`, `boleto` e `moeda`) e o molde escrito à mão, com `9` para dígito, `A` para letra e `*` para os dois, saem de um arquivo só, compartilhado pelos dois pacotes. O molde com `#`, a sintaxe antiga daqui, continua funcionando e está obsoleto: troque `#` por `9`.

O que muda é o `value`: aqui ele é o valor limpo, sem pontuação e com letra em caixa alta, porque a máscara é do campo e o dado não a carrega. O `onValueChange` entrega o limpo primeiro e o texto com máscara no segundo argumento, que é o que o web entrega primeiro. Com `moeda`, o limpo é o mesmo cru do web, os dígitos do que está na tela: `0,05` entrega `005`, e `12,00` entrega `1200`.
