---
category: IA
---

# AILabel

O selo "IA" que marca conteúdo gerado por inteligência artificial. Sozinho, é
um selo; com `explanation`, vira botão e abre um painel dizendo quem gerou, com
que dados e o que a pessoa deve conferir. Vive em `@rivocode/ui/ai`.

```tsx
import { AILabel } from '@rivocode/ui/ai'

<AILabel explanation="Escrito pelo assistente a partir das 42 notas de agosto. Confira os valores antes de enviar ao contador." />
```

É a ideia do AI label do Carbon: quem lê um resumo, uma sugestão de valor ou
uma classificação tem o direito de saber que aquilo saiu de um modelo, e de
perguntar como.

## Selo e explicação

Sem `explanation`, o selo é texto. O leitor de tela não ouve "I A" soletrado:
ouve "Conteúdo gerado por IA", ou o que `label` disser.

Com `explanation`, o selo vira botão com esse mesmo nome e abre um `Popover`
com o título "Gerado por IA" (`title` troca) e a explicação embaixo. `side`
decide o lado em que ele abre. O desenho continua o do selo, de 20 pixels de
altura, mas a área de toque do botão passa dele por 8 pixels de cada lado: o
dedo não precisa acertar um alvo menor que os 24 da WCAG 2.5.8.

Escreva a explicação para quem vai decidir se confia: a origem ("a partir das
notas de agosto"), o limite ("não lê notas canceladas") e o que conferir. "Este
conteúdo foi gerado por IA" repete o selo e não explica nada.

## Tons e tamanhos

`tone` é `accent` (padrão) ou `neutral`, os mesmos papéis do `Badge`; nenhuma
cor é escrita na peça. `size` é `sm` (padrão) ou `md`. `text` troca o "IA",
para outra língua.

```tsx
<div className="flex items-center gap-2">
  <CardTitle>Resumo de agosto</CardTitle>
  <AILabel tone="neutral" />
</div>
```

## Quando não usar

- **Estado de um registro** é `Badge`. "Paga", "Em aberto" e "Cancelada" são
  estados; o `AILabel` diz a origem do conteúdo, e só isso. Um `Badge` com o
  texto "IA" perde o nome por extenso para o leitor de tela e a explicação.
- **Conteúdo inteiro produzido numa conversa** não precisa de selo: a
  `Message` com `role="assistant"` já diz quem falou. O selo é para o que sai
  da conversa e vai morar numa tela comum.

## No React Native

Traduz, no caminho próprio `@rivocode/ui-native/ai`, com os mesmos `text`, `label`, `tone`, `size`, `explanation` e `title`.

**A explicação abre numa `Sheet`.** O painel ancorado ao selo ficaria embaixo do dedo que tocou nele, a mesma razão por que o `Popover` não porta. Por isso não há `side`, e `explanation` é `string`: ela vira a descrição da folha.
