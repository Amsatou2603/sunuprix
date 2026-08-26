import { prisma } from "../../config/prisma";
import { SEUIL_ATTENTION_POURCENT_DEFAUT, SEUIL_CRITIQUE_POURCENT_DEFAUT } from "../../config/constants";

/**
 * Seul point d'accès Prisma pour la configuration singleton des seuils
 * d'alerte par défaut (`ConfigurationSeuils`). La ligne est créée
 * paresseusement au premier accès si elle n'existe pas encore.
 */

export async function obtenirOuCreer() {
  const existante = await prisma.configurationSeuils.findFirst();
  if (existante) return existante;

  return prisma.configurationSeuils.create({
    data: {
      seuilAttentionPourcent: SEUIL_ATTENTION_POURCENT_DEFAUT,
      seuilCritiquePourcent: SEUIL_CRITIQUE_POURCENT_DEFAUT,
    },
  });
}

export function mettreAJour(
  id: string,
  donnees: { seuilAttentionPourcent: number; seuilCritiquePourcent: number; misAJourParId: string },
) {
  return prisma.configurationSeuils.update({ where: { id }, data: donnees });
}
