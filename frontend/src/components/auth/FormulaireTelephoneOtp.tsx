"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ErreurApi } from "@/lib/api/api-client";
import { MessageErreur } from "@/components/partages/EtatAsync";
import { ChampTelephoneSenegal, formaterAffichage } from "./ChampTelephoneSenegal";
import { SaisieCodeOtp } from "./SaisieCodeOtp";

interface ProprietesFormulaireTelephoneOtp {
  /** "inscription" demande le nom (nécessaire seulement si ce numéro n'a pas encore de compte). */
  mode: "connexion" | "inscription";
  onSucces: () => void;
}

type Etape = "numero" | "code";

/**
 * Flux de connexion/inscription en deux étapes par numéro de téléphone
 * sénégalais, vérifié par SMS via Twilio Verify (POST /api/auth/otp/*).
 */
export function FormulaireTelephoneOtp({ mode, onSucces }: ProprietesFormulaireTelephoneOtp) {
  const { envoyerOtp, verifierOtp } = useAuth();

  const [etape, setEtape] = useState<Etape>("numero");
  const [chiffres, setChiffres] = useState("");
  const [nom, setNom] = useState("");
  const [code, setCode] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const telephone = `+221${chiffres}`;

  const envoyerCode = async (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await envoyerOtp(telephone);
      setEtape("code");
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Une erreur inattendue est survenue.");
    } finally {
      setEnCours(false);
    }
  };

  const renvoyerCode = async () => {
    setErreur(null);
    setEnCours(true);
    try {
      await envoyerOtp(telephone);
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Une erreur inattendue est survenue.");
    } finally {
      setEnCours(false);
    }
  };

  const verifier = async (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await verifierOtp({
        telephone,
        code,
        ...(mode === "inscription" ? { nom, role: "CONSOMMATEUR" } : {}),
      });
      onSucces();
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Une erreur inattendue est survenue.");
    } finally {
      setEnCours(false);
    }
  };

  if (etape === "code") {
    return (
      <form onSubmit={verifier} className="space-y-4">
        <div>
          <p className="text-center text-sm text-header/70">
            Code envoyé au{" "}
            <span className="font-semibold text-header">+221 {formaterAffichage(chiffres)}</span>
          </p>
          <div className="mt-3">
            <SaisieCodeOtp valeur={code} onChange={setCode} disabled={enCours} />
          </div>
        </div>

        {erreur && <MessageErreur message={erreur} />}

        <button type="submit" disabled={enCours || code.length < 4} className="bouton-primaire w-full">
          {enCours ? "Vérification…" : "Vérifier le code"}
        </button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setEtape("numero");
              setCode("");
              setErreur(null);
            }}
            className="font-medium text-header/60 hover:underline"
          >
            Changer de numéro
          </button>
          <button
            type="button"
            onClick={renvoyerCode}
            disabled={enCours}
            className="font-semibold text-primary hover:underline disabled:opacity-50"
          >
            Renvoyer le code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={envoyerCode} className="space-y-4">
      {mode === "inscription" && (
        <div>
          <label htmlFor="nom-telephone" className="etiquette-champ">
            Nom complet
          </label>
          <input
            id="nom-telephone"
            type="text"
            required
            minLength={2}
            className="champ-formulaire"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Aminata Diop"
          />
        </div>
      )}

      <div>
        <label htmlFor="telephone" className="etiquette-champ">
          Numéro de téléphone
        </label>
        <ChampTelephoneSenegal id="telephone" valeur={chiffres} onChange={setChiffres} disabled={enCours} />
      </div>

      {erreur && <MessageErreur message={erreur} />}

      <button type="submit" disabled={enCours || chiffres.length !== 9} className="bouton-primaire w-full">
        {enCours ? "Envoi du code…" : "Recevoir le code par SMS"}
      </button>
    </form>
  );
}
