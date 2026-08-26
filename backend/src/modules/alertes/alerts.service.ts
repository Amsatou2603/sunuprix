import { ApiError } from "../../utils/ApiError";
import * as prixRepository from "../prix/prix.repository";
import { calculerVariationPourcent, verifierProduitEtRegion } from "../prix/prix.service";
import * as referentielRepository from "../referentiel/referentiel.repository";
import * as alertesRepository from "./alertes.repository";
import * as notificationsRepository from "./notifications.repository";
import * as configurationSeuilsRepository from "./configurationSeuils.repository";

/**
 * Service de détection de seuils : compare la dernière variation de prix
 * connue d'un couple produit/région aux alertes personnelles actives d'un
 * utilisateur et génère des notifications persistées lorsqu'un seuil est
 * dépassé. Volontairement synchrone et à la demande (déclenché à chaque
 * consultation du centre de notifications) plutôt que planifié par une tâche
 * de fond — suffisant pour une démonstration pédagogique, et testable
 * unitairement sans dépendre d'un ordonnanceur.
 */

type Severite = "INFO" | "ATTENTION" | "CRITIQUE";

export function determinerSeverite(
  variationAbsoluePourcent: number,
  config: { seuilAttentionPourcent: number; seuilCritiquePourcent: number },
): Severite {
  if (variationAbsoluePourcent >= config.seuilCritiquePourcent) return "CRITIQUE";
  if (variationAbsoluePourcent >= config.seuilAttentionPourcent) return "ATTENTION";
  return "INFO";
}

function construireTitreNotification(sens: "hausse" | "baisse", produitNom: string, regionNom: string, variation: number): string {
  const icone = sens === "hausse" ? "📈" : "📉";
  return `${icone} ${produitNom} à ${regionNom} : ${sens} de ${Math.abs(variation)}%`;
}

/**
 * Exécute une passe de détection pour toutes les alertes actives d'un
 * utilisateur et crée les notifications correspondantes. Idempotence
 * volontairement simple (évite de renotifier deux fois d'affilée pour
 * exactement le même événement) plutôt qu'un mécanisme de déduplication
 * complet — suffisant tant que la détection est déclenchée à la demande.
 */
export async function detecterEtNotifierPourUtilisateur(utilisateurId: string): Promise<number> {
  const [alertesActives, config, derniereNotification] = await Promise.all([
    alertesRepository.listerActivesParUtilisateur(utilisateurId),
    configurationSeuilsRepository.obtenirOuCreer(),
    notificationsRepository.trouverDerniereParUtilisateur(utilisateurId),
  ]);

  let titrePrecedent = derniereNotification?.titre ?? null;
  let nombreCreees = 0;

  for (const alerte of alertesActives) {
    if (!alerte.produitId || !alerte.regionId) continue;

    const [dernier, precedent] = await prixRepository.trouverDeuxDerniersReleves(alerte.produitId, alerte.regionId);
    if (!dernier || !precedent) continue;

    const variation = calculerVariationPourcent(dernier.prixFcfa, precedent.prixFcfa);
    if (variation === null || Math.abs(variation) < alerte.seuilPourcent) continue;

    const [produit, region] = await Promise.all([
      referentielRepository.trouverProduitParId(alerte.produitId),
      referentielRepository.trouverRegionParId(alerte.regionId),
    ]);
    if (!produit || !region) continue;

    const sens: "hausse" | "baisse" = variation >= 0 ? "hausse" : "baisse";
    const titre = construireTitreNotification(sens, produit.nom, region.nom, variation);

    if (titre === titrePrecedent) continue; // déjà notifié pour ce même événement

    const severite = determinerSeverite(Math.abs(variation), config);
    await notificationsRepository.creer({
      utilisateurId,
      titre,
      message: `Le prix de ${produit.nom} à ${region.nom} est passé à ${dernier.prixFcfa} FCFA/${produit.unite} (${sens} de ${Math.abs(variation)}% par rapport au relevé précédent du ${new Date(precedent.dateReleve).toLocaleDateString("fr-FR")}), au-delà de votre seuil personnel de ${alerte.seuilPourcent}% (niveau ${severite}).`,
    });
    await alertesRepository.mettreAJourSeverite(alerte.id, severite);

    titrePrecedent = titre;
    nombreCreees++;
  }

  return nombreCreees;
}

// --------------------------------------------------------------------------
// Alertes personnelles (CRUD)
// --------------------------------------------------------------------------

export async function listerMesAlertes(utilisateurId: string) {
  return alertesRepository.listerParUtilisateur(utilisateurId);
}

export async function creerAlerte(
  utilisateurId: string,
  donnees: { produitId: string; regionId: string; seuilPourcent?: number },
) {
  await verifierProduitEtRegion(donnees.produitId, donnees.regionId);

  const seuilPourcent = donnees.seuilPourcent ?? (await configurationSeuilsRepository.obtenirOuCreer()).seuilAttentionPourcent;
  if (seuilPourcent <= 0) {
    throw ApiError.mauvaiseRequete("Le seuil d'alerte doit être strictement positif.");
  }

  return alertesRepository.creer({
    utilisateurId,
    produitId: donnees.produitId,
    regionId: donnees.regionId,
    seuilPourcent,
  });
}

async function verifierProprietaire(id: string, utilisateurId: string) {
  const alerte = await alertesRepository.trouverParId(id);
  if (!alerte) throw ApiError.introuvable("Alerte introuvable.");
  if (alerte.utilisateurId !== utilisateurId) throw ApiError.acceIntedit("Cette alerte ne vous appartient pas.");
  return alerte;
}

export async function mettreAJourAlerte(
  id: string,
  utilisateurId: string,
  donnees: { active?: boolean; seuilPourcent?: number },
) {
  await verifierProprietaire(id, utilisateurId);
  return alertesRepository.mettreAJour(id, donnees);
}

export async function supprimerAlerte(id: string, utilisateurId: string): Promise<void> {
  await verifierProprietaire(id, utilisateurId);
  await alertesRepository.supprimer(id);
}

// --------------------------------------------------------------------------
// Notifications personnelles
// --------------------------------------------------------------------------

/** Liste les notifications de l'utilisateur, après avoir lancé une passe de détection à jour. */
export async function listerMesNotifications(utilisateurId: string) {
  await detecterEtNotifierPourUtilisateur(utilisateurId);
  return notificationsRepository.listerParUtilisateur(utilisateurId);
}

export async function compterNotificationsNonLues(utilisateurId: string): Promise<number> {
  return notificationsRepository.compterNonLues(utilisateurId);
}

export async function marquerNotificationLue(id: string, utilisateurId: string) {
  const notification = await notificationsRepository.trouverParId(id);
  if (!notification) throw ApiError.introuvable("Notification introuvable.");
  if (notification.utilisateurId !== utilisateurId) {
    throw ApiError.acceIntedit("Cette notification ne vous appartient pas.");
  }
  return notificationsRepository.marquerLue(id);
}

// --------------------------------------------------------------------------
// Seuils par défaut du système (configuration administrateur)
// --------------------------------------------------------------------------

export async function obtenirConfigurationSeuils() {
  return configurationSeuilsRepository.obtenirOuCreer();
}

export async function mettreAJourConfigurationSeuils(
  adminId: string,
  donnees: { seuilAttentionPourcent: number; seuilCritiquePourcent: number },
) {
  if (donnees.seuilAttentionPourcent <= 0 || donnees.seuilCritiquePourcent <= 0) {
    throw ApiError.mauvaiseRequete("Les seuils doivent être strictement positifs.");
  }
  if (donnees.seuilCritiquePourcent < donnees.seuilAttentionPourcent) {
    throw ApiError.mauvaiseRequete("Le seuil critique doit être supérieur ou égal au seuil d'attention.");
  }

  const configurationExistante = await configurationSeuilsRepository.obtenirOuCreer();
  return configurationSeuilsRepository.mettreAJour(configurationExistante.id, {
    seuilAttentionPourcent: donnees.seuilAttentionPourcent,
    seuilCritiquePourcent: donnees.seuilCritiquePourcent,
    misAJourParId: adminId,
  });
}
