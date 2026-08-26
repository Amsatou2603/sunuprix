import * as annoncesRepository from "./annonces.repository";
import type { EntreePublicationAnnonce } from "./annonces.schema";

export function publierAnnonce(auteurId: string, donnees: EntreePublicationAnnonce) {
  return annoncesRepository.creer({ auteurId, titre: donnees.titre, contenu: donnees.contenu });
}

/** Visible par tous les rôles (affichées sur l'accueil). */
export function listerAnnonces(limite?: number) {
  return annoncesRepository.listerRecentes(limite);
}
