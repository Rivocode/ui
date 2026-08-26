---
category: Formulário
---

# InputGroup

Moldura que encosta texto ou botão no campo: `R$` antes, `.com.br` depois, lupa
de busca, botão de copiar.

A borda e o anel de foco passam para a moldura, e o campo de dentro entrega os
dois. Sem isso aparecem duas bordas encaixadas e dois aneis, e o conjunto deixa
de parecer um campo só.

Acompanham `InputPrefix`, `InputSuffix` e `InputAction`.

## No React Native

Ainda não portado — sem moldura: prefixo e sufixo ainda são composição sua em volta do `Input`. É ausência de agora, e não decisão: a [tabela de paridade](/react-native) separa as duas.
