---
category: Tipografia
---

# Heading

O título de uma seção, com o nível e o tamanho separados. `level` decide a
tag, de `h1` a `h6`, e é o que o leitor de tela usa para saltar de seção em
seção; `size` decide o corpo na escala da casa, de `sm` a `3xl`.

```tsx
<Heading level={2}>Notas fiscais</Heading>
<Heading level={2} size="md">Resumo do mês</Heading>
```

A separação existe para a ordem dos títulos não ficar refém do tamanho. Quando
a tag carrega o desenho, quem quer um título menor desce o nível, e a página
passa a pular de `h2` para `h4` sem ter um `h3`. Quem navega por título ouve
um buraco que não está na tela. Aqui o tamanho muda sozinho, e o nível
continua dizendo onde o título mora.

`level` não tem padrão, de propósito: quem sabe o nível é a página, e não a
peça. Sem `size`, o corpo acompanha o nível: `h1` é `2xl`, `h2` é `xl`, `h3`
é `lg`, `h4` é `md`, `h5` é `base` e `h6` é `sm`. A letra é a `font-display`
em peso 600, a mesma do `CardTitle` e do `PageHeader`.

`truncate` corta em uma linha com reticências, para o título que mora numa
coluna estreita. A frase inteira continua no DOM, e o leitor de tela lê tudo.

## Quando não usar

- **Topo de rota:** `PageHeader`. Ele já traz o `h1`, a trilha, a descrição
  e as ações, na mesma hierarquia em todas as páginas; montar isso com
  `Heading` é reescrever o topo a cada rota.
- **Título de cartão, diálogo ou folha:** `CardTitle`, `DialogTitle`,
  `SheetTitle`. Eles ligam o título à região que nomeiam (o `DialogTitle`
  vira o nome acessível do diálogo), e um `Heading` solto ali não liga nada.
- **Texto que só precisa parecer grande:** `Text` com `size="lg"` e
  `weight="semibold"`. Título é para o que abre uma seção; um número de
  destaque ou uma frase de efeito que não abre nada não entra no esboço da
  página.

## No React Native

Traduz, com os mesmos `level`, `size` e `truncate` do web, e o mesmo tamanho para cada nível quando `size` não vem. Sai como `Text` com `accessibilityRole="header"`, na família `display` do provider.

**O nível não é anunciado.** O VoiceOver e o TalkBack dizem “cabeçalho” e param aí: não há `h1` a `h6` no toque. O `level` continua obrigatório mesmo assim, por dois motivos: ele decide o tamanho quando `size` não vem, e a tela porta do web sem reescrever a chamada.
