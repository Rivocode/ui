---
category: Feedback
---

# CookieConsent

O aviso de consentimento de cookies, no molde da LGPD: um painel preso no pé
da tela, com o texto, o link da política de privacidade e três saídas, "Aceitar
todos", "Recusar não essenciais" e "Personalizar", que abre as categorias uma a
uma.

```tsx
const [choice, setChoice] = useState(() => readChoice())

<CookieConsent
  open={choice === null}
  policyHref="/privacidade"
  onDecision={(next) => {
    saveChoice(next)
    setChoice(next)
  }}
/>
```

**A peça não grava cookie nenhum.** Ela mostra o aviso e devolve a escolha por
`onDecision`; guardar a escolha, carregar só os scripts aceitos e fechar o
aviso é trabalho de quem usa. `open` é controlado: abra quando não há escolha
guardada, ou quando a pessoa pede para rever a dela num link "Preferências de
cookies" do rodapé.

## A escolha

`onDecision` recebe `{ action, categories }`. `action` diz qual botão decidiu
(`acceptAll`, `rejectOptional` ou `save`), e `categories` traz uma chave por
categoria, com `true` para o que foi aceito:

```tsx
{ action: 'rejectOptional', categories: { necessary: true, analytics: false, marketing: false } }
```

A categoria obrigatória volta sempre `true`, em qualquer um dos três botões.
Guarde também a data e a versão da política que a pessoa viu: se a política
mudar, é a data que diz que a escolha precisa ser pedida de novo.

## Recusar é tão fácil quanto aceitar

"Aceitar todos" e "Recusar não essenciais" saem lado a lado, com o mesmo
tamanho, a mesma variante e o mesmo peso. Nenhum dos dois é o botão de
destaque. É o que o guia de cookies da ANPD pede, e é a diferença entre
consentimento e truque de interface: recusar não pode custar um clique a mais
nem exigir abrir o "Personalizar".

No "Personalizar", só as obrigatórias nascem ligadas. Chave que já vem ligada
não é escolha, e a LGPD pede consentimento ativo. Para quem reabre o aviso,
`defaultValue` recebe a escolha guardada e as chaves começam como a pessoa as
deixou.

## Categorias

Sem `categories`, o aviso traz três, em `defaultCookieCategories`:
**Necessários** (obrigatória, sempre ligada e sem chave de desligar),
**Análise** e **Marketing**. Troque pelas do seu produto, cada uma com o que
faz numa frase:

```tsx
<CookieConsent
  open={open}
  policyHref="/privacidade"
  onDecision={decide}
  categories={[
    { id: 'necessary', label: 'Necessários', description: 'Sessão, segurança e esta escolha.', required: true },
    { id: 'analytics', label: 'Análise', description: 'Quais telas são usadas, sem identificar você.' },
    { id: 'support', label: 'Chat de suporte', description: 'O balão de conversa no canto da tela.' },
  ]}
/>
```

## Foco e teclado

Ao abrir, o foco vai para o aviso, e o leitor de tela lê o título e o texto.
**Ele não prende a página**: é um diálogo não modal (`aria-modal="false"`), sem
fundo escurecido e sem armadilha de foco, e quem quer ler a página antes de
decidir continua lendo. O Tab sai do aviso para a página normalmente.

**Esc não dispensa.** Fechar sem escolher deixaria a pessoa sem saber o que foi
decidido por ela, e o aviso voltaria na próxima página. Quem fecha é a escolha.
Quando o aviso fecha com o foco dentro dele, o foco volta para onde estava
antes de ele abrir.

Ele entra subindo com a curva de entrada dos tokens de movimento e sai com a de
saída, e empilha em `--rc-z-overlay`: acima do conteúdo e de barra grudada, e
abaixo de diálogo e de aviso.

## Partes

`classNames` alcança cada nó pelo nome: `panel`, `title`, `description`,
`policy`, `categories`, `category` e `actions`. `className` veste a faixa
fixa de fora.

## Quando não usar

- **Aviso de página sem escolha** (manutenção, fatura em atraso) é `Banner`.
  O `CookieConsent` existe para colher uma decisão, e o `Banner` só informa.
- **Parede de cookies**, que bloqueia a página até a pessoa aceitar, não é
  este aviso e não é `AlertDialog`: condicionar o acesso ao aceite contraria o
  consentimento livre que a LGPD pede. Se o produto não funciona sem os
  cookies necessários, eles são necessários, e não precisam de aceite.
- **Confirmar que a escolha foi salva** é `Toast`, se for preciso dizer
  alguma coisa. Na maior parte das vezes o aviso sumir já diz.

## No React Native

Não porta, por decisão. Aplicativo não tem cookie de navegador para pedir licença: o consentimento de rastreio no celular é o aviso da própria plataforma, o App Tracking Transparency no iOS, pedido pelo `expo-tracking-transparency`, e a declaração de dados na loja no Android. Um painel desenhado pela biblioteca por cima disso seria um segundo pedido para a mesma coisa.

Se o app abre páginas web num `WebView`, o aviso é o da página, que roda o `@rivocode/ui` do web.
