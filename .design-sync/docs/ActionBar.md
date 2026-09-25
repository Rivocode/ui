---
category: Ações
---

# ActionBar

A barra das ações **em lote**: aparece quando há itens selecionados, diz
quantos são, oferece o que dá para fazer com todos eles de uma vez e deixa
limpar a seleção. Exportar vinte notas, cancelar três boletos, reenviar os
recibos de uma semana.

```tsx
const [selected, setSelected] = useState<string[]>([])

<DataTable
  data={invoices}
  columns={columns}
  rowKey={(invoice) => invoice.id}
  selectable
  value={selected}
  onValueChange={setSelected}
/>
<ActionBar count={selected.length} onClear={() => setSelected([])}>
  <Button size="sm" variant="secondary">Exportar XML</Button>
  <Button size="sm" variant="destructive">Cancelar notas</Button>
</ActionBar>
```

A barra não guarda estado nenhum. `count` diz quantos estão marcados, e é o
`length` do `value` do `DataTable`; `onClear` é quem zera a seleção. Com o
`DataTable` controlado, o "Limpar seleção" desmarca a tabela na mesma hora,
porque os dois leem o mesmo estado.

## Quando aparece

Acima de zero ela entra, subindo do pé da área; em zero ela sai. A entrada usa
a curva de entrada dos tokens de movimento (`--rc-ease-enter`, na duração
`base`) e a saída usa a de saída (`--rc-ease-exit`, na `fast`), então quem pediu
ao sistema para reduzir movimento vê a barra aparecer e sumir sem deslize.

Enquanto sai, ela continua dizendo o último número (e não "0 selecionados") até
terminar de sumir. Fechada, ela fica inerte: nenhum botão dela recebe foco nem
clique.

## A contagem, dita em voz alta

A frase sai no plural certo e com o número no formato brasileiro: "1
selecionado", "3 selecionados", "1.234 selecionados". Ela é também anunciada
numa região viva educada, que existe antes da primeira seleção (região montada
junto com o texto não é anunciada por leitor de tela nenhum). Quando a seleção
zera, o que se ouve é "Seleção limpa".

`labels.selected` recebe a contagem e devolve a frase, para quem quer dar nome
ao item e acertar o gênero:

```tsx
<ActionBar
  count={selected.length}
  onClear={() => setSelected([])}
  labels={{
    selected: (count) => (count === 1 ? '1 nota selecionada' : `${count} notas selecionadas`),
  }}
>
  <Button size="sm" variant="secondary">Reenviar por e-mail</Button>
</ActionBar>
```

## Onde ela gruda

`position="sticky"`, o padrão, gruda no pé da área que a contém: ponha a barra
logo depois da tabela, dentro do mesmo bloco. Enquanto está aberta ela ocupa
lugar embaixo da tabela, então a paginação nunca fica escondida atrás dela.

`position="fixed"` gruda no pé da janela, acima da área segura do celular, e não
ocupa lugar nenhum. É para listagem que ocupa a tela inteira; numa tela com
mais de uma área, a `sticky` diz melhor de qual lista ela fala.

Como a `fixed` não ocupa lugar, ela pode cobrir o controle que recebe o foco
pelo Tab no pé da tela, e o navegador não rola para tirá-lo de baixo dela.
Reserve a altura da barra na rolagem da página enquanto ela está aberta:

```css
html {
  scroll-padding-bottom: 6rem;
}
```

Com Tailwind é a classe `scroll-pb-24` no `html`. Se a página rola dentro de um
contêiner, a regra vai nele, e não no `html`. Os `6rem` cobrem a barra de uma
linha com a área segura; com ações que quebram em duas linhas no celular, suba
o valor.

Os botões dentro dela quebram o rótulo longo em mais de uma linha em vez de
empurrar a página para o lado, então a barra cabe em 320px, que é a tela de
quem usa zoom de 400%.

Nos dois casos ela empilha em `--rc-z-sticky`: fica acima do conteúdo que rola
e abaixo de menu, diálogo e aviso.

## O foco

Quando a barra sai com o foco dentro dela (depois do "Limpar seleção", ou de
uma ação que zera a seleção), o foco não cai no começo da página: ele volta
para onde estava antes de entrar na barra, que quase sempre é o checkbox da
última linha marcada. Se aquilo sumiu da tela, ele fica na raiz da barra, no
mesmo ponto da leitura. `finalFocus` manda para outro lugar, como o bloco da
tabela. Foco que estava fora da barra não é tocado.

## Partes

`classNames` alcança cada nó pelo nome: `bar` (o painel), `count`, `actions` e
`clear`.

## Quando não usar

- **Ação de uma linha só** mora na própria linha, num `Menu` da coluna de
  ações. A `ActionBar` é para o que se faz com vários de uma vez; com um item só
  ela aparece, mas quem clicou na linha esperava a ação ali.
- **Controles que ficam sempre na tela**, como filtro, busca e exportar tudo,
  são `Toolbar`. A `Toolbar` está lá desde o começo e anda por seta; a
  `ActionBar` só existe enquanto há seleção.
- **Confirmar o que a ação fez** é `Toast`. A barra não diz "3 notas
  canceladas": quem chamou limpa a seleção, a barra sai, e o `Toast` conta o
  resultado.
- **Ação destrutiva em lote** não roda direto do botão da barra: ela abre um
  `AlertDialog` dizendo quantos itens vão embora.

## No React Native

Traduz, com o mesmo `count`, o mesmo `onClear` e a mesma frase no plural certo. As ações entram como filhas, e o texto dos botões é o do `Button` nativo.

**Ela gruda acima da área segura de baixo.** O pacote não depende do `react-native-safe-area-context`, então a altura da barra do sistema entra por `bottomInset`: `bottomInset={useSafeAreaInsets().bottom}`. A barra fica por cima da lista, em `absolute`, e quem a monta deixa o respiro no fim da lista para a última linha não ficar embaixo dela.

**A contagem é anunciada.** A frase sai pelo anúncio do leitor de tela do sistema, e a barra entra subindo e sai descendo com os tokens de movimento, sem deslize quando o sistema pede para reduzir movimento.

As partes vestem pelo mesmo `classNames` do web: `bar`, `count` e `clear`, e o `className` veste o mesmo painel de `bar`. `actions` não existe aqui: as ações são filhas diretas do painel, sem caixa própria.
