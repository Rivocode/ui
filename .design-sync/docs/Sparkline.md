---
category: Gráfico
---

# Sparkline

A linha miúda que cabe dentro de um número.

```tsx
<Sparkline data={[12, 15, 14, 19, 22, 28]} className="h-8 w-24" />
```

Sem eixo, sem grade, sem dica. Ela não responde "quanto foi em maio", e sim
"isto vem subindo ou descendo". Um indicador sozinho é um número sem história, e
abrir um gráfico inteiro ao lado de cada indicador enche o painel de moldura.

## Cor

Por padrão sai no acento do tema, que é a leitura neutra de "isto é um número
desta tela".

`trend="auto"` pinta de verde ou vermelho conforme suba ou desça do primeiro ao
último ponto. **Use só quando subir for bom.** Em custo, inadimplência ou nota
vencida, subir é ruim, e a peça não tem como saber disso: inverta os números
antes de passar, ou fixe a cor pela prop `color`. Com menos de dois pontos não
há tendência, e ela sai na cor neutra do acento.

A prop não se chama `tone` de propósito: esse é o nome que o catálogo inteiro
usa para a escala semântica de cor, `success`, `danger`, `warning`, `info`, no
`Badge`, no `Alert`, no `Tracker` e no `Timeline`. Aqui a palavra quereria dizer
outra coisa, e com outros valores.

## Entra esmaecendo, e só

A Sparkline entra, mas curta e discreta: o desenho esmaece em
`--rc-duration-base` (200 ms) quando aparece, e não se desenha traço a traço nem
anda quando os dados mudam. Ela mora em linha de tabela e em fileira de
indicadores, e nesses lugares aparece às dezenas: vinte linhas se desenhando da
esquerda para a direita ao mesmo tempo são uma onda atravessando a tabela, e
vinte linhas trocando de forma no filtro são ruído, e não a mudança. O
esmaecer diz só "chegou", que é o que a miniatura precisa dizer. E ele custa
uma animação de CSS por miniatura, em vez de uma interpolação de JavaScript por
quadro, que em cinquenta linhas se sente no rolar.

A animação mora na própria superfície do SVG, e não na caixa em volta: a
Recharts só pinta depois de medir, e a caixa que viesse do servidor já teria
esmaecido antes de o traço existir. Com "reduzir movimento", ela aparece
parada. O `ChartContainer`, a rosca e o arco se desenham e andam até o valor
novo porque cada um é o assunto do cartão; a miniatura é um detalhe do número
ao lado dela.

## Acessibilidade

Ela sai escondida do leitor de tela de propósito: um desenho de tendência sem
número não tem o que ler em voz alta, e o número ao lado dela já foi lido.

Passe `label` quando ela for a única informação ali, e ela vira `role="img"` com
o texto que você escrever.

`variant="bar"` conta ocorrência por período (emissões por dia, chamados por
semana) em vez de tendência contínua. É a única variante que atravessa para o
`@rivocode/ui-native`: a área pede polígono preenchido, que sem SVG não sai.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Sparkline`, e ela é o que o slot `chart` do `Stat` nativo esperava. Ela é desenhada com `View`, sem SVG, e isso decide o que atravessa: `variant="line"` e `variant="bar"` significam a mesma coisa nos dois mundos, e **`area` não porta**: área quer polígono preenchido, que `View` não faz. Duas outras diferenças, ambas deliberadas: o traço desenha 2px em vez de 1,5 (a 1,5 ele desaparece na tela do telefone sob luz) e a largura vem do pai, com a altura em `height`. **Sem `label` ela é escondida do leitor de tela de propósito**: uma linha sem descrição não diz nada a quem não a vê, e anunciar "imagem" seria pior do que calar. E ela entra **só esmaecendo**, como no web, em `duration-base`: não se desenha nem anda na troca de dados, e com "reduzir movimento" aparece parada.
