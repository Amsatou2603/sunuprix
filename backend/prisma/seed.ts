/**
 * Script de seed SunuPrix.
 *
 * Peuple la base de données avec :
 *   1. Les 5 régions et 12 produits (listes fermées, importées de @sunuprix/shared).
 *   2. Un utilisateur de démonstration par rôle (identifiants documentés dans le README).
 *   3. 12 mois d'historique de prix par produit × région, généré de façon
 *      réaliste : une tendance mensuelle + une saisonnalité sinusoïdale +
 *      un bruit borné — jamais un aléatoire pur (le résultat est déterministe
 *      d'une exécution à l'autre, seedé par le nom du produit et de la région).
 *
 * Exécution : `npm run seed -w @sunuprix/backend` (depuis la racine), ou
 * directement `npm run seed` depuis /backend une fois @sunuprix/shared construit.
 */
import "dotenv/config";
import { PrismaClient, type SourcePrix as SourcePrixType, type StatutPrix as StatutPrixType } from "@prisma/client";
import { PRODUITS, REGIONS, ROLES, LIBELLES_ROLES } from "@sunuprix/shared";
import { hacherMotDePasse } from "../src/utils/motDePasse";

const prisma = new PrismaClient();

const NB_MOIS_HISTORIQUE = 12;
/** Mot de passe commun à tous les comptes de démonstration (voir README). */
const MOT_DE_PASSE_DEMO = "SunuPrix2026!";

// ---------------------------------------------------------------------------
// Génération déterministe "tendance + bruit" (pas d'aléatoire pur)
// ---------------------------------------------------------------------------

/** Hash simple (FNV-1a) d'une chaîne vers un entier 32 bits non signé. */
function hacherChaineVersEntier(chaine: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < chaine.length; i++) {
    h ^= chaine.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Générateur pseudo-aléatoire déterministe (mulberry32), seedé par un entier. */
function creerGenerateurDeterministe(graine: number): () => number {
  let etat = graine >>> 0;
  return function tirer(): number {
    etat = (etat + 0x6d2b79f5) | 0;
    let t = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface PointHistorique {
  date: Date;
  prixFcfa: number;
}

/**
 * Construit 12 points mensuels de prix pour un couple produit/région donné,
 * en combinant une tendance de fond (haussière ou baissière selon le produit
 * et la région), une saisonnalité sinusoïdale légère et un bruit borné. Le
 * dernier point (mois courant) est ancré près du prix de base du produit.
 */
function genererHistoriquePrix(nomProduit: string, nomRegion: string, prixBaseFcfa: number): PointHistorique[] {
  const graine = hacherChaineVersEntier(`${nomProduit}::${nomRegion}`);
  const tirer = creerGenerateurDeterministe(graine);

  // Tendance mensuelle entre -0.6% et +1.4% (légèrement biaisée à la hausse,
  // cohérent avec un contexte d'inflation modérée sur les denrées de base).
  const tauxTendanceMensuel = tirer() * 0.02 - 0.006;
  // Amplitude et déphasage d'une saisonnalité sinusoïdale sur 12 mois.
  const amplitudeSaisonniere = 0.015 + tirer() * 0.02;
  const dephasageSaisonnier = tirer() * 2 * Math.PI;
  // Bruit relatif maximum appliqué à chaque point (évite un signal trop lisse).
  const bruitRelatifMax = 0.01 + tirer() * 0.015;

  const maintenant = new Date();
  const anneeCourante = maintenant.getFullYear();
  const moisCourant = maintenant.getMonth();

  const points: PointHistorique[] = [];
  for (let indexMois = 0; indexMois < NB_MOIS_HISTORIQUE; indexMois++) {
    // indexMois = 0 -> il y a 11 mois ; indexMois = 11 -> mois courant.
    const moisAvantAujourdHui = NB_MOIS_HISTORIQUE - 1 - indexMois;
    const facteurTendance = (1 + tauxTendanceMensuel) ** -moisAvantAujourdHui;
    const facteurSaison = 1 + amplitudeSaisonniere * Math.sin((indexMois / 12) * 2 * Math.PI + dephasageSaisonnier);
    const facteurBruit = 1 + (tirer() * 2 - 1) * bruitRelatifMax;

    const prixFcfa = Math.round(prixBaseFcfa * facteurTendance * facteurSaison * facteurBruit);
    const date = new Date(anneeCourante, moisCourant - moisAvantAujourdHui, 1);

    points.push({ date, prixFcfa });
  }

  return points;
}

// ---------------------------------------------------------------------------
// Étapes de seed
// ---------------------------------------------------------------------------

async function semerRegions(): Promise<Map<string, string>> {
  const idsParNom = new Map<string, string>();
  for (const nom of REGIONS) {
    const region = await prisma.region.upsert({
      where: { nom },
      update: {},
      create: { nom },
    });
    idsParNom.set(nom, region.id);
  }
  console.log(`  Régions : ${idsParNom.size} prêtes.`);
  return idsParNom;
}

async function semerProduits(): Promise<Map<string, { id: string; prixBaseFcfa: number }>> {
  const infosParNom = new Map<string, { id: string; prixBaseFcfa: number }>();
  for (const produit of PRODUITS) {
    const enregistrement = await prisma.produit.upsert({
      where: { nom: produit.nom },
      update: { unite: produit.unite, prixBaseFcfa: produit.prixBaseFcfa },
      create: { nom: produit.nom, unite: produit.unite, prixBaseFcfa: produit.prixBaseFcfa },
    });
    infosParNom.set(produit.nom, { id: enregistrement.id, prixBaseFcfa: produit.prixBaseFcfa });
  }
  console.log(`  Produits : ${infosParNom.size} prêts.`);
  return infosParNom;
}

async function semerUtilisateursDemo(): Promise<void> {
  for (const role of ROLES) {
    const email = `${role.toLowerCase()}@sunuprix.sn`;
    const nom = `${LIBELLES_ROLES[role]} Démo`;
    const motDePasseHash = await hacherMotDePasse(MOT_DE_PASSE_DEMO);

    await prisma.utilisateur.upsert({
      where: { email },
      update: {},
      create: { email, nom, motDePasseHash, role },
    });
  }
  console.log(`  Utilisateurs de démonstration : ${ROLES.length} prêts (voir README pour les identifiants).`);
}

async function semerHistoriquePrix(
  regionsParNom: Map<string, string>,
  produitsParNom: Map<string, { id: string; prixBaseFcfa: number }>,
): Promise<void> {
  // Idempotence : on regénère systématiquement l'historique "système" plutôt
  // que d'empiler des doublons à chaque exécution du seed.
  await prisma.relevePrix.deleteMany({ where: { source: "SYSTEME" as SourcePrixType } });

  const lignes: {
    produitId: string;
    regionId: string;
    prixFcfa: number;
    source: SourcePrixType;
    statut: StatutPrixType;
    dateReleve: Date;
  }[] = [];

  for (const [nomProduit, infosProduit] of produitsParNom) {
    for (const nomRegion of REGIONS) {
      const regionId = regionsParNom.get(nomRegion);
      if (!regionId) continue;

      const historique = genererHistoriquePrix(nomProduit, nomRegion, infosProduit.prixBaseFcfa);
      for (const point of historique) {
        lignes.push({
          produitId: infosProduit.id,
          regionId,
          prixFcfa: point.prixFcfa,
          source: "SYSTEME" as SourcePrixType,
          statut: "VALIDE" as StatutPrixType,
          dateReleve: point.date,
        });
      }
    }
  }

  await prisma.relevePrix.createMany({ data: lignes });
  console.log(`  Historique de prix : ${lignes.length} relevés créés (12 mois × ${produitsParNom.size} produits × ${REGIONS.length} régions).`);
}

async function main(): Promise<void> {
  console.log("Seed SunuPrix — démarrage...");
  const regionsParNom = await semerRegions();
  const produitsParNom = await semerProduits();
  await semerUtilisateursDemo();
  await semerHistoriquePrix(regionsParNom, produitsParNom);
  console.log("Seed SunuPrix — terminé avec succès.");
}

main()
  .catch((erreur) => {
    console.error("Échec du seed :", erreur);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
