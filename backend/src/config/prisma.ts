import { PrismaClient } from "@prisma/client";
import { estProduction } from "./env";

/**
 * Client Prisma en singleton.
 *
 * En développement, `tsx watch` recharge le module à chaque changement de
 * fichier : sans précaution, chaque rechargement ouvrirait une nouvelle
 * connexion à la base. On mémorise donc l'instance sur `globalThis`.
 */
declare global {
  // eslint-disable-next-line no-var
  var __sunuprixPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__sunuprixPrisma ??
  new PrismaClient({
    log: estProduction ? ["error", "warn"] : ["warn", "error"],
  });

if (!estProduction) {
  globalThis.__sunuprixPrisma = prisma;
}
