# Mudanças

## 0.1.0

### O servidor MCP do design system, pelo stdio

A primeira versão. `npx -y @rivocode/ui-mcp` sobe o servidor na máquina de
quem usa, sem servidor hospedado e sem rede: a documentação viaja dentro do
pacote.

Sete ferramentas: `list_components`, `get_component`, `search_docs`,
`recommend_component`, `get_tokens`, `get_native_parity` e `get_guide`. Cada
página de peça, cada guia e cada arquivo DTCG também sai como resource.

### A documentação empacotada

Gerada de `@rivocode/ui` 0.15.0 e `@rivocode/ui-native` 0.10.0: 99 peças, as
convenções, os nove guias do site, a skill com as onze referências e os tokens
em JSON DTCG 2025.10.
