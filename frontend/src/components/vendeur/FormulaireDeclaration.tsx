"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { referentielApi } from "@/lib/api/referentiel";
import { prixApi } from "@/lib/api/prix";
import { ErreurApi } from "@/lib/api/api-client";
import { MessageErreur } from "@/components/partages/EtatAsync";
import type { DeclarationPrixPublique, Produit, Region } from "@/lib/api/types";

interface ProprietesFormulaireDeclaration {
  onDeclaree: (declaration: DeclarationPrixPublique) => void;
}

const AUJOURDHUI = () => new Date().toISOString().slice(0, 10);

/** Formulaire de déclaration de prix par un vendeur — statut initial toujours `EN_ATTENTE` côté backend. */
export function FormulaireDeclaration({ onDeclaree }: ProprietesFormulaireDeclaration) {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [produitId, setProduitId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [prixFcfa, setPrixFcfa] = useState("");
  const [dateReleve, setDateReleve] = useState(AUJOURDHUI());
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  const [chargementReferentiel, setChargementReferentiel] = useState(true);

  useEffect(() => {
    Promise.all([referentielApi.produits(), referentielApi.regions()])
      .then(([listeProduits, listeRegions]) => {
        setProduits(listeProduits);
        setRegions(listeRegions);
        setProduitId(listeProduits[0]?.id ?? "");
        setRegionId(listeRegions[0]?.id ?? "");
      })
      .catch((e) => setErreur(e instanceof ErreurApi ? e.message : "Impossible de charger produits et régions."))
      .finally(() => setChargementReferentiel(false));
  }, []);

  const soumettre = async (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();
    setErreur(null);
    setSucces(null);

    const prixNombre = Number(prixFcfa);
    if (!Number.isFinite(prixNombre) || prixNombre <= 0) {
      setErreur("Le prix doit être un nombre strictement positif.");
      return;
    }

    setEnCours(true);
    try {
      const declaration = await prixApi.declarer({
        produitId,
        regionId,
        prixFcfa: prixNombre,
        dateReleve: new Date(dateReleve).toISOString(),
      });
      onDeclaree(declaration);
      setSucces("Déclaration envoyée — en attente de validation par un administrateur.");
      setPrixFcfa("");
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Impossible d'enregistrer la déclaration.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <form onSubmit={soumettre} className="carte space-y-4">
      <h2 className="text-sm font-semibold text-header/70">Déclarer un prix constaté</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="vendeur-produit" className="etiquette-champ">
            Produit
          </label>
          <select
            id="vendeur-produit"
            className="champ-formulaire"
            value={produitId}
            onChange={(e) => setProduitId(e.target.value)}
          >
            {produits.map((produit) => (
              <option key={produit.id} value={produit.id}>
                {produit.nom} ({produit.unite})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="vendeur-region" className="etiquette-champ">
            Région
          </label>
          <select
            id="vendeur-region"
            className="champ-formulaire"
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
          >
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="vendeur-prix" className="etiquette-champ">
            Prix constaté (FCFA)
          </label>
          <input
            id="vendeur-prix"
            type="number"
            min={1}
            step={1}
            required
            className="champ-formulaire"
            value={prixFcfa}
            onChange={(e) => setPrixFcfa(e.target.value)}
            placeholder="450"
          />
        </div>

        <div>
          <label htmlFor="vendeur-date" className="etiquette-champ">
            Date du relevé
          </label>
          <input
            id="vendeur-date"
            type="date"
            required
            max={AUJOURDHUI()}
            className="champ-formulaire"
            value={dateReleve}
            onChange={(e) => setDateReleve(e.target.value)}
          />
        </div>
      </div>

      {erreur && <MessageErreur message={erreur} />}
      {succes && <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{succes}</p>}

      <button
        type="submit"
        disabled={enCours || chargementReferentiel || !produitId || !regionId}
        className="bouton-primaire w-full sm:w-auto"
      >
        {enCours ? "Envoi en cours…" : "Déclarer ce prix"}
      </button>
    </form>
  );
}
