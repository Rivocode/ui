---
category: Ações
---

# Clipboard

Copiar um dado para levar a outro lugar.

Chave de acesso, CNPJ, id de rastro, código Pix, número da nota: todo dado que
a pessoa precisa colar em outro sistema quer este botão do lado.

A confirmação é parte da peça, e não enfeite. Copiar é a ação sem resultado
visível: nada muda na tela, então sem confirmação a pessoa clica de novo por
dúvida. E quem não vê o ícone trocar não soube que aconteceu. Por isso o
próprio nome acessível do botão muda, e o leitor de tela anuncia "Copiado" onde
antes anunciava "Copiar". A confirmação volta sozinha depois de `timeout`,
senão o botão fica preso num estado que já passou.

Quando a área de transferência não está disponível (sem permissão, ou fora de
contexto seguro), nada é confirmado. Mentir que copiou é pior do que não
confirmar: a pessoa cola o que tinha antes e só descobre no destino.

Os dois nomes entram por `labels`, e cada um tem o próprio padrão: trocar o
verbo não obriga a reescrever a confirmação junto.

```tsx
<Clipboard value="35240612345678000199" labels={{ copy: 'Copiar a chave' }} />
```

O `variant` é o do `Button`. O visto da confirmação sai no verde de sucesso em
`secondary`, `ghost` e `outline`; nos dois preenchidos, `primary` e
`danger`, ele sai na cor do rótulo, porque o verde medido sobre eles fica
em 1,41:1 no `accent` do tema escuro e em 1,08:1 no `danger` do claro, contra
os 3:1 que um ícone pede.

Sem `children`, o botão é um `IconButton`, e o nome acessível é o de `labels`,
que muda para o de confirmado depois de copiar. `size` escolhe o lado do
quadrado entre `sm` (o padrão), `md` e `lg`; com texto, escolhe a altura.

Com `children`, o texto do botão é o `children` enquanto não copiou, e vira
`labels.copied` na confirmação. O `onClick` de quem usa é chamado no clique,
antes de copiar, e não substitui a cópia.

## Quando não usar

Para o bloco de código inteiro, `CodeBlock copyable` já traz este botão no
canto, com o próprio conteúdo. Dois botões de copiar na mesma caixa fazem a
pessoa escolher entre coisas que ela acha que são diferentes.

## No React Native

Traduz, no caminho próprio `@rivocode/ui-native/clipboard`, com o mesmo arranjo do `form` e do `chart` e pela mesma razão: o `expo-clipboard` é peer **opcional**, e no celular ele não é só bytes, é módulo nativo que o app liga e reconstrói (`npx expo install expo-clipboard`). Ele tem caminho **separado** do `FileUpload` de propósito: quem põe um botão de copiar ao lado da chave de acesso de uma NF-e não anexa arquivo nenhum, e um índice comum aos dois cobraria os dois.

**A confirmação passa a ser dupla, e no web bastava uma.** A regra não muda: copiar é a ação sem resultado visível, e sem confirmação a pessoa toca de novo por dúvida. O que muda é por onde ela chega. O botão continua trocando o ícone e o nome acessível, como lá; e a peça dispara **também** um aviso, porque aqui trocar o `accessibilityLabel` de um `Pressable` que já está sob o foco **não é reanunciado** nem pelo VoiceOver nem pelo TalkBack: quem não vê o ícone virar visto não ficaria sabendo de nada. O aviso que o `RivoProvider` já monta mora num `accessibilityLiveRegion="polite"` (no iOS, onde ela não existe, o mesmo texto sai pelo anúncio do sistema), e é o único canal desta tela que fala sozinho. `toast={false}` desliga, para a tela que copia várias coisas seguidas e não quer uma pilha de avisos.

**Quando não copiou, nada é confirmado**, como no web: o `setStringAsync` do Expo devolve `false` quando a área de transferência recusa (o caso do passe web, fora de contexto seguro), e no iOS e no Android ele sempre resolve `true`.

Sem `children` o botão é só o ícone, e aí o alvo é 44px cheios, sem depender de `hitSlop` para chegar lá. O ícone é desenhado com `View`, como o olho do `PasswordInput`.

**O `variant` é o do `Button`, e aceita os mesmos cinco nomes do web**: `primary`, `secondary` (o padrão), `ghost`, `outline` e `danger`, cada um com o fundo e o rótulo do `Button` nativo daquela variante. Nos dois preenchidos, `primary` e `danger`, o visto da confirmação sai na cor do rótulo, e não no verde de sucesso: medido, o verde fica em 1,41:1 sobre o `accent` do tema escuro e em 1,08:1 sobre o `danger` do claro, contra os 3:1 que um ícone pede.
