"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { referentielApi } from "@/lib/api/referentiel";
import { prixApi } from "@/lib/api/prix";
import { predictionsApi } from "@/lib/api/predictions";
import { ErreurApi } from "@/lib/api/api-client";
import { Chargement, EtatVide, MessageErreur } from "@/components/partages/EtatAsync";
import type { Produit, Region } from "@/lib/api/types";

type ModeComparaison = "REGIONS" | "PRODUITS";

const COULEURS = ["#0F6E56", "#EF9F27", "#DC2626", "#2563EB", "#7C3AED"];

interface EntiteComparee {
  id: string;
  label: string;
  margeErreurFcfa: number | null;
  prixPredit: number | null;
}

interface ProprietesVueComparative {
  /** Rapporte à la page parente le nombre de points/entités du dernier résultat, pour les cartes de statistiques. */
  onResultat?: (resume: { pointsDeDonnees: number; entitesComparees: number }) => void;
}

/**
 * Vue analytique réservée aux chercheurs : compare l'évolution de plusieurs
 * régions pour un même produit, ou de plusieurs produits pour une même
 * région, avec la marge d'erreur de prédiction associée à chaque série.
 */
export function VueComparative({ onResultat }: ProprietesVueComparative) {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [mode, setMode] = useState<ModeComparaison>("REGIONS");
  const [axeFixeId, setAxeFixeId] = useState(""); // produitId si mode REGIONS, regionId si mode PRODUITS
  const [idsSelectionnes, setIdsSelectionnes] = useState<string[]>([]);
  const [donneesGraphique, setDonneesGraphique] = useState<Record<string, number | string>[]>([]);
  const [entites, setEntites] = useState<EntiteComparee[]>([]);
  const [chargement, setChargement] = useState(false);
  const [chargementReferentiel, setChargementReferentiel] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [aLanceUneComparaison, setALanceUneComparaison] = useState(false);

  useEffect(() => {
    Promise.all([referentielApi.produits(), referentielApi.regions()])
      .then(([listeProduits, listeRegions]) => {
        setProduits(listeProduits);
        setRegions(listeRegions);
        setAxeFixeId(listeProduits[0]?.id ?? "");
        setIdsSelectionnes(listeRegions.slice(0, 3).map((r) => r.id));
      })
      .catch((e) => setErreur(e instanceof ErreurApi ? e.message : "Impossible de charger le référentiel."))
      .finally(() => setChargementReferentiel(false));
  }, []);

  const changerMode = (nouveauMode: ModeComparaison) => {
    setMode(nouveauMode);
    setAxeFixeId(nouveauMode === "REGIONS" ? produits[0]?.id ?? "" : regions[0]?.id ?? "");
    setIdsSelectionnes(nouveauMode === "REGIONS" ? regions.slice(0, 3).map((r) => r.id) : produits.slice(0, 3).map((p) => p.id));
  };

  const basculerId = (id: string) => {
    setIdsSelectionnes((precedents) =>
      precedents.includes(id) ? precedents.filter((i) => i !== id) : [...precedents, id],
    );
  };

  const lancerComparaison = async () => {
    if (!axeFixeId || idsSelectionnes.length === 0) return;
    setChargement(true);
    setErreur(null);
    setALanceUneComparaison(true);
    try {
      const resultats = await Promise.all(
        idsSelectionnes.map(async (id) => {
          const [produitId, regionId] = mode === "REGIONS" ? [axeFixeId, id] : [id, axeFixeId];
          const [historique, prediction] = await Promise.all([
            prixApi.historique(produitId, regionId),
            predictionsApi.obtenir(produitId, regionId).catch(() => null),
          ]);
          const label =
            mode === "REGIONS" ? regions.find((r) => r.id === id)?.nom ?? id : produits.find((p) => p.id === id)?.nom ?? id;
          return { id, label, historique, prediction };
        }),
      );

      const datesTriees = Array.from(
        new Set(resultats.flatMap((r) => r.historique.map((p) => p.date.slice(0, 7)))),
      ).sort();

      const lignes = datesTriees.map((date) => {
        const ligne: Record<string, number | string> = { date };
        for (const resultat of resultats) {
          const point = resultat.historique.find((p) => p.date.slice(0, 7) === date);
          if (point) ligne[resultat.label] = point.prixFcfa;
        }
        return ligne;
      });

      setDonneesGraphique(lignes);
      setEntites(
        resultats.map((r) => ({
          id: r.id,
          label: r.label,
          margeErreurFcfa: r.prediction?.margeErreurFcfa ?? null,
          prixPredit: r.prediction?.prixPredit ?? null,
        })),
      );
      onResultat?.({
        pointsDeDonnees: resultats.reduce((total, r) => total + r.historique.length, 0),
        entitesComparees: resultats.length,
      });
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Impossible de générer la comparaison.");
    } finally {
      setChargement(false);
    }
  };

  const listeAxeSecondaire = mode === "REGIONS" ? regions : produits;

  if (chargementReferentiel) {
    return (
      <div className="carte">
        <Chargement libelle="Chargement du référentiel…" />
      </div>
    );
  }

  return (
    <div className="carte space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-header/70">Analyse comparative</h2>
        <p className="mt-1 text-sm text-header/50">
          Comparez l&apos;évolution de plusieurs régions pour un produit, ou de plusieurs produits pour une région.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => changerMode("REGIONS")}
          className={mode === "REGIONS" ? "bouton-primaire" : "bouton-secondaire"}
        >
          Comparer des régions
        </button>
        <button
          type="button"
          onClick={() => changerMode("PRODUITS")}
          className={mode === "PRODUITS" ? "bouton-primaire" : "bouton-secondaire"}
        >
          Comparer des produits
        </button>
      </div>

      <div>
        <label htmlFor="axe-fixe" className="etiquette-champ">
          {mode === "REGIONS" ? "Produit de référence" : "Région de référence"}
        </label>
        <select id="axe-fixe" className="champ-formulaire" value={axeFixeId} onChange={(e) => setAxeFixeId(e.target.value)}>
          {(mode === "REGIONS" ? produits : regions).map((option) => (
            <option key={option.id} value={option.id}>
              {option.nom}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="etiquette-champ">{mode === "REGIONS" ? "Régions à comparer" : "Produits à comparer"}</p>
        <div className="flex flex-wrap gap-2">
          {listeAxeSecondaire.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1.5 text-sm"
            >
              <input
                type="checkbox"
                checked={idsSelectionnes.includes(option.id)}
                onChange={() => basculerId(option.id)}
              />
              {option.nom}
            </label>
          ))}
        </div>
      </div>

      {erreur && <MessageErreur message={erreur} />}

      <button
        type="submit"
        onClick={lancerComparaison}
        disabled={chargement || idsSelectionnes.length === 0}
        className="bouton-primaire w-full sm:w-auto"
      >
        {chargement ? "Analyse en cours…" : "Comparer"}
      </button>

      {chargement && <Chargement libelle="Génération de la comparaison…" />}

      {!chargement && aLanceUneComparaison && donneesGraphique.length === 0 && !erreur && (
        <EtatVide
          icone="📉"
          titre="Aucune donnée pour cette sélection"
          description="Essayez une autre combinaison de produit/région : l'historique est peut-être encore vide pour ce couple."
        />
      )}

      {!chargement && donneesGraphique.length > 0 && (
        <>
          <div className="h-72 w-full overflow-x-auto">
            <div className="h-full min-w-[480px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={donneesGraphique} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,46,36,0.08)" />
                  <XAxis dataKey="date" fontSize={12} stroke="#0B2E24" />
                  <YAxis fontSize={12} stroke="#0B2E24" width={64} />
                  <Tooltip />
                  <Legend />
                  {entites.map((entite, indice) => (
                    <Line
                      key={entite.id}
                      type="monotone"
                      dataKey={entite.label}
                      stroke={COULEURS[indice % COULEURS.length]}
                      strokeWidth={2}
                      connectNulls
                      dot={{ r: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-header/50">
                  <th className="py-2 pr-4">{mode === "REGIONS" ? "Région" : "Produit"}</th>
                  <th className="py-2 pr-4">Prédiction (mois suivant)</th>
                  <th className="py-2 pr-4">Marge d&apos;erreur</th>
                </tr>
              </thead>
              <tbody>
                {entites.map((entite) => (
                  <tr key={entite.id} className="border-b border-black/5">
                    <td className="py-2 pr-4 font-medium text-header">{entite.label}</td>
                    <td className="py-2 pr-4">
                      {entite.prixPredit != null ? `${entite.prixPredit.toLocaleString("fr-FR")} FCFA` : "Indisponible"}
                    </td>
                    <td className="py-2 pr-4">{entite.margeErreurFcfa != null ? `± ${Math.round(entite.margeErreurFcfa)} FCFA` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
