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

## O gancho

`useToast()` devolve quatro funções, e nenhuma delas precisa de estado seu:

| Função | O que faz |
|---|---|
| `add(options)` | Cria o aviso e devolve o `id` dele |
| `update(id, options)` | Reescreve um aviso que ainda está na tela |
| `close(id)` | Tira o aviso antes da hora |
| `promise(promessa, estados)` | Um aviso só para as três fases de uma espera |

O `options` do `add` tem `title`, `description`, `type` e `timeout`. O `type`
escolhe o tom no mesmo vocabulário do `Alert`, `info`, `success`, `warning` e
`danger`; sem ele o aviso sai neutro, que é o padrão e o que serve para a maior
parte das confirmações. `timeout: 0` deixa o aviso na tela até alguém fechar.

```tsx
toast.promise(emitirNota(), {
  loading: { title: 'Emitindo a nota…' },
  success: (numero) => ({ title: `Nota ${numero} emitida` }),
  error: { title: 'A emissão falhou' },
})
```

O `promise` existe para a espera não virar três avisos empilhados. É um aviso
só, que troca de texto e de tom conforme a promessa resolve; a alternativa,
`add` na saída e outro `add` na volta, deixa o "enviando" na tela ao lado do
"enviado".

O objeto que o gancho devolve tem identidade estável entre renderizações, então
ele pode entrar na lista de dependências de um efeito sem laço. O gerenciador
da Base UI por baixo não tem essa garantia, e absorver isso é trabalho da
biblioteca, não de quem a usa.

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
`bottom-center` e `bottom-right`; o tipo `ToastPosition` é essa união, para
quando o canto vem de uma configuração e não de uma constante.

O aviso entra sempre pela borda mais próxima do canto escolhido. Um aviso
ancorado à esquerda que deslizasse da direita atravessaria a tela inteira para
chegar ao lugar, e o olho seguiria o movimento errado até perceber que o texto
já estava lá.

Vale sair do padrão quando o aviso responde a uma ação que acontece longe dali,
ou quando aquele canto já está ocupado por outra coisa fixa, como um botão
flutuante.

## Quando não usar

Aviso é para o que já aconteceu, e o que já aconteceu não precisa de resposta.
Se a pessoa tem de decidir algo, use `AlertDialog`. Se a informação precisa
ficar na tela enquanto ela trabalha, use `Alert`, que mora no fluxo da página e
não some sozinho.

Erro de formulário também não é aviso: ele pertence ao campo que errou, via
`FieldError`, onde a pessoa está olhando e pode corrigir.
