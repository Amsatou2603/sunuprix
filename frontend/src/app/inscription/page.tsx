"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROLES_INSCRIPTIBLES, LIBELLES_ROLES } from "@sunuprix/shared";
import { useAuth } from "@/lib/auth/AuthContext";
import { ErreurApi } from "@/lib/api/api-client";
import { MessageErreur } from "@/components/partages/EtatAsync";

export default function PageInscription() {
  const { inscrire } = useAuth();
  const router = useRouter();

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  // ADMIN n'apparaît volontairement pas : ce rôle n'est créé que par seed ou par un autre administrateur.
  const [role, setRole] = useState<string>(ROLES_INSCRIPTIBLES[0]);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const soumettre = async (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await inscrire({ nom, email, motDePasse, role });
      router.push("/");
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : "Une erreur inattendue est survenue.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4">
      <div className="carte">
        <h1 className="text-xl font-bold text-header">Créer un compte</h1>
        <p className="mt-1 text-sm text-header/60">
          Choisissez le profil qui correspond à votre usage de SunuPrix.
        </p>

        <form onSubmit={soumettre} className="mt-6 space-y-4">
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
