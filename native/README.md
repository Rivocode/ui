# Tokens para o @rivocode/ui-native

Fase 0 da proposta em
`docs/superpowers/specs/2026-08-25-rivocode-ui-native-proposta.md`.

A fonte única dos tokens continua sendo o CSS em `src/tokens/` — é lá que os
guards de contraste e de documentação mordem. Estes arquivos são **derivados**:

- `tokens.json` — paleta crua, escalas em número (sem `px`/`ms`), densidades
  separadas, fontes por nome e os dois temas com toda cor resolvida (`var()`
  não existe no React Native).
- `tokens.ts` — o mesmo, tipado, pronto para o provider nativo e para gerar o
  preset do NativeWind com o mesmo vocabulário do web (`bg-accent`,
  `text-fg-muted`).

O que não traduz fica de fora de propósito: sombra de caixa (no RN é
`elevation`/`shadow*`, decisão da peça), `clamp()` de marketing e `z-index`.

Regenerar: `bun run gen:native`. O `bun run check` falha se este diretório
divergir do CSS — mudou token, o native anda junto no mesmo commit.
