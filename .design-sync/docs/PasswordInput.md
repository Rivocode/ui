---
category: Formulário
---

# PasswordInput

Campo de senha com o olho que revela.

Existe como peça porque todo projeto reconstrói este par — e reconstrói com o
mesmo defeito: o botão dizendo o estado em vez da ação. "Senha visível" não diz
o que acontece ao clicar, e quem navega por leitor de tela decide pelo verbo.
Aqui o nome do botão é sempre a ação: "Mostrar senha", "Esconder senha".

Revelar é um gesto momentâneo: sair do campo esconde de novo. Deixar a senha na
tela depois que a pessoa foi para outro lugar é o que faz alguém ser lido por
cima do ombro numa mesa compartilhada.

## Vestir por parte

O `className` veste o **campo**, e não a moldura — é a única peça do catálogo em
que a raiz não é o alvo dele, e mudar isso agora trocaria em silêncio a largura
de toda tela de login que já existe. Então a moldura ganhou nome próprio:

```tsx
<PasswordInput
  aria-label="Senha"
  classNames={{ wrapper: 'w-72', input: 'font-mono', action: 'text-fg-muted' }}
/>
```

`wrapperClassName` é o nome antigo de `classNames.wrapper` e continua valendo.

Os dois nomes que o leitor de tela ouve no botão entram por `labels`, e cada um
tem o próprio padrão — trocar só um não apaga o outro:

```tsx
<PasswordInput aria-label="Senha" labels={{ show: 'Revelar a senha' }} />
```

## Quando não usar

Para código de verificação de seis dígitos, use `OTPField` — ele separa as
casas, aceita colar o código inteiro e não esconde nada, porque o código é para
ser lido em voz alta do celular.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `PasswordInput` — o botão troca de nome com o estado (`labels.show`/`labels.hide`), e sair do campo esconde de novo. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
