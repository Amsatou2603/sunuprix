import type { StatutDeclaration } from "@/lib/api/types";

const LIBELLES: Record<StatutDeclaration, string> = {
  VALIDE: "Validée",
  EN_ATTENTE: "En attente",
  REJETE: "Rejetée",
};

const CLASSES: Record<StatutDeclaration, string> = {
  VALIDE: "bg-primary/10 text-primary",
  EN_ATTENTE: "bg-accent/15 text-accent-dark",
  REJETE: "bg-red-100 text-red-700",
};

/** Badge de statut réutilisé partout où une déclaration de prix est affichée (espace vendeur, modération admin). */
export function BadgeStatutDeclaration({ statut }: { statut: StatutDeclaration }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${CLASSES[statut]}`}>
      {LIBELLES[statut]}
    </span>
  );
}
