---
category: Formulário
---

# Editable

Edição no lugar: o texto vira campo ao ser clicado, e volta a ser texto ao ser
confirmado.

É o gesto que separa painel de leitura de painel de operação. Corrigir o nome de
um cliente sem abrir uma tela de edição, sem perder a posição na lista e sem
esperar duas navegações é a diferença entre a pessoa corrigir e a pessoa deixar
errado.

Duas decisões que a peça toma, e que são a razão de ela existir. **O Escape
desfaz**: sair pela lateral é o gesto de quem se arrependeu, e salvar ali
transforma um clique errado numa edição que ninguém pediu. **Sair do campo
salva**: é o oposto do Escape de propósito, porque quem clicou fora seguiu
adiante, e exigir um Enter depois disso perde o que foi escrito sem avisar.

Fechado, o texto é um `button`. Quem navega pelo teclado precisa saber que
aquilo abre alguma coisa, e um `div` com `onClick` não diz isso a ninguém.

## Quem guarda o valor

Guarda o próprio quando recebe só `defaultValue`, e obedece ao de fora quando
recebe `value` — o mesmo par das outras peças de formulário. Controle quando o
valor precisa voltar do servidor depois de salvo; deixe solto quando a correção
só vale nesta tela.

```tsx
<Editable defaultValue="Clínica São Lucas" label="Cliente" onValueChange={save} />
```

O `label` continua obrigatório: aberto, a peça é um `<input>` sem rótulo
visível, e sem ele o campo fica sem nome.

## Quando não usar

Quando a mudança precisa de confirmação explícita — valor, alíquota, qualquer
campo que o servidor valida e pode recusar. Ali um `Dialog` com Salvar e
Cancelar diz o que está em jogo; a edição no lugar promete que é barato desfazer.

## No React Native

Traduz, com os dois gestos trocados — e os dois eram a peça inteira no web, então vale ler antes de portar a tela.

**Quem abre é o toque longo**, e não o toque. É o gesto que o sistema já usa para agir sobre um texto, e a escolha é defensiva: num painel de leitura o dedo encosta em tudo enquanto rola, e com o toque curto abrindo o campo o teclado subia sozinho a cada esbarrão. Para quem usa leitor de tela o gesto não existe, então a peça declara também uma ação de acessibilidade `longpress` chamada "Editar", que aparece no rotor.

**Sair do campo não salva.** No web, clicar fora confirma; aqui não há clicar fora — há o teclado que se esconde, e o próprio `Cancelar` tira o foco do campo antes de rodar, então um `blur` que salvasse salvaria o rascunho no caminho de cancelá-lo. Nada sai daqui sem confirmação explícita (o botão de retorno do teclado) e nada se perde sem o `Cancelar`, que é visível ao lado do campo porque sem Escape não existe saída invisível.

O resto é o contrato de sempre: `value` e `onValueChange` **obrigatórios**, sem `defaultValue`, e `label` obrigatório — fechada, a peça anuncia `label` e valor juntos, porque "Nome do cliente" sozinho manda a pessoa abrir a edição só para descobrir o que há lá dentro.
