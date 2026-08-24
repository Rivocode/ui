---
category: Acoes
---

# Button

Acao. Sai como `<button>` nativo, e vira `<a>` com `render={<a href="..." />}`.

**Quando usar cada variante.** `primary` para a acao principal da tela, uma so por
area. `secondary` para a alternativa. `outline` para chamada secundaria de pagina
de marketing. `ghost` para acao discreta em tabela ou cabecalho. `destructive`
para o que apaga, e so para isso.

**Tamanho.** `sm`, `md` e `lg` leem a altura do token de densidade, entao encolhem
sozinhos no modo compacto. `icon` e `iconSm` sao quadrados, para botao sem texto,
que sempre precisa de `aria-label`. `cta` e de marketing: maior, em negrito, com
medida propria.

**Forma.** O padrao do produto e o canto de 8px. `shape="pill"` e assinatura de
marketing, nao de formulario.

`loading` desabilita e anuncia ocupado.
