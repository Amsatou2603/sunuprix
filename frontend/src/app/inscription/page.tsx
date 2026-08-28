"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { ROLES_INSCRIPTIBLES, LIBELLES_ROLES } from "@sunuprix/shared";
import { useAuth } from "@/lib/auth/AuthContext";
import { ErreurApi } from "@/lib/api/api-client";
import { MessageErreur } from "@/components/partages/EtatAsync";
import { BoutonGoogle } from "@/components/auth/BoutonGoogle";
import { FormulaireTelephoneOtp } from "@/components/auth/FormulaireTelephoneOtp";

type MethodeInscription = "email" | "telephone";

export default function PageInscription() {
  const { inscrire, connecterAvecGoogle } = useAuth();
  const router = useRouter();

  const [methode, setMethode] = useState<MethodeInscription>("email");

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  // ADMIN n'apparaît volontairement pas : ce rôle n'est créé que par seed ou par un autre administrateur.
  const [role, setRole] = useState<string>(ROLES_INSCRIPTIBLES[0]);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurGoogle, setErreurGoogle] = useState<string | null>(null);

  const versAccueil = useCallback(() => router.push("/"), [router]);

  const soumettre = async (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await inscrire({ nom, email, motDePasse, role });
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
      setErreurGoogle(e instanceof ErreurApi ? e.message : "Inscription avec Google impossible pour le moment.");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4">
      <div className="carte">
        <h1 className="text-xl font-bold text-header">Créer un compte</h1>
        <p className="mt-1 text-sm text-header/60">
          Choisissez le profil qui correspond à votre usage de SunuPrix.
        </p>

        <div className="mt-6">
          <BoutonGoogle onJeton={gererJetonGoogle} texte="signup_with" />
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
              <label htmlFor="nom" className="etiquette-champ">
                Nom complet
              </label>
              <input
                id="nom"
                type="text"
                required
                minLength={2}
                className="champ-formulaire"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Aminata Diop"
              />
            </div>

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
                minLength={8}
                autoComplete="new-password"
                className="champ-formulaire"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="8 caractères minimum"
              />
            </div>

            <div>
              <label htmlFor="role" className="etiquette-champ">
                Rôle
              </label>
              <select
                id="role"
                required
                className="champ-formulaire"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLES_INSCRIPTIBLES.map((valeurRole) => (
                  <option key={valeurRole} value={valeurRole}>
                    {LIBELLES_ROLES[valeurRole]}
                  </option>
                ))}
              </select>
            </div>

            {erreur && <MessageErreur message={erreur} />}

            <button type="submit" disabled={enCours} className="bouton-primaire w-full">
              {enCours ? "Création du compte…" : "Créer mon compte"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-header/50">
              L&apos;inscription par téléphone crée un compte Consommateur. Pour un profil Vendeur, Chercheur ou
              Ministère, utilisez plutôt l&apos;inscription par e-mail ci-dessus.
            </p>
            <FormulaireTelephoneOtp mode="inscription" onSucces={versAccueil} />
          </div>
        )}

        <p className="mt-6 text-center text-sm text-header/60">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
