---
category: Feedback
---

# Meter

Medida de quanto de uma capacidade esta em uso: espaço, cota, limite.

**Parece o `Progress` e não é.** O progresso anda para o fim e termina; a medida
fica parada mostrando um estado que pode subir e descer. Trocar um pelo outro
faz o leitor de tela anunciar "carregando" para algo que não carrega.

```tsx
<Meter value={72} max={100} label="Espaco de arquivos" showValue />
```

`showValue` mostra o valor ao lado do rótulo, e `format` diz como ele é escrito:
o nome de um formatador da casa — `percent`, `currencyShort`, `compact` — ou uma
função sua. Sem rótulo visível, passe `aria-label`.
