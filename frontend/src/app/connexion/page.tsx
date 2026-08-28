"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ErreurApi } from "@/lib/api/api-client";
import { MessageErreur } from "@/components/partages/EtatAsync";
import { BoutonGoogle } from "@/components/auth/BoutonGoogle";
import { FormulaireTelephoneOtp } from "@/components/auth/FormulaireTelephoneOtp";

type MethodeConnexion = "email" | "telephone";

export default function PageConnexion() {
  const { connecter, connecterAvecGoogle } = useAuth();
  const router = useRouter();

  const [methode, setMethode] = useState<MethodeConnexion>("email");

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurGoogle, setErreurGoogle] = useState<string | null>(null);

  const versAccueil = useCallback(() => router.push("/"), [router]);

  const soumettre = async (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await connecter({ email, motDePasse });
      versAccueil();
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Une erreur inattendue est survenue.");
    } finally {
      setEnCours(false);
    }
  };

  const gererJetonGoogle = async (idToken: string) => {
    setErreurGoogle(null);
    try {
      await connecterAvecGoogle(idToken);
      versAccueil();
    } catch (e) {
      setErreurGoogle(e instanceof ErreurApi ? e.message : "Connexion avec Google impossible pour le moment.");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4">
      <div className="carte">
        <h1 className="text-xl font-bold text-header">Connexion</h1>
        <p className="mt-1 text-sm text-header/60">Accédez à votre espace SunuPrix.</p>

        <div className="mt-6">
          <BoutonGoogle onJeton={gererJetonGoogle} texte="signin_with" />
          {erreurGoogle && (
            <div className="mt-3">
              <MessageErreur message={erreurGoogle} />
            </div>
          )}
        </div>

        <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-header/40">
          <span className="h-px flex-1 bg-black/10" />
          ou continuez avec
          <span className="h-px flex-1 bg-black/10" />
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-header/[0.04] p-1">
          <button
            type="button"
            onClick={() => setMethode("email")}
            className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition ${
              methode === "email" ? "bg-white text-primary shadow-sm" : "text-header/50 hover:text-header/80"
            }`}
          >
            <Mail className="h-3.5 w-3.5" strokeWidth={2} />
            E-mail
          </button>
          <button
            type="button"
            onClick={() => setMethode("telephone")}
            className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition ${
              methode === "telephone" ? "bg-white text-primary shadow-sm" : "text-header/50 hover:text-header/80"
            }`}
          >
            <Phone className="h-3.5 w-3.5" strokeWidth={2} />
            Téléphone
          </button>
        </div>

        {methode === "email" ? (
          <form onSubmit={soumettre} className="space-y-4">
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
        ) : (
          <FormulaireTelephoneOtp mode="connexion" onSucces={versAccueil} />
        )}

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
