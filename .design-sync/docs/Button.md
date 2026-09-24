---
category: Ações
---

# Button

Ação. Sai como `<button>` nativo, e vira `<a>` com `render={<a href="..." />}`.

**Quando usar cada variante.** `primary` para a ação principal da tela, uma só por
área. `secondary` para a alternativa. `outline` para chamada secundária de página
de marketing. `ghost` para ação discreta em tabela ou cabeçalho. `destructive`
para o que apaga, e só para isso.

**Tamanho.** `sm`, `md` e `lg` leem a altura do token de densidade, então encolhem
sozinhos no modo compacto. `cta` é de marketing: maior, em negrito, com
medida própria.

**Botão só com ícone é `IconButton`.** Ele exige `label`, que vira o nome
acessível, tem os três tamanhos quadrados lidos do token de controle, troca o
ícone pela espera em `loading` sem alargar e mostra o `label` como dica com
`tooltip`. Os tamanhos `icon` e `iconSm` daqui continuam funcionando, mas não
cobram o nome: quem os usa tem de lembrar do `aria-label` sozinho.

**Forma.** O padrão do produto e o canto de 8px. `shape="pill"` e assinatura de
marketing, não de formulário.

`loading` desabilita e anuncia ocupado.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Button` - contrato controlado; `hitSlop` no `sm`, porque 32px de alvo não se toca sem ajuda. Afunda de leve no toque, e não afunda quando o sistema pede para reduzir movimento. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
