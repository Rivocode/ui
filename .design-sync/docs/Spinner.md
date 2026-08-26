---
category: Feedback
---

# Spinner

Giro de espera sem fim previsto.

Quando da para medir, `Progress` diz mais. Quando a espera vai preencher uma tela
inteira, o `Skeleton` mostra o formato do que vem, que assusta menos.

Ele para de girar quando o sistema pede menos movimento, e continua no lugar:
sumir com o aviso deixaria a tela parecendo travada.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Spinner` — `small` e `large`, os dois tamanhos do `ActivityIndicator`. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
