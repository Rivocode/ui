# @rivocode/ui-mcp

Servidor [MCP](https://modelcontextprotocol.io) do design system da RivoCode.
Ele entrega a um agent o catálogo do `@rivocode/ui` e do `@rivocode/ui-native`
— a página de cada peça, as props, os tokens, a paridade com o React Native e
os guias — por ferramentas que ele chama no meio do trabalho, em vez de
adivinhar a API pelo nome.

Roda na sua máquina, pelo stdio. Não há servidor hospedado, e ele não abre
conexão de rede: a documentação viaja dentro do pacote.

## Instalação

No Claude Code:

```bash
claude mcp add rivocode-ui -- npx -y @rivocode/ui-mcp
```

Em qualquer cliente que leia a configuração em JSON (Claude Desktop, Cursor,
Windsurf, VS Code e afins):

```json
{
  "mcpServers": {
    "rivocode-ui": {
      "command": "npx",
      "args": ["-y", "@rivocode/ui-mcp"]
    }
  }
}
```

Precisa de Node 20 ou mais novo.

## Que documentação ele serve

**A da versão do design system em que o pacote foi gerado.** O `@rivocode/ui-mcp`
0.2.0 foi gerado da documentação do **`@rivocode/ui` 0.17.0** e do
**`@rivocode/ui-native` 0.12.0**. Toda resposta termina dizendo isso, e o
servidor repete no stderr ao subir.

O conteúdo sai no build da mesma fonte que o site
[ds.rivocode.com.br](https://ds.rivocode.com.br) publica: as páginas de peça, a
tabela de props extraída do compilador, a tabela de paridade conferida contra o
pacote nativo, as convenções, a skill e os tokens em JSON DTCG. Se o projeto usa
uma versão mais nova da biblioteca do que a citada acima, a página da peça no
site é a referência.

## Ferramentas

| Ferramenta | O que devolve |
| --- | --- |
| `list_components` | O catálogo por família, uma linha por peça, com as partes e o estado no React Native. Filtra por `family`. |
| `get_component` | A página inteira de uma peça: importação, exemplos que rodam, props, partes, "Quando não usar" e React Native. Aceita `DataTable`, `data-table` ou uma parte, como `CardHeader`. |
| `search_docs` | Busca textual em toda a documentação, sem acento e sem caixa, com os trechos que casaram. |
| `recommend_component` | Dada uma intenção de interface em texto livre, as peças candidatas em ordem, com o motivo: a linha da tabela de escolha da casa, a descrição da peça e o "Quando não usar" de cada uma, mais as vizinhas que ele nomeia. `platform: "native"` diz como cada uma fica no celular. |
| `get_tokens` | Papéis de cor nos dois temas, escalas, densidade e movimento. Com `file`, o JSON DTCG 2025.10 cru. |
| `get_native_parity` | A linha de paridade (traduz, vira outra, não porta), a seção React Native da página, cada prop que muda na chamada e as props da peça nativa. |
| `get_guide` | Um guia inteiro: convenções, instalação, temas, tokens, densidade, ícones, React Native, IA e agents, e as referências da skill (método, fluxo, texto, layout, design, escolha de peça, acessibilidade, formulários, gráficos). Sem `name`, lista os guias. |

Cada página também sai como resource MCP: `rivocode://docs/componentes/<peça>.md`,
`rivocode://docs/<guia>.md`, `rivocode://docs/skill/...` e
`rivocode://tokens/<arquivo>.tokens.json`.

## Licença

MIT.
