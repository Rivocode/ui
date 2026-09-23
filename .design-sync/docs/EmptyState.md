---
category: Feedback
---

# EmptyState

Estado vazio, com saída.

`title` e `description` são obrigatórias, e `action` é fortemente recomendada.
Uma tela que só diz "nenhum resultado" empurra para a pessoa o trabalho de
adivinhar o que fazer.

Distinga os dois vazios: primeiro uso ("emita a primeira nota") pede ação de
criação; busca sem resultado ("nada para esse filtro") pede ação de limpar
filtro.

`title` e `description` aceitam nó, e não só texto (como no `PageHeader` e no
`Timeline`). Um número já formatado ou um `<strong>` no meio da frase cabem:
"Nenhuma nota em **março**".

O `empty` do `DataTable` e o do `ChartContainer` são este mesmo objeto:
`title`, `description`, `action` e `icon`.

## Ícone ou ilustração

São dois espaços, e cada um tem o seu vazio.

**`icon` é o vazio que acontece no meio do trabalho**: filtro ou busca sem
resultado, lista que a pessoa esvaziou, período sem movimento. A tela já é
conhecida, e o desenho só marca o lugar. Ele sai em 32px, forçados em todo SVG,
em `fg-subtle`.

```tsx
<EmptyState
  icon={<Search />}
  title="Nada encontrado para esse filtro"
  description="Tente ampliar o período ou limpar o filtro de status."
  action={<Button size="sm" variant="secondary">Limpar filtros</Button>}
/>
```

**`illustration` é o vazio de primeira vez**: a tela inicial que ainda não tem
nada, o passo de onboarding, o módulo que a pessoa acabou de ligar. Ali o vazio
é a primeira impressão do produto, e um desenho maior explica o que vai morar
naquele lugar. Nada é forçado: o tamanho é de quem desenha. Quando vem, toma o
lugar do `icon`.

```tsx
<EmptyState
  illustration={
    <svg viewBox="0 0 120 80" className="h-20 w-auto">
      <rect x="20" y="10" width="80" height="60" rx="8" className="fill-accent-subtle" />
      <path d="M36 32h48M36 44h32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  }
  title="Nenhuma nota por aqui"
  description="Quando você emitir a primeira, ela aparece nesta lista."
  action={<Button size="sm">Emitir nota</Button>}
/>
```

**A ilustração pinta com `currentColor` ou com classe de token, e nunca com cor
literal.** O sistema veste vários clientes pelo tema, e um desenho com a cor escrita em
hexadecimal fica igual na tela de todos eles, e pode sumir no tema escuro.
O invólucro já vem em `text-fg-subtle`, então `currentColor` acompanha o tema
sozinho; para o segundo tom, use `fill-accent-subtle`, `fill-surface-raised` e
os outros papéis do contrato. Um `<img>` de arquivo externo não acompanha tema
nenhum: prefira o SVG em linha.

Não há kit de ilustrações na biblioteca, de propósito: cada cliente tem a sua
voz, e o espaço reservado é o que a biblioteca garante.

Os dois saem `aria-hidden`: o título e a descrição já dizem o que o desenho
mostra. Se ele disser algo que o texto não diz, o que falta é texto.

## No React Native

Traduz, com `description` obrigatória pelo mesmo motivo do web, e com os dois espaços de desenho: `icon` e `illustration`, os dois escondidos do leitor de tela.

**No React Native a cor não desce da `View` para o SVG**, então o `icon` aceita também uma função, que recebe o `fg-subtle` do tema que pinta agora e os mesmos 32 do web:

```tsx
<EmptyState
  icon={({ color, size }) => <Search color={color} size={size} />}
  title="Nada encontrado para esse filtro"
  description="Tente ampliar o período ou limpar o filtro de status."
/>
```

A `illustration` não força nada, como no web: o tamanho é de quem desenha, e a cor vem dos papéis de `useRivo().colors`, nunca de cor literal. `title` e `description` são `string`, porque moram dentro de um `Text`.
