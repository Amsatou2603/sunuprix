import { REGIONS, PRODUITS, LIBELLES_ROLES, ROLES } from "@sunuprix/shared";

export const metadata = {
  title: "À propos",
};

export default function PageAPropos() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4">
      <div className="carte">
        <h1 className="text-xl font-bold text-header">À propos de SunuPrix</h1>
        <p className="mt-3 text-sm leading-relaxed text-header/70">
          SunuPrix est un projet de fin de formation. La plateforme simule le suivi et la prédiction des prix de
          produits de consommation courante dans cinq régions du Sénégal.{" "}
          <strong className="text-header">
            Toutes les données affichées (prix, tendances, utilisateurs) sont fictives et générées à des fins
            pédagogiques
          </strong>{" "}
          — elles ne reflètent pas des relevés de terrain réels.
        </p>
      </div>

      <div className="carte">
        <h2 className="text-base font-semibold text-header">Rôles disponibles</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-header/70 sm:grid-cols-3">
          {ROLES.map((role) => (
            <li key={role} className="rounded-lg bg-surface px-3 py-2">
              {LIBELLES_ROLES[role]}
            </li>
          ))}
        </ul>
      </div>

      <div className="carte">
        <h2 className="text-base font-semibold text-header">Régions couvertes</h2>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm text-header/70">
          {REGIONS.map((region) => (
            <li key={region} className="rounded-full bg-surface px-3 py-1">
              {region}
            </li>
          ))}
        </ul>
      </div>

      <div className="carte">
        <h2 className="text-base font-semibold text-header">Produits suivis</h2>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm text-header/70">
          {PRODUITS.map((produit) => (
            <li key={produit.nom} className="rounded-full bg-surface px-3 py-1">
              {produit.nom} <span className="text-header/40">/ {produit.unite}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
