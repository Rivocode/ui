---
category: Formulário
---

# Switch

Chave de liga e desliga, para o que muda na hora.

Não e um `Checkbox` de outro formato. O Checkbox responde uma pergunta que só
vale quando o formulário for enviado; a chave age no clique. Trocar um pelo
outro faz a pessoa clicar e não saber se já valeu.

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
