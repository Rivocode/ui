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
sozinhos no modo compacto. `icon` e `iconSm` sao quadrados, para botão sem texto,
que sempre precisa de `aria-label`. `cta` e de marketing: maior, em negrito, com
medida própria.

**Forma.** O padrão do produto e o canto de 8px. `shape="pill"` e assinatura de
marketing, não de formulário.

`loading` desabilita e anuncia ocupado.
