"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { notificationsApi } from "@/lib/api/alertes";
import { ErreurApi } from "@/lib/api/api-client";
import { Chargement, EtatVide, MessageErreur } from "@/components/partages/EtatAsync";
import type { NotificationUtilisateur } from "@/lib/api/types";

/**
 * Centre de notifications alimenté par l'API : la simple consultation
 * déclenche côté backend une passe de détection de seuils à jour (voir
 * `alerts.service.ts`), donc la liste reflète toujours l'état le plus récent.
 */
export function CentreNotifications() {
  const [notifications, setNotifications] = useState<NotificationUtilisateur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    notificationsApi
      .lister()
      .then(setNotifications)
      .catch((e) => setErreur(e instanceof ErreurApi ? e.message : "Impossible de charger les notifications."))
      .finally(() => setChargement(false));
  }, []);

  const marquerLue = async (id: string) => {
    try {
      const notification = await notificationsApi.marquerLue(id);
      setNotifications((precedentes) => precedentes.map((n) => (n.id === id ? notification : n)));
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Impossible de marquer cette notification comme lue.");
    }
  };

  return (
    <div className="carte">
      <h2 className="mb-4 text-sm font-semibold text-header/70">Notifications</h2>
      {erreur && (
        <div className="mb-3">
          <MessageErreur message={erreur} />
        </div>
      )}

      {chargement ? (
        <Chargement libelle="Chargement des notifications…" />
      ) : notifications.length === 0 ? (
        <EtatVide
          icone="🔕"
          titre="Aucune notification"
          description="Vous serez averti ici si un prix suivi dépasse le seuil de l'une de vos alertes."
        />
      ) : (
        <ul className="space-y-2">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={clsx(
                "rounded-lg border p-3 text-sm",
                notification.lue ? "border-black/5 bg-white" : "border-primary/30 bg-primary/5",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-header">{notification.titre}</p>
                {!notification.lue && (
                  <button
                    type="button"
                    onClick={() => marquerLue(notification.id)}
                    className="whitespace-nowrap text-xs font-semibold text-primary hover:underline"
                  >
                    Marquer comme lue
                  </button>
                )}
              </div>
              <p className="mt-1 text-header/70">{notification.message}</p>
              <p className="mt-1.5 text-xs text-header/40">{new Date(notification.creeLe).toLocaleString("fr-FR")}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
