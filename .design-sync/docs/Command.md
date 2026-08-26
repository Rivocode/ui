---
category: Navegação
---

# Command

A paleta de comandos: um campo, uma lista e o teclado.

Ela existe para quem trabalha o dia inteiro na mesma tela e já sabe para onde
quer ir. Navegar por menu custa três cliques e a memória de onde a opção mora;
aqui custa o nome da coisa.

```tsx
<Command
  open={aberta}
  onOpenChange={setAberta}
  groups={[
    { label: 'Ir para', items: [{ id: 'notas', label: 'Notas fiscais', onSelect: irParaNotas }] },
  ]}
/>
```

## A busca

Ignora acento e caixa, e lê também as `keywords` do item. "nf", "fatura" e
"boleto" levando a Notas fiscais é o que separa uma paleta útil de uma que só
acha quem já sabe o nome exato, que é justamente quem menos precisa dela.

Cada abertura começa limpa. Paleta que guarda a busca da vez passada abre
mostrando o resultado de outra pergunta.

Buscar e não achar nada também precisa ser dito. A contagem de resultados e a
mensagem de vazio saem numa região `role="status"` fora da lista: sem ela,
digitar uma busca sem resultado produz silêncio, com o foco parado no campo e
nenhuma pista de que a lista esvaziou. O `title` é o nome do campo e o da
lista, e é ele que o leitor de tela anuncia ao abrir — o `placeholder` some ao
digitar e não serve de rótulo.

## O atalho

`Ctrl+K`, ou `Cmd+K` no Mac, registrado por ela mesma. Passe `shortcut={null}`
para registrar na sua aplicação, ou outra letra para trocar.

## A lista é dado, não filho

Os itens vêm por `groups`, e não como componentes aninhados. A filtragem, a
ordem em que a seta anda e o `aria-activedescendant` moram todos num lugar só; a
forma composta obrigaria a peça a adivinhar o texto de cada filho para poder
filtrar por ele.

## Quando não usar

Menos de dez destinos não justificam. Com essa quantidade a barra lateral mostra
tudo de uma vez, e a paleta vira um passo a mais para chegar no mesmo lugar.

## No React Native

Não porta. A paleta de comandos é um gesto de mesa — abre por atalho, anda por seta, confirma por Enter — e nenhuma das três coisas existe no toque. No celular a porta equivalente é a tela de busca do router, com o campo no topo e o resultado levando direto para a tela.
