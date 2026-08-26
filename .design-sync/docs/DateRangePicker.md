---
category: Formulário
---

# DateRangePicker

Periodo, para filtro de relatório e de listagem.

Aqui não ha digitacao, e essa é a diferença de propósito para o `DatePicker`:
mascara de intervalo pede duas datas num campo só, e o custo de acertar teclado,
colagem e ordem invertida não se paga.

O rodape com Aplicar vem ligado por padrão, porque filtro de periodo quase sempre
recarrega listagem, e sem confirm ele recarregaria duas vezes.

`startMonth`, `endMonth`, `showOutsideDays` e `locale` atravessam para o
calendário, as mesmas quatro do `DatePicker`. Só o `locale` chegava aqui, e por
isso um filtro de período não conseguia limitar a escolha aos exercícios
abertos — que é justamente para o que as duas primeiras existem.

## No React Native

Ainda não portado — dois `DatePicker` até lá — e a validação de fim-antes-do-começo passa a ser sua. É ausência de agora, e não decisão: a [tabela de paridade](/react-native) separa as duas.
