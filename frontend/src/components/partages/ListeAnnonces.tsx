import { Megaphone } from "lucide-react";
import { Chargement, EtatVide } from "@/components/partages/EtatAsync";
import type { Annonce } from "@/lib/api/types";

interface ProprietesListeAnnonces {
  annonces: Annonce[];
  chargement: boolean;
}

/** Liste des annonces officielles publiées par le Ministère — réutilisée sur l'accueil et dans l'espace Ministère. */
export function ListeAnnonces({ annonces, chargement }: ProprietesListeAnnonces) {
  if (chargement) return <Chargement libelle="Chargement des annonces…" />;
  if (annonces.length === 0) {
    return (
      <EtatVide
        icone={<Megaphone className="h-7 w-7" strokeWidth={1.75} />}
        titre="Aucune annonce publiée"
        description="Les annonces officielles du Ministère apparaîtront ici."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {annonces.map((annonce) => (
        <li key={annonce.id} className="carte">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
            <h3 className="font-semibold text-header">{annonce.titre}</h3>
            <span className="whitespace-nowrap text-xs text-header/40">
              {new Date(annonce.publieeLe).toLocaleDateString("fr-FR")}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-header/70">{annonce.contenu}</p>
          <p className="mt-2 text-xs font-medium text-primary">Ministère · {annonce.auteur.nom}</p>
        </li>
      ))}
    </ul>
  );
}
