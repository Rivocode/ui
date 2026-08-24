---
category: Sobreposição
---

# PreviewCard

O cartao que aparece ao pousar sobre um link: quem e o cliente, o que é aquela
nota, o resumo do termo.

**Não e `Tooltip`.** A dica explica um botão em poucas palavras e some ao sair;
o cartao mostra conteúdo que da para ler com calma, e por isso ele espera antes
de abrir e demora a fechar, para o ponteiro chegar até ele.

Nada que só exista aqui e alcancavel por toque, então o cartao nunca pode ser o
único caminho para uma informação.

```tsx
<PreviewCard>
  <PreviewCardTrigger render={<a href="/clientes/4813" />}>Clinica Sao Lucas</PreviewCardTrigger>
  <PreviewCardContent>
    <p className="font-medium text-fg">Clinica Sao Lucas</p>
    <p className="text-sm text-fg-muted">12.345.678/0001-99, cliente desde 2023.</p>
  </PreviewCardContent>
</PreviewCard>
```
