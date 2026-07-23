import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  // rollupTypes uses API Extractor, which drops `declare global` blocks —
  // the HTMLElementTagNameMap augmentation would vanish from the published types.
  // With a single source file there is nothing to roll up anyway.
  plugins: [dts()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/p-img.ts"),
      name: "p-img",
      fileName: "p-img",
    },
  },
});
