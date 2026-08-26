import type { Produit, Region } from "@/lib/api/types";

interface ProprietesSelecteur {
  produits: Produit[];
  regions: Region[];
  produitId: string;
  regionId: string;
  onChangerProduit: (produitId: string) => void;
  onChangerRegion: (regionId: string) => void;
}

/** Sélecteurs communs produit (12 valeurs) / région (5 valeurs), alimentés uniquement par l'API référentiel. */
export function SelecteurProduitRegion({
  produits,
  regions,
  produitId,
  regionId,
  onChangerProduit,
  onChangerRegion,
}: ProprietesSelecteur) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="flex-1">
        <label htmlFor="selecteur-produit" className="etiquette-champ">
          Produit
        </label>
        <select
          id="selecteur-produit"
          className="champ-formulaire"
          value={produitId}
          onChange={(e) => onChangerProduit(e.target.value)}
        >
          {produits.map((produit) => (
            <option key={produit.id} value={produit.id}>
              {produit.nom} ({produit.unite})
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label htmlFor="selecteur-region" className="etiquette-champ">
          Région
        </label>
        <select
          id="selecteur-region"
          className="champ-formulaire"
          value={regionId}
          onChange={(e) => onChangerRegion(e.target.value)}
        >
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.nom}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
