# Mudanças

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
