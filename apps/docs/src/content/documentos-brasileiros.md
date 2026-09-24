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
