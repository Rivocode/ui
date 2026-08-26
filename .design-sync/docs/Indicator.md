---
category: Feedback
---

# Indicator

A contagem por cima de outra coisa: avisos no sino, itens na aba, mensagens no
menu.

Existe como peça porque a alternativa é cada tela posicionar um `Badge` com
`absolute` na mão — e as cinco telas acabam com cinco deslocamentos diferentes,
todas com o mesmo defeito: a contagem existindo só para quem vê. Aqui o número
é escondido do leitor de tela e o `label` inteiro entra no lugar dele, porque
"7" não diz o que são sete.

Zero não desenha nada. Uma pastilha com "0" chama atenção para dizer que não há
nada, que é o contrário do trabalho dela.

Acima de `max` sai "99+", em vez de a pastilha esticar e empurrar o que está ao
lado. Com `dot`, sai só o ponto — para "tem algo novo aqui", quando o número
não importa.

## No React Native

Ainda não portado — a contagem por cima do ícone ainda é `View` posicionada na mão. É ausência de agora, e não decisão: a [tabela de paridade](/react-native) separa as duas.
