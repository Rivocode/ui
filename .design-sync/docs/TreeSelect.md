---
category: Formulário
---

# TreeSelect

Escolha dentro de uma arvore: setor e equipe, categoria e subcategoria, conta e
centro de custo.

**Quem vale e a folha.** O valor sai como lista de ids de folha; marcar um pai
marca todas as folhas debaixo dele. Guardar o pai junto criaria dois jeitos de
dizer a mesma coisa.

O gatilho resume em vez de listar: até três nomes eles aparecem, passando disso
vem o número. Nome cortado no meio diz menos do que "7 escolhidos".

`value`, `defaultValue` e `onValueChange` são os mesmos do `Tree`: trocar o
painel pela árvore inline, ou o contrário, é mexer no nome da peça e em mais
nada.

## No React Native

Traduz: é o `Tree` nativo dentro da folha de baixo, com a mesma navegação por níveis — e por isso ele resolve o que os dois `Select` encadeados, que esta página mandava usar, nunca resolveram: a profundidade não é fixa, e o segundo `Select` só sabia existir depois que alguém escolhia no primeiro.

**O rodapé é a metade que o web não precisa ter.** No desktop o painel fica ao lado do gatilho, e o gatilho conta quantos foram; sob uma folha não há gatilho à vista, então a contagem vive no rodapé, junto do `Aplicar` — e ela conta o **rascunho**, que é o único número que responde "quantos eu já marquei?" enquanto a pessoa ainda está marcando. O texto sai do mesmo resumo do `Select` e do `Combobox`, de propósito.

**Sair pela lateral desiste**, e o `Aplicar` é a única porta que confirma — a mesma divisão do `DateRangePicker`: o toque no fundo escurecido é o gesto de quem se arrependeu, e ele não pode valer como aplicar. Sem `searchable`, pela razão que está na página do `Tree`.
