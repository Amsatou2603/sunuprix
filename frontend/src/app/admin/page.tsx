"use client";

import { useEffect, useMemo, useState } from "react";
import { RouteProtegee } from "@/components/auth/RouteProtegee";
import { TableauUtilisateurs } from "@/components/admin/TableauUtilisateurs";
import { FileModeration } from "@/components/admin/FileModeration";
import { ConfigurationSeuilsForm } from "@/components/admin/ConfigurationSeuilsForm";
import { CarteStat } from "@/components/partages/CarteStat";
import { MessageErreur } from "@/components/partages/EtatAsync";
import { adminApi } from "@/lib/api/admin";
import { ErreurApi } from "@/lib/api/api-client";
import type { DeclarationPrixPublique, UtilisateurPublic } from "@/lib/api/types";

function ContenuPageAdmin() {
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurPublic[]>([]);
  const [declarations, setDeclarations] = useState<DeclarationPrixPublique[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([adminApi.utilisateurs(), adminApi.declarationsEnAttente()])
      .then(([listeUtilisateurs, listeDeclarations]) => {
        setUtilisateurs(listeUtilisateurs);
        setDeclarations(listeDeclarations);
      })
      .catch((e) => setErreur(e instanceof ErreurApi ? e.message : "Impossible de charger le tableau de bord."))
      .finally(() => setChargement(false));
  }, []);

  // Statistiques dérivées des données réellement chargées ci-dessus — jamais de valeur fixe.
  const statistiques = useMemo(() => {
    const actifs = utilisateurs.filter((u) => u.actif).length;
    const desactives = utilisateurs.length - actifs;
    return { totalUtilisateurs: utilisateurs.length, actifs, desactives, enAttente: declarations.length };
  }, [utilisateurs, declarations]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-header sm:text-2xl">Espace administrateur</h1>
        <p className="mt-1 text-sm text-header/60">
          Gérez les comptes utilisateurs, modérez les déclarations de prix vendeur et configurez les seuils d&apos;alerte
          par défaut.
        </p>
      </div>

      {erreur && <MessageErreur message={erreur} />}

      {!chargement && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CarteStat icone="👥" label="Utilisateurs" valeur={statistiques.totalUtilisateurs} />
          <CarteStat icone="✅" label="Comptes actifs" valeur={statistiques.actifs} couleurIcone="bg-primary/10" />
          <CarteStat icone="🚫" label="Comptes désactivés" valeur={statistiques.desactives} couleurIcone="bg-red-100" />
          <CarteStat
            icone="⏳"
            label="Déclarations en attente"
            valeur={statistiques.enAttente}
            couleurIcone="bg-accent/15"
          />
        </div>
      )}

      <TableauUtilisateurs
        utilisateurs={utilisateurs}
        chargement={chargement}
        onUtilisateurMisAJour={(utilisateur) =>
          setUtilisateurs((precedents) => precedents.map((u) => (u.id === utilisateur.id ? utilisateur : u)))
        }
      />

      <FileModeration
        declarations={declarations}
        chargement={chargement}
        onDeclarationTraitee={(id) => setDeclarations((precedentes) => precedentes.filter((d) => d.id !== id))}
      />

      <ConfigurationSeuilsForm />
    </div>
  );
}

export default function PageAdmin() {
  return (
    <RouteProtegee rolesAutorises={["ADMIN"]}>
      <ContenuPageAdmin />
    </RouteProtegee>
  );
}
