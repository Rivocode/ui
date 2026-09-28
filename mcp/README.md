# @rivocode/ui-mcp

[MCP](https://modelcontextprotocol.io) server for RivoCode's design system.
It gives an agent the catalog of `@rivocode/ui` and `@rivocode/ui-native`
— the page of each piece, the props, the tokens, the React Native parity and
the guides — through tools it calls in the middle of the work, instead of
guessing the API from the name.

It runs on your machine, over stdio. There is no hosted server, and it opens no
network connection: the documentation travels inside the package.

## Installation

In Claude Code:

```bash
claude mcp add rivocode-ui -- npx -y @rivocode/ui-mcp
```

In any client that reads its configuration as JSON (Claude Desktop, Cursor,
Windsurf, VS Code and the like):

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

Requires Node 20 or newer.

## Which documentation it serves

**The one from the design system version the package was generated from.** The
`@rivocode/ui-mcp` 0.6.0 was generated from the documentation of
**`@rivocode/ui` 1.0.0** and **`@rivocode/ui-native` 1.0.0**. Every answer ends
by saying so, and the server repeats it on stderr when it starts.

The content is produced at build time from the same source that the site
[ds.rivocode.com.br](https://ds.rivocode.com.br) publishes: the piece pages, the
props table extracted from the compiler, the parity table checked against the
native package, the conventions, the skill and the tokens as DTCG JSON. If the
project uses a newer version of the library than the one cited above, the piece
page on the site is the reference.

## Tools

| Tool | What it returns |
| --- | --- |
| `list_components` | The catalog by family, one line per piece, with the parts and the state on React Native. Filters by `family`. |
| `get_component` | The whole page of a piece: import, examples that run, props, parts, "When not to use" and React Native. Accepts `DataTable`, `data-table` or a part, such as `CardHeader`. |
| `search_docs` | Full-text search over all the documentation, ignoring accents and case, with the matching snippets. |
| `recommend_component` | Given an interface intent in free text, the candidate pieces in order, with the reason: the row of the house choice table, the piece description and the "When not to use" of each one, plus the neighbors it names. `platform: "native"` says how each one looks on a phone. |
| `get_tokens` | Color roles in both themes, scales, density and motion. With `file`, the raw DTCG 2025.10 JSON. |
| `get_native_parity` | The parity row (translates, becomes another piece, does not port), the React Native section of the page, each prop that changes in the call and the props of the native piece. |
| `get_guide` | A whole guide: conventions, installation, themes, tokens, density, icons, React Native, AI and agents, and the skill references (method, flow, text, layout, design, choosing a piece, accessibility, forms, charts). Without `name`, lists the guides. |
| `audit_screen` | Audits screen files (path and text) against the house rules and returns the report with a deterministic score from 0 to 100. With `package_jsons` (the manifests from the one nearest the screen to the monorepo root, which add up) or `package_json` (a single one), it checks the peers; with `findings` and `dismissals`, it brings the agent's judgment into the same math. It is the audit of the `rivocode-ui-audit` skill. |

Each page is also served as an MCP resource: `rivocode://docs/componentes/<piece>.md`,
`rivocode://docs/<guide>.md`, `rivocode://docs/skill/...` and
`rivocode://tokens/<file>.tokens.json`.

## License

MIT.
