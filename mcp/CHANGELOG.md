# Mudanças

## 0.6.0

A documentação empacotada passa a ser a de `@rivocode/ui` 1.0.0 e
`@rivocode/ui-native` 1.0.0: a API congelada, com semver à risca, o texto de
interface em `labels`, `danger` no lugar de `destructive` e `open` para abrir e
fechar em toda a biblioteca. As oito ferramentas continuam as mesmas.

- `get_guide` ganha o guia `migrar-para-1-0`, com cada nome que mudou da 0.x
  para a 1.0, peça por peça, no web e no nativo.
- A tabela de props do web vai de 4391 para 4407 props, e a do nativo de 855
  para 866, nas mesmas 118 peças: são os `labels` novos, o `size` do `Select`,
  do `Combobox` e do `Textarea`, e o `label` do `Checkbox`, do `Switch`, do
  `OTPField` e do `SignaturePad` nativos.
- `get_native_parity`: a tabela de assinatura vai de 189 para 195 linhas, nas
  mesmas 88 peças, e o `AlertDialog` passa a aparecer com `onConfirm` e
  `labels`, os nomes do `Popconfirm`. A paridade continua em 104 peças com o
  mesmo nome e 4 com outro.
- 52 páginas de peça reescritas, e as convenções, a skill e a auditoria de tela
  deixam de citar os nomes que saíram; a auditoria cobra `label` no
  `IconButton` nativo e no `Checkbox` e no `Switch` nativos sem texto.

## 0.5.0

A documentação empacotada passa a ser a de `@rivocode/ui` 0.20.0 e
`@rivocode/ui-native` 0.16.0: o `Autocomplete` nativo, o `validate` do `Field`
e o `classNames` com os nomes do web em quarenta peças nativas. As oito
ferramentas continuam as mesmas.

- `get_native_parity`: o `Autocomplete` passa a traduzir com o mesmo nome (104
  peças com o mesmo nome e 4 com outro; eram 103 e 5), e a tabela de assinatura
  cai de 195 para 189 diferenças, nas mesmas 88 peças: as linhas de
  "um `className` só" saíram, e as que ficaram nomeiam a parte que o nativo não
  desenha.
- A tabela de props do nativo vai de 800 para 855 props, em 118 peças (eram
  117). A do web continua com 4391.
- 44 páginas de peça reescritas, as convenções ganham a regra da classe por
  parte, e o guia e a referência de React Native da skill ensinam o
  `classNames` e o `validate` do `Field`.

## 0.4.0

A documentação empacotada passa a ser a de `@rivocode/ui` 0.19.0 e
`@rivocode/ui-native` 0.15.0: as datas em texto `aaaa-mm-dd`, o nativo falando
os nomes do web e os formatadores nos dois pacotes. As oito ferramentas
continuam as mesmas.

- `get_native_parity` e a tabela de assinatura encolhem de 225 para 195
  diferenças, em 88 peças em vez de 91: as linhas que saíram viraram o mesmo
  nome dos dois lados.
- As tabelas de props ganham o que sumia delas: 4391 props no web (eram 4368)
  e 800 no nativo (eram 762), com as sobrecargas de data juntadas numa linha só.
- 38 páginas de peça reescritas, e a referência de React Native da skill ensina
  `label`, `onValueChange`, `sm`/`md`/`lg` e os moldes do web como nome
  principal.

## 0.3.0

A documentação empacotada passa a ser a de `@rivocode/ui` 0.18.0 e
`@rivocode/ui-native` 0.13.0: 134 peças, os gráficos novos, o peso como
token e os blocos de erro.

### A oitava ferramenta: `audit_screen`

O servidor passa de sete para oito ferramentas. `audit_screen` recebe os
arquivos de tela e devolve o relatório da skill `rivocode-ui-audit`, com a
mesma nota de 0 a 100 que o script dela daria, e `get_guide` serve a skill com
o nome `auditoria`.

Os manifestos entram por `package_jsons`, do mais perto da tela ao da raiz do
monorepo, e somam como no script: o peer instalado na raiz conta.
`package_json`, com o texto de um manifesto só, continua aceito.

## 0.2.0

A documentação empacotada passa a ser a de `@rivocode/ui` 0.17.0 e
`@rivocode/ui-native` 0.12.0: 121 peças, os subcaminhos `dnd` e `editor`, o
guia de hooks, o de documentos brasileiros, os blocos de página e as
referências novas da skill. As sete ferramentas continuam as mesmas.

## 0.1.0

### O servidor MCP do design system, pelo stdio

A primeira versão. `npx -y @rivocode/ui-mcp` sobe o servidor na máquina de
quem usa, sem servidor hospedado e sem rede: a documentação viaja dentro do
pacote.

Sete ferramentas: `list_components`, `get_component`, `search_docs`,
`recommend_component`, `get_tokens`, `get_native_parity` e `get_guide`. Cada
página de peça, cada guia e cada arquivo DTCG também sai como resource.

### A documentação empacotada

Gerada de `@rivocode/ui` 0.16.0 e `@rivocode/ui-native` 0.11.0: 109 peças, as
convenções, os nove guias do site, a skill com as doze referências, os seis blocos de página e os tokens
em JSON DTCG 2025.10.
