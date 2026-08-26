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

## No React Native

Traduz, com a lista por `items`: cada evento leva `title`, `at`, `by`, `description`, `tone` e `pending`, e a composição do `TimelineItem` não atravessa — a mesma regra do `RadioGroup` e do `Select`. **O carimbo é texto, e não um `RelativeTime`**: cada evento é uma parada só do leitor de tela e o rótulo dela é montado a partir desse texto, então um relógio vivo lá dentro continuaria andando na tela enquanto o rótulo ficaria preso na hora em que montou — e trilha de auditoria não pode dizer duas horas diferentes. Para o carimbo, `formatDate`. **A ordem, que o `<ol>` do web entrega de graça, vai escrita**: não existe papel de item de lista no React Native, então cada evento anuncia "3 de 5: Nota autorizada, 12/03 às 14:22, por Ana Duarte" — uma frase com o que mudou, quando e por quem, em vez de três paradas de VoiceOver que não dizem o assunto. E nada é tocável: uma trilha se lê, e o marcador de 9px nunca seria alvo de dedo — quem quer abrir o detalhe de um evento põe um `Item` com `onPress`.
