import { defineConfig } from "vitest/config";

/**
 * Config de test minimale : environnement Node (pas de DOM nécessaire côté
 * API), variables d'environnement de test posées dans `src/__tests__/setup.ts`
 * avant tout import applicatif (voir ce fichier pour le détail).
 */
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.test.ts"],
  },
});
