/**
 * Seed direct via `pg` (sans Prisma Client), utilisé uniquement parce que
 * cet environnement de préparation n'a pas accès réseau à
 * `binaries.prisma.sh` pour générer le client Prisma. Reproduit exactement
 * la même logique déterministe que `backend/prisma/seed.ts` (mêmes régions,
 * produits, comptes de démonstration, génération d'historique de prix
 * tendance + saisonnalité + bruit). En production (Render), le seed normal
 * (`npm run seed`, basé sur Prisma Client) fonctionne sans ce contournement.
 */
import pg from "pg";
import bcrypt from "bcrypt";
import crypto from "node:crypto";

const { Client } = pg;

const DATABASE_URL = process.argv[2];
if (!DATABASE_URL) {
  console.error("Usage: node seed-direct-pg.mjs <DATABASE_URL>");
  process.exit(1);
}

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

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    console.log("Seed SunuPrix (direct pg) — démarrage...");

    // 1. Régions
    const regionIdParNom = new Map();
    for (const nom of REGIONS) {
      const existant = await client.query('SELECT id FROM regions WHERE nom = $1', [nom]);
      if (existant.rows.length > 0) {
        regionIdParNom.set(nom, existant.rows[0].id);
        continue;
      }
      const id = crypto.randomUUID();
      await client.query('INSERT INTO regions (id, nom) VALUES ($1, $2)', [id, nom]);
      regionIdParNom.set(nom, id);
    }
    console.log(`  Régions : ${regionIdParNom.size} prêtes.`);

    // 2. Produits
    const produitInfoParNom = new Map();
    for (const produit of PRODUITS) {
      const existant = await client.query('SELECT id FROM produits WHERE nom = $1', [produit.nom]);
      if (existant.rows.length > 0) {
        await client.query('UPDATE produits SET unite = $1, "prixBaseFcfa" = $2 WHERE id = $3', [
          produit.unite,
          produit.prixBaseFcfa,
          existant.rows[0].id,
        ]);
        produitInfoParNom.set(produit.nom, { id: existant.rows[0].id, prixBaseFcfa: produit.prixBaseFcfa });
        continue;
      }
      const id = crypto.randomUUID();
      await client.query('INSERT INTO produits (id, nom, unite, "prixBaseFcfa") VALUES ($1, $2, $3, $4)', [
        id,
        produit.nom,
        produit.unite,
        produit.prixBaseFcfa,
      ]);
      produitInfoParNom.set(produit.nom, { id, prixBaseFcfa: produit.prixBaseFcfa });
    }
    console.log(`  Produits : ${produitInfoParNom.size} prêts.`);

    // 3. Utilisateurs de démonstration
    for (const role of ROLES) {
      const email = `${role.toLowerCase()}@sunuprix.sn`;
      const nom = `${LIBELLES_ROLES[role]} Démo`;
      const existant = await client.query('SELECT id FROM utilisateurs WHERE email = $1', [email]);
      if (existant.rows.length > 0) continue;
      const motDePasseHash = await bcrypt.hash(MOT_DE_PASSE_DEMO, BCRYPT_SALT_ROUNDS);
      const id = crypto.randomUUID();
      await client.query(
        'INSERT INTO utilisateurs (id, email, "motDePasseHash", nom, role, actif, "creeLe", "misAJourLe") VALUES ($1, $2, $3, $4, $5, true, now(), now())',
        [id, email, motDePasseHash, nom, role],
      );
    }
    console.log(`  Utilisateurs de démonstration : ${ROLES.length} prêts.`);

    // 4. Historique de prix (idempotent : on repart de zéro pour la source SYSTEME)
    await client.query("DELETE FROM releves_de_prix WHERE source = 'SYSTEME'");

    let total = 0;
    for (const [nomProduit, infosProduit] of produitInfoParNom) {
      for (const nomRegion of REGIONS) {
        const regionId = regionIdParNom.get(nomRegion);
        if (!regionId) continue;

        const historique = genererHistoriquePrix(nomProduit, nomRegion, infosProduit.prixBaseFcfa);
        for (const point of historique) {
          const id = crypto.randomUUID();
          await client.query(
            'INSERT INTO releves_de_prix (id, "produitId", "regionId", "prixFcfa", source, statut, "dateReleve", "creeLe") VALUES ($1, $2, $3, $4, $5, $6, $7, now())',
            [id, infosProduit.id, regionId, point.prixFcfa, "SYSTEME", "VALIDE", point.date],
          );
          total++;
        }
      }
    }
    console.log(`  Historique de prix : ${total} relevés créés (12 mois × ${produitInfoParNom.size} produits × ${REGIONS.length} régions).`);

    console.log("Seed SunuPrix (direct pg) — terminé avec succès.");
  } finally {
    await client.end();
  }
}

main().catch((erreur) => {
  console.error("Échec du seed :", erreur);
  process.exitCode = 1;
});
