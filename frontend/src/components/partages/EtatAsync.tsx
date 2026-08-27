import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

/**
 * Trio d'états asynchrones réutilisé sur toutes les pages qui chargent des
 * données depuis l'API (chargement / erreur / liste vide) — évite de
 * dupliquer le même balisage "Chargement…" / bandeau rouge / message vide
 * dans chaque composant.
 */

interface ProprietesChargement {
  /** Libellé affiché à côté du spinner. */
  libelle?: string;
  /** Réduit le padding vertical pour un usage à l'intérieur d'une carte déjà compacte. */
  compact?: boolean;
}

export function Chargement({ libelle = "Chargement…", compact = false }: ProprietesChargement) {
  return (
    <div className={`flex items-center justify-center gap-2 text-sm text-header/50 ${compact ? "py-3" : "py-8"}`}>
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
        aria-hidden="true"
      />
      <span>{libelle}</span>
    </div>
  );
}

interface ProprietesMessageErreur {
  message: string;
  /** Action de récupération optionnelle (ex. "Réessayer"). */
  action?: ReactNode;
}

export function MessageErreur({ message, action }: ProprietesMessageErreur) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      {action}
    </div>
  );
}

interface ProprietesEtatVide {
  titre: string;
  description?: string;
  icone?: ReactNode;
  action?: ReactNode;
}

export function EtatVide({ titre, description, icone = <Inbox className="h-7 w-7" strokeWidth={1.75} />, action }: ProprietesEtatVide) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-black/10 px-4 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-header/5 text-header/40" aria-hidden="true">
        {icone}
      </span>
      <p className="font-medium text-header">{titre}</p>
      {description && <p className="max-w-sm text-sm text-header/50">{description}</p>}
      {action}
    </div>
  );
}
