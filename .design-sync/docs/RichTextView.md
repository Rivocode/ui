---
category: Tipografia
---

# RichTextView

Exibe o que o `RichTextEditor` salvou, com a mesma tipografia do editor:
título no tamanho do `Heading`, código no desenho do `Code`, link no do
`Link`. Vive em `@rivocode/ui/editor`, e **não usa o Tiptap**: a página que só
lê não carrega editor nenhum.

```tsx
import { RichTextView } from '@rivocode/ui/editor'

<RichTextView value={nota.descricao} empty="Sem descrição." />
```

## Por que é seguro exibir

A peça não usa `innerHTML`. Ela lê o HTML com um leitor próprio, fica só com
os blocos e as marcas que o editor escreve (parágrafo, `h2`, `h3`, listas,
citação, bloco de código, linha, quebra, negrito, itálico, sublinhado,
tachado, código e link) e monta cada um como elemento React. O resto não tem
por onde entrar:

- `script`, `style`, `iframe`, `img`, `svg` e controle de formulário somem com
  o conteúdo.
- Atributo nenhum atravessa: nem `style`, nem `class`, nem `onclick`.
- Link só sai com `http`, `https`, `mailto`, `tel` ou endereço relativo, e
  sempre com `rel="noopener noreferrer nofollow"`. `javascript:` perde o
  endereço e fica só o texto.
- Tag desconhecida (`span`, `div`, `font`) sai do caminho e deixa o texto.

Por isso não há sanitizador a instalar. O cuidado que continua sendo seu é o
de qualquer HTML vindo do navegador: se ele for exibido por **outro** caminho
(e-mail, PDF, `dangerouslySetInnerHTML`), sanitize no servidor. A página do
`RichTextEditor` diz como.

## HTML ou JSON

`value` aceita o HTML do `onValueChange` ou o JSON do `onJsonChange`, e os
dois desenham a mesma coisa.

```tsx
<RichTextView value={nota.descricaoJson} />
```

A peça roda no servidor: o leitor não depende de DOM, então a página
renderizada no servidor já sai com o texto formatado no primeiro desenho.

## Vazio

`null`, string vazia e o `<p></p>` de um editor em branco não desenham nada.
Com `empty`, a peça desenha a frase no lugar, e marca a raiz com
`data-empty`:

```tsx
<RichTextView value={nota.descricao} empty={<Text tone="muted">Sem descrição.</Text>} />
```

## Largura

O texto ocupa a largura que recebe. Para leitura corrida, limite pela classe:
`className="max-w-prose"`.

Bloco de código não quebra linha: o que passa da largura rola de lado dentro
do próprio bloco. Quando rola, o bloco vira parada de Tab com o nome "Bloco de
código", para quem usa teclado alcançar o fim da linha com as setas.

## Quando não usar

- **Texto sem formatação** é `Text`. Uma observação salva de um `Textarea` não
  tem marca nenhuma para desenhar, e passar texto puro aqui transformaria
  quebra de linha em espaço.
- **Editar** é `RichTextEditor`, que já mostra o conteúdo formatado enquanto
  carrega.
- **Código, log ou retorno de API** é `CodeBlock`, que numera linha e copia.

## No React Native

Traduz, no índice principal `@rivocode/ui-native`, com os mesmos `value` e `empty`. Lê o HTML do `onValueChange` e o JSON do `onJsonChange` do `RichTextEditor` pelo **mesmo leitor do web**, que é código puro compartilhado entre os dois pacotes: não há `WebView`, não há peer, e nada do conteúdo executa.

Cada bloco vira `View` e cada marca vira `Text` aninhado: o título é o `Heading` (e se anuncia como cabeçalho), a lista numerada começa do `start` salvo, a citação sai no tom apagado com a borda à esquerda, o bloco de código em fonte mono e selecionável, e o link é o `Link`, que abre pelo `Linking` e só com `http`, `https`, `mailto`, `tel` ou endereço relativo.

**Não mora num subcaminho.** No web ele sai de `@rivocode/ui/editor` porque divide o caminho com o editor; no celular não há editor, então não há peer a separar, e a peça vive junto do `Text`.
