"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { adminApi } from "@/lib/api/admin";
import { ErreurApi } from "@/lib/api/api-client";
import { Chargement, MessageErreur } from "@/components/partages/EtatAsync";

/** Configuration des seuils d'alerte par défaut du système (attention / critique), utilisés par le moteur de détection. */
export function ConfigurationSeuilsForm() {
  const [seuilAttentionPourcent, setSeuilAttentionPourcent] = useState("");
  const [seuilCritiquePourcent, setSeuilCritiquePourcent] = useState("");
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .obtenirSeuils()
      .then((configuration) => {
        setSeuilAttentionPourcent(String(configuration.seuilAttentionPourcent));
        setSeuilCritiquePourcent(String(configuration.seuilCritiquePourcent));
      })
      .catch((e) => setErreur(e instanceof ErreurApi ? e.message : "Impossible de charger la configuration."))
      .finally(() => setChargement(false));
  }, []);

  const soumettre = async (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();
    setErreur(null);
    setSucces(null);
    setEnCours(true);
    try {
      const configuration = await adminApi.mettreAJourSeuils({
        seuilAttentionPourcent: Number(seuilAttentionPourcent),
        seuilCritiquePourcent: Number(seuilCritiquePourcent),
      });
      setSeuilAttentionPourcent(String(configuration.seuilAttentionPourcent));
      setSeuilCritiquePourcent(String(configuration.seuilCritiquePourcent));
      setSucces("Seuils mis à jour.");
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Impossible de mettre à jour les seuils.");
    } finally {
      setEnCours(false);
    }
  };

  if (chargement) {
    return (
      <div className="carte">
        <Chargement libelle="Chargement de la configuration…" />
      </div>
    );
  }

  return (
    <form onSubmit={soumettre} className="carte space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-header/70">Seuils d&apos;alerte par défaut</h2>
        <p className="mt-1 text-sm text-header/50">
          Appliqués par défaut aux nouvelles alertes personnelles créées sans seuil explicite.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="seuil-attention" className="etiquette-champ">
            Seuil d&apos;attention (%)
          </label>
          <input
            id="seuil-attention"
            type="number"
            min={0.1}
            step={0.1}
            required
            className="champ-formulaire"
            value={seuilAttentionPourcent}
            onChange={(e) => setSeuilAttentionPourcent(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="seuil-critique" className="etiquette-champ">
            Seuil critique (%)
          </label>
          <input
            id="seuil-critique"
            type="number"
            min={0.1}
            step={0.1}
            required
            className="champ-formulaire"
            value={seuilCritiquePourcent}
            onChange={(e) => setSeuilCritiquePourcent(e.target.value)}
          />
        </div>
      </div>

      {erreur && <MessageErreur message={erreur} />}
      {succes && <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{succes}</p>}

      <button type="submit" disabled={enCours} className="bouton-primaire w-full sm:w-auto">
        {enCours ? "Enregistrement…" : "Enregistrer les seuils"}
      </button>
    </form>
  );
}
