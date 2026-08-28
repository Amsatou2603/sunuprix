"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { GoogleIcon } from "./GoogleIcon";

/**
 * Bouton "Continuer avec Google", basé sur Google Identity Services (jeton
 * d'identité côté navigateur, vérifié côté serveur dans google.service.ts).
 *
 * Sans NEXT_PUBLIC_GOOGLE_CLIENT_ID configuré, affiche un bouton désactivé
 * portant tout de même le logo officiel Google plutôt que de disparaître —
 * la fonctionnalité est visible mais explicitement "bientôt disponible".
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (reponse: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              shape?: "rectangular" | "pill" | "circle" | "square";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              logo_alignment?: "left" | "center";
              locale?: string;
              width?: number;
            },
          ) => void;
        };
      };
    };
  }
}

const ID_CLIENT_GOOGLE = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface ProprietesBoutonGoogle {
  /** Jeton d'identité Google reçu après authentification, à transmettre à POST /api/auth/google. */
  onJeton: (idToken: string) => void;
  texte?: "signin_with" | "signup_with" | "continue_with";
}

export function BoutonGoogle({ onJeton, texte = "continue_with" }: ProprietesBoutonGoogle) {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const [scriptCharge, setScriptCharge] = useState(false);

  // `onJeton` est en général une fonction en ligne recréée à chaque rendu du
  // parent (ex. la page Connexion se re-rend à chaque frappe dans le champ
  // e-mail) — la garder dans une ref évite de la mettre dans les dépendances
  // de l'effet ci-dessous, qui sinon rappellerait `initialize()` à chaque
  // rendu (avertissement Google "initialize() is called multiple times").
  const onJetonRef = useRef(onJeton);
  useEffect(() => {
    onJetonRef.current = onJeton;
  }, [onJeton]);

  useEffect(() => {
    if (!scriptCharge || !ID_CLIENT_GOOGLE || !conteneurRef.current || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: ID_CLIENT_GOOGLE,
      callback: (reponse) => onJetonRef.current(reponse.credential),
    });

    conteneurRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(conteneurRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "pill",
      text: texte,
      logo_alignment: "left",
      locale: "fr",
      width: 320,
    });
  }, [scriptCharge, texte]);

  if (!ID_CLIENT_GOOGLE) {
    return (
      <button
        type="button"
        disabled
        title="La connexion avec Google sera bientôt disponible sur SunuPrix."
        className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-header/40 opacity-70"
      >
        <GoogleIcon className="h-[18px] w-[18px]" />
        Continuer avec Google
      </button>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptCharge(true)}
      />
      <div ref={conteneurRef} className="flex w-full justify-center" />
    </>
  );
}
