Nenhum componente da biblioteca conhece a cor da marca. Ele pede um papel, "a
cor de acento", "a superfície levantada", e o tema responde. É isso que permite
a mesma peça servir a RivoCode num projeto e a um cliente no seguinte, sem tocar
em componente.

## As três camadas

```
Camada 1  paleta      --rc-p-lima-500: oklch(...)     a cor crua, sem opinião
Camada 2  contrato    --color-accent: var(--rc-accent)  vira bg-accent no Tailwind
Camada 3  tema        --rc-accent: var(--rc-p-lima-500) quem faz o papel, aqui
```

A **paleta** é um dicionário de cores. A **camada de contrato** liga cada papel
ao vocabulário do Tailwind: todo nome ali vira utilitário, então `--color-surface`
produz `bg-surface`, `text-surface` e `border-surface`, dentro da biblioteca e
no layout que você escreve. O **tema** é a única camada que decide qual cor faz
qual papel.

Trocar de cliente é reescrever a camada 3. Nada mais.

## Os dois temas prontos

```tsx
<RivoProvider theme="rivocode-dark">   {/* padrão */}
<RivoProvider theme="rivocode-light">
<RivoProvider theme="system">          {/* segue o sistema operacional */}
```

Com `system`, o Provider lê `prefers-color-scheme` e acompanha a troca enquanto
a página está aberta, não é só a leitura inicial.

## Preenchimento e texto são tokens diferentes

Esta é a distinção que mais economiza tempo depois:

```tsx
<div className="bg-danger text-danger-fg">Botão vermelho, texto por cima</div>
<p className="text-danger-text">Mensagem de erro sobre o fundo da página</p>
```

`bg-danger` é o vermelho que **preenche** e recebe `text-danger-fg` em cima.
`text-danger-text` é o vermelho que **se lê** sobre o fundo. Nenhuma cor serve
bem para as duas coisas: a que tem contraste como texto não aguenta texto branco
por cima, e a que aguenta é clara demais para ler. Vale igual para o acento,
para `success`, `warning` e `info`.

## Um tema de cliente, do começo ao fim

Digamos que o cliente é azul.

**1. Declare os papéis num seletor de tema.** Só os papéis; a paleta pode ser
sua ou a nossa:

```css
/* tema-acme.css */
[data-rc-theme="acme"] {
  --rc-bg: oklch(21% 0.02 250);
  --rc-surface: oklch(26% 0.02 250);
  --rc-surface-raised: oklch(31% 0.02 250);

  --rc-fg: oklch(97% 0.01 250);
  --rc-fg-muted: oklch(82% 0.01 250);
  --rc-fg-subtle: oklch(64% 0.01 250);

  --rc-accent: oklch(62% 0.19 250);
  --rc-accent-fg: oklch(99% 0 0);        /* o que se lê sobre o acento */
  --rc-accent-text: oklch(74% 0.16 250); /* o acento que se lê sobre o fundo */
  --rc-accent-subtle: oklch(62% 0.19 250 / 0.14);

  --rc-border: oklch(100% 0 0 / 0.1);
  --rc-ring: oklch(62% 0.19 250);

  /* …e os demais papéis: success, warning, danger, info, selected, skeleton */
}
```

**2. Importe depois do preset**, para a sua camada 3 vencer:

```css
@import "tailwindcss";
@import "@rivocode/ui/preset";
@import "./tema-acme.css";

@source '../node_modules/@rivocode/ui/dist';
```

**3. Vista a árvore:**

```tsx
<RivoProvider theme="acme">
```

Se o seu tema esquecer um papel, o componente que o usa cai no valor do tema
anterior, o que costuma aparecer como uma cor da RivoCode isolada no meio do
azul. Rode a guarda de contraste antes de acreditar no resultado.

## As duas guardas

O repositório tem duas travas que rodam em `bun run check`, e existem porque as
duas falhas são silenciosas:

**Cor literal.** Nenhum componente pode escrever `#d4f34a`, `bg-lime-400` ou
`rgb(...)` direto. Se pudesse, o tema do cliente não alcançaria aquela peça, e o
erro só apareceria na tela dele.

**Contraste.** Quarenta pares medidos, texto contra o fundo em que ele de fato
aparece, nos dois temas. Um tema novo deve passar pela mesma medida, é a
diferença entre "parece bom no meu monitor" e "dá para ler".

## Gráfico pede série própria

O subcaminho `/chart` usa oito tokens de série, `--rc-chart-1` a `--rc-chart-8`,
com guarda própria de 3:1 contra a superfície. **Tema de cliente que não os
declara desenha gráfico sem cor de série.** Eles são papéis como os outros:

```css
[data-rc-theme="acme"] {
  --rc-chart-1: oklch(62% 0.19 250);
  --rc-chart-2: oklch(70% 0.15 190);
  /* … até 8 */
}
```

Um detalhe de bastidor que vale saber: no CSS use sempre `var(--rc-chart-1)`, e
não a classe `bg-chart-1`. Essa classe não existe na folha compilada, porque o
Tailwind só gera o que encontra ao varrer, e o resultado seria uma cor que
nunca resolve, em silêncio.
