"use client";

import { RouteProtegee } from "@/components/auth/RouteProtegee";
import { CentreNotifications } from "@/components/alertes/CentreNotifications";
import { GestionAlertes } from "@/components/alertes/GestionAlertes";

function ContenuPageAlertes() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-xl font-bold text-header sm:text-2xl">Alertes &amp; notifications</h1>
        <p className="mt-1 text-sm text-header/60">
          Configurez vos alertes de prix personnelles et consultez le centre de notifications.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GestionAlertes />
        <CentreNotifications />
      </div>
    </div>
  );
}

export default function PageAlertes() {
  return (
    <RouteProtegee messageVisiteur="Créez un compte gratuit (ou connectez-vous) pour être notifié(e) dès qu'un prix dépasse le seuil que vous choisissez.">
      <ContenuPageAlertes />
    </RouteProtegee>
  );
}
