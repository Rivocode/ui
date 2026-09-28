/**
 * O MCP leva a documentacao da arvore em que foi construido, e so a publicacao
 * dele a atualiza.
 *
 * Em 26/09/2026 a biblioteca saiu em 1.1.2, 1.1.3, 1.1.4 e 1.2.0 sem nenhuma
 * versao nova do `@rivocode/ui-mcp`: quem usava o MCP continuou com a
 * documentacao da 1.1.1, sem o guia de arquitetura, sem o `render` do
 * `SidebarMenuItem` e sem o `forValue` do `MaskedInput`. Nada acusou, porque
 * o MCP publicado nao e lido por guarda nenhuma e o conteudo dele e gerado no
 * build.
 *
 * A regra: a secao do topo do CHANGELOG do MCP diz de que versao da biblioteca
 * e do nativo ela leva a documentacao, com os nomes entre crases e o numero
 * logo depois. Subir a versao de um dos dois pacotes sem abrir uma secao nova
 * no MCP deixa esta guarda vermelha no mesmo commit - e a secao nova, com o
 * `version` do `mcp/package.json`, e o que faz o `tag.yml` publicar o MCP.
 */
const web = (await Bun.file("package.json").json()) as { version: string };
const native = (await Bun.file("native/package.json").json()) as { version: string };
const mcp = (await Bun.file("mcp/package.json").json()) as { version: string };
const changelog = await Bun.file("mcp/CHANGELOG.md").text();

const top = /^## (\S+)\n([\s\S]*?)(?=^## |\s*$(?![\s\S]))/m.exec(changelog);
if (!top) {
  console.error("mcp/CHANGELOG.md sem secao `## <versao>`.");
  process.exit(1);
}

const [, heading, body] = top;
const problems: string[] = [];

if (heading !== mcp.version) {
  problems.push(`a secao do topo e ${heading}, e o mcp/package.json diz ${mcp.version}`);
}

for (const [name, version] of [
  ["@rivocode/ui", web.version],
  ["@rivocode/ui-native", native.version],
] as const) {
  const said = new RegExp(`\`${name.replace("/", "\\/")}\` (\\d+\\.\\d+\\.\\d+)`).exec(body!)?.[1];
  if (said !== version) {
    problems.push(
      said
        ? `a secao ${heading} leva a documentacao de ${name} ${said}, e o pacote esta em ${version}`
        : `a secao ${heading} nao diz de que versao de ${name} leva a documentacao (esperado \`${name}\` ${version})`,
    );
  }
}

if (problems.length > 0) {
  console.error("O MCP ficou para tras da documentacao que ele empacota:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    "\nAbra uma secao nova no topo de mcp/CHANGELOG.md, com a versao do mcp/package.json\n" +
      "subida junto, dizendo `@rivocode/ui` e `@rivocode/ui-native` com os numeros de agora.",
  );
  process.exit(1);
}

console.log(`MCP ${mcp.version} leva a documentacao de @rivocode/ui ${web.version} e @rivocode/ui-native ${native.version}.`);

export {};
