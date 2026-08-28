import type { Role } from "@sunuprix/shared";

/** Miroir de `UtilisateurPublic` côté backend — jamais de mot de passe. */
export interface UtilisateurPublic {
  id: string;
  nom: string;
  // Null pour un compte créé uniquement via téléphone/OTP.
  email: string | null;
  // Non-null uniquement pour un compte créé ou vérifié via l'OTP SMS Twilio.
  telephone: string | null;
  role: Role;
  actif: boolean;
  creeLe: string;
}

export interface ReponseAuthentification {
  utilisateur: UtilisateurPublic;
}

export interface RoleDisponible {
  valeur: string;
  libelle: string;
}

// ---------------------------------------------------------------------------
// Référentiel (régions / produits)
// ---------------------------------------------------------------------------

export interface Region {
  id: string;
  nom: string;
}

export interface Produit {
  id: string;
  nom: string;
  unite: string;
  prixBaseFcfa: number;
}

// ---------------------------------------------------------------------------
// Prix
// ---------------------------------------------------------------------------

export interface PointHistoriquePrix {
  date: string;
  prixFcfa: number;
  source: "SYSTEME" | "VENDEUR";
}

export interface SnapshotRegion {
  regionId: string;
  region: string;
  prixActuelFcfa: number | null;
  variationMensuellePourcent: number | null;
  dateDernierReleve: string | null;
}

export type StatutDeclaration = "VALIDE" | "EN_ATTENTE" | "REJETE";

export interface DeclarationPrixPublique {
  id: string;
  produit: { id: string; nom: string; unite: string };
  region: { id: string; nom: string };
  prixFcfa: number;
  statut: StatutDeclaration;
  dateReleve: string;
  creeLe: string;
  modereLe: string | null;
  vendeur?: { id: string; nom: string; email: string } | null;
}

// ---------------------------------------------------------------------------
// Prédictions
// ---------------------------------------------------------------------------

export interface PredictionPublique {
  id: string;
  produitId: string;
  regionId: string;
  dateCible: string;
  prixPredit: number;
  margeErreurFcfa: number | null;
  methode: string;
  genereLe: string;
}

// ---------------------------------------------------------------------------
// Chatbot
// ---------------------------------------------------------------------------

export interface MessageConversation {
  role: "UTILISATEUR" | "ASSISTANT";
  contenu: string;
  horodatage: string;
}

export interface ReponseChatbot {
  conversationId: string;
  reponse: string;
  source: "GEMINI" | "REPLI_LOCAL";
}

// ---------------------------------------------------------------------------
// Alertes & notifications
// ---------------------------------------------------------------------------

export type SeveriteAlerte = "INFO" | "ATTENTION" | "CRITIQUE";

export interface Alerte {
  id: string;
  utilisateurId: string;
  produitId: string;
  regionId: string;
  produit: { id: string; nom: string; unite: string };
  region: { id: string; nom: string };
  seuilPourcent: number;
  active: boolean;
  severite: SeveriteAlerte;
  creeLe: string;
}

export interface NotificationUtilisateur {
  id: string;
  utilisateurId: string;
  titre: string;
  message: string;
  lue: boolean;
  creeLe: string;
}

export interface ConfigurationSeuils {
  id: string;
  seuilAttentionPourcent: number;
  seuilCritiquePourcent: number;
  misAJourLe: string;
}

// ---------------------------------------------------------------------------
// Ministère
// ---------------------------------------------------------------------------

export interface Annonce {
  id: string;
  titre: string;
  contenu: string;
  publieeLe: string;
  auteur: { id: string; nom: string; role: string };
}

export interface InflationRegion {
  regionId: string;
  region: string;
  inflationMoyennePourcent: number | null;
  nombreProduitsPrisEnCompte: number;
}
