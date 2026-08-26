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

## No React Native

Traduz, e o que **não** atravessa é a dica por quadrado — nem poderia. No web cada ponto monta um `Tooltip`, e um tooltip é um portal: 365 dias seriam 365 portais montados para que no máximo um apareça. E mesmo de graça eles não serviriam, porque dica se abre ao pousar o ponteiro. Trocar cada quadrado por um `Pressable` também não resolve: 90 períodos em 358px dão 4px por quadrado, seis vezes menos que o alvo de toque mínimo.

**No lugar, a faixa inteira vira um alvo só.** O dedo pousa e arrasta sobre ela, uma marca fina acompanha, e o texto do período lido aparece numa linha fixa embaixo — que é onde o rótulo da dica passa a morar. A linha existe desde o primeiro quadro, mostrando o período mais recente: o espaço fica reservado, a tela não pula no primeiro toque, e o mais recente é o que a pergunta "piorou ontem?" quer ler primeiro.

A leitura de tela também muda de forma. A lista escondida com os 365 textos, que no web é barata, aqui seriam 365 paradas de VoiceOver dentro de um cartão; a faixa é uma parada só, do tipo ajustável — o mesmo contrato do `Slider` —, e cada passo anuncia o texto de um período. Nenhum dado fica inalcançável e nenhum vira obstáculo. Por isso o `label` de cada ponto é `string`, e não `ReactNode`: ele vai inteiro para o valor acessível da faixa, e de um `ReactNode` não há como ler o texto de volta.
