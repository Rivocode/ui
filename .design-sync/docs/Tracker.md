---
category: Dados
---

# Tracker

A faixa de quadradinhos por período: as últimas 90 emissões, a disponibilidade
do mês, a fila dos últimos dias.

Ela responde uma pergunta que o número sozinho não responde — "esteve sempre
assim, ou piorou ontem?" — e por isso cabe dentro de um `Stat`, embaixo do
valor.

Cada quadrado carrega o próprio texto. Uma faixa de cor sem texto não existe
para quem usa leitor de tela, e "verde, verde, vermelho" também não diz nada
para quem enxerga: o que importa é qual dia foi o vermelho.

## Quando não usar

Quando a grandeza é contínua e a forma da curva importa, use `Sparkline`: o
tracker conta ocorrências discretas, uma por período, e não desenha tendência.
