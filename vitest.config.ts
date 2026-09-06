import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next", "mobile"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // Next.js resolve "server-only" via alias interno do webpack; o Vite
      // não conhece esse alias, então apontamos pra um stub no-op.
      "server-only": path.resolve(__dirname, "test/stubs/server-only.ts"),
    },
  },
});
