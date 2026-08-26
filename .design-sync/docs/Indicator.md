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

Traduz, e o que muda é quem carrega o nome acessível. No web o número é escondido do leitor e um texto só para ele entra ao lado; no nativo a pastilha inteira é UM elemento de acessibilidade, e o `label` — aqui obrigatório — é o que ele anuncia. O leitor lê o filho ("Notificações, botão") e a pastilha em seguida ("3 notificações"), e nunca um "3" solto entre os dois. Embrulhar filho e pastilha num elemento só resolveria a leitura e quebraria o toque, porque o botão de dentro deixaria de ser alcançável. O anel que separa a pastilha do que está embaixo vira borda da cor do fundo: `ring` não existe no React Native, e borda ali ocupa por dentro da caixa.
