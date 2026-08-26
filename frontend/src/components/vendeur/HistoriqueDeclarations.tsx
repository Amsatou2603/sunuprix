import { BadgeStatutDeclaration } from "@/components/partages/BadgeStatutDeclaration";
import { Chargement, EtatVide } from "@/components/partages/EtatAsync";
import type { DeclarationPrixPublique } from "@/lib/api/types";

interface ProprietesHistorique {
  declarations: DeclarationPrixPublique[];
  chargement: boolean;
}

/** Historique des déclarations de prix soumises par le vendeur connecté, avec leur statut de modération. */
export function HistoriqueDeclarations({ declarations, chargement }: ProprietesHistorique) {
  if (chargement) {
    return <Chargement libelle="Chargement de votre historique…" />;
  }

  if (declarations.length === 0) {
    return (
      <EtatVide
        icone="🧾"
        titre="Aucune déclaration pour le moment"
        description="Utilisez le formulaire ci-dessus pour déclarer votre premier prix constaté."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
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
  );
}
