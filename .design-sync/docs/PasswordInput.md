---
category: Formulário
---

# PasswordInput

Campo de senha com o olho que revela.

Existe como peça porque todo projeto reconstrói este par — e reconstrói com o
mesmo defeito: o botão dizendo o estado em vez da ação. "Senha visível" não diz
o que acontece ao clicar, e quem navega por leitor de tela decide pelo verbo.
Aqui o nome do botão é sempre a ação: "Mostrar senha", "Esconder senha".

Revelar é um gesto momentâneo: sair do campo esconde de novo. Deixar a senha na
tela depois que a pessoa foi para outro lugar é o que faz alguém ser lido por
cima do ombro numa mesa compartilhada.

## Quando não usar

Para código de verificação de seis dígitos, use `OTPField` — ele separa as
casas, aceita colar o código inteiro e não esconde nada, porque o código é para
ser lido em voz alta do celular.
