---
category: Feedback
---

# Banner

Aviso de **página**: uma faixa de largura total, no topo da área que ela
governa, que fica até o motivo dela acabar. Manutenção programada, fatura em
atraso, modo de teste, conta em verificação.

```tsx
<Banner
  tone="warning"
  title="Você está no modo de teste"
  description="As notas emitidas aqui não têm validade fiscal."
/>
```

Ela diz respeito à conta, ao produto ou à sessão inteira, e não a um trecho do
conteúdo. Por isso encosta nas bordas da área, sem canto de cartão, com uma
linha do tom embaixo. Quem a põe dentro de uma área com respiro pode arredondar
por `className`.

## Tom e papel

`info`, `success`, `warning` e `danger`, os quatro tons de estado dos tokens.
O tom decide três coisas ao mesmo tempo: a cor, o ícone e o papel para o leitor
de tela.

- `danger` e `warning` saem com `role="alert"`, e interrompem o leitor.
- `info` e `success` saem com `role="status"`, e esperam a frase terminar.

É a mesma regra do `Alert`, pelo mesmo motivo: interromper alguém para dizer
"sua conta foi verificada" é falta de educação com quem depende do leitor.

**Cor nunca é o único sinal**, e por isso o ícone vem sozinho: `Info`,
`CheckCircle2`, `TriangleAlert` e `CircleX`, o par canônico do lucide. `icon`
troca o desenho (uma chave inglesa para manutenção, por exemplo), e `icon={null}`
tira. Ele sai sempre `aria-hidden`: o texto ao lado já diz o que ele desenha.

## Título, descrição e ações

`description` é obrigatória e é o corpo: o que aconteceu e o que a pessoa faz a
respeito. `title` é opcional, sai na cor do tom e, quando existe, dá nome à
faixa.

`actions` recebe os botões, à direita do texto na mesa e embaixo dele no
celular. Use `Button` com `size="sm"` e `variant="secondary"`: a borda dele é a
fronteira medida contra o fundo dos quatro tons, nos dois temas. Rótulo longo
quebra dentro do botão em vez de empurrar a página para o lado, e a faixa cabe
em 320px, que é a tela de quem usa zoom de 400%.

```tsx
<Banner
  tone="danger"
  title="Fatura em atraso"
  description="A fatura de agosto venceu há 5 dias. A emissão será suspensa em 10/10."
  actions={
    <Button size="sm" variant="secondary">
      Pagar com Pix
    </Button>
  }
/>
```

## Que a pessoa dispensa

`onDismiss` liga o xis no fim da faixa, com o nome "Fechar aviso" (ou o que
`dismissLabel` disser). **Quem some com a faixa é quem chamou**: a peça não
guarda estado nenhum, e lembrar que a pessoa já dispensou (nesta sessão, ou para
sempre) é decisão do produto, não da faixa.

```tsx
const [open, setOpen] = useState(true)

{open && (
  <Banner
    tone="info"
    title="Manutenção programada"
    description="A emissão fica fora do ar domingo, das 2h às 4h."
    onDismiss={() => setOpen(false)}
  />
)}
```

O que bloqueia não se dispensa. Uma fatura que vai suspender a conta continua
na tela até ser paga: tirá-la é resolver o que ela aponta.

## Partes

`classNames` alcança cada nó pelo nome: `icon`, `content` (a coluna do texto),
`title`, `description`, `actions` e `dismiss`.

## Quando não usar

- **Aviso sobre um trecho do conteúdo** é `Alert`. O `Alert` mora junto do que
  ele fala (o formulário cujo certificado vence, a tabela que veio incompleta),
  e o `Banner` fala da página ou da conta inteira. Se o aviso some quando a
  pessoa troca de tela, era `Alert`.
- **Confirmação do que acabou de acontecer** é `Toast`. O `Toast` passa, e o
  `Banner` fica: uma faixa "nota emitida" no topo da tela ainda está lá quando a
  pessoa volta dez minutos depois, e ela lê aquilo como o estado de agora.
- **Decisão que precisa de resposta antes de seguir** é `AlertDialog`. O
  `Banner` informa e deixa trabalhar; o `AlertDialog` bloqueia a tela até a
  pessoa escolher.

E não empilhe três faixas no topo. Se há mais de um aviso de página ao mesmo
tempo, mostre o mais grave e deixe os outros para a tela onde eles importam.

## No React Native

Traduz, com os mesmos quatro tons, o mesmo `title`, `description`, `actions` e `onDismiss`, e o xis com o mesmo nome acessível ("Fechar aviso"). `title` e `description` são `string`, porque texto no nativo mora dentro de um `Text`.

**A urgência sai por região viva.** `danger` e `warning` saem com `accessibilityRole="alert"` e anúncio imediato; `info` e `success` saem em região viva educada, que espera a frase terminar. É a mesma divisão do `role` do web. No iOS, onde a região viva não existe, título e descrição saem pelo anúncio do sistema: nos tons urgentes também ao aparecer, e nos quatro a cada troca de texto.

**O ícone não vem sozinho.** O pacote nativo não traz biblioteca de ícones, então o `icon` é opcional e a forma que pinta na cor do tom é a função: `icon={({ color, size }) => <TriangleAlert color={color} size={size} />}`. As ações ficam embaixo do texto, que é onde cabem na largura do telefone.
