import { Receipt } from "lucide-react";
import { BadgeStatutDeclaration } from "@/components/partages/BadgeStatutDeclaration";
import { Chargement, EtatVide } from "@/components/partages/EtatAsync";
import type { DeclarationPrixPublique } from "@/lib/api/types";

interface ProprietesHistorique {
  declarations: DeclarationPrixPublique[];
  chargement: boolean;
}

/** Historique des déclarations de prix soumises par le contributeur connecté, avec leur statut de modération. */
export function HistoriqueDeclarations({ declarations, chargement }: ProprietesHistorique) {
  if (chargement) {
    return <Chargement libelle="Chargement de votre historique…" />;
  }

  if (declarations.length === 0) {
    return (
      <EtatVide
        icone={<Receipt className="h-7 w-7" strokeWidth={1.75} />}
        titre="Aucune déclaration pour le moment"
        description="Utilisez le formulaire ci-dessus pour déclarer votre premier prix constaté."
      />
    );
  }

  return (
    <>
    {/* Mobile : une carte par déclaration plutôt qu'un tableau à faire défiler horizontalement. */}
    <ul className="space-y-3 sm:hidden">
      {declarations.map((declaration) => (
        <li key={declaration.id} className="rounded-2xl border border-black/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-header">{declaration.produit.nom}</p>
              <p className="text-xs text-header/50">
                {declaration.region.nom} · {new Date(declaration.dateReleve).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <BadgeStatutDeclaration statut={declaration.statut} />
          </div>
          <p className="mt-2 text-sm font-semibold text-header">
            {declaration.prixFcfa.toLocaleString("fr-FR")} FCFA/{declaration.produit.unite}
          </p>
        </li>
      ))}
    </ul>

    <div className="hidden overflow-x-auto sm:block">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-header/50">
            <th className="py-2 pr-4">Produit</th>
            <th className="py-2 pr-4">Région</th>
            <th className="py-2 pr-4">Prix déclaré</th>
            <th className="py-2 pr-4">Date du relevé</th>
            <th className="py-2 pr-4">Statut</th>
          </tr>
        </thead>
        <tbody>
          {declarations.map((declaration) => (
            <tr key={declaration.id} className="border-b border-black/5">
              <td className="py-2 pr-4 font-medium text-header">{declaration.produit.nom}</td>
              <td className="py-2 pr-4">{declaration.region.nom}</td>
              <td className="py-2 pr-4">
                {declaration.prixFcfa.toLocaleString("fr-FR")} FCFA/{declaration.produit.unite}
              </td>
              <td className="py-2 pr-4">{new Date(declaration.dateReleve).toLocaleDateString("fr-FR")}</td>
              <td className="py-2 pr-4">
                <BadgeStatutDeclaration statut={declaration.statut} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
