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

A dica é uma só. A faixa inteira é o alvo: o ponteiro corre por ela, uma marca
fina acompanha o período lido e um único painel flutuante anda junto. Antes
cada quadrado montava a própria dica, e um ano de emissões montava 365 delas
para que no máximo uma aparecesse.

O teclado chega ao mesmo período. A faixa é uma parada de tabulação — uma só,
e não uma por quadrado: ao receber foco ela abre no período mais recente, as
setas caminham pelos períodos, `Home` e `End` vão às pontas e `Esc` fecha o
painel sem tirar o foco dali. O período lido pelo teclado é dito também numa
região viva, porque desenho não chega a quem ouve; o ponteiro fica calado ali,
para não encher a fila do leitor de tela com cada quadrado varrido.

## Quando não usar

Quando a grandeza é contínua e a forma da curva importa, use `Sparkline`: o
tracker conta ocorrências discretas, uma por período, e não desenha tendência.

## No React Native

Traduz, e os dois lados chegaram ao mesmo desenho: **a faixa inteira é um alvo só**. O nativo chegou primeiro por necessidade, e o web o seguiu — lá cada ponto montava um `Tooltip`, e tooltip é portal: 365 dias eram 365 portais montados para que no máximo um aparecesse. Aqui nem essa saída existia, porque dica se abre ao pousar o ponteiro, e trocar cada quadrado por um `Pressable` também não resolveria: 90 períodos em 358px dão 4px por quadrado, seis vezes menos que o alvo de toque mínimo.

**O que não atravessa é o balão.** No web a leitura sai num `Tooltip` único que segue ponteiro e teclado; aqui ela mora numa linha fixa embaixo da faixa. O dedo pousa e arrasta, uma marca fina acompanha, e o período lido aparece nessa linha, que existe desde o primeiro quadro, mostrando o período mais recente: o espaço fica reservado, a tela não pula no primeiro toque, e o mais recente é o que a pergunta "piorou ontem?" quer ler primeiro.

A leitura de tela também muda de forma. A lista escondida com os 365 textos, que no web é barata, aqui seriam 365 paradas de VoiceOver dentro de um cartão; a faixa é uma parada só, do tipo ajustável — o mesmo contrato do `Slider` —, e cada passo anuncia o texto de um período. Nenhum dado fica inalcançável e nenhum vira obstáculo. Por isso o `label` de cada ponto é `string`, e não `ReactNode`: ele vai inteiro para o valor acessível da faixa, e de um `ReactNode` não há como ler o texto de volta.
