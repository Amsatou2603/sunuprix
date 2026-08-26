import { prisma } from "../../config/prisma";

/** Seul point d'accès Prisma pour le modèle `Notification`. */

export function listerParUtilisateur(utilisateurId: string) {
  return prisma.notification.findMany({
    where: { utilisateurId },
    orderBy: { creeLe: "desc" },
  });
}

export function compterNonLues(utilisateurId: string) {
  return prisma.notification.count({ where: { utilisateurId, lue: false } });
}

export function trouverDerniereParUtilisateur(utilisateurId: string) {
  return prisma.notification.findFirst({
    where: { utilisateurId },
    orderBy: { creeLe: "desc" },
  });
}

export function creer(donnees: { utilisateurId: string; titre: string; message: string }) {
  return prisma.notification.create({ data: donnees });
}

export function trouverParId(id: string) {
  return prisma.notification.findUnique({ where: { id } });
}

export function marquerLue(id: string) {
  return prisma.notification.update({ where: { id }, data: { lue: true } });
}
