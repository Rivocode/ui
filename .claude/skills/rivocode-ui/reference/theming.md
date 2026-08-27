# Vestir com a cor de outro cliente

## Conteúdo

- As três camadas
- Por que escrever meio tema falha em silêncio
- A fonte também é papel de tema
- Os pares que precisam passar no contraste
- No React Native o tema de cliente é build, não runtime
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

São **dezenas de papéis**. Escrever só os óbvios não dá erro: o papel que
faltou cai no valor do tema anterior, e aparece uma cor da RivoCode isolada no
meio da marca do cliente, quase sempre num gráfico ou num estado que ninguém
abriu durante o desenvolvimento.

Escreva o tema inteiro de uma vez, a partir do esqueleto pronto.

## A fonte também é papel de tema

`--rc-font-sans`, `--rc-font-display` e `--rc-font-mono` moram no seletor do
tema, ao lado das cores, e **não** têm valor de `:root` por baixo. Tema que
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

## No React Native o tema de cliente é build, não runtime

O mesmo arquivo CSS veste as duas plataformas, mas o **momento** em que a cor é
decidida muda, e é aqui que se perde um dia.

No celular o compilador do `react-native-css` resolve o token em build e crava o
valor dentro da regra: `.bg-accent` vira `{"backgroundColor":"#d4f34a"}`, e no
CSS compilado não sobra uma ocorrência de `--`. Então
`<RivoProvider theme={{ light, dark }}>` **não troca cor de classe nenhuma**.

Ele trocava só quem lê a cor por JS: `ChartDonut`, `ChartRadial`, o giro do
`Button` e do `Spinner`, o trilho do `Switch`, a `Sparkline`, o texto de dica dos
campos. Fundo, cartão, botão, selo e borda continuavam com a cor da RivoCode, e o
resultado na tela **não era a marca ausente: era a tela misturada**, donut de um
tema e botão de outro.

**O mapa está descontinuado, e agora é inerte.** O provider resolve os 45 papéis
lendo o CSS compilado, uma classe `bg-` por papel, e publica no contexto que as
peças já liam: contexto e classe dizem sempre a mesma cor. Passar `theme={{
light, dark }}` não veste nada, e `RivoNativeThemeMap` está marcado como
descontinuado. A prop `scheme` continua escolhendo claro ou escuro.

O caminho que funciona é sobrescrever os papéis num `@theme` do `global.css` do
app, depois do `@rivocode/ui-native/theme.css`, e pré-compilar de novo com
`npx rivocode-ui-native-css`:

```css
@import "@rivocode/ui-native/theme.css";
@import "tailwindcss/utilities.css";

@theme {
  --color-accent: #2563eb;
  --color-accent-fg: #ffffff;
  --color-bg: light-dark(#f7f8fa, #0d1220);
  /* …e os outros papéis que a marca troca. */
}
```

Isto sozinho veste a tela inteira: a classe pinta a cor nova, e a peça que lê
cor por JS lê a mesma cor do mesmo CSS. Não passe mapa nenhum na prop `theme`.

**E há um teto de arquitetura: dois temas por build.** `light-dark()` tem duas
vagas, uma clara e uma escura. Um cliente por app cabe folgado; uma vitrine de
cinco temas, como a do web, pede cinco bundles.

## Onde está a lista completa

<https://ds.rivocode.com.br/temas.md> traz os cinquenta papéis, o que cada um
veste, o esqueleto pronto para copiar e como aplicar por `data-rc-theme`.

Leia esse arquivo antes de escrever um tema. Não deduza nome de papel: eles são
verificados por uma guarda, e um nome inventado simplesmente não pinta nada.

## Depois de escrever, confira

```bash
npx rivocode-ui check-theme caminho/do/tema.css
```

O comando vem no pacote e roda no projeto que consome. Ele cobra os cinquenta e
cinco papéis obrigatórios, sai com código 1 se faltar algum, e a mensagem diz o
que acontece **na tela** sem cada um. Rode também depois de subir a versão da
biblioteca: papel novo numa versão nova é a quebra que ninguém vê, e foi assim
que `--rc-font-*` pegou quem tinha tema escrito para a 0.6.x.

Depois da completude ele **mede o contraste** — 76 pares por tema, com a mesma
conta e a mesma tabela que a biblioteca cobra de si mesma, e com o alfa composto
sobre o fundo em que ele é desenhado. A ordem importa: papel faltando primeiro,
porque medir o que não existe devolve um número bonito por acidente.

A extensão diz qual forma de tema é: `.css` para a camada 3 do web, e `.ts`,
`.mjs` ou `.js` para o mapa com `light` e `dark` do React Native. No projeto
nativo a mesma tabela está em `@rivocode/ui-native/contrast`, exportando
`checkThemeMap`, `contrastRatio` e `compose` — não porte a conta a mão.
