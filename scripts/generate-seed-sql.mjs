/**
 * Génère les instructions SQL du seed SunuPrix (mêmes données déterministes
 * que backend/prisma/seed.ts) sans se connecter à la base — la sortie est
 * ensuite exécutée via l'outil Neon MCP (run_sql_transaction), car ce
 * bac à sable n'a pas d'accès réseau sortant direct vers Postgres.
 * Écrit un tableau JSON de chaînes SQL sur stdout.
 */
import bcrypt from "bcrypt";
import crypto from "node:crypto";

const REGIONS = ["Dakar", "Saint-Louis", "Thiès", "Louga", "Kaolack"];

const PRODUITS = [
  { nom: "Riz", unite: "kg", prixBaseFcfa: 450 },
  { nom: "Sucre", unite: "kg", prixBaseFcfa: 650 },
  { nom: "Huile", unite: "litre", prixBaseFcfa: 1100 },
  { nom: "Oignons", unite: "kg", prixBaseFcfa: 350 },
  { nom: "Pommes de terre", unite: "kg", prixBaseFcfa: 400 },
  { nom: "Mil", unite: "kg", prixBaseFcfa: 300 },
  { nom: "Farine de blé", unite: "kg", prixBaseFcfa: 380 },
  { nom: "Poisson frais", unite: "kg", prixBaseFcfa: 1500 },
  { nom: "Tomate", unite: "kg", prixBaseFcfa: 425 },
  { nom: "Lait en poudre", unite: "kg", prixBaseFcfa: 3200 },
  { nom: "Gaz butane", unite: "bonbonne", prixBaseFcfa: 3800 },
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

const NB_MOIS_HISTORIQUE = 12;
const MOT_DE_PASSE_DEMO = "SunuPrix2026!";
const BCRYPT_SALT_ROUNDS = 10;

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
  const graine = hacherChaineVersEntier(`${nomProduit}::${nomRegion}`);
  const tirer = creerGenerateurDeterministe(graine);

  const tauxTendanceMensuel = tirer() * 0.02 - 0.006;
  const amplitudeSaisonniere = 0.015 + tirer() * 0.02;
  const dephasageSaisonnier = tirer() * 2 * Math.PI;
  const bruitRelatifMax = 0.01 + tirer() * 0.015;

  const maintenant = new Date();
  const anneeCourante = maintenant.getFullYear();
  const moisCourant = maintenant.getMonth();

  const points = [];
  for (let indexMois = 0; indexMois < NB_MOIS_HISTORIQUE; indexMois++) {
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
