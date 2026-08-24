---
category: Gráfico
---

# ChartRadial

O arco de uma medida só: meta batida, uso de cota, taxa de conversão.

```tsx
<ChartRadial value={82} centerLabel="da meta do mês" />
```

## Contra o Meter

Escolha pelo espaço, não pelo gosto. A barra do `Meter` cabe numa linha de
formulário e lê mais rápido. O arco pede um cartão inteiro, e ganha quando o
número **é o assunto** do cartão, não um detalhe dentro dele.

## Não é Progress

O progresso anda para o fim e termina; esta medida sobe e desce enquanto o mês
corre. Por isso ela sai como `role="img"` com rótulo, e não como barra de
carregamento — trocar um pelo outro faz o leitor de tela anunciar "carregando"
para algo que não carrega.

## O eixo escondido

`sweep` é quanto do círculo o arco ocupa. Em `270`, que é o padrão, ele deixa a
base aberta, e é ali que o rótulo de baixo respira. Em `360` fecha.

Por dentro há um `PolarAngleAxis` com `domain={[0, max]}` que não desenha nada.
Ele existe porque a Recharts normaliza pelo maior valor da série, e com um único
ponto isso significa que **qualquer valor daria a volta inteira**.
