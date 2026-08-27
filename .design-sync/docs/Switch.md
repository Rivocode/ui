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

## O trilho ligado

O trilho ligado pinta `accent-text`, e não `accent`: é a mesma lima um passo
mais escura, e a troca é de contraste. Com a lima cheia o trilho media 1,21:1
sobre a página no tema claro, contra 3,33:1 do trilho **desligado** - o estado
ligado ficava menos visível que o desligado, e abaixo dos 3:1 que a WCAG 1.4.11
pede para controle que não carrega texto. Com `accent-text` ele mede 5,55:1
sobre a página e 5,75:1 sobre o cartão.

Não havia lima clara que resolvesse: o passo mais escuro antes do `accent-text`
é o `accent-active`, e ele para em 1,54:1 sobre branco. No tema escuro os dois
papéis apontam para o mesmo valor, então lá o trilho não mudou um pixel. O pino
ligado acompanha em `surface-raised`, e é o que se lê dentro do trilho, a
5,75:1 no claro e 13,91:1 no escuro.

Quem escreve tema de cliente herda a garantia sem fazer nada: `accent-text` já
precisa de 4,5:1 sobre os fundos para o texto de acento, e é a mesma medida que
o trilho usa.

## Desabilitado

Desabilitado se pinta com token, e não com opacidade, como no `Checkbox` e no
`Radio`. O trilho já é a superfície apagada quando a chave está desligada, então
aqui quem diz travado é o pino: ele vai de `fg-muted` para `fg-disabled`, e o
trilho perde o acento quando ligado.

Não vale devolver um acento lavado ao trilho ligado-e-travado para o "ligado"
continuar óbvio: medido, o pino cai para 2,5:1 sobre ele no tema escuro, abaixo
dos 3:1 da WCAG 1.4.11. E o pino é o único lugar onde se lê a chave.

## Quando não usar

Dentro de um formulário que tem botão de salvar, use `Checkbox`. **Não é o mesmo
controle de outro formato**: a chave age no clique e o efeito é imediato; a
caixa responde uma pergunta que só vale quando o formulário for enviado. Uma
chave em cima de um Salvar deixa a pessoa sem saber se já valeu, e se ela sair
da tela sem salvar, a resposta é não.

## No React Native

Traduz: o `@rivocode/ui-native` exporta `Switch` - `checked` e `onCheckedChange` obrigatórios; o trilho é o do sistema, pintado por token. A API não é a mesma do web (no nativo tudo é controlado), e a [tabela de paridade](/react-native) diz o que muda peça a peça.
