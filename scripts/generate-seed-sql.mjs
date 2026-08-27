/**
 * Génère les instructions SQL du seed SunuPrix (mêmes données déterministes
 * que backend/prisma/seed.ts) sans se connecter à la base — la sortie est
 * ensuite exécutée via l'outil Neon MCP (run_sql_transaction), car ce
 * bac à sable n'a pas d'accès réseau sortant direct vers Postgres.
 * Écrit un tableau JSON de chaînes SQL sur stdout.
 *
 * IMPORTANT : les profils de tendance/saisonnalité et les multiplicateurs
 * régionaux ci-dessous sont dupliqués depuis backend/prisma/seed.ts (voir
 * ce fichier pour les sources et justifications détaillées de chaque
 * chiffre — ANSD, prixdakar.com, presse économique sénégalaise). Toute
 * modification doit être répercutée dans les deux fichiers.
 */
import bcrypt from "bcrypt";
import crypto from "node:crypto";

const REGIONS = ["Dakar", "Saint-Louis", "Thiès", "Louga", "Kaolack"];

const PRODUITS = [
  { nom: "Riz", unite: "kg", prixBaseFcfa: 370 },
  { nom: "Sucre", unite: "kg", prixBaseFcfa: 650 },
  { nom: "Huile", unite: "litre", prixBaseFcfa: 1050 },
  { nom: "Oignons", unite: "kg", prixBaseFcfa: 380 },
  { nom: "Pommes de terre", unite: "kg", prixBaseFcfa: 480 },
  { nom: "Mil", unite: "kg", prixBaseFcfa: 300 },
  { nom: "Farine de blé", unite: "kg", prixBaseFcfa: 340 },
  { nom: "Poisson frais", unite: "kg", prixBaseFcfa: 1000 },
  { nom: "Tomate", unite: "kg", prixBaseFcfa: 450 },
  { nom: "Lait en poudre", unite: "kg", prixBaseFcfa: 3200 },
  { nom: "Gaz butane", unite: "bonbonne (6 kg)", prixBaseFcfa: 2900 },
  { nom: "Savon", unite: "unité", prixBaseFcfa: 500 },
];

const ROLES = ["ADMIN", "CHERCHEUR", "MINISTERE", "VENDEUR", "CONSOMMATEUR"];
const LIBELLES_ROLES = {
  ADMIN: "Administrateur",
  CHERCHEUR: "Chercheur",
  MINISTERE: "Ministère",
  VENDEUR: "Vendeur",
  CONSOMMATEUR: "Consommateur",
};

const NB_MOIS_HISTORIQUE = 24;
const MOT_DE_PASSE_DEMO = "SunuPrix2026!";
const BCRYPT_SALT_ROUNDS = 10;

// Voir backend/prisma/seed.ts pour le détail des sources de chaque profil.
const PROFIL_PAR_DEFAUT = { tendanceAnnuelle: 0.02, amplitudeSaisonniere: 0.02, moisPicSaisonnier: 6, volatilite: 0.02 };

const PROFILS_PRODUITS = {
  Riz: { tendanceAnnuelle: -0.03, amplitudeSaisonniere: 0.02, moisPicSaisonnier: 7, volatilite: 0.015 },
  Sucre: { tendanceAnnuelle: 0.04, amplitudeSaisonniere: 0.02, moisPicSaisonnier: 3, volatilite: 0.02 },
  Huile: { tendanceAnnuelle: 0.05, amplitudeSaisonniere: 0.025, moisPicSaisonnier: 3, volatilite: 0.025 },
  Oignons: { tendanceAnnuelle: 0.02, amplitudeSaisonniere: 0.22, moisPicSaisonnier: 8, volatilite: 0.05 },
  "Pommes de terre": { tendanceAnnuelle: 0.06, amplitudeSaisonniere: 0.1, moisPicSaisonnier: 8, volatilite: 0.03 },
  Mil: { tendanceAnnuelle: 0.02, amplitudeSaisonniere: 0.12, moisPicSaisonnier: 7, volatilite: 0.025 },
  "Farine de blé": { tendanceAnnuelle: 0.05, amplitudeSaisonniere: 0.02, moisPicSaisonnier: 5, volatilite: 0.02 },
  "Poisson frais": { tendanceAnnuelle: -0.05, amplitudeSaisonniere: 0.08, moisPicSaisonnier: 8, volatilite: 0.04 },
  Tomate: { tendanceAnnuelle: 0.02, amplitudeSaisonniere: 0.35, moisPicSaisonnier: 7, volatilite: 0.06 },
  "Lait en poudre": { tendanceAnnuelle: 0.03, amplitudeSaisonniere: 0.015, moisPicSaisonnier: 0, volatilite: 0.012 },
  "Gaz butane": { tendanceAnnuelle: 0.005, amplitudeSaisonniere: 0, moisPicSaisonnier: 0, volatilite: 0.005 },
  Savon: { tendanceAnnuelle: 0.02, amplitudeSaisonniere: 0.01, moisPicSaisonnier: 0, volatilite: 0.015 },
};

const MULTIPLICATEUR_REGIONAL_PAR_DEFAUT = { Dakar: 1.0, "Saint-Louis": 1.0, Thiès: 1.01, Louga: 1.03, Kaolack: 1.04 };

const MULTIPLICATEURS_REGIONAUX = {
  Riz: { Dakar: 1.0, "Saint-Louis": 0.97, Thiès: 1.15, Louga: 1.03, Kaolack: 1.1 },
  Oignons: { Dakar: 1.05, "Saint-Louis": 1.0, Thiès: 0.85, Louga: 0.78, Kaolack: 1.12 },
  "Pommes de terre": { Dakar: 1.0, "Saint-Louis": 1.02, Thiès: 1.15, Louga: 1.05, Kaolack: 1.08 },
  "Poisson frais": { Dakar: 0.9, "Saint-Louis": 0.85, Thiès: 0.88, Louga: 1.85, Kaolack: 1.15 },
  Mil: { Dakar: 1.05, "Saint-Louis": 0.98, Thiès: 0.97, Louga: 0.98, Kaolack: 0.95 },
  Tomate: { Dakar: 1.03, "Saint-Louis": 0.98, Thiès: 0.97, Louga: 0.98, Kaolack: 0.95 },
};

function multiplicateurRegional(nomProduit, nomRegion) {
  const parProduit = MULTIPLICATEURS_REGIONAUX[nomProduit];
  if (parProduit && nomRegion in parProduit) return parProduit[nomRegion];
  return MULTIPLICATEUR_REGIONAL_PAR_DEFAUT[nomRegion] ?? 1;
}

function hacherChaineVersEntier(chaine) {
  let h = 0x811c9dc5;
  for (let i = 0; i < chaine.length; i++) {
    h ^= chaine.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function creerGenerateurDeterministe(graine) {
  let etat = graine >>> 0;
  return function tirer() {
    etat = (etat + 0x6d2b79f5) | 0;
    let t = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function genererHistoriquePrix(nomProduit, nomRegion, prixBaseFcfa) {
  const profil = PROFILS_PRODUITS[nomProduit] ?? PROFIL_PAR_DEFAUT;
  const prixReference = prixBaseFcfa * multiplicateurRegional(nomProduit, nomRegion);
  const tauxTendanceMensuel = profil.tendanceAnnuelle / 12;

  const graine = hacherChaineVersEntier(`${nomProduit}::${nomRegion}`);
  const tirer = creerGenerateurDeterministe(graine);

  const maintenant = new Date();
  const anneeCourante = maintenant.getFullYear();
  const moisCourant = maintenant.getMonth();

  const points = [];
  for (let indexMois = 0; indexMois < NB_MOIS_HISTORIQUE; indexMois++) {
    const moisAvantAujourdHui = NB_MOIS_HISTORIQUE - 1 - indexMois;
    const date = new Date(anneeCourante, moisCourant - moisAvantAujourdHui, 1);
    const moisCalendaire = date.getMonth();

    const facteurTendance = (1 + tauxTendanceMensuel) ** -moisAvantAujourdHui;
    const phase = ((moisCalendaire - profil.moisPicSaisonnier) / 12) * 2 * Math.PI + Math.PI / 2;
    const facteurSaison = 1 + profil.amplitudeSaisonniere * Math.sin(phase);
    const facteurBruit = 1 + (tirer() * 2 - 1) * profil.volatilite;

    const prixFcfa = Math.max(1, Math.round(prixReference * facteurTendance * facteurSaison * facteurBruit));

    points.push({ date, prixFcfa });
  }

  return points;
}

function sqlEscape(valeur) {
  return valeur.replace(/'/g, "''");
}

function dateSql(date) {
  const iso = date.toISOString().slice(0, 10);
  return iso;
}

async function main() {
  const statements = [];

  const regionIdParNom = new Map();
  for (const nom of REGIONS) {
    const id = crypto.randomUUID();
    regionIdParNom.set(nom, id);
  }
  statements.push(
    `INSERT INTO regions (id, nom) VALUES ${REGIONS.map(
      (nom) => `('${regionIdParNom.get(nom)}', '${sqlEscape(nom)}')`,
    ).join(", ")}`,
  );

  const produitInfoParNom = new Map();
  for (const produit of PRODUITS) {
    const id = crypto.randomUUID();
    produitInfoParNom.set(produit.nom, { id, prixBaseFcfa: produit.prixBaseFcfa });
  }
  statements.push(
    `INSERT INTO produits (id, nom, unite, "prixBaseFcfa") VALUES ${PRODUITS.map(
      (p) => `('${produitInfoParNom.get(p.nom).id}', '${sqlEscape(p.nom)}', '${sqlEscape(p.unite)}', ${p.prixBaseFcfa})`,
    ).join(", ")}`,
  );

  const utilisateurValeurs = [];
  for (const role of ROLES) {
    const email = `${role.toLowerCase()}@sunuprix.sn`;
    const nom = `${LIBELLES_ROLES[role]} Démo`;
    const id = crypto.randomUUID();
    const motDePasseHash = await bcrypt.hash(MOT_DE_PASSE_DEMO, BCRYPT_SALT_ROUNDS);
    utilisateurValeurs.push(
      `('${id}', '${sqlEscape(email)}', '${sqlEscape(motDePasseHash)}', '${sqlEscape(nom)}', '${role}', true, now(), now())`,
    );
  }
  statements.push(
    `INSERT INTO utilisateurs (id, email, "motDePasseHash", nom, role, actif, "creeLe", "misAJourLe") VALUES ${utilisateurValeurs.join(", ")}`,
  );

  let totalReleves = 0;
  for (const [nomProduit, infosProduit] of produitInfoParNom) {
    for (const nomRegion of REGIONS) {
      const regionId = regionIdParNom.get(nomRegion);
      const historique = genererHistoriquePrix(nomProduit, nomRegion, infosProduit.prixBaseFcfa);
      const valeurs = historique.map((point) => {
        const id = crypto.randomUUID();
        totalReleves++;
        return `('${id}', '${infosProduit.id}', '${regionId}', ${point.prixFcfa}, 'SYSTEME', 'VALIDE', '${dateSql(point.date)}', now())`;
      });
      statements.push(
        `INSERT INTO releves_de_prix (id, "produitId", "regionId", "prixFcfa", source, statut, "dateReleve", "creeLe") VALUES ${valeurs.join(", ")}`,
      );
    }
  }

  process.stderr.write(
    `Généré : 1 requête régions (${REGIONS.length}), 1 requête produits (${PRODUITS.length}), 1 requête utilisateurs (${ROLES.length}), ${statements.length - 3} requêtes historique (${totalReleves} relevés).\n`,
  );

  process.stdout.write(JSON.stringify(statements));
}

main();
