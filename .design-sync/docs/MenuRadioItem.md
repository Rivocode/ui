---
category: Navegação
---

# MenuRadioItem

Uma opção de escolha única no menu: "por data de emissão", "por valor".

Sempre dentro de um `MenuRadioGroup`, que é quem guarda o valor. O `value` é
obrigatório: é ele que o grupo compara para saber qual linha está escolhida.

O ponto no lugar da marca de certo não é decoração: ele diz que escolher esta
desescolhe a de cima.

Como na Base UI, escolher **não** fecha o menu. Quando a escolha encerra o
assunto, e ordenar costuma encerrar, passe `closeOnClick`.

## Partes

`classNames` alcança o `indicator`, a coluna que guarda o ponto (a mesma
largura do `MenuCheckboxItem`, para os dois alinharem o texto quando aparecem no
mesmo painel).

## Quando não usar

Para ligar e desligar cada opção por conta, use `MenuCheckboxItem`.

Para uma ação que acontece e acaba (baixar o PDF, cancelar a nota), use
`MenuItem`: `aria-checked` num item que não guarda estado nenhum diz ao leitor de
tela que há uma escolha marcada onde não há.
