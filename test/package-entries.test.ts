import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync("package.json", "utf8"));

test("todo subcaminho de src tem entrada no exports do pacote", () => {
  const subpaths = readdirSync("src", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => readdirSync(`src/${entry.name}`).includes("index.ts"))
    .map((entry) => entry.name);
  expect(subpaths.length).toBeGreaterThan(2);

  for (const name of subpaths) {
    expect(manifest.exports[`./${name}`]?.default).toBe(`./dist/${name}/index.js`);
  }
});

test("toda pagina da vitrine entra no script demo", () => {
  const pages = readdirSync("demo").filter(
    (file) => file.endsWith(".tsx") && readFileSync(`demo/${file}`, "utf8").includes("createRoot("),
  );
  expect(pages.length).toBeGreaterThan(10);

  for (const page of pages) {
    expect(manifest.scripts.demo.split(" ")).toContain(`demo/${page}`);
  }
});
