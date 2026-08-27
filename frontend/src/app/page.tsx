"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth/AuthContext";
import { ministereApi } from "@/lib/api/ministere";
import { referentielApi } from "@/lib/api/referentiel";
import { prixApi } from "@/lib/api/prix";
import { predictionsApi } from "@/lib/api/predictions";
import { statsApi, type StatsPubliques } from "@/lib/api/stats";
import { ListeAnnonces } from "@/components/partages/ListeAnnonces";
import { GraphiquePrix } from "@/components/donnees/GraphiquePrix";
import { CarteApercuAccueil } from "@/components/accueil/CarteApercuAccueil";
import type {
  Annonce,
  PointHistoriquePrix,
  PredictionPublique,
  Produit,
  Region,
  SnapshotRegion,
} from "@/lib/api/types";

const FONCTIONNALITES = [
  {
    href: "/chercheur",
    icone: "🔬",
    titre: "Analyse comparative",
    description: "Comparez produits et régions, avec un diagnostic généré par l'IA en quelques lignes claires.",
  },
  {
    href: "/donnees",
    icone: "📈",
    titre: "Suivi & prédictions",
    description: "Historique des prix et prédiction du mois suivant, région par région.",
  },
  {
    href: "/alertes",
    icone: "🔔",
    titre: "Alertes personnalisées",
    description: "Soyez notifié dès qu'un produit franchit le seuil de variation que vous avez choisi.",
  },
  {
    href: "/chatbot",
    icone: "🤖",
    titre: "Assistant SunuBot",
    description: "Posez vos questions sur les prix et l'inflation, en français, ancré sur les données réelles.",
  },
];

const variantsSection = {
  cache: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export default function PageAccueil() {
  const { utilisateur, chargementInitial } = useAuth();

  const [stats, setStats] = useState<StatsPubliques | null>(null);

  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [chargementAnnonces, setChargementAnnonces] = useState(true);

  const [produits, setProduits] = useState<Produit[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [carte, setCarte] = useState<SnapshotRegion[]>([]);
  const [historique, setHistorique] = useState<PointHistoriquePrix[]>([]);
  const [prediction, setPrediction] = useState<PredictionPublique | null>(null);
  const [chargementApercu, setChargementApercu] = useState(true);

  // Chiffres agrégés réels, publics — visibles même pour un visiteur non connecté.
  useEffect(() => {
    statsApi.publiques().then(setStats).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!utilisateur) {
      setChargementAnnonces(false);
      setChargementApercu(false);
      return;
    }

    ministereApi
      .annonces()
      .then(setAnnonces)
      .catch(() => setAnnonces([]))
      .finally(() => setChargementAnnonces(false));

    Promise.all([referentielApi.produits(), referentielApi.regions()])
      .then(async ([listeProduits, listeRegions]) => {
        setProduits(listeProduits);
        setRegions(listeRegions);
        const produit = listeProduits[0];
        const region = listeRegions[0];
        if (!produit || !region) return;

        const [snapshotCarte, donneesHistorique, donneesPrediction] = await Promise.all([
          prixApi.carte(produit.id).catch(() => [] as SnapshotRegion[]),
          prixApi.historique(produit.id, region.id).catch(() => [] as PointHistoriquePrix[]),
          predictionsApi.obtenir(produit.id, region.id).catch(() => null),
        ]);
        setCarte(snapshotCarte);
        setHistorique(donneesHistorique);
        setPrediction(donneesPrediction);
      })
      .catch(() => undefined)
      .finally(() => setChargementApercu(false));
  }, [utilisateur]);

  const produitCourant = produits[0];
  const regionCourante = regions[0];

  return (
    <div className="mx-auto max-w-7xl space-y-20 px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
          {/* Colonne gauche : texte + CTA */}
          <motion.div
            initial="cache"
            animate="visible"
            variants={variantsSection}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-6 lg:col-span-7"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-bold text-primary-dark">
              ✨ Plateforme nationale de suivi &amp; IA
            </span>

            <h1 className="font-serif text-4xl font-extrabold tracking-tight text-header sm:text-5xl lg:text-6xl leading-tight">
              Maîtrisez les prix du marché au Sénégal avec <span className="text-primary">Sunu</span>
              <span className="text-primary-light">Prix</span>
            </h1>

            <p className="max-w-xl text-sm sm:text-base text-header/60 leading-relaxed">
              Suivi et prédiction des prix de produits de première nécessité à travers les régions du Sénégal,
              ancrés sur des relevés réels et assistés par l&apos;IA.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              {!chargementInitial && !utilisateur && (
                <>
                  <Link href="/inscription" className="bouton-primaire px-6 py-3.5 text-sm">
                    Commencer gratuitement
                  </Link>
                  <Link href="/a-propos" className="bouton-verre-clair">
                    En savoir plus
                  </Link>
                </>
              )}
              {utilisateur && (
                <>
                  <Link href="/donnees" className="bouton-primaire px-6 py-3.5 text-sm">
                    Accéder au tableau de bord
                  </Link>
                  <Link href="/alertes" className="bouton-verre-clair">
                    Voir mes alertes
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          {/* Colonne droite : aperçu carte régionale, à côté du texte */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            className="flex justify-center lg:col-span-5 lg:justify-end"
          >
            <div className="animate-flotter">
              <CarteApercuAccueil
                connecte={!!utilisateur}
                chargement={chargementApercu}
                snapshots={carte}
                produitNom={produitCourant?.nom}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== STATS RÉELLES ==================== */}
      <motion.section
        initial="cache"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={variantsSection}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {[
          { libelle: "Produits suivis", valeur: stats?.produits },
          { libelle: "Régions couvertes", valeur: stats?.regions },
          { libelle: "Relevés de prix enregistrés", valeur: stats?.relevesPrix },
        ].map((item) => (
          <div key={item.libelle} className="verre rounded-3xl p-6 text-center text-header">
            <p className="text-3xl font-extrabold text-primary-dark sm:text-4xl">
              {item.valeur != null ? item.valeur.toLocaleString("fr-FR") : "—"}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-header/60">{item.libelle}</p>
          </div>
        ))}
      </motion.section>

      {/* ==================== FONCTIONNALITÉS ==================== */}
      <motion.section
        initial="cache"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={variantsSection}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="font-serif text-2xl font-extrabold text-header sm:text-3xl">Une plateforme, quatre outils</h2>
          <p className="mt-2 text-sm text-header/60">Chaque module s&apos;appuie sur les mêmes relevés réels du terrain.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FONCTIONNALITES.map((fonctionnalite, indice) => (
            <motion.div
              key={fonctionnalite.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: indice * 0.08 }}
            >
              <Link
                href={fonctionnalite.href}
                className="verre group flex h-full flex-col gap-3 rounded-3xl p-6 text-header transition hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(11,46,36,0.16)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-xl transition group-hover:scale-110">
                  {fonctionnalite.icone}
                </span>
                <h3 className="text-sm font-bold text-header">{fonctionnalite.titre}</h3>
                <p className="text-xs leading-relaxed text-header/60">{fonctionnalite.description}</p>
                <span className="mt-auto pt-1 text-xs font-semibold text-primary">Découvrir →</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ==================== APERÇU CHIFFRES + SUNUBOT ==================== */}
      <motion.section
        initial="cache"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={variantsSection}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <div className="carte">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-header">
              {utilisateur && produitCourant && regionCourante
                ? `Évolution — ${produitCourant.nom} à ${regionCourante.nom}`
                : "Évolution des prix"}
            </h3>
            <Link href="/donnees" className="text-xs font-semibold text-primary hover:underline">
              Explorer les données
            </Link>
          </div>
          {utilisateur ? (
            chargementApercu ? (
              <div className="flex h-72 items-center justify-center text-sm text-header/40">Chargement…</div>
            ) : (
              <GraphiquePrix historique={historique} prediction={prediction} unite={produitCourant?.unite ?? ""} />
            )
          ) : (
            <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-header/15 text-center">
              <span className="text-2xl">📈</span>
              <p className="max-w-xs text-xs text-header/50">
                Connectez-vous pour voir l&apos;historique réel et la prédiction du mois suivant.
              </p>
              <Link href="/connexion" className="bouton-secondaire text-xs">
                Se connecter
              </Link>
            </div>
          )}
        </div>

        <div className="verre-sombre relative overflow-hidden rounded-3xl p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00C49F]/30 bg-[#00C49F]/10 px-3 py-1 text-[11px] font-bold text-[#00C49F]">
                🤖 SunuBot
              </span>
              <h3 className="mt-4 font-serif text-xl font-bold text-white">Un assistant IA ancré sur vos données</h3>
              <p className="mt-2 text-xs leading-relaxed text-emerald-100/70">
                SunuBot répond en français à vos questions sur les prix, les tendances et l&apos;inflation, en
                s&apos;appuyant strictement sur les relevés enregistrés — jamais de chiffre inventé.
              </p>
            </div>
            {utilisateur ? (
              <p className="text-xs font-medium text-emerald-100/60">
                Ouvrez la bulle en bas à droite pour lui parler dès maintenant.
              </p>
            ) : (
              <Link href="/inscription" className="bouton-verre self-start">
                Créer un compte pour discuter
              </Link>
            )}
          </div>
        </div>
      </motion.section>

      {/* ==================== ANNONCES OFFICIELLES ==================== */}
      {utilisateur && (
        <motion.div
          initial="cache"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={variantsSection}
          transition={{ duration: 0.5 }}
          className="verre rounded-3xl p-6 text-header"
        >
          <h2 className="mb-4 text-lg font-bold text-header">Annonces officielles du Ministère</h2>
          <ListeAnnonces annonces={annonces} chargement={chargementAnnonces} />
        </motion.div>
      )}
    </div>
  );
}
