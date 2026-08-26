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

## Quando não usar

Dentro de um formulário que tem botão de salvar, use `Checkbox`. **Não é o mesmo
controle de outro formato**: a chave age no clique e o efeito é imediato; a
caixa responde uma pergunta que só vale quando o formulário for enviado. Uma
chave em cima de um Salvar deixa a pessoa sem saber se já valeu — e se ela sair
da tela sem salvar, a resposta é não.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Switch` — `checked` e `onCheckedChange` obrigatórios; o trilho é o do sistema, pintado por token. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
