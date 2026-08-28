import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";

/**
 * Vérification côté serveur des jetons d'identité (ID tokens) émis par
 * Google Identity Services dans le navigateur. Ne fait JAMAIS confiance à un
 * jeton non vérifié par la bibliothèque officielle — c'est cette vérification
 * qui garantit que le jeton a bien été émis par Google pour NOTRE Client ID.
 */

let client: OAuth2Client | undefined;

function obtenirClient(): OAuth2Client {
  if (!env.googleClientId) {
    throw ApiError.nonConfigure(
      "La connexion avec Google n'est pas encore configurée sur ce serveur.",
    );
  }
  if (!client) {
    client = new OAuth2Client(env.googleClientId);
  }
  return client;
}

export interface ProfilGoogle {
  googleId: string;
  email: string;
  nom: string;
}

/**
 * Vérifie le jeton d'identité et en extrait les informations de profil déjà
 * validées par Google (sub, e-mail, nom).
 */
export async function verifierJetonGoogle(idToken: string): Promise<ProfilGoogle> {
  const googleClient = obtenirClient();

  let billet;
  try {
    billet = await googleClient.verifyIdToken({
      idToken,
      audience: env.googleClientId,
    });
  } catch {
    throw ApiError.mauvaiseRequete("Jeton Google invalide ou expiré.");
  }

  const charge = billet.getPayload();
  if (!charge?.sub || !charge.email) {
    throw ApiError.mauvaiseRequete("Le jeton Google ne contient pas les informations attendues.");
  }
  if (charge.email_verified === false) {
    throw ApiError.mauvaiseRequete("Votre adresse e-mail Google n'est pas vérifiée.");
  }

  return {
    googleId: charge.sub,
    email: charge.email.toLowerCase(),
    nom: charge.name?.trim() || charge.email.split("@")[0],
  };
}
