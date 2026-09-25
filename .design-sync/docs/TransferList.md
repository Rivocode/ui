---
category: Formulário
---

# TransferList

Duas listas lado a lado: à esquerda o que **está disponível**, à direita o que
**foi escolhido**. A pessoa marca um ou vários itens e os passa de um lado para
o outro. Permissões de um papel, colunas de um relatório, cidades de entrega,
os produtos de uma tabela de preço.

```tsx
const [granted, setGranted] = useState<string[]>([])

<TransferList
  items={[
    { value: 'notas.emitir', label: 'Emitir nota fiscal' },
    { value: 'notas.cancelar', label: 'Cancelar nota fiscal' },
    { value: 'conta.excluir', label: 'Excluir a conta', disabled: true },
  ]}
  value={granted}
  onValueChange={setGranted}
  labels={{ available: 'Permissões', chosen: 'Concedidas' }}
/>
```

A peça é controlada: `value` são os `value` dos escolhidos, e `onValueChange`
recebe a lista nova a cada movimento. O lado da direita aparece **na ordem do
`value`**, e o que entra vai para o fim, na ordem de `items`. O lado da esquerda
é `items` sem os escolhidos, na ordem de `items`.

## Mover

Entre as duas listas ficam quatro botões: mover os marcados para a direita,
mover todos para a direita, e os mesmos dois de volta. Cada um tem nome próprio
("Mover selecionados para Escolhidos") e a dica com o mesmo texto ao pousar o
ponteiro. O botão fica apagado quando não há o que mover.

"Mover todos" move **o que está à mostra**: com uma busca digitada, só o que a
busca deixou na lista. O marcado que a busca escondeu também não é movido pelo
"mover selecionados", para ninguém mover o que não está vendo.

Item com `disabled` não se marca e não se move, nem pelo "mover todos": ele
fica onde está. Serve para a permissão que o papel não pode perder ou ganhar.

Depois de mover, a frase "3 itens movidos para Escolhidos" é dita numa região
viva educada, com o plural certo e o nome da lista de destino. Se o botão
apertado apagou (porque não sobrou nada para mover), o foco passa para a lista
de destino, e não cai no começo da página.

## A contagem e a busca

O cabeçalho de cada lista diz quantos itens ela tem ("10 itens") e, com itens
marcados, quantos estão marcados ("3 de 10 selecionados"). A contagem é a
descrição da lista para o leitor de tela.

A busca no topo de cada lista ignora acento e caixa: "sao" acha "São Paulo" e
"joao" acha "João Pessoa". Sem resultado, a lista diz "Nada encontrado"; vazia,
diz "Nenhum item". `searchable={false}` tira as duas buscas, para listas curtas.

## Teclado

Cada lista é uma parada de Tab e anda pelo padrão de lista com seleção
múltipla:

| Tecla | O que faz |
| --- | --- |
| Seta para cima e para baixo | anda pela lista sem marcar |
| Espaço | marca ou desmarca o item atual |
| Shift + seta | anda e marca o caminho |
| Home e End | vão ao primeiro e ao último; com Shift, marcam o trecho |
| Ctrl + A (⌘ + A) | marca tudo o que está à mostra, ou desmarca se já estava |
| Enter | move os marcados para a outra lista |
| Esc | desmarca tudo |

Na busca, a seta para baixo desce para a lista.

## Textos

`labels` troca os nomes das listas (`available` e `chosen`), as frases de
vazio (`empty` e `noResults`), o texto de espera da busca (`search`), a
contagem (`count`) e o anúncio (`moved`). Os
nomes dos botões e das buscas acompanham os nomes das listas.

## Partes

`classNames` alcança cada nó pelo nome: `panel` (cada lista com a moldura),
`header`, `search`, `list` (a caixa que rola, com 240px de altura), `option`,
`actions` (a coluna dos botões) e `empty`. A altura da lista se troca em
`classNames.list`.

No celular, as duas listas empilham, e as setas dos botões giram para apontar
para cima e para baixo.

## Quando não usar

- **Marcar algumas opções de uma lista curta** é `CheckboxGroup`. A
  `TransferList` vale quando a lista é longa e o que importa é ver, lado a lado,
  o que ficou de fora e o que entrou.
- **Escolher vários de uma lista longa sem precisar ver o que sobrou** é
  `Combobox` com `multiple`: ele ocupa uma linha só e mostra o escolhido em
  fichas.
- **Pôr os escolhidos numa ordem que só a pessoa sabe** é `SortableList`. A
  `TransferList` acrescenta no fim, e não arrasta.
- **Escolher dentro de uma árvore**, como departamentos e equipes, é
  `TreeSelect`.

## No React Native

Traduz, com os mesmos `items`, `value`, `onValueChange`, `searchable`, `disabled` e `labels`, e as mesmas frases de contagem e de anúncio.

**As listas empilham, e cada uma tem os próprios botões.** No telefone não há largura para duas colunas com botões no meio: a lista de cima é a de disponíveis, a de baixo a de escolhidos, e cada uma fecha com “Mover selecionados para …” e “Mover todos para …”. Cada linha é uma caixa de marcar com alvo de 44 pontos, e a lista rola por dentro a partir de 288 pontos. O anúncio sai pelo leitor de tela do sistema.
