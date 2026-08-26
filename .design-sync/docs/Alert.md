---
category: Feedback
---

# Alert

Aviso que **fica** na tela.

Compõe com `AlertTitle` e `AlertDescription`.

O papel de acessibilidade vem do tom: `danger` e `warning` interrompem o leitor
de tela, `success` e `info` esperam a pessoa terminar a frase. Interromper
alguém para dizer "salvo com sucesso" e falta de educacao com quem depende do
leitor.

## Quando não usar

Para a confirmação do que acabou de acontecer — nota emitida, arquivo enviado —
use `useToast()`. O aviso de toast passa; este fica. Um "salvo com sucesso" que
mora no fluxo da página ainda está lá quando a pessoa volta dez minutos depois,
e ela lê aquilo como o estado de agora.

O contrário também vale, e é o erro mais caro dos dois: informação que a pessoa
precisa **ter na tela enquanto trabalha** — o motivo de um campo estar
bloqueado, a pendência que impede emitir — não pode ser um toast, porque ele
some antes de ela chegar na parte em que aquilo importa.

E erro de campo não é nenhum dos dois: pertence ao campo que errou, via
`FieldError`, onde a pessoa está olhando e pode corrigir.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Alert` — `title` é prop e o corpo é filho; sem `AlertTitle`/`AlertDescription`. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
