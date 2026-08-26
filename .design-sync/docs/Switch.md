---
category: Formulário
---

# Switch

Chave de liga e desliga, para o que muda na hora.

O alvo tem 44px de altura mesmo com o trilho de 24, por respiro invisivel: e a
medida do dedo.

## O rótulo

Passe o texto como filho e a chave sai dentro de um `<label>`, então clicar no
texto também liga:

```tsx
<Switch defaultChecked>Enviar o XML junto com o PDF</Switch>
```

Sem filho, sai só a chave. Vale para linha de ajuste onde o texto tem descrição
embaixo e a chave fica na ponta direita.

## Desabilitado

Desabilitado se pinta com token, e não com opacidade, como no `Checkbox` e no
`Radio`. O trilho já é a superfície apagada quando a chave está desligada, então
aqui quem diz travado é o pino: ele vai de `fg-muted` para `fg-disabled`, e o
trilho perde o acento quando ligado.

Não vale devolver um acento lavado ao trilho ligado-e-travado para o "ligado"
continuar óbvio: medido, o pino cai para 2,5:1 sobre ele no tema escuro, abaixo
dos 3:1 da WCAG 1.4.11 — e o pino é o único lugar onde se lê a chave.

## Quando não usar

Dentro de um formulário que tem botão de salvar, use `Checkbox`. **Não é o mesmo
controle de outro formato**: a chave age no clique e o efeito é imediato; a
caixa responde uma pergunta que só vale quando o formulário for enviado. Uma
chave em cima de um Salvar deixa a pessoa sem saber se já valeu — e se ela sair
da tela sem salvar, a resposta é não.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Switch` — `checked` e `onCheckedChange` obrigatórios; o trilho é o do sistema, pintado por token. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
