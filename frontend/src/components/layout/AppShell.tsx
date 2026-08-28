"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";

/** Durée plancher d'affichage du splashscreen, pour éviter un flash trop
 *  bref et déstabilisant quand la vérification de session est quasi
 *  instantanée (ex. cache navigateur chaud) — sur un cold start Render
 *  (plan gratuit), la vérification peut prendre plusieurs secondes : dans ce
 *  cas ce délai plancher n'a aucun effet, l'écran reste déjà affiché plus
 *  longtemps que lui. */
const DELAI_MINIMUM_MS = 500;

/**
 * Point d'entrée unique du contenu applicatif, à l'intérieur de
 * `<AuthProvider>`. Tant que la session n'a pas été vérifiée
 * (`chargementInitial`), affiche le splashscreen de marque plutôt que la
 * coquille de l'app (nav, page, footer) — évite tout flash de contenu
 * "déconnecté" pendant ce court instant, à chaque chargement/actualisation
 * complète de page.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { chargementInitial } = useAuth();
  const [delaiEcoule, setDelaiEcoule] = useState(false);

  useEffect(() => {
    const identifiant = setTimeout(() => setDelaiEcoule(true), DELAI_MINIMUM_MS);
    return () => clearTimeout(identifiant);
  }, []);

  if (chargementInitial || !delaiEcoule) {
    return <SplashScreen />;
  }

  return (
    <>
      <Header />
      {/* La barre de nav est en position sticky avec un décalage (top-2 sm:top-4) :
          elle réserve sa hauteur "statique" (sans ce décalage) dans le flux normal,
          mais s'affiche décalée vers le bas de ce même décalage au premier rendu —
          sans ce padding, elle chevauche les ~8-16px du haut de chaque page. */}
      <main className="w-full flex-1 pt-2 sm:pt-4">{children}</main>
      <Footer />
      <ChatbotWidget />
    </>
  );
}
