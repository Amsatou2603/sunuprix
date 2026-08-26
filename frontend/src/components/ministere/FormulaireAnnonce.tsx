"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { ministereApi } from "@/lib/api/ministere";
import { ErreurApi } from "@/lib/api/api-client";
import { MessageErreur } from "@/components/partages/EtatAsync";
import type { Annonce } from "@/lib/api/types";

interface ProprietesFormulaireAnnonce {
  onPublieee: (annonce: Annonce) => void;
}

/** Formulaire de publication d'une annonce officielle, réservé au Ministère — visible ensuite sur l'accueil de tous les rôles. */
export function FormulaireAnnonce({ onPublieee }: ProprietesFormulaireAnnonce) {
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  const soumettre = async (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();
    setErreur(null);
    setSucces(null);
    setEnCours(true);
    try {
      const annonce = await ministereApi.publierAnnonce({ titre, contenu });
      onPublieee(annonce);
      setTitre("");
      setContenu("");
      setSucces("Annonce publiée — visible sur l'accueil de tous les utilisateurs.");
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Impossible de publier l'annonce.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <form onSubmit={soumettre} className="carte space-y-4">
      <h2 className="text-sm font-semibold text-header/70">Publier une annonce</h2>

      <div>
        <label htmlFor="annonce-titre" className="etiquette-champ">
          Titre
        </label>
        <input
          id="annonce-titre"
          type="text"
          required
          minLength={3}
          maxLength={150}
          className="champ-formulaire"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Mesure de soutien au prix du riz"
        />
      </div>

      <div>
        <label htmlFor="annonce-contenu" className="etiquette-champ">
          Contenu
        </label>
        <textarea
          id="annonce-contenu"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          className="champ-formulaire"
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          placeholder="Détail de la mesure annoncée…"
        />
      </div>

      {erreur && <MessageErreur message={erreur} />}
      {succes && <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{succes}</p>}

      <button type="submit" disabled={enCours} className="bouton-primaire w-full sm:w-auto">
        {enCours ? "Publication en cours…" : "Publier l'annonce"}
      </button>
    </form>
  );
}
