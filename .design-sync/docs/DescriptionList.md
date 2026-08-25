---
category: Estrutura
---

# DescriptionList

Pares de rótulo e valor, na marcação que já existe para isso: `<dl>`.

É a folha de detalhes de toda listagem — CNPJ, emissão, vencimento, valor —
que cada tela montava com um par de `<span>` num flex. Aqui o leitor de tela
ouve "termo, definição" em vez de dois textos soltos, e as linhas saem
divididas pelo mesmo fio.

O valor aceita qualquer nó: `Badge` para situação, `font-mono` para número,
dinheiro do `currencyShort`. O rótulo não encolhe; valor comprido quebra do
lado dele.

Vive bem dentro de `Sheet` e `Dialog` de detalhes, e ao lado de um
`Separator` quando a folha tem mais de um bloco.
