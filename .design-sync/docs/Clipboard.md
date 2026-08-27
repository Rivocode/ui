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

## Quando não usar

Para o bloco de código inteiro, `CodeBlock copyable` já traz este botão no
canto, com o próprio conteúdo. Dois botões de copiar na mesma caixa fazem a
pessoa escolher entre coisas que ela acha que são diferentes.

## No React Native

Traduz, no caminho próprio `@rivocode/ui-native/clipboard`, com o mesmo arranjo do `form` e do `chart` e pela mesma razão: o `expo-clipboard` é peer **opcional**, e no celular ele não é só bytes, é módulo nativo que o app liga e reconstrói (`npx expo install expo-clipboard`). Ele tem caminho **separado** do `FileUpload` de propósito: quem põe um botão de copiar ao lado da chave de acesso de uma NF-e não anexa arquivo nenhum, e um índice comum aos dois cobraria os dois.

**A confirmação passa a ser dupla, e no web bastava uma.** A regra não muda: copiar é a ação sem resultado visível, e sem confirmação a pessoa toca de novo por dúvida. O que muda é por onde ela chega. O botão continua trocando o ícone e o nome acessível, como lá; e a peça dispara **também** um aviso, porque aqui trocar o `accessibilityLabel` de um `Pressable` que já está sob o foco **não é reanunciado** nem pelo VoiceOver nem pelo TalkBack: quem não vê o ícone virar visto não ficaria sabendo de nada. O aviso que o `RivoProvider` já monta mora num `accessibilityLiveRegion="polite"`, e é o único canal desta tela que fala sozinho. `toast={false}` desliga, para a tela que copia várias coisas seguidas e não quer uma pilha de avisos.

**Quando não copiou, nada é confirmado**, como no web: o `setStringAsync` do Expo devolve `false` quando a área de transferência recusa (o caso do passe web, fora de contexto seguro), e no iOS e no Android ele sempre resolve `true`.

Sem `children` o botão é só o ícone, e aí o alvo é 44px cheios, sem depender de `hitSlop` para chegar lá. O ícone é desenhado com `View`, como o olho do `PasswordInput`.
