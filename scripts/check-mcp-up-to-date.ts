/**
 * The MCP carries the documentation of the tree it was built from, and only
 * its own publication updates it.
 *
 * On 26/09/2026 the library shipped 1.1.2, 1.1.3, 1.1.4 and 1.2.0 without any
 * new version of `@rivocode/ui-mcp`: whoever used the MCP kept the 1.1.1
 * documentation, without the architecture guide, without the `render` of
 * `SidebarMenuItem` and without the `forValue` of `MaskedInput`. Nothing
 * flagged it, because the published MCP is read by no guard and its content is
 * generated at build time.
 *
 * The rule: the top section of the MCP CHANGELOG says which version of the
 * library and of native it carries the documentation of, with the names in
 * backticks and the number right after. Bumping the version of either package
 * without opening a new section in the MCP turns this guard red in the same
 * commit - and the new section, with the `version` of `mcp/package.json`, is
 * what makes `tag.yml` publish the MCP.
 */
const web = (await Bun.file("package.json").json()) as { version: string };
const native = (await Bun.file("native/package.json").json()) as { version: string };
const mcp = (await Bun.file("mcp/package.json").json()) as { version: string };
const changelog = await Bun.file("mcp/CHANGELOG.md").text();

const top = /^## (\S+)\n([\s\S]*?)(?=^## |\s*$(?![\s\S]))/m.exec(changelog);
if (!top) {
  console.error("mcp/CHANGELOG.md has no `## <version>` section.");
  process.exit(1);
}

const [, heading, body] = top;
const problems: string[] = [];

if (heading !== mcp.version) {
  problems.push(`the top section is ${heading}, and mcp/package.json says ${mcp.version}`);
}

for (const [name, version] of [
  ["@rivocode/ui", web.version],
  ["@rivocode/ui-native", native.version],
] as const) {
  const said = new RegExp(`\`${name.replace("/", "\\/")}\` (\\d+\\.\\d+\\.\\d+)`).exec(body!)?.[1];
  if (said !== version) {
    problems.push(
      said
        ? `section ${heading} carries the documentation of ${name} ${said}, and the package is at ${version}`
        : `section ${heading} does not say which version of ${name} it carries the documentation of (expected \`${name}\` ${version})`,
    );
  }
}

if (problems.length > 0) {
  console.error("The MCP fell behind the documentation it packages:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    "\nOpen a new section at the top of mcp/CHANGELOG.md, with the version in mcp/package.json\n" +
      "bumped along, naming `@rivocode/ui` and `@rivocode/ui-native` with the current numbers.",
  );
  process.exit(1);
}

console.log(`MCP ${mcp.version} carries the documentation of @rivocode/ui ${web.version} and @rivocode/ui-native ${native.version}.`);

export {};
