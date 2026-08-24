Boa parte do código que usa esta biblioteca hoje é escrita com um agent ao
lado. Um site que só serve HTML obriga o agent a adivinhar a API a partir do
nome, e ele adivinha com confiança, o que é pior do que errar em silêncio.

Por isso tudo aqui existe também em markdown cru.

## Os três endereços

| Endereço                       | O que entrega                                              |
| ------------------------------ | ---------------------------------------------------------- |
| `/llms.txt`                    | o índice, por família, com link para cada documento        |
| `/componentes/<nome>.md`       | o documento de uma peça, cru                               |
| `/convencoes.md`               | o contrato da biblioteca: Provider, tokens, vocabulário    |

O nome no endereço é o mesmo da página: `ToggleGroup` mora em
`/componentes/toggle-group`, e o markdown dele em
`/componentes/toggle-group.md`.

**São os mesmos arquivos que as páginas renderizam.** Não há uma segunda cópia
para manter, o que você lê como agent é o que a página mostra.

## No prompt

O caminho mais curto é mandar o contrato junto com a peça que interessa:

```
Leia https://ds.rivocode.com.br/convencoes.md e
https://ds.rivocode.com.br/componentes/data-table.md e monte uma listagem de
notas com os estados de carregando, erro e vazio.
```

Para trabalho maior, o índice primeiro:

```
Comece por https://ds.rivocode.com.br/llms.txt e leia o que precisar.
```

## De onde isso vem

Os documentos não foram escritos para o site. Eles nasceram para o sync com o
`claude.ai/design`, onde um agent monta telas com estas peças, e por isso já
respondem o que um agent pergunta: para que serve, quando **não** usar, e qual
a diferença para a peça parecida do lado.

O padrão não é nosso: a própria Base UI envia a documentação inteira dentro do
pacote, em `node_modules/@base-ui/react/docs/`. Foi assim que o `Sheet` desta
biblioteca foi construído sem chutar API.

## O que ainda não existe

Uma skill empacotada junto com o `@rivocode/ui`, para o agent já vir com o
contrato carregado sem precisar buscar. O material está pronto, falta o
empacotamento.
