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

`tone="auto"` pinta de verde ou vermelho conforme suba ou desça do primeiro ao
último ponto. **Use só quando subir for bom.** Em custo, inadimplência ou nota
vencida, subir é ruim, e a peça não tem como saber disso: inverta os números
antes de passar, ou fixe a cor pela prop `color`.

## Acessibilidade

Ela sai escondida do leitor de tela de propósito: um desenho de tendência sem
número não tem o que ler em voz alta, e o número ao lado dela já foi lido.

Passe `label` quando ela for a única informação ali, e ela vira `role="img"` com
o texto que você escrever.
