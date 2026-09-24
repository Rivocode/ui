A máscara põe a pontuação, e não diz se o número existe. Quem diz é a conta dos
dígitos verificadores, e a biblioteca traz uma função para cada documento que
uma tela brasileira costuma pedir. Todas são puras, aceitam o texto com ou sem
pontuação e respondem `true` ou `false`, e todas existem com o mesmo nome e a
mesma conta no `@rivocode/ui` e no `@rivocode/ui-native`.

| Função | Documento | Tamanho | Exemplo válido |
| --- | --- | --- | --- |
| `isValidCpf` | CPF | 11 dígitos | `529.982.247-25` |
| `isValidCnpj` | CNPJ, numérico ou alfanumérico | 14 casas | `12.ABC.345/01DE-35` |
| `isValidCnh` | CNH, o número de registro | 11 dígitos | `02650306461` |
| `isValidVoterId` | Título de eleitor | 12 dígitos | `0043 5687 0906` |
| `isValidPis` | PIS, PASEP, NIT e NIS | 11 dígitos | `120.56874.10-7` |
| `isValidRenavam` | RENAVAM | 11 dígitos, ou os 9 antigos | `00639884962` |
| `isValidPlate` | Placa, a antiga e a Mercosul | 7 casas | `ABC-1234`, `BRA2E19` |

```tsx
import { isValidCnh, isValidPlate } from '@rivocode/ui'

const schema = z.object({
  cnh: z.string().refine(isValidCnh, 'CNH inválida'),
  placa: z.string().refine(isValidPlate, 'Placa inválida'),
})
```

Valide ao sair do campo, e não a cada tecla: o documento pela metade é sempre
inválido, e acusar quem ainda está digitando é ruído. O `MaskedInput` põe a
pontuação enquanto a pessoa digita, e a função confere o número quando ela
termina.

## O que cada conta confere

Nenhuma dessas funções consulta cadastro. Elas dizem que o número **pode**
existir, porque os verificadores batem, e nunca que ele está ativo, em nome de
quem está, ou que a placa está emplacada. Isso é pergunta para o serviço do
órgão, e não para a tela.

- **CPF e CNPJ** conferem os dois verificadores pelo módulo 11 da Receita. O
  CNPJ alfanumérico entra pela mesma conta: cada letra vale o código dela menos
  48, e os dois verificadores continuam sendo dígitos.
- **CNH** confere os dois verificadores do número de registro de 11 dígitos,
  com o desconto de 2 no segundo quando o primeiro dá 10. Não confunda com o
  número do espelho, impresso em outro lugar do documento.
- **Título de eleitor** confere a unidade da federação (as casas 9 e 10, de
  `01` a `28`, em que `28` é o exterior) e os dois verificadores. São Paulo
  (`01`) e Minas Gerais (`02`) têm a exceção do TSE: resto zero vira 1, e não
  0.
- **PIS** confere o verificador pelos pesos 3, 2, 9, 8, 7, 6, 5, 4, 3 e 2. O
  mesmo número serve de PASEP, NIT e NIS, então uma função cobre os quatro.
- **RENAVAM** confere o verificador do número de 11 dígitos. O antigo, de 9,
  continua valendo: a função completa com dois zeros à esquerda antes da
  conta.
- **Placa** não tem verificador. A função confere a forma: três letras e quatro
  números na antiga (`ABC1234`), e três letras, número, letra e dois números na
  Mercosul (`BRA2E19`), com ou sem hífen e em qualquer caixa.

Sequência de um dígito só, como `111.111.111-11`, passa na conta de vários deles
e não existe em nenhum: as funções recusam.

## Boleto

A linha digitável tem duas formas, e o primeiro dígito diz qual é:

- **Boleto de banco**, a ficha de compensação: 47 dígitos em cinco campos,
  `00190.00009 01149.718601 68524.522114 6 75860000102656`. Os três primeiros
  campos têm verificador próprio no módulo 10, e o quarto é o verificador geral
  do código de barras, no módulo 11 da Carta-Circular 2.926 do Banco Central.
- **Convênio**, a conta de consumo e o tributo: 48 dígitos em quatro blocos de
  onze, cada um com o seu verificador, e começa sempre com 8:
  `84630000000-3 29990296202-4 00410136000-8 00200644114-7`. A terceira casa
  diz o módulo: 6 e 7 são módulo 10, e 8 e 9 são módulo 11, como está no leiaute
  de arrecadação da FEBRABAN.

`isValidBoletoLine` confere todos os verificadores das duas formas, inclusive o
geral, que é o único que pega um dígito trocado no valor ou no vencimento.
`boletoLineToBarcode` devolve os 44 dígitos do código de barras, ou `null`
quando a linha não confere. E `parseBoleto` lê o que o número carrega:

```tsx
import { parseBoleto } from '@rivocode/ui'

const boleto = parseBoleto('00190.00009 01149.718601 68524.522114 6 75860000102656')
// { kind: 'bank', bank: '001', amount: 102656, dueDate: 15/07/2018, … }
```

| Campo | No boleto de banco | No convênio |
| --- | --- | --- |
| `kind` | `bank` | `collection` |
| `bank` | o código de compensação, com três dígitos | `null` |
| `amount` | o valor em centavos, ou `null` quando vem zerado | o valor em centavos quando a terceira casa é 6 ou 8; `null` quando é 7 ou 9, que carregam referência e não reais |
| `dueDate` | o vencimento, ou `null` com o fator `0000` | `null`: o convênio não tem fator |
| `segment` | `null` | 1 prefeitura, 2 saneamento, 3 energia e gás, 4 telecomunicações, 5 órgão de governo, 6 carnê, 7 multa de trânsito, 9 uso do banco |
| `line`, `barcode` | os dois, só dígitos | os dois, só dígitos |

`parseBoleto` aceita também os 44 dígitos que o leitor ótico devolve, e monta a
linha a partir deles. Número que não confere devolve `null`, e não metade dos
campos.

### O fator de vencimento voltou a 1000

O vencimento do boleto de banco é um fator de quatro dígitos: quantos dias
depois de 07/10/1997. O fator chegou a 9999 em 21/02/2025, e a FEBRABAN o
reiniciou em 1000 no dia seguinte, 22/02/2025. Desde então o mesmo fator serve
a duas datas com 9.000 dias de distância, e o número sozinho não diz qual é.

`parseBoleto` escolhe a data mais perto de hoje, que é a que um boleto em
circulação tem. Quem lê boleto antigo guardado, ou quer um resultado que não
mude com o relógio, passa o dia de referência:

```tsx
parseBoleto(linha, { today: new Date(2018, 6, 1) })
```

O `MaskedInput` tem o molde `boleto`, que começa no de banco e passa sozinho
para o de convênio quando o primeiro dígito é 8. No celular é o mesmo nome, no
`MaskedInput` do `@rivocode/ui-native`.

## Sem campo por perto

As funções não dependem de peça nenhuma, então servem também fora do
formulário: conferir uma planilha importada, marcar a linha da tabela cujo
documento veio torto do servidor, ou decidir no próprio servidor, porque não
tocam o DOM.

```tsx
const invalid = rows.filter((row) => !isValidRenavam(row.renavam))
```

As máscaras de pontuação moram no `MaskedInput`, que também exporta as funções
que as aplicam fora do campo, como `applyMask(texto, 'cpf')`.
