/**
 * Service worker basique de SunuPrix (PWA).
 *
 * Portée volontairement réduite pour cette démonstration : mise en cache des
 * ressources statiques de l'application (l'"app shell") pour permettre un
 * démarrage hors-ligne, et politique "network-first" pour la navigation afin
 * que le dernier tableau de bord consulté reste disponible hors-ligne sans
 * jamais servir une page périmée quand le réseau est disponible.
 *
 * Ce fichier vit dans /public afin d'être servi tel quel à la racine du site
 * (portée maximale), comme l'exige l'API Service Worker.
 */

const NOM_CACHE = "sunuprix-cache-v2";
const RESSOURCES_APP_SHELL = ["/", "/a-propos", "/manifest.json", "/design/icon.svg"];

self.addEventListener("install", (evenement) => {
  evenement.waitUntil(
    caches
      .open(NOM_CACHE)
      .then((cache) => cache.addAll(RESSOURCES_APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((cle) => cle !== NOM_CACHE).map((cle) => caches.delete(cle))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evenement) => {
  const requete = evenement.request;

  // On ne met jamais en cache les appels API : ils doivent refléter les
  // données réelles du backend, jamais une réponse figée hors-ligne.
  if (requete.method !== "GET" || requete.url.includes("/api/")) {
    return;
  }

  evenement.respondWith(
    fetch(requete)
      .then((reponse) => {
        const copie = reponse.clone();
        caches.open(NOM_CACHE).then((cache) => cache.put(requete, copie));
        return reponse;
      })
      .catch(() => caches.match(requete).then((reponseEnCache) => reponseEnCache ?? caches.match("/"))),
  );
});
