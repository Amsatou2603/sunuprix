import { prisma } from "../../config/prisma";
import type { SeveriteAlerte } from "@prisma/client";

/** Seul point d'accès Prisma pour le modèle `Alerte` (alertes personnelles de prix). */

const INCLUSION = {
  produit: { select: { id: true, nom: true, unite: true } },
  region: { select: { id: true, nom: true } },
} as const;

export function listerParUtilisateur(utilisateurId: string) {
  return prisma.alerte.findMany({
    where: { utilisateurId },
    orderBy: { creeLe: "desc" },
    include: INCLUSION,
  });
}

export function listerActivesParUtilisateur(utilisateurId: string) {
  return prisma.alerte.findMany({ where: { utilisateurId, active: true } });
}

export function creer(donnees: {
  utilisateurId: string;
  produitId: string;
  regionId: string;
  seuilPourcent: number;
}) {
  return prisma.alerte.create({ data: donnees, include: INCLUSION });
}

export function trouverParId(id: string) {
  return prisma.alerte.findUnique({ where: { id } });
}

export function mettreAJour(id: string, donnees: { active?: boolean; seuilPourcent?: number }) {
  return prisma.alerte.update({ where: { id }, data: donnees, include: INCLUSION });
}

export function supprimer(id: string) {
  return prisma.alerte.delete({ where: { id } });
}

export function mettreAJourSeverite(id: string, severite: SeveriteAlerte) {
  return prisma.alerte.update({ where: { id }, data: { severite } });
}

export { INCLUSION };
