---
category: Ações
---

# Button

Ação. Sai como `<button>` nativo, e vira `<a>` com `render={<a href="..." />}`.

**Quando usar cada variante.** `primary` para a ação principal da tela, uma só por
área. `secondary` para a alternativa. `outline` para chamada secundária de página
de marketing. `ghost` para ação discreta em tabela ou cabeçalho. `danger`
para o que apaga, e só para isso.

**Tamanho.** `sm`, `md` e `lg` leem a altura do token de densidade, então encolhem
sozinhos no modo compacto. `cta` é de marketing: maior, em negrito, com
medida própria.

**Botão só com ícone é `IconButton`.** Ele exige `label`, que vira o nome
acessível, tem os três tamanhos quadrados lidos do token de controle, troca o
ícone pela espera em `loading` sem alargar e mostra o `label` como dica com
`tooltip`. O `Button` não tem tamanho de ícone: o quadrado só existe no
`IconButton`, e é ele que cobra o nome.

**Forma.** O padrão do produto e o canto de 8px. `shape="pill"` e assinatura de
marketing, não de formulário.

`loading` desabilita e anuncia ocupado.

**Desabilitado.** `disabled` pinta o fundo de `surface-raised`, o rótulo de
`fg-disabled` e o contorno de `border-disabled`, em toda variante que tem
contorno ou preenchimento: `primary`, `secondary`, `outline` e `danger`.
Sem o contorno, o botão desabilitado sobre superfície branca virava rótulo
solto, porque no tema claro `surface-raised` e `surface` são o mesmo branco. O
contorno de inativo é mais fraco que o vivo (o `check:contrast` cobra que o
vivo pese 1,4 vez mais), então ele não parece clicável. `primary` e
`danger` já nascem com borda transparente de 1px, para o tamanho não
pular ao desabilitar. `ghost` continua sem contorno: vivo, ele nunca teve.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Button` - contrato controlado; `hitSlop` no `sm`, porque 32px de alvo não se toca sem ajuda. Afunda de leve no toque, e não afunda quando o sistema pede para reduzir movimento. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
