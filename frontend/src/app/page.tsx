"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { ministereApi } from "@/lib/api/ministere";
import { ListeAnnonces } from "@/components/partages/ListeAnnonces";
import type { Annonce } from "@/lib/api/types";

export default function PageAccueil() {
  const { utilisateur, chargementInitial } = useAuth();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [chargementAnnonces, setChargementAnnonces] = useState(true);

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
  }, [utilisateur]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <span className="badge-hausse">Suivi &amp; prédiction des prix</span>
        <h1 className="max-w-2xl text-3xl font-bold text-header sm:text-4xl">
          Maîtrisez le marché avec <span className="text-primary">Sunu</span>
          <span className="text-accent">Prix</span>
        </h1>
        <p className="max-w-xl text-header/70">
          Suivi et prédiction des prix de 12 produits de consommation dans cinq régions du Sénégal, avec un assistant
          conversationnel ancré dans les données et un centre de notifications personnalisé.
        </p>
        {!chargementInitial && !utilisateur && (
          <div className="flex gap-3">
            <Link href="/inscription" className="bouton-primaire">
              Créer un compte
            </Link>
            <Link href="/a-propos" className="bouton-secondaire">
              En savoir plus
            </Link>
          </div>
        )}
        {!chargementInitial && utilisateur && (
          <Link href="/donnees" className="bouton-primaire">
            Voir les données de marché
          </Link>
        )}
      </div>

      {utilisateur && (
        <div>
          <h2 className="mb-3 text-lg font-bold text-header">Annonces officielles</h2>
          <ListeAnnonces annonces={annonces} chargement={chargementAnnonces} />
        </div>
      )}
    </div>
  );
}
