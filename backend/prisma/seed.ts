/**
 * Script de seed SunuPrix.
 *
 * Peuple la base de données avec :
 *   1. Les 5 régions et 12 produits (listes fermées, importées de @sunuprix/shared).
 *   2. Un utilisateur de démonstration par rôle (identifiants documentés dans le README).
 *   3. 24 mois d'historique de prix par produit × région, généré à partir de
 *      profils PAR PRODUIT (tendance, saisonnalité, volatilité) documentés
 *      dans `PROFILS_PRODUITS` ci-dessous et de multiplicateurs régionaux
 *      dans `MULTIPLICATEURS_REGIONAUX`, plutôt qu'un tirage aléatoire par
 *      paire produit/région comme dans la version précédente. Seul le bruit
 *      résiduel (`volatilite`) reste tiré par un PRNG déterministe (seedé par
 *      le nom du produit et de la région) — jamais Math.random() pur, et
 *      jamais la tendance elle-même.
 *
 * Pourquoi ce changement (voir aussi packages/shared/src/produits.ts) : le
 * moteur de prédiction (`predictions/regression.service.ts`) fait une
 * régression linéaire sur cet historique. Avec une tendance purement
 * aléatoire par paire, la "prédiction" n'avait aucun lien avec une réalité
 * économique — juste un ajustement à du bruit. Les profils ci-dessous
 * s'appuient sur des chiffres publiés (ANSD, presse économique
 * sénégalaise, grilles tarifaires officielles) afin que l'historique simulé
 * — et donc la prédiction qui en découle — se rapproche d'une trajectoire
 * d'inflation plausible. Cela reste un JEU DE DONNÉES SIMULÉ à but
 * pédagogique (voir le disclaimer de /a-propos), pas un import direct de
 * relevés de terrain.
 *
 * Exécution : `npm run seed -w @sunuprix/backend` (depuis la racine), ou
 * directement `npm run seed` depuis /backend une fois @sunuprix/shared construit.
 *
 * IMPORTANT : `scripts/generate-seed-sql.mjs` et `scripts/seed-direct-pg.mjs`
 * dupliquent volontairement cette même logique (contournements pour semer la
 * base sans passer par le client Prisma — voir leurs en-têtes). Toute
 * modification des profils/multiplicateurs ci-dessous doit être répercutée
 * dans ces deux fichiers pour rester cohérente.
 */
import "dotenv/config";
import { PrismaClient, type SourcePrix as SourcePrixType, type StatutPrix as StatutPrixType } from "@prisma/client";
import { PRODUITS, REGIONS, ROLES, LIBELLES_ROLES } from "@sunuprix/shared";
import { hacherMotDePasse } from "../src/utils/motDePasse";

const prisma = new PrismaClient();

const NB_MOIS_HISTORIQUE = 24;
/** Mot de passe commun à tous les comptes de démonstration (voir README). */
const MOT_DE_PASSE_DEMO = "SunuPrix2026!";

// ---------------------------------------------------------------------------
// Profils de tendance par produit — recherchés (août 2026), pas inventés.
//
//   tendanceAnnuelle       taux net sur 12 mois (0.05 = +5%/an, -0.03 = -3%/an)
//   amplitudeSaisonniere   amplitude de la saisonnalité (fraction du prix)
//   moisPicSaisonnier      mois du pic de prix, 0 = janvier … 11 = décembre
//   volatilite             bruit résiduel max par mois (fraction du prix)
//
// Sources principales : ANSD (notes trimestrielles IHPC, base 2023,
// ansd.sn) ; relevés régionaux prixdakar.com (janvier 2026) ; presse
// économique sénégalaise (dakaractu.com, lesoleil.sn, afriksoir.net) ;
// grille tarifaire TotalEnergies Sénégal (gaz butane).
// ---------------------------------------------------------------------------
interface ProfilProduit {
  tendanceAnnuelle: number;
  amplitudeSaisonniere: number;
  moisPicSaisonnier: number;
  volatilite: number;
}

const PROFIL_PAR_DEFAUT: ProfilProduit = {
  tendanceAnnuelle: 0.02,
  amplitudeSaisonniere: 0.02,
  moisPicSaisonnier: 6,
  volatilite: 0.02,
};

const PROFILS_PRODUITS: Record<string, ProfilProduit> = {
  // Baisse décidée par l'État en 2025 (riz brisé 410 → 350 FCFA/kg, -14,6 %,
  // afriksoir.net/allafrica.com) : tendance nette négative sur la fenêtre,
  // volatilité faible (prix régulé). Pic en soudure (août), creux après les
  // récoltes/importations massives (fin d'année).
  Riz: { tendanceAnnuelle: -0.03, amplitudeSaisonniere: 0.02, moisPicSaisonnier: 7, volatilite: 0.015 },
  // Demande saisonnière (Ramadan/fêtes) + coûts d'import ; ANSD note une
  // inflation alimentaire modérée mais continue.
  Sucre: { tendanceAnnuelle: 0.04, amplitudeSaisonniere: 0.02, moisPicSaisonnier: 3, volatilite: 0.02 },
  // Huile importée, exposée au marché mondial des huiles végétales.
  Huile: { tendanceAnnuelle: 0.05, amplitudeSaisonniere: 0.025, moisPicSaisonnier: 3, volatilite: 0.025 },
  // Très volatil : relevés régionaux réels de 288 à 793 FCFA/kg selon le
  // type et le mois (prixdakar.com, juil. 2026). Récolte ~fév-avr (creux),
  // soudure ~sept (pic).
  Oignons: { tendanceAnnuelle: 0.02, amplitudeSaisonniere: 0.22, moisPicSaisonnier: 8, volatilite: 0.05 },
  // Tubercules +5,4 % en un mois sur le relevé ANSD de juil. 2026 (hausse
  // sensible) ; hausse régionale confirmée (Diourbel/Thiès, prixdakar.com).
  "Pommes de terre": { tendanceAnnuelle: 0.06, amplitudeSaisonniere: 0.1, moisPicSaisonnier: 8, volatilite: 0.03 },
  // Céréale de base moins suivie dans la presse que le riz ; estimation
  // raisonnable (pas de relevé chiffré direct trouvé) : cycle soudure
  // (juil-sept, cher) / récolte (oct-nov, moins cher).
  Mil: { tendanceAnnuelle: 0.02, amplitudeSaisonniere: 0.12, moisPicSaisonnier: 7, volatilite: 0.025 },
  // Blé 100 % importé au Sénégal, volumes d'importation en hausse continue
  // (agenceecofin.com) → exposition directe aux cours mondiaux et au FCFA/USD.
  "Farine de blé": { tendanceAnnuelle: 0.05, amplitudeSaisonniere: 0.02, moisPicSaisonnier: 5, volatilite: 0.02 },
  // ANSD : poisson frais -11,1 % au 2e trimestre 2026 (dakaractu.com) →
  // tendance nette négative. Saisonnalité hivernage (juil-sept, moins de
  // sorties de pêche, prix plus élevés).
  "Poisson frais": { tendanceAnnuelle: -0.05, amplitudeSaisonniere: 0.08, moisPicSaisonnier: 8, volatilite: 0.04 },
  // Le produit frais le plus volatil dans les relevés ANSD trouvés (+26,2 %
  // en un mois puis -6,3 % au trimestre suivant, dakaractu.com) : récolte
  // déc-mars (bon marché), soudure juin-sept (cher).
  Tomate: { tendanceAnnuelle: 0.02, amplitudeSaisonniere: 0.35, moisPicSaisonnier: 7, volatilite: 0.06 },
  // Produit importé conditionné (type Nido/Vitalait) : peu spéculatif,
  // tendance douce, quasi pas de saisonnalité.
  "Lait en poudre": { tendanceAnnuelle: 0.03, amplitudeSaisonniere: 0.015, moisPicSaisonnier: 0, volatilite: 0.012 },
  // Prix administré/subventionné par l'État (grille TotalEnergies Sénégal :
  // bonbonne 6 kg ≈ 2 885 FCFA au détail) : quasiment stable, ne suit pas le
  // marché comme les denrées fraîches.
  "Gaz butane": { tendanceAnnuelle: 0.005, amplitudeSaisonniere: 0, moisPicSaisonnier: 0, volatilite: 0.005 },
  // Produit manufacturé générique : suit à peu près l'inflation "cœur" hors
  // énergie/produits frais publiée par l'ANSD (~+0,5 %/trimestre).
  Savon: { tendanceAnnuelle: 0.02, amplitudeSaisonniere: 0.01, moisPicSaisonnier: 0, volatilite: 0.015 },
};

// ---------------------------------------------------------------------------
// Multiplicateurs régionaux — écart de prix par rapport à la référence
// nationale (Dakar = 1,00). Sourcés quand un relevé régional existe
// (prixdakar.com, janv. 2026 ; lesoleil.sn pour le poisson au Djolof/Louga) ;
// sinon, un écart modéré reflétant l'éloignement du port de Dakar (transport)
// ou une zone de production connue, explicitement documenté ci-dessous.
// ---------------------------------------------------------------------------
const MULTIPLICATEUR_REGIONAL_PAR_DEFAUT: Record<string, number> = {
  Dakar: 1.0,
  "Saint-Louis": 1.0,
  Thiès: 1.01,
  Louga: 1.03,
  Kaolack: 1.04,
};

const MULTIPLICATEURS_REGIONAUX: Record<string, Record<string, number>> = {
  // Relevés prixdakar.com (janv. 2026, riz brisé ordinaire local) : Dakar
  // 369, Saint-Louis 358, Thiès 483, Kaolack 443 FCFA/kg (Louga non
  // couverte par la source, estimée entre Saint-Louis et Kaolack).
  Riz: { Dakar: 1.0, "Saint-Louis": 0.97, Thiès: 1.15, Louga: 1.03, Kaolack: 1.1 },
  // Louga (zone des Niayes/Potou) est un grand bassin de production
  // d'oignon : prix le plus bas. Thiès, également proche des Niayes,
  // suit (326 FCFA/kg relevé à Thiès, prixdakar.com). Kaolack, plus
  // éloignée des zones de production, plus chère.
  Oignons: { Dakar: 1.05, "Saint-Louis": 1.0, Thiès: 0.85, Louga: 0.78, Kaolack: 1.12 },
  "Pommes de terre": { Dakar: 1.0, "Saint-Louis": 1.02, Thiès: 1.15, Louga: 1.05, Kaolack: 1.08 },
  // Poisson nettement plus cher dans le Djolof (Louga, intérieur des
  // terres) que sur la côte : sardinelle à 2 000 FCFA/kg relevée à
  // Linguère contre un prix côtier courant bien inférieur (lesoleil.sn).
  // Dakar/Saint-Louis/Thiès (sites de débarquement) restent moins chères.
  "Poisson frais": { Dakar: 0.9, "Saint-Louis": 0.85, Thiès: 0.88, Louga: 1.85, Kaolack: 1.15 },
  // Kaolack (bassin arachidier/céréalier) : production céréalière locale
  // importante, mil un peu moins cher qu'à Dakar.
  Mil: { Dakar: 1.05, "Saint-Louis": 0.98, Thiès: 0.97, Louga: 0.98, Kaolack: 0.95 },
  Tomate: { Dakar: 1.03, "Saint-Louis": 0.98, Thiès: 0.97, Louga: 0.98, Kaolack: 0.95 },
};

function multiplicateurRegional(nomProduit: string, nomRegion: string): number {
  const parProduit = MULTIPLICATEURS_REGIONAUX[nomProduit];
  if (parProduit && nomRegion in parProduit) return parProduit[nomRegion];
  return MULTIPLICATEUR_REGIONAL_PAR_DEFAUT[nomRegion] ?? 1;
}

// ---------------------------------------------------------------------------
// Génération déterministe (bruit résiduel uniquement — la tendance et la
// saisonnalité viennent des profils ci-dessus, jamais d'un tirage aléatoire).
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
 * Construit `NB_MOIS_HISTORIQUE` points mensuels de prix pour un couple
 * produit/région donné : prix de référence (base × multiplicateur régional)
 * combiné à la tendance et la saisonnalité documentées du produit, plus un
 * bruit résiduel borné et déterministe. Le dernier point (mois courant) est
 * ancré près du prix de référence réel du produit/région.
 */
function genererHistoriquePrix(nomProduit: string, nomRegion: string, prixBaseFcfa: number): PointHistorique[] {
  const profil = PROFILS_PRODUITS[nomProduit] ?? PROFIL_PAR_DEFAUT;
  const prixReference = prixBaseFcfa * multiplicateurRegional(nomProduit, nomRegion);
  const tauxTendanceMensuel = profil.tendanceAnnuelle / 12;

  const graine = hacherChaineVersEntier(`${nomProduit}::${nomRegion}`);
  const tirer = creerGenerateurDeterministe(graine);

  const maintenant = new Date();
  const anneeCourante = maintenant.getFullYear();
  const moisCourant = maintenant.getMonth();

  const points: PointHistorique[] = [];
  for (let indexMois = 0; indexMois < NB_MOIS_HISTORIQUE; indexMois++) {
    // indexMois = 0 -> il y a NB_MOIS_HISTORIQUE-1 mois ; dernier indice -> mois courant.
    const moisAvantAujourdHui = NB_MOIS_HISTORIQUE - 1 - indexMois;
    const date = new Date(anneeCourante, moisCourant - moisAvantAujourdHui, 1);
    const moisCalendaire = date.getMonth();

    const facteurTendance = (1 + tauxTendanceMensuel) ** -moisAvantAujourdHui;
    // Sinusoïde calée sur le vrai mois calendaire (pas un déphasage
    // aléatoire) : maximale exactement au mois du pic saisonnier documenté.
    const phase = ((moisCalendaire - profil.moisPicSaisonnier) / 12) * 2 * Math.PI + Math.PI / 2;
    const facteurSaison = 1 + profil.amplitudeSaisonniere * Math.sin(phase);
    const facteurBruit = 1 + (tirer() * 2 - 1) * profil.volatilite;

    const prixFcfa = Math.max(1, Math.round(prixReference * facteurTendance * facteurSaison * facteurBruit));

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
  console.log(
    `  Historique de prix : ${lignes.length} relevés créés (${NB_MOIS_HISTORIQUE} mois × ${produitsParNom.size} produits × ${REGIONS.length} régions).`,
  );
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
