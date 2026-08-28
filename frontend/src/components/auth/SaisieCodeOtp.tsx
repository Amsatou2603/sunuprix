"use client";

import { useEffect, useRef } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";

interface ProprietesSaisieCodeOtp {
  valeur: string;
  onChange: (valeur: string) => void;
  longueur?: number;
  disabled?: boolean;
}

/** Saisie du code de vérification SMS sous forme de cases individuelles, avec navigation automatique et collage. */
export function SaisieCodeOtp({ valeur, onChange, longueur = 6, disabled }: ProprietesSaisieCodeOtp) {
  const refsCases = useRef<Array<HTMLInputElement | null>>([]);

  // Focus la première case dès l'apparition du composant, pour que
  // l'utilisateur puisse saisir le code SMS reçu sans avoir à cliquer.
  useEffect(() => {
    refsCases.current[0]?.focus();
  }, []);

  const gererChangement = (index: number, saisie: string) => {
    const chiffre = saisie.replace(/\D/g, "").slice(-1);
    const chiffres = valeur.padEnd(longueur, " ").split("");
    chiffres[index] = chiffre;
    const nouvelleValeur = chiffres.join("").trimEnd().replace(/ /g, "");
    onChange(nouvelleValeur.slice(0, longueur));
    if (chiffre && index < longueur - 1) {
      refsCases.current[index + 1]?.focus();
    }
  };

  const gererTouche = (index: number, evenement: KeyboardEvent<HTMLInputElement>) => {
    if (evenement.key === "Backspace" && !valeur[index] && index > 0) {
      refsCases.current[index - 1]?.focus();
    }
  };

  const gererCollage = (evenement: ClipboardEvent<HTMLInputElement>) => {
    const texteColle = evenement.clipboardData.getData("text").replace(/\D/g, "").slice(0, longueur);
    if (!texteColle) return;
    evenement.preventDefault();
    onChange(texteColle);
    refsCases.current[Math.min(texteColle.length, longueur - 1)]?.focus();
  };

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: longueur }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            refsCases.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={valeur[index] ?? ""}
          onChange={(e) => gererChangement(index, e.target.value)}
          onKeyDown={(e) => gererTouche(index, e)}
          onPaste={gererCollage}
          className="h-12 w-10 rounded-lg border border-black/10 bg-white text-center text-lg font-bold text-header transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      ))}
    </div>
  );
}
