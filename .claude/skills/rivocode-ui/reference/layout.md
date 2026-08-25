# Layout com o @rivocode/ui

## Conteúdo

- Os quatro esqueletos de página
- O ritmo do espaçamento
- Grid ou flex, e a armadilha do `min-w-0`
- Largura de leitura e alinhamento
- Densidade, e o que ela move
- Estreito primeiro
- Erros de layout que aparecem sempre

## Os quatro esqueletos de página

Quase toda tela de produto é uma destas quatro. Comece pela que se parece com o
pedido e ajuste, em vez de montar do zero.

### 1. Operação: barra lateral e área de trabalho

O padrão de sistema interno. A barra guarda a navegação, o `SidebarInset`
recebe a página.

```tsx
<SidebarProvider defaultOpen>
  <Sidebar>
    <SidebarHeader><SidebarBrand mark={<Waves size={18} />}>RivoCode</SidebarBrand></SidebarHeader>
    <SidebarContent>
      <SidebarGroup label="Operação">
        <SidebarMenu>{/* itens */}</SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>

  <SidebarInset>
    <header className="sticky top-0 z-[var(--rc-z-sticky)] flex items-center gap-3 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-md">
      <SidebarTrigger />
      <Breadcrumb items={trilha} className="min-w-0" />
      <div className="ml-auto flex items-center gap-2">{/* ações */}</div>
    </header>

    <div className="p-4 sm:p-6">{/* a tela */}</div>
  </SidebarInset>
</SidebarProvider>
```

O `ml-auto` no bloco de ações é o que separa navegação de ação sem precisar de
`justify-between`, que brigaria com o `gap`.

### 2. Listagem: filtros, tabela, paginação

```tsx
<div className="space-y-4">
  <Card>
    <CardContent className="flex flex-wrap items-center gap-3 py-4">
      {/* busca com flex-1, filtros com largura própria */}
    </CardContent>
  </Card>

  <DataTable {...} />

  <div className="flex justify-center">
    <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
  </div>
</div>
```

`flex-wrap` na barra de filtros, sempre. Sem ela, o quinto filtro empurra a
busca para fora da tela em vez de descer uma linha.

### 3. Formulário longo: régua de passos e um cartão

```tsx
<div className="mx-auto max-w-3xl space-y-6">
  <Steps steps={STEPS} current={wizard.step} onStepClick={wizard.goTo} />
  <Card>
    <CardContent className="py-6">
      <div className="grid gap-4 sm:grid-cols-2">{/* campos */}</div>
      <WizardFooter>{/* voltar e continuar */}</WizardFooter>
    </CardContent>
  </Card>
</div>
```

`max-w-3xl` e não a largura toda: formulário esticado numa tela de 1440 vira
campo de 1200px de largura para digitar um CNPJ.

### 4. Painel: indicadores em cima, gráficos embaixo

```tsx
<div className="space-y-4">
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
    {/* quatro indicadores */}
  </div>
  <div className="grid gap-4 xl:grid-cols-3 [&>*]:min-w-0">
    <Card className="xl:col-span-2">{/* o gráfico principal */}</Card>
    <Card>{/* a rosca ou a lista */}</Card>
  </div>
</div>
```

Indicador vem antes do gráfico porque responde em um segundo; o gráfico pede
dez.

## O ritmo do espaçamento

Use poucos valores, sempre os mesmos. A escala do Tailwind é fina demais para
decidir a cada componente, então trate assim:

| Distância | Onde |
|---|---|
| `gap-2` | dentro de um controle: ícone e texto, botões irmãos |
| `gap-3` | itens de uma mesma barra: filtros, ações do cabeçalho |
| `gap-4` | entre cartões, entre colunas de um grid |
| `space-y-4` | entre blocos de uma tela |
| `space-y-6` | entre seções que mudam de assunto |
| `p-4 sm:p-6` | respiro da página |

Dentro de `Card`, use `CardContent` em vez de inventar `padding`: ele já traz o
`--rc-pad-panel`, que a densidade move junto.

**Uma distância só entre irmãos.** Se um bloco precisa de mais ar que o vizinho,
o problema quase sempre é falta de hierarquia, não falta de pixel.

## Grid ou flex, e a armadilha do `min-w-0`

- **Grid** quando as colunas são a estrutura: painel, formulário de duas
  colunas, listagem com barra lateral de filtro.
- **Flex** quando os itens são uma fila que pode quebrar: ações, filtros,
  etiquetas.

A armadilha vale para os dois: **item de grid e item de flex têm
`min-width: auto`**, ou seja, nunca encolhem abaixo do próprio `min-content`.
Uma tabela larga dentro de uma coluna estica a coluna inteira, e o vizinho vai
junto para fora da tela.

```tsx
// A tabela volta a rolar dentro da própria caixa.
<div className="grid gap-4 lg:grid-cols-[16rem_1fr] [&>*]:min-w-0">
```

O mesmo vale para texto que promete cortar: `truncate` sem `min-w-0` não corta
nada, ele empurra.

```tsx
<span className="min-w-0 flex-1 truncate">{nome}</span>
```

Quando o conteúdo é largo por natureza, deixe **ele** rolar, e não a página:
`overflow-x-auto` na caixa dele. A `Table` já faz isso sozinha.

Cuidado com um efeito do CSS: num elemento com `overflow-y-auto`, o eixo X
deixa de ser `visible` e vira `auto` também. Uma área de página que rola
verticalmente rola de lado sem ninguém pedir, e o vazamento não aparece no
`scrollWidth` do documento.

## Largura de leitura e alinhamento

- Texto corrido: `max-w-prose`. Linha de 200 caracteres não se lê.
- Formulário: `max-w-3xl` centralizado com `mx-auto`.
- Painel e listagem: largura toda, porque a informação é a densidade.
- Número em tabela: `text-right` e `font-mono`. Alinhados à direita e com dígito
  de largura fixa, os valores se comparam na vertical sem esforço.
- Rótulo acima do campo, nunca ao lado: no celular não cabe ao lado, e uma tela
  que muda de arranjo entre larguras custa mais do que ganha.

## Densidade, e o que ela move

`density="compact"` encolhe altura de controle, `--rc-item-y` e o respiro dos
painéis. Ela **não** mexe no seu `gap` nem no seu `padding`.

Por isso: altura de controle sempre por token.

```tsx
<div className="h-[var(--rc-control-md)]" />   // acompanha a densidade
<div className="h-10" />                        // não acompanha
```

Compacta é para tela de operação, onde caber mais linha vale mais do que o
respiro. Não use em cadastro nem em formulário longo.

## Estreito primeiro

Escreva a versão de celular e acrescente `sm:` e `lg:` por cima. O contrário
gera layout que "desmonta" ao encolher, porque o caso estreito nunca foi
pensado.

Cortes que a biblioteca já usa, e que vale acompanhar:

| Corte | O que muda |
|---|---|
| `sm` (640px) | a folha encosta embaixo, a barra lateral vira folha, o calendário mostra um mês |
| `lg` (1024px) | a segunda coluna aparece |
| `xl` (1280px) | o painel abre para três ou quatro colunas |

Quando a decisão não couber em classe, leia o mesmo corte que os componentes
leem, com `useMobile()`, em vez de escrever `640` de novo.

## Erros de layout que aparecem sempre

- Item de grid ou de flex sem `min-w-0`, com conteúdo largo dentro.
- `truncate` sem `min-w-0`: promete cortar e empurra.
- Barra de filtros sem `flex-wrap`.
- Altura cravada em controle, quebrando a densidade compacta.
- Gráfico sem altura: `ChartContainer` sem `h-*` some.
- `justify-between` numa fila que tem `gap`: use `ml-auto` no que deve ir para
  a ponta.
- Página inteira com `overflow-hidden` para "resolver" vazamento lateral. Isso
  esconde o sintoma e corta menu e dica junto.
- Espaço vertical resolvido com `<br>` ou `mt-*` solto em vez de `space-y-*` no
  contêiner.
