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

Traduz, e a forma muda junto: no web a moldura é composição — `InputGroup` por fora, `Input`, `InputPrefix` e `InputAction` por dentro — e ela desarma a borda do campo com um seletor de descendente. Esse seletor não existe no React Native, e quem escrevesse a mesma árvore lá ganharia duas bordas encaixadas sem jeito de apagar a de dentro. Por isso a moldura nativa desenha o campo: `value`, `onValueChange`, `prefix`, `suffix` e `actions` são props dela. Não há `size` — altura de controle é única no nativo, porque alvo de toque não encolhe.
