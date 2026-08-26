import { prisma } from "../../config/prisma";

/** Seul point d'accès Prisma pour le modèle `Annonce`. */

export function creer(donnees: { auteurId: string; titre: string; contenu: string }) {
  return prisma.annonce.create({
    data: donnees,
    include: { auteur: { select: { id: true, nom: true, role: true } } },
  });
}

export function listerRecentes(limite = 10) {
  return prisma.annonce.findMany({
    orderBy: { publieeLe: "desc" },
    take: limite,
    include: { auteur: { select: { id: true, nom: true, role: true } } },
  });
}
