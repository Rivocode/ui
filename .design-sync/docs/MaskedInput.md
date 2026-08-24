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
