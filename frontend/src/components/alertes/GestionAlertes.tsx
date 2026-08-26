"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import clsx from "clsx";
import { referentielApi } from "@/lib/api/referentiel";
import { alertesApi } from "@/lib/api/alertes";
import { ErreurApi } from "@/lib/api/api-client";
import { Chargement, EtatVide, MessageErreur } from "@/components/partages/EtatAsync";
import type { Alerte, Produit, Region } from "@/lib/api/types";

const CLASSES_SEVERITE: Record<Alerte["severite"], string> = {
  INFO: "bg-primary/10 text-primary",
  ATTENTION: "bg-accent/15 text-accent-dark",
  CRITIQUE: "bg-red-100 text-red-700",
};

/** Gestion des alertes de prix personnelles : création, activation/désactivation, suppression. */
export function GestionAlertes() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [produitId, setProduitId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [seuilPourcent, setSeuilPourcent] = useState("");
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([alertesApi.lister(), referentielApi.produits(), referentielApi.regions()])
      .then(([listeAlertes, listeProduits, listeRegions]) => {
        setAlertes(listeAlertes);
        setProduits(listeProduits);
        setRegions(listeRegions);
        setProduitId(listeProduits[0]?.id ?? "");
        setRegionId(listeRegions[0]?.id ?? "");
      })
      .catch((e) => setErreur(e instanceof ErreurApi ? e.message : "Impossible de charger vos alertes."))
      .finally(() => setChargement(false));
  }, []);

  const creer = async (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const alerte = await alertesApi.creer({
        produitId,
        regionId,
        seuilPourcent: seuilPourcent ? Number(seuilPourcent) : undefined,
      });
      setAlertes((precedentes) => [alerte, ...precedentes]);
      setSeuilPourcent("");
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Impossible de créer cette alerte.");
    } finally {
      setEnCours(false);
    }
  };

  const basculerActive = async (alerte: Alerte) => {
    try {
      const misAJour = await alertesApi.mettreAJour(alerte.id, { active: !alerte.active });
      setAlertes((precedentes) => precedentes.map((a) => (a.id === alerte.id ? misAJour : a)));
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Impossible de mettre à jour cette alerte.");
    }
  };

  const supprimer = async (id: string) => {
    try {
      await alertesApi.supprimer(id);
      setAlertes((precedentes) => precedentes.filter((a) => a.id !== id));
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Impossible de supprimer cette alerte.");
    }
  };

  if (chargement) {
    return (
      <div className="carte">
        <Chargement libelle="Chargement de vos alertes…" />
      </div>
    );
  }

  return (
    <div className="carte">
      <h2 className="text-sm font-semibold text-header/70">Mes alertes de prix</h2>
      <p className="mt-1 text-sm text-header/50">
        Soyez notifié dès qu&apos;un produit dépasse, dans une région donnée, le seuil de variation que vous fixez.
      </p>

      <form onSubmit={creer} className="mt-4 grid gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-[1fr_1fr_120px_auto]">
        <div>
          <label htmlFor="alerte-produit" className="etiquette-champ">
            Produit
          </label>
          <select id="alerte-produit" className="champ-formulaire" value={produitId} onChange={(e) => setProduitId(e.target.value)}>
            {produits.map((produit) => (
              <option key={produit.id} value={produit.id}>
                {produit.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="alerte-region" className="etiquette-champ">
            Région
          </label>
          <select id="alerte-region" className="champ-formulaire" value={regionId} onChange={(e) => setRegionId(e.target.value)}>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="alerte-seuil" className="etiquette-champ">
            Seuil (%)
          </label>
          <input
            id="alerte-seuil"
            type="number"
            min={0.1}
            step={0.1}
            className="champ-formulaire"
            placeholder="Défaut"
            value={seuilPourcent}
            onChange={(e) => setSeuilPourcent(e.target.value)}
          />
        </div>
        <button type="submit" disabled={enCours || !produitId || !regionId} className="bouton-primaire">
          Ajouter
        </button>
      </form>

      {erreur && (
        <div className="mt-3">
          <MessageErreur message={erreur} />
        </div>
      )}

      {alertes.length === 0 ? (
        <div className="mt-5">
          <EtatVide
            icone="🔔"
            titre="Aucune alerte personnelle"
            description="Ajoutez un produit et une région ci-dessus pour être notifié dès qu'un seuil de variation est dépassé."
          />
        </div>
      ) : (
      <ul className="mt-5 space-y-2">
        {alertes.map((alerte) => (
          <li
            key={alerte.id}
            className={clsx(
              "flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between",
              alerte.active ? "border-black/10" : "border-black/5 opacity-60",
            )}
          >
            <div>
              <p className="font-medium text-header">
                {alerte.produit.nom} — {alerte.region.nom}
              </p>
              <p className="text-header/50">Seuil : {alerte.seuilPourcent}%</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold", CLASSES_SEVERITE[alerte.severite])}>
                {alerte.severite}
              </span>
              <button type="button" onClick={() => basculerActive(alerte)} className="bouton-secondaire !px-3 !py-1.5 !text-xs">
                {alerte.active ? "Désactiver" : "Activer"}
              </button>
              <button
                type="button"
                onClick={() => supprimer(alerte.id)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}
