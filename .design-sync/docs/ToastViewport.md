---
category: Feedback
---

# ToastViewport

A área onde os avisos aparecem. Ela já vem montada dentro do `RivoProvider`,
então na prática o aplicativo nunca a escreve: chama `useToast()` e pronto.

```tsx
const toast = useToast()

toast.add({ title: 'Nota 4816 emitida', description: 'O PDF foi para o e-mail.' })
```

## Onde o aviso aparece

O padrão é `bottom-right`, que é o canto que menos disputa com o conteúdo:
cabeçalho, título e ação principal moram em cima. Para mudar, escolha no
provider, e não com CSS por cima:

```tsx
<RivoProvider toastPosition="top-center">
  <App />
</RivoProvider>
```

Os seis cantos são `top-left`, `top-center`, `top-right`, `bottom-left`,
`bottom-center` e `bottom-right`.

O aviso entra sempre pela borda mais próxima do canto escolhido. Um aviso
ancorado à esquerda que deslizasse da direita atravessaria a tela inteira para
chegar ao lugar, e o olho seguiria o movimento errado até perceber que o texto
já estava lá.

Vale sair do padrão quando o aviso responde a uma ação que acontece longe dali,
ou quando aquele canto já está ocupado por outra coisa fixa, como um botão
flutuante.

## O que ele não é

Aviso é para o que já aconteceu, e o que já aconteceu não precisa de resposta.
Se a pessoa tem de decidir algo, use `AlertDialog`. Se a informação precisa
ficar na tela enquanto ela trabalha, use `Alert`, que mora no fluxo da página e
não some sozinho.

Erro de formulário também não é aviso: ele pertence ao campo que errou, via
`FieldError`, onde a pessoa está olhando e pode corrigir.
