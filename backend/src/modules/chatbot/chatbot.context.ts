import { PRODUITS, REGIONS } from "@sunuprix/shared";
import * as referentielRepository from "../referentiel/referentiel.repository";
import * as prixRepository from "../prix/prix.repository";
import { calculerVariationPourcent } from "../prix/prix.service";
import type { ContexteChatbot, FaitMarche } from "./chatbot.types";

/** Retire les accents et met en minuscules, pour une recherche insensible aux accents/casse. */
function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function detecterMention(messageNormalise: string, candidats: readonly string[]): string | null {
  const trouve = candidats.find((candidat) => messageNormalise.includes(normaliser(candidat)));
  return trouve ?? null;
}

/**
 * Construit le contexte factuel utilisé pour ancrer la réponse du chatbot :
 * détecte un produit et/ou une région mentionnés dans le message (parmi les
 * listes fermées de `@sunuprix/shared`), puis va chercher les derniers prix
 * réels correspondants en base. Ni Gemini ni le mode de repli ne répondent
 * jamais sans être passés par cette étape — les deux s'appuient sur les
 * mêmes faits.
 */
export async function construireContexte(message: string): Promise<ContexteChatbot> {
  const messageNormalise = normaliser(message);

  const nomsProduits = PRODUITS.map((p) => p.nom);
  const produitMentionne = detecterMention(messageNormalise, nomsProduits);
  const regionMentionnee = detecterMention(messageNormalise, REGIONS);

  const [produits, regions] = await Promise.all([
    referentielRepository.listerProduits(),
    referentielRepository.listerRegions(),
  ]);

  const produitsACouvrir = produitMentionne
    ? produits.filter((p) => p.nom === produitMentionne)
    : produits.slice(0, 1); // à défaut de mention explicite, on illustre avec le premier produit de la liste.
  const regionsACouvrir = regionMentionnee ? regions.filter((r) => r.nom === regionMentionnee) : regions.slice(0, 1);

  const faits: FaitMarche[] = [];
  for (const produit of produitsACouvrir) {
    for (const region of regionsACouvrir) {
      const [dernier, precedent] = await prixRepository.trouverDeuxDerniersReleves(produit.id, region.id);
      if (!dernier) continue;
      faits.push({
        produit: produit.nom,
        unite: produit.unite,
        region: region.nom,
        prixActuelFcfa: dernier.prixFcfa,
        variationPourcent: precedent ? calculerVariationPourcent(dernier.prixFcfa, precedent.prixFcfa) : null,
        dateDernierReleve: dernier.dateReleve.toISOString(),
      });
    }
  }

  const resume =
    faits.length === 0
      ? "Aucune donnée de prix disponible pour construire une réponse précise."
      : faits
          .map((fait) => {
            const sensVariation =
              fait.variationPourcent === null ? "" : fait.variationPourcent >= 0 ? "hausse" : "baisse";
            const variationTexte =
              fait.variationPourcent === null
                ? "variation inconnue (historique insuffisant)"
                : `${sensVariation} de ${Math.abs(fait.variationPourcent)}% par rapport au relevé précédent`;
            return `${fait.produit} à ${fait.region} : ${fait.prixActuelFcfa} FCFA/${fait.unite} (${variationTexte}, au ${new Date(fait.dateDernierReleve).toLocaleDateString("fr-FR")}).`;
          })
          .join(" ");

  return { produitMentionne, regionMentionnee, faits, resume };
}
