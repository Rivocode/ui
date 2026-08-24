import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/form/index.ts", "src/chart/index.ts"],
  format: "esm",
  dts: true,
  clean: true,
  // O pacote e "type": "module", entao .js ja e ESM. Sem isto o tsdown emite
  // .mjs e .d.mts, e os exports do package.json deixam de resolver.
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
  deps: { neverBundle: ["react", "react-dom", "lucide-react"] },
});
