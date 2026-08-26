"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { ErreurApi } from "@/lib/api/api-client";
import { MessageErreur } from "@/components/partages/EtatAsync";

export default function PageConnexion() {
  const { connecter } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const soumettre = async (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await connecter({ email, motDePasse });
      router.push("/");
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Une erreur inattendue est survenue.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="carte">
        <h1 className="text-xl font-bold text-header">Connexion</h1>
        <p className="mt-1 text-sm text-header/60">Accédez à votre espace SunuPrix.</p>

        <form onSubmit={soumettre} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="etiquette-champ">
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="champ-formulaire"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.sn"
            />
          </div>

          <div>
            <label htmlFor="motDePasse" className="etiquette-champ">
              Mot de passe
            </label>
            <input
              id="motDePasse"
              type="password"
              required
              autoComplete="current-password"
              className="champ-formulaire"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {erreur && <MessageErreur message={erreur} />}

          <button type="submit" disabled={enCours} className="bouton-primaire w-full">
            {enCours ? "Connexion en cours…" : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-header/60">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-semibold text-primary hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
