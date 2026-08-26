# Vestir com a cor de outro cliente

## Conteúdo

- As três camadas
- Por que escrever meio tema falha em silêncio
- A fonte também é papel de tema
- Os pares que precisam passar no contraste
- Onde está a lista completa

## As três camadas

1. **Paleta** (`--rc-p-*`): as cores cruas, sem papel. Só o tema fala com ela.
2. **Contrato** (`@theme inline`, `--color-*`): o que vira classe do Tailwind.
   Não se mexe aqui para trocar de marca.
3. **Tema** (`[data-rc-theme]`, `--rc-*`): quem liga papel a cor. **É a única
   camada que um cliente novo escreve.**

Componente nenhum conhece a cor da marca: ele pede um papel e o tema responde.
É isso que deixa a mesma peça servir dois clientes.

## Por que escrever meio tema falha em silêncio

São **cinquenta papéis**. Escrever só os dez óbvios não dá erro: o papel que
faltou cai no valor do tema anterior, e aparece uma cor da RivoCode isolada no
meio da marca do cliente, quase sempre num gráfico ou num estado que ninguém
abriu durante o desenvolvimento.

Escreva o tema inteiro de uma vez, a partir do esqueleto pronto.

## A fonte também é papel de tema

`--rc-font-sans`, `--rc-font-display` e `--rc-font-mono` moram no seletor do
tema, ao lado das cores — e **não** têm valor de `:root` por baixo. Tema que
esquece as três fica sem família nenhuma, exatamente como um tema que esquece
`--rc-bg` fica sem fundo. Declare-as sempre.

As faces da RivoCode saem num arquivo separado, `@rivocode/ui/fonts.css`. Um
tema de cliente **não** importa esse arquivo: importa a família do cliente e
aponta os três tokens para ela.

```css
@import "@rivocode/ui/styles.css";
@import "@fontsource-variable/inter";

[data-rc-theme="cliente-acme"] {
  --rc-font-sans: "Inter Variable", system-ui, sans-serif;
  --rc-font-display: "Inter Variable", system-ui, sans-serif;
  --rc-font-mono: ui-monospace, SFMono-Regular, monospace;

  /* …e os cinquenta papéis de cor. */
}
```

Dois clientes com fontes diferentes convivem na mesma aplicação por esse
mecanismo: a família troca por `data-rc-theme`, como a cor.

## Os pares que precisam passar no contraste

O repositório da biblioteca tem uma guarda que falha se um par que carrega texto
ficar abaixo da norma. Ao escrever um tema, garanta pelo menos:

| Par | Mínimo |
|---|---|
| `--rc-fg` sobre `--rc-bg` e sobre `--rc-surface` | 7:1 |
| `--rc-fg-muted` e `--rc-fg-subtle` sobre os dois fundos | 4.5:1 |
| `--rc-accent-fg` sobre `--rc-accent` | 4.5:1 |
| `--rc-*-fg` sobre o `--rc-*` da mesma família | 4.5:1 |
| `--rc-*-text` sobre `--rc-bg` e `--rc-surface` | 4.5:1 |

Lembre da regra do `design.md`: a cor que preenche e a cor que se escreve nunca
são a mesma. Um tema que aponta `--rc-accent-text` para o mesmo valor de
`--rc-accent` produz texto invisível sobre o próprio acento.

## Onde está a lista completa

<https://ds.rivocode.com.br/temas.md> traz os cinquenta papéis, o que cada um
veste, o esqueleto pronto para copiar e como aplicar por `data-rc-theme`.

Leia esse arquivo antes de escrever um tema. Não deduza nome de papel: eles são
verificados por uma guarda, e um nome inventado simplesmente não pinta nada.
