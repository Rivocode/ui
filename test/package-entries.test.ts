import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync("package.json", "utf8"));

test("every subpath of src has an entry in the package exports", () => {
  const subpaths = readdirSync("src", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => readdirSync(`src/${entry.name}`).includes("index.ts"))
    .map((entry) => entry.name);
  expect(subpaths.length).toBeGreaterThan(2);

  for (const name of subpaths) {
    expect(manifest.exports[`./${name}`]?.default).toBe(`./dist/${name}/index.js`);
  }
});

test("every showcase page is in the demo script", () => {
  const pages = readdirSync("demo").filter(
    (file) => file.endsWith(".tsx") && readFileSync(`demo/${file}`, "utf8").includes("createRoot("),
  );
  expect(pages.length).toBeGreaterThan(10);

  for (const page of pages) {
    expect(manifest.scripts.demo.split(" ")).toContain(`demo/${page}`);
  }
});
