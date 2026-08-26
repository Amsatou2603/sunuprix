"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker basique de l'application (voir /public/sw.js)
 * une fois le document chargé. Rendu côté client uniquement : l'API
 * `navigator.serviceWorker` n'existe pas côté serveur.
 */
export function EnregistreurServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const enregistrer = () => {
      navigator.serviceWorker.register("/sw.js").catch((erreur) => {
        // eslint-disable-next-line no-console
        console.error("[SunuPrix] Échec de l'enregistrement du service worker :", erreur);
      });
    };

    window.addEventListener("load", enregistrer);
    return () => window.removeEventListener("load", enregistrer);
  }, []);

  return null;
}
