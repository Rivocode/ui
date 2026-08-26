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

## O ícone tem lugar próprio

**Cor nunca é o único sinal.** Sem ícone, os quatro tons são quatro caixas
idênticas de forma, separadas só pelo matiz — e quem não distingue vermelho de
verde é uma fatia grande de qualquer base de usuários, sem contar a impressão em
preto e branco.

O ícone entrava como filho, no meio do título e da descrição: sem coluna
própria, sem alinhamento com a primeira linha, e num lugar diferente a cada
tela. Agora ele é `icon`, com posição garantida antes do texto:

```tsx
<Alert tone="warning" icon={<TriangleAlert />}>
  <AlertTitle>Certificado vence em 8 dias</AlertTitle>
  <AlertDescription>Renove antes de 01/09 para não interromper a emissão.</AlertDescription>
</Alert>
```

O par canônico do lucide, o mesmo da tabela de ícones da casa: `Info` para
`info`, `CheckCircle2` para `success`, `TriangleAlert` para `warning`, `CircleX`
para `danger`. Ele sai `aria-hidden`: o texto ao lado já diz o que ele desenha,
e o `role` da raiz já diz a urgência — anunciá-lo de novo seria dizer a mesma
coisa duas vezes.

## Que a pessoa dispensa

`onDismiss` liga o xis no canto direito, com nome acessível ("Fechar aviso", ou
o que `dismissLabel` disser).

**Quem some com o aviso é quem chamou.** A peça não guarda estado nenhum, pelo
mesmo motivo de ela não ter `open`: um aviso que se apaga sozinho é `Toast`, e o
`Alert` existe justamente para o que fica na tela.

```tsx
const [open, setOpen] = useState(true)

{open && (
  <Alert tone="warning" icon={<TriangleAlert />} onDismiss={() => setOpen(false)}>
    <AlertTitle>Certificado vence em 8 dias</AlertTitle>
    <AlertDescription>Renove antes de 01/09.</AlertDescription>
  </Alert>
)}
```

Sem `onDismiss` não há botão, que continua sendo o padrão: aviso que a pessoa
pode dispensar é o caso, e não a regra. O que bloqueia uma ação não se dispensa
— tirá-lo da tela é resolver o que ele aponta.

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
