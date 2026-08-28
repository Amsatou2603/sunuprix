/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permet à Next.js de transpiler le package du monorepo @sunuprix/shared
  // (publié en TypeScript source, sans étape de build séparée nécessaire ici).
  transpilePackages: ["@sunuprix/shared"],

  // Proxy serveur-à-serveur de /api/* vers le backend réel (Render).
  //
  // Pourquoi : le frontend (Vercel) et le backend (Render) sont sur deux
  // domaines différents. Le cookie de session httpOnly posé par le backend
  // est donc un cookie "cross-site" du point de vue du navigateur — même
  // avec `SameSite=None; Secure`, Safari (donc tout navigateur sur iPhone,
  // qui utilise le moteur WebKit d'Apple) bloque par défaut ce type de
  // cookie tiers (ITP — Intelligent Tracking Prevention). Résultat concret :
  // l'app fonctionnait sur ordinateur (Chrome ne bloque pas ces cookies) mais
  // renvoyait "Aucun token de session fourni." sur iPhone, le cookie
  // n'atteignant jamais le navigateur.
  //
  // Ce rewrite fait passer chaque appel /api/* du navigateur par le serveur
  // Next.js lui-même (même origine que la page, sunuprix.vercel.app), qui le
  // relaie côté serveur vers Render — un appel serveur-à-serveur n'est pas
  // soumis aux règles de cookies tiers du navigateur. Pour le navigateur,
  // tout se passe désormais en un seul domaine : le cookie devient de
  // première partie, et Safari cesse de le bloquer.
  async rewrites() {
    const urlApiBackend = process.env.NEXT_PUBLIC_API_URL;
    if (!urlApiBackend) return [];
    return [
      {
        source: "/api/:chemin*",
        destination: `${urlApiBackend}/api/:chemin*`,
      },
    ];
  },
};

module.exports = nextConfig;
