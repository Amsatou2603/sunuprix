"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth/AuthContext";
import { ministereApi } from "@/lib/api/ministere";
import { referentielApi } from "@/lib/api/referentiel";
import { ListeAnnonces } from "@/components/partages/ListeAnnonces";
import type { Annonce, Produit, Region } from "@/lib/api/types";

export default function PageAccueil() {
  const { utilisateur, chargementInitial } = useAuth();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [chargementAnnonces, setChargementAnnonces] = useState(true);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    if (!utilisateur) {
      setChargementAnnonces(false);
      return;
    }
    ministereApi
      .annonces()
      .then(setAnnonces)
      .catch(() => setAnnonces([]))
      .finally(() => setChargementAnnonces(false));

    // Compteurs réels (référentiel), affichés dans les cartes flottantes du héros.
    Promise.all([referentielApi.produits(), referentielApi.regions()])
      .then(([listeProduits, listeRegions]) => {
        setProduits(listeProduits);
        setRegions(listeRegions);
      })
      .catch(() => undefined);
  }, [utilisateur]);

  return (
    <div className="space-y-12 pb-12">
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden rounded-3xl bg-[#093327] text-white p-8 sm:p-12 shadow-2xl">
        {/* Subtle Map / Grid Background Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#00C49F_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Heading & CTAs */}
          <div className="space-y-6 lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-[#00C49F]">
              ✨ Plateforme Nationale de Suivi &amp; IA
            </span>

            <h1 className="font-serif text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
              Maîtrisez les prix du marché au Sénégal avec <span className="text-[#00C49F]">Sunu</span><span className="text-[#E5C158]">Prix</span>
            </h1>

            <p className="max-w-xl text-sm sm:text-base text-emerald-100/80 leading-relaxed">
              Suivi en temps réel et prédictions algorithmiques des prix de produits de première nécessité à travers les régions du Sénégal. Ancré sur des données fiables et assisté par l&apos;IA.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              {!chargementInitial && !utilisateur && (
                <>
                  <Link
                    href="/inscription"
                    className="rounded-xl bg-[#00C49F] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-[#00a989] hover:scale-105"
                  >
                    Commencer Gratuitement
                  </Link>
                  <Link
                    href="/a-propos"
                    className="rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    En Savoir Plus
                  </Link>
                </>
              )}
              {utilisateur && (
                <Link
                  href="/donnees"
                  className="rounded-xl bg-[#00C49F] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-[#00a989]"
                >
                  Accéder au Tableau de Bord
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Mobile Phone Mockup & 3D Logo Emblem */}
          <div className="relative flex items-center justify-center lg:col-span-5">
            {/* Round Emblem Badge floating left */}
            <div className="absolute -left-4 top-10 z-20 hidden sm:block transition-transform hover:scale-110">
              <div className="h-28 w-28 rounded-full border-4 border-[#E5C158] bg-[#F3ECE0] shadow-2xl p-1 flex items-center justify-center">
                <Image src="/design/icon.svg" alt="SunuPrix Emblem" width={90} height={90} />
              </div>
            </div>

            {/* Floating Stats Cards — comptages réels du référentiel, visibles une fois connecté */}
            {utilisateur && (produits.length > 0 || regions.length > 0) && (
              <div className="absolute -right-2 top-4 z-20 space-y-3 hidden sm:block">
                <div className="rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur-md shadow-lg text-xs">
                  <p className="text-[10px] text-gray-300 font-medium">Produits suivis</p>
                  <p className="text-base font-extrabold text-white">{produits.length}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur-md shadow-lg text-xs">
                  <p className="text-[10px] text-gray-300 font-medium">Régions couvertes</p>
                  <p className="text-base font-extrabold text-white">{regions.length}</p>
                </div>
              </div>
            )}

            {/* Mobile Phone Mockup Frame */}
            <div className="relative w-64 rounded-[40px] border-8 border-gray-800 bg-[#062920] p-4 shadow-2xl">
              {/* Speaker Notch */}
              <div className="mx-auto h-4 w-28 rounded-full bg-gray-800 mb-4" />

              <div className="flex flex-col items-center py-6 text-center space-y-4">
                <div className="h-32 w-32 rounded-3xl bg-[#072A20] p-2 shadow-inner flex items-center justify-center border border-[#E5C158]/30">
                  <Image src="/design/icon.svg" alt="App Icon" width={110} height={110} priority />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-white">SunuPrix</h3>
                  <p className="text-[10px] text-emerald-300 font-medium">Version Mobile (PWA)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Official Announcements Section */}
      {utilisateur && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#0F172A]">Annonces officielles du Ministère</h2>
          <ListeAnnonces annonces={annonces} chargement={chargementAnnonces} />
        </div>
      )}
    </div>
  );
}
