---
category: Dados
---

# Timeline

O que aconteceu com uma coisa, em ordem.

Uma nota fiscal olha para trás — emitida, autorizada, enviada, paga, cancelada
— com carimbo de tempo e autor em cada ponto. Trilha de auditoria tem a mesma
forma: o que mudou, quando e por quem.

Sai como `<ol>` porque a ordem é o dado. Um leitor de tela que anuncia "lista de
5 itens" na ordem certa já entregou metade do que a linha desenha.

O tom é por item, de propósito: numa nota, a linha do cancelamento é vermelha e
as outras não, e é essa linha que a pessoa procura quando abre a trilha.
`pending` deixa o marcador vazado — preencher o marcador de um evento futuro
faz a linha prometer que ele já ocorreu, que é o erro que uma trilha de
auditoria não pode cometer.

## Quando não usar

Para um formulário longo em etapas, use `Steps`. O `Steps` é assistente: olha
para a frente, sabe quantos passos faltam e só deixa voltar. A `Timeline` olha
para trás e ninguém "avança" nela. Trocar uma pela outra faz o controle
prometer o que ele não faz — o mesmo argumento que separa `Progress` de `Meter`.

## As partes

`TimelineItem` é um ponto: `title`, `at`, `by`, `tone`, `pending`, e conteúdo
livre como filho. O `at` costuma receber um `RelativeTime`.
